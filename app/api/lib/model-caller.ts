import { z } from "zod";
import { openrouter } from "./openrouter";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { ActivityTracker, ActivityType } from "./activity-tracker";

// 延迟函数
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模型调用选项接口
interface ModelCallOptions<T> {
  model: string;
  prompt: string;
  system?: string;
  schema?: z.ZodType<T>;
  activityType?: ActivityType;
}

// 研究状态接口
interface ResearchState {
  tokenUsed: number;
  completedSteps: number;
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
      const result = data.choices[0].message.content;

      // 更新研究状态
      researchState.tokenUsed += data.usage.total_tokens;
      researchState.completedSteps++;

      // 如果提供了schema，验证并返回对象
      if (schema) {
        const parsed = schema.parse(JSON.parse(result));
        return parsed;
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
