import { NextResponse } from "next/server";
import { z } from "zod";

// 安全获取API响应内容的辅助函数
function safeGetContentFromApiResponse(data: any): string {
  try {
    // 检查data是否存在
    if (!data) {
      console.log("API响应为空");
      return "";
    }

    // 记录响应结构，帮助调试
    console.log(
      "API响应结构:",
      JSON.stringify({
        hasChoices: Array.isArray(data.choices),
        choicesLength: Array.isArray(data.choices) ? data.choices.length : 0,
        firstChoice:
          data.choices && data.choices.length > 0
            ? typeof data.choices[0]
            : "不存在",
        hasMessage:
          data.choices && data.choices.length > 0 && data.choices[0]
            ? "message" in data.choices[0]
            : false,
      })
    );

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

// 使用直接的fetch方式调用OpenRouter API
async function generateQuestions(topic: string): Promise<string[]> {
  console.log("正在为主题生成问题:", topic);
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  console.log("使用API密钥前5位:", apiKey.substring(0, 5));

  const prompt = `
    Given the research topic <topic>${topic}</topic>, generate 5 specific research questions that will help guide a comprehensive investigation. Focus on:
    - Key aspects and dimensions of the topic
    - Current developments and trends
    - Potential impacts and implications
    - Different perspectives and viewpoints
    
    Format: Return a JSON object with a 'questions' array containing 5 questions.
  `;

  try {
    console.log("开始直接fetch调用OpenRouter API...");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Deep Research AI Agent",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-001",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    console.log("API响应状态:", response.status);

    if (!response.ok) {
      let errorText = "";
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
        console.error("OpenRouter API错误响应:", errorData);
      } catch (e) {
        errorText = await response.text();
        console.error("无法解析错误响应:", errorText);
      }

      throw new Error(`API调用失败(${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("API响应消息:", JSON.stringify(data).substring(0, 100) + "...");

    // 使用安全获取内容的函数
    const content = safeGetContentFromApiResponse(data);
    let questions = [];

    try {
      // 尝试解析JSON
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else if (Array.isArray(parsed)) {
        // 处理直接返回数组的情况
        questions = parsed;
      } else if (parsed.questions) {
        questions = [parsed.questions];
      }
    } catch (e) {
      console.log("无法解析为JSON，尝试从文本提取问题:", e);
      // 按行分割并过滤出看起来像问题的行
      questions = content
        .split("\n")
        .filter((line: string) => line.trim().length > 10)
        .filter((line: string) => line.includes("?") || /^\d+\./.test(line))
        .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
        .slice(0, 5);
    }

    if (questions.length === 0) {
      throw new Error("无法从响应中提取问题");
    }

    return questions;
  } catch (error) {
    console.error("生成问题时出错:", error);
    // 返回备选问题作为备选
    return [
      `${topic}的主要方面是什么？`,
      `${topic}的最新发展趋势是什么？`,
      `${topic}带来的主要挑战是什么？`,
      `${topic}对社会的影响是什么？`,
      `如何评估${topic}的未来发展？`,
    ];
  }
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    console.log("收到研究主题:", topic);

    const questions = await generateQuestions(topic);
    console.log("成功生成问题:", questions);

    return NextResponse.json(questions);
  } catch (error) {
    console.error("问题生成失败:", error);
    // 返回备选问题而不是错误
    const fallbackQuestions = [
      `该主题的关键方面是什么？`,
      `目前的研究趋势如何？`,
      `有哪些主要挑战？`,
      `对社会的潜在影响是什么？`,
      `未来发展方向如何？`,
    ];
    return NextResponse.json(fallbackQuestions);
  }
}
