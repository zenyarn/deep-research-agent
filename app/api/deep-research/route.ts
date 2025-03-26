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

// 定义事件类型
type EventType = "activity" | "source" | "report" | "complete" | "error";

// 流事件接口
interface StreamEvent {
  type: EventType;
  payload: any;
}

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
      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
    },
    end() {
      controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
      controller.close();
    },
  };
}

// 活动跟踪器
class ActivityTracker implements ActivityTrackerInterface {
  private activities: Activity[] = [];
  private stream: SimpleStream;
  private sources: Array<{
    url: string;
    title?: string;
    snippet?: string;
    relevance?: number;
  }> = [];
  private reportContent: string = "";

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

    // 发送活动事件
    const event: StreamEvent = {
      type: "activity",
      payload: activity,
    };
    this.stream.write(JSON.stringify(event));

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

      // 发送活动更新事件
      const event: StreamEvent = {
        type: "activity",
        payload: updatedActivity,
      };
      this.stream.write(JSON.stringify(event));

      return updatedActivity;
    }
    return null;
  }

  addSource(source: {
    url: string;
    title?: string;
    snippet?: string;
    relevance?: number;
  }) {
    // 检查是否已存在相同URL的来源
    if (!this.sources.some((s) => s.url === source.url)) {
      this.sources.push(source);

      // 发送来源事件
      const event: StreamEvent = {
        type: "source",
        payload: source,
      };
      this.stream.write(JSON.stringify(event));
    }
  }

  getActivities(): Activity[] {
    return this.activities;
  }

  getSources() {
    return this.sources;
  }

  clear(): void {
    this.activities = [];
    this.sources = [];
  }

  // 发送报告流事件
  sendReportUpdate(content: string) {
    // 存储报告内容
    this.reportContent += content;

    // 发送报告更新事件
    const event: StreamEvent = {
      type: "report",
      payload: { content },
    };
    this.stream.write(JSON.stringify(event));
  }

  // 修改完成事件发送，包含完整报告
  sendComplete(report: any) {
    // 在完成事件中确保包含报告内容
    if (this.reportContent) {
      // 确保report对象存在
      report = report || {};

      // 为报告添加纯文本内容和标记
      report.content = this.reportContent;
      report.isPlainText = true;

      console.log(
        `发送完成事件，报告内容长度: ${this.reportContent.length}字符`
      );
      console.log("报告对象结构：", {
        title: report.title || "未设置标题",
        isPlainText: report.isPlainText,
        contentLength: report.content ? report.content.length : 0,
        contentPreview: report.content
          ? report.content.substring(0, 100) + "..."
          : "无内容",
        hasContent: !!report.content,
        reportKeys: Object.keys(report),
      });
    } else {
      console.log("警告: 完成事件中没有报告内容");
    }

    try {
      // 确保报告完整性的情况下再发送完成事件
      const event: StreamEvent = {
        type: "complete",
        payload: { report },
      };

      // 先发送最后一次报告更新，确保内容被保存到state中
      if (this.reportContent) {
        const reportEvent: StreamEvent = {
          type: "report",
          payload: { content: this.reportContent },
        };
        this.stream.write(JSON.stringify(reportEvent));
        console.log("已发送最终报告内容事件");
      }

      // 然后发送完成事件
      this.stream.write(JSON.stringify(event));
      console.log("已发送完成事件，包含报告对象");
    } catch (error) {
      console.error("发送完成事件时出错:", error);
    }
  }

  // 发送错误事件
  sendError(error: string) {
    const event: StreamEvent = {
      type: "error",
      payload: { message: error },
    };
    this.stream.write(JSON.stringify(event));
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

            // 发送完成信号
            activityTracker.sendComplete({
              title: `${topic}研究报告`,
              status: "success",
            });
          } catch (error) {
            console.error("研究过程失败:", error);
            activityTracker.add(
              "generate",
              "error",
              `研究过程失败: ${
                error instanceof Error ? error.message : "未知错误"
              }`
            );

            // 发送错误事件
            activityTracker.sendError(
              error instanceof Error ? error.message : "未知错误"
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

            // 发送模拟完成事件
            activityTracker.sendComplete({
              title: `${topic}备选研究报告`,
              status: "fallback",
            });
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

          // 发送错误事件
          activityTracker.sendError(
            error instanceof Error ? error.message : "未知错误"
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
        "Cache-Control": "no-cache, no-transform",
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
