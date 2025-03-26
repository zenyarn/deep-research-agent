import { z } from "zod";
import { openrouter } from "./openrouter";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { ActivityTracker, ActivityType } from "./activity-tracker";
import { SimpleStream } from "./activity-tracker";

// 延迟函数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模型调用选项接口
interface ModelCallOptions<T> {
  model: string;
  prompt: string;
  system?: string;
  schema?: z.ZodType<T>;
  activityType?: ActivityType;
  streaming?: boolean;
}

// 研究状态接口
interface ResearchState {
  tokenUsed: number;
  completedSteps: number;
}

// 解析流式输出
function parseStreamOutput(chunk: string): string | null {
  try {
    // 处理SSE格式数据
    if (chunk.startsWith("data: ")) {
      const data = chunk.slice(6); // 删除 'data: ' 前缀
      if (data === "[DONE]") return null; // 流结束标记

      try {
        const parsed = JSON.parse(data);
        // 提取内容
        if (parsed.choices && parsed.choices[0]?.delta?.content) {
          return parsed.choices[0].delta.content;
        }
      } catch (e) {
        // JSON解析错误，但不影响流处理
        console.warn("Stream chunk JSON解析失败:", e);
      }
    }
    return null; // 无法解析的数据
  } catch (e) {
    console.error("解析流输出错误:", e);
    return null;
  }
}

// 流式模型调用函数
export async function callModelStream(
  { model, prompt, system, activityType = "generate" }: ModelCallOptions<any>,
  researchState: ResearchState,
  activityTracker: ActivityTracker,
  outputStream: SimpleStream
): Promise<void> {
  let attempts = 0;
  let lastError: Error | null = null;

  // 添加活动指示器
  const activityId = activityTracker.add(
    activityType,
    "pending",
    `使用模型生成内容...`
  );

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "Deep Research AI Agent",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              ...(system ? [{ role: "system", content: system }] : []),
              { role: "user", content: prompt },
            ],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter API调用失败: ${error}`);
      }

      if (!response.body) {
        throw new Error("响应中没有主体");
      }

      // 读取流数据
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resultText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解码二进制数据
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // 处理缓冲区中的所有行
          let lineEnd;
          while ((lineEnd = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, lineEnd);
            buffer = buffer.slice(lineEnd + 1);

            if (line.trim() === "") continue;

            const content = parseStreamOutput(line);
            if (content) {
              resultText += content;

              // 将内容写入输出流
              outputStream.write(
                JSON.stringify({
                  type: "content",
                  content: content,
                })
              );
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 更新活动状态
      activityTracker.update(
        activityId,
        "complete",
        `内容生成完成 (${resultText.length} 字符)`
      );

      // 发送完成信号
      outputStream.write(
        JSON.stringify({
          type: "complete",
          content: resultText,
        })
      );

      return;
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error("未知错误");

      if (attempts < MAX_RETRY_ATTEMPTS) {
        activityTracker.update(
          activityId,
          "warning",
          `模型调用失败，尝试 ${attempts}/${MAX_RETRY_ATTEMPTS}. 重试中...`
        );
        await delay(RETRY_DELAY_MS * attempts);
      }
    }
  }

  // 所有尝试失败
  activityTracker.update(
    activityId,
    "error",
    `模型调用失败: ${lastError?.message || "未知错误"}`
  );

  // 发送错误信号
  outputStream.write(
    JSON.stringify({
      type: "error",
      error: lastError?.message || "未知错误",
    })
  );

  throw lastError || new Error(`在 ${MAX_RETRY_ATTEMPTS} 次尝试后失败！`);
}

// 添加安全获取API响应内容的辅助函数
function safeGetContentFromApiResponse(data: any): string {
  try {
    // 检查data是否存在
    if (!data) {
      console.log("API响应为空");
      return "";
    }

    // 如果是标准结构，按正常方式获取
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content || "";
    }

    // Claude直接输出模式
    if (data.content) {
      return data.content;
    }

    // 其他可能的结构
    if (data.choices && data.choices.length > 0) {
      // OpenAI格式变体
      if (data.choices[0].text) {
        return data.choices[0].text;
      }

      // 可能是直接内容
      if (typeof data.choices[0] === "string") {
        return data.choices[0];
      }

      // 其他可能的属性
      if (data.choices[0].content) {
        return data.choices[0].content;
      }
    }

    // 如果有message但结构不同
    if (data.message && typeof data.message === "object") {
      return data.message.content || "";
    }

    console.warn("无法从API响应中提取内容，使用空字符串");
    return "";
  } catch (error) {
    console.error("从API响应中提取内容时出错:", error);
    return "";
  }
}

// 模型调用函数
export async function callModel<T>(
  {
    model,
    prompt,
    system,
    schema,
    activityType = "generate",
  }: ModelCallOptions<T>,
  researchState: ResearchState,
  activityTracker: ActivityTracker
): Promise<T | string> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "Deep Research AI Agent",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              ...(system ? [{ role: "system", content: system }] : []),
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenRouter API调用失败: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      // 使用安全获取内容的函数
      const result = safeGetContentFromApiResponse(data);

      // 更新研究状态
      if (data.usage && data.usage.total_tokens) {
        researchState.tokenUsed += data.usage.total_tokens;
      }
      researchState.completedSteps++;

      // 如果提供了schema，验证并返回对象
      if (schema) {
        try {
          const parsedObj = JSON.parse(result);
          const parsed = schema.parse(parsedObj);
          return parsed;
        } catch (parseError) {
          console.error("解析API返回的JSON失败:", parseError);
          // 如果解析失败且还有重试次数，继续重试
          if (attempts < MAX_RETRY_ATTEMPTS - 1) {
            attempts++;
            continue;
          }
          throw parseError;
        }
      }

      return result;
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error("未知错误");

      if (attempts < MAX_RETRY_ATTEMPTS) {
        activityTracker.add(
          activityType,
          "warning",
          `模型调用失败，尝试 ${attempts}/${MAX_RETRY_ATTEMPTS}. 重试中...`
        );
        await delay(RETRY_DELAY_MS * attempts);
      }
    }
  }

  throw lastError || new Error(`在 ${MAX_RETRY_ATTEMPTS} 次尝试后失败！`);
}
