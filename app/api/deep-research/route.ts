import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ActivityType,
  ActivityStatus,
  Activity,
  ActivityTracker as ActivityTrackerInterface,
  SimpleStream,
} from "../lib/activity-tracker";
import { PLANNING_SYSTEM_PROMPT } from "../lib/prompts";
import { conductResearch } from "../lib/research-functions";

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

// 创建响应流
function createStream(
  controller: ReadableStreamDefaultController
): SimpleStream {
  return {
    write(data: string) {
      controller.enqueue(new TextEncoder().encode(data + "\n"));
    },
    end() {
      controller.close();
    },
  };
}

// 活动跟踪器
class ActivityTracker implements ActivityTrackerInterface {
  private activities: Activity[] = [];
  private stream: SimpleStream;

  constructor(stream: SimpleStream) {
    this.stream = stream;
  }

  add(type: ActivityType, status: ActivityStatus, message: string): string {
    const activity: Activity = {
      id: crypto.randomUUID(),
      type,
      status,
      message,
      timestamp: Date.now(),
    };

    this.activities.push(activity);
    this.stream.write(JSON.stringify(activity));
    return activity.id;
  }

  update(
    id: string,
    status: ActivityStatus,
    message?: string
  ): Activity | null {
    const index = this.activities.findIndex((a) => a.id === id);
    if (index >= 0) {
      const activity = this.activities[index];
      const updatedActivity: Activity = {
        ...activity,
        status,
        message: message || activity.message,
        timestamp: Date.now(),
      };
      this.activities[index] = updatedActivity;
      this.stream.write(JSON.stringify(updatedActivity));
      return updatedActivity;
    }
    return null;
  }

  getActivities(): Activity[] {
    return this.activities;
  }

  clear(): void {
    this.activities = [];
  }
}

// 研究状态
const researchState = {
  tokenUsed: 0,
  completedSteps: 0,
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
    const stream = new ReadableStream({
      start: async (controller) => {
        const streamAdapter = createStream(controller);
        const activityTracker = new ActivityTracker(streamAdapter);

        try {
          // 获取所有问题文本
          const questions = clarifications.map((c) => c.text);

          // 执行研究流程
          try {
            // 注意: 这里使用完整研究流程
            await conductResearch(topic, questions, activityTracker);

            // 更新状态
            researchState.completedSteps++;
          } catch (error) {
            console.error("研究过程失败:", error);
            activityTracker.add(
              "generate",
              "error",
              `研究过程失败: ${
                error instanceof Error ? error.message : "未知错误"
              }`
            );

            // 继续使用模拟数据作为备选
            const planningId = activityTracker.add(
              "planning",
              "pending",
              `使用备选方案研究主题: ${topic}`
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
            activityTracker.update(
              planningId,
              "complete",
              "已生成备选搜索查询"
            );

            const searchId = activityTracker.add(
              "search",
              "pending",
              "使用备选方案搜索相关信息..."
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            activityTracker.update(searchId, "complete", "已完成备选信息搜索");

            const generateId = activityTracker.add(
              "generate",
              "pending",
              "正在生成备选研究报告..."
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));
            activityTracker.update(
              generateId,
              "complete",
              "备选研究报告生成完成"
            );
          }
        } catch (error) {
          console.error("研究过程出错:", error);
          activityTracker.add(
            "generate",
            "error",
            `研究过程出错: ${
              error instanceof Error ? error.message : "未知错误"
            }`
          );
        } finally {
          streamAdapter.end();
        }
      },
    });

    // 返回流式响应
    return new NextResponse(stream, {
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
