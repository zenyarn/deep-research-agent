import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// 请求体验证模式
const requestSchema = z.object({
  topic: z.string().min(2).max(200),
});

// 问题生成API处理函数
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求体
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "无效的请求格式", details: result.error.format() },
        { status: 400 }
      );
    }

    const { topic } = result.data;

    // 生成问题
    // 注意：目前使用硬编码的问题，后续会集成AI模型
    const questions = [
      {
        id: uuidv4(),
        text: `"${topic}"的主要发展历史是什么？`,
      },
      {
        id: uuidv4(),
        text: `"${topic}"目前面临的最大挑战是什么？`,
      },
      {
        id: uuidv4(),
        text: `"${topic}"的未来发展趋势如何？`,
      },
      {
        id: uuidv4(),
        text: `"${topic}"在全球范围内的影响力如何？`,
      },
      {
        id: uuidv4(),
        text: `如何评价"${topic}"的社会价值？`,
      },
    ];

    // 记录生成的问题
    console.log(`成功为主题 "${topic}" 生成${questions.length}个问题`);

    // 返回生成的问题
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("问题生成失败:", error);
    return NextResponse.json(
      { error: "问题生成失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}
