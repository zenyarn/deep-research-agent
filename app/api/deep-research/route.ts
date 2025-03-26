import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createActivityTracker,
  SimpleStream,
  Activity,
  ActivityType,
  ActivityStatus,
} from "./activity-tracker";

// 请求体验证模式
const requestSchema = z.object({
  topic: z.string().min(2).max(200),
  clarifications: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      answer: z.string().optional(),
    })
  ),
});

// 研究状态类型
type ResearchState = {
  topic: string;
  clarifications: {
    id: string;
    text: string;
    answer?: string;
  }[];
  sources: {
    url: string;
    title: string;
    snippet?: string;
    relevance?: number;
  }[];
  activities: {
    id: string;
    type:
      | "search"
      | "extract"
      | "analyze"
      | "question"
      | "summarize"
      | "clarify"
      | "error";
    status: "pending" | "complete" | "error" | "warning";
    message: string;
    timestamp: Date;
    details?: string;
  }[];
  findings: {
    id: string;
    summary: string;
    details?: string;
    sources: {
      url: string;
      title: string;
    }[];
    confidence?: number;
  }[];
  report: string | null;
};

// 使用Web Streams API实现流式响应
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

    // 提取请求数据
    const { topic, clarifications } = result.data;

    // 创建响应流
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // 初始化研究状态
    const state: ResearchState = {
      topic,
      clarifications,
      sources: [],
      activities: [],
      findings: [],
      report: null,
    };

    // 创建适配器，将数据写入流
    const streamAdapter: SimpleStream = {
      append: (data: any) => {
        const json = JSON.stringify(data) + "\n";
        writer.write(encoder.encode(json));
      },
    };

    // 创建活动跟踪器
    const activityTracker = createActivityTracker(streamAdapter, state);

    // 启动研究过程
    // 注意：这里先添加一个初始活动，实际的研究引擎将在后续实现
    const initialActivityId = activityTracker.add({
      type: "analyze",
      status: "pending",
      message: `开始对主题 "${topic}" 进行深度研究...`,
    });

    // 异步运行研究过程
    (async () => {
      try {
        // 这里将在后续实现真正的研究引擎
        // 目前只是模拟一个异步的流程
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 更新第一个活动状态为完成
        activityTracker.update(initialActivityId, {
          status: "complete",
          message: `开始对主题 "${topic}" 进行深度研究...`,
        });

        const searchActivityId = activityTracker.add({
          type: "search",
          status: "pending",
          message: "搜索相关资料中...",
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        activityTracker.update(searchActivityId, {
          status: "complete",
          message: "找到5条相关资源",
        });

        const analyzeActivityId = activityTracker.add({
          type: "analyze",
          status: "pending",
          message: "分析搜索结果中...",
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        activityTracker.update(analyzeActivityId, {
          status: "complete",
          message: "分析完成",
        });

        // 关闭流
        writer.close();
      } catch (error) {
        console.error("研究过程出错:", error);
        // 发送错误信息
        streamAdapter.append({
          type: "error",
          data: {
            message: (error as Error).message || "未知错误",
            timestamp: new Date(),
          },
        });
        writer.close();
      }
    })();

    // 返回流式响应
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("研究过程出错:", error);
    return NextResponse.json(
      { error: "研究过程出错", details: (error as Error).message },
      { status: 500 }
    );
  }
}
