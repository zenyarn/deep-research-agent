import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";

// OpenRouter配置
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

// 响应类型定义
export interface OpenRouterResponse {
  object: any;
  usage: {
    totalTokens: number;
  };
}

// 调用OpenRouter API生成问题
export async function generateQuestions(topic: string): Promise<string[]> {
  const prompt = `
    Given the research topic <topic>${topic}</topic>, generate 5 specific research questions that will help guide a comprehensive investigation. Focus on:
    - Key aspects and dimensions of the topic
    - Current developments and trends
    - Potential impacts and implications
    - Different perspectives and viewpoints
    
    Format: Return only the questions as an array.
  `;

  try {
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.0-flash-lite-001"),
      prompt,
      schema: z.object({
        questions: z.array(z.string()).describe("Generated research questions"),
      }),
    });

    return object.questions;
  } catch (error) {
    console.error("OpenRouter API调用失败:", error);
    throw error;
  }
}

// 从ai包导入generateObject
async function generateObject({
  model,
  prompt,
  schema,
}: {
  model: any;
  prompt: string;
  schema: z.ZodType<any>;
}): Promise<OpenRouterResponse> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: model.id,
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter API调用失败: ${JSON.stringify(error)}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data;
}
