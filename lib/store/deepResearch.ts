import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  Activity,
  ActivityStatus,
  DeepResearchState,
  Question,
  Report,
  ResearchFinding,
  Source,
  ResearchState,
  ReportPayload,
} from "@/lib/types";

/**
 * 创建深度研究状态管理Store
 */
export const useDeepResearchStore = create<DeepResearchState>((set, get) => ({
  // 研究基本信息
  topic: "",

  // 问题和答案跟踪
  questions: [],
  currentQuestionIndex: 0,

  // 研究进度跟踪
  isCompleted: false,
  isLoading: false,
  isResearching: false,
  researchState: "idle",

  // 活动和来源跟踪
  activities: [],
  sources: [],

  // 研究结果
  findings: [],
  report: null,

  // 流式数据状态
  streamConnection: null,
  streamingContent: "",
  isStreamConnected: false,

  // 状态管理函数
  setTopic: (topic) => set({ topic }),

  setQuestions: (questions) => set({ questions }),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
    })),

  updateQuestion: (id, updates) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),

  setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),

  setIsCompleted: (isCompleted) => set({ isCompleted }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setResearchState: (state: ResearchState) => set({ researchState: state }),

  // 连接流式数据
  connectToStream: async (topic: string, questions: string[]) => {
    const state = get();

    // 如果已经有连接，先断开
    if (state.streamConnection) {
      state.disconnectStream();
    }

    set({
      isResearching: true,
      researchState: "researching",
      isStreamConnected: true,
      activities: [],
      sources: [],
      findings: [],
      report: null,
      streamingContent: "",
    });

    try {
      const response = await fetch("/api/deep-research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          clarifications: questions.map((q) => ({ id: uuidv4(), text: q })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("响应中没有数据流");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // 保存连接引用以便后续可以断开
      const connection = { reader, active: true };
      set({ streamConnection: connection });

      // 处理流数据
      let buffer = "";

      const processStream = async () => {
        while (connection.active) {
          try {
            const { done, value } = await reader.read();

            if (done) {
              console.log("流数据读取完成");
              set({
                isResearching: false,
                researchState: "completed",
                isCompleted: true,
                isStreamConnected: false,
              });
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 处理所有完整的SSE消息
            let eventStart;
            while ((eventStart = buffer.indexOf("data: ")) !== -1) {
              const eventEnd = buffer.indexOf("\n\n", eventStart);
              if (eventEnd === -1) break; // 不完整的事件

              const eventData = buffer.slice(eventStart + 6, eventEnd).trim();
              buffer = buffer.slice(eventEnd + 2);

              if (eventData === "[DONE]") {
                console.log("收到流结束信号");
                set({
                  isResearching: false,
                  researchState: "completed",
                  isCompleted: true,
                  isStreamConnected: false,
                });
                break;
              }

              try {
                // 解析事件数据
                const event = JSON.parse(eventData);
                console.log("收到事件:", event.type);

                // 根据事件类型更新状态
                switch (event.type) {
                  case "activity":
                    get().handleActivityEvent(event.payload);
                    break;
                  case "source":
                    get().handleSourceEvent(event.payload);
                    break;
                  case "report":
                    get().handleReportEvent(event.payload);
                    break;
                  case "complete":
                    get().handleCompleteEvent(event.payload);
                    break;
                  case "error":
                    get().handleErrorEvent(event.payload);
                    break;
                  default:
                    console.warn("未知事件类型:", event.type);
                }
              } catch (error) {
                console.error("解析事件数据失败:", error);
              }
            }
          } catch (error) {
            console.error("读取流数据失败:", error);
            set({
              isResearching: false,
              researchState: "error",
              isStreamConnected: false,
            });

            // 添加错误活动
            set((state) => ({
              activities: [
                ...state.activities,
                {
                  id: uuidv4(),
                  type: "error",
                  status: "error",
                  message: "连接中断",
                  timestamp: new Date(),
                  details:
                    error instanceof Error ? error.message : String(error),
                },
              ],
            }));
            break;
          }
        }
      };

      // 开始处理流
      processStream();
    } catch (error) {
      console.error("建立流连接失败:", error);
      set({
        isResearching: false,
        researchState: "error",
        isStreamConnected: false,
      });

      // 添加错误活动
      set((state) => ({
        activities: [
          ...state.activities,
          {
            id: uuidv4(),
            type: "error",
            status: "error",
            message: "无法连接到服务器",
            timestamp: new Date(),
            details: error instanceof Error ? error.message : String(error),
          },
        ],
      }));
    }
  },

  // 断开流连接
  disconnectStream: () => {
    const { streamConnection } = get();
    if (streamConnection) {
      streamConnection.active = false;
      streamConnection.reader.cancel().catch(console.error);
      set({ streamConnection: null, isStreamConnected: false });
    }
  },

  // 处理活动事件
  handleActivityEvent: (activity) => {
    const timestamp = new Date(activity.timestamp);

    set((state) => {
      // 检查是否已存在该活动
      const existingIndex = state.activities.findIndex(
        (a) => a.id === activity.id
      );

      if (existingIndex >= 0) {
        // 更新已存在的活动
        const updatedActivities = [...state.activities];
        updatedActivities[existingIndex] = {
          ...activity,
          timestamp,
        };
        return { activities: updatedActivities };
      } else {
        // 添加新活动
        return {
          activities: [
            ...state.activities,
            {
              ...activity,
              timestamp,
            },
          ],
        };
      }
    });
  },

  // 处理来源事件
  handleSourceEvent: (source) => {
    set((state) => {
      // 检查是否已存在该来源
      if (state.sources.some((s) => s.url === source.url)) {
        return { sources: state.sources };
      }

      return {
        sources: [...state.sources, source],
      };
    });
  },

  // 处理报告事件
  handleReportEvent: (payload) => {
    // 提取payload中的属性
    const {
      content,
      isChunk = false,
      chunkIndex = 0,
      totalChunks = 1,
    } = payload as ReportPayload;

    // 记录接收到的报告状态
    console.log(
      `处理报告事件: ${
        isChunk ? `第 ${chunkIndex + 1}/${totalChunks} 块` : "完整内容"
      }`
    );
    console.log(`内容长度: ${content.length}字符`);

    set((state) => {
      // 记录当前流内容状态
      console.log(
        `当前流内容长度: ${
          state.streamingContent ? state.streamingContent.length : 0
        }字符`
      );

      // 将新内容追加到现有流内容
      const newContent = `${state.streamingContent || ""}${content}`;
      console.log(`更新后流内容长度: ${newContent.length}字符`);

      // 如果是最后一个块或非分块内容，尝试构建完整的报告对象
      if (!isChunk || chunkIndex === totalChunks - 1) {
        console.log("构建完整报告对象");
        const reportObj = createReportFromMarkdown(state.topic, newContent);
        console.log("从Markdown构建的报告对象:", {
          title: reportObj.title,
          introLength: reportObj.introduction
            ? reportObj.introduction.length
            : 0,
          sectionsCount: reportObj.sections ? reportObj.sections.length : 0,
          conclusionLength: reportObj.conclusion
            ? reportObj.conclusion.length
            : 0,
          referencesCount: reportObj.references
            ? reportObj.references.length
            : 0,
        });

        return {
          streamingContent: newContent,
          report: reportObj,
        };
      }

      // 如果只是中间分块，只更新streamingContent
      return {
        streamingContent: newContent,
      };
    });
  },

  // 处理完成事件
  handleCompleteEvent: (payload) => {
    // 从payload中提取报告数据
    const { report } = payload;

    console.log("处理完成事件，报告数据:", report ? "存在" : "不存在");
    if (report) {
      console.log("报告标题:", report.title);
      console.log("报告类型:", report.isPlainText ? "纯文本" : "结构化");
      console.log("报告内容长度:", report.content ? report.content.length : 0);
      console.log("报告对象键:", Object.keys(report));
      console.log(
        "报告内容前100字符:",
        report.content ? report.content.substring(0, 100) + "..." : "无内容"
      );
    }

    // 如果有报告数据，更新report状态
    if (report) {
      try {
        // 创建一个有效的日期对象
        const reportDate = new Date();
        console.log("生成报告日期:", reportDate);

        set((state) => {
          // 准备报告对象
          let finalReport;

          if (report.isPlainText) {
            // 确保内容不为空，优先使用报告内容，否则使用累积的流内容
            const content = report.content || state.streamingContent || "";

            // 确保内容不为空
            if (!content || content.trim() === "") {
              console.warn("警告：报告内容为空，使用默认内容");
            }

            console.log("使用纯文本报告，内容长度:", content.length);
            console.log(
              "纯文本报告内容前100字符:",
              content.substring(0, 100) + "..."
            );

            finalReport = {
              title: report.title || `${state.topic}研究报告`,
              isPlainText: true,
              content: content,
              date: reportDate.toISOString(),
              generatedAt: reportDate,
              introduction: "",
              sections: [], // 确保sections数组存在，即使是空的
              conclusion: "",
              references: [],
            };
          } else {
            // 对于结构化报告，确保所有必要字段存在
            finalReport = {
              ...report,
              title: report.title || `${state.topic}研究报告`,
              introduction: report.introduction || "",
              sections: Array.isArray(report.sections) ? report.sections : [],
              conclusion: report.conclusion || "",
              references: Array.isArray(report.references)
                ? report.references
                : [],
              generatedAt: reportDate,
            };
          }

          // 确保content字段存在，无论是什么类型的报告
          if (!finalReport.content && state.streamingContent) {
            console.log("从流中添加内容到最终报告");
            finalReport.content = state.streamingContent;
          }

          console.log("最终报告对象:", {
            title: finalReport.title,
            hasContent: !!finalReport.content,
            contentLength: finalReport.content ? finalReport.content.length : 0,
            isPlainText: finalReport.isPlainText,
            generatedAt: finalReport.generatedAt,
            hasReportSections:
              Array.isArray(finalReport.sections) &&
              finalReport.sections.length > 0,
          });

          return {
            report: finalReport,
            isResearching: false,
            researchState: "completed",
            isCompleted: true,
          };
        });
      } catch (error) {
        console.error("处理报告时出错:", error);
        // 发生错误时使用最基本的报告对象
        set((state) => {
          // 确保有内容可用
          const fallbackContent =
            state.streamingContent || "报告生成出错，请重试";
          console.log(
            "使用后备内容:",
            fallbackContent.substring(0, 100) + "..."
          );

          return {
            report: {
              title: `${state.topic}研究报告`,
              isPlainText: true,
              content: fallbackContent,
              date: new Date().toISOString(),
              generatedAt: new Date(),
              introduction: "",
              sections: [],
              conclusion: "",
              references: [],
            },
            isResearching: false,
            researchState: "completed",
            isCompleted: true,
          };
        });
      }
    } else {
      // 没有报告数据，从流内容创建一个基本报告
      set((state) => {
        // 如果有累积的流内容，创建一个报告
        if (state.streamingContent && state.streamingContent.trim() !== "") {
          console.log("没有报告对象，但有流内容，创建基于流的报告");
          const now = new Date();
          return {
            report: {
              title: `${state.topic}研究报告`,
              isPlainText: true,
              content: state.streamingContent,
              date: now.toISOString(),
              generatedAt: now,
              introduction: "",
              sections: [],
              conclusion: "",
              references: [],
            },
            isResearching: false,
            researchState: "completed",
            isCompleted: true,
          };
        }

        // 否则只更新状态
        console.log("没有报告对象，也没有流内容，只更新状态");
        return {
          isResearching: false,
          researchState: "completed",
          isCompleted: true,
        };
      });
    }

    console.log("完成事件处理完毕，状态已更新");
  },

  // 处理错误事件
  handleErrorEvent: (payload) => {
    const { message } = payload;

    set({
      isResearching: false,
      researchState: "error",
    });

    // 添加错误活动
    set((state) => ({
      activities: [
        ...state.activities,
        {
          id: uuidv4(),
          type: "error",
          status: "error",
          message: "研究过程出错",
          timestamp: new Date(),
          details: message,
        },
      ],
    }));
  },

  startResearch: async () => {
    // 获取当前状态
    const { topic, questions, connectToStream } = get();

    // 使用新的流式API
    if (topic && questions.length > 0) {
      const questionTexts = questions.map((q) => q.text);
      connectToStream(topic, questionTexts);
    } else {
      console.error("缺少研究主题或问题");

      // 设置错误状态
      set({
        isResearching: false,
        researchState: "error",
      });

      // 添加错误活动
      set((state) => ({
        activities: [
          ...state.activities,
          {
            id: uuidv4(),
            type: "error",
            status: "error",
            message: "无法开始研究",
            timestamp: new Date(),
            details: "研究主题或问题不能为空",
          },
        ],
      }));
    }
  },

  addActivity: (activity) =>
    set((state) => ({
      activities: [
        ...state.activities,
        {
          id: uuidv4(),
          timestamp: new Date(),
          ...activity,
        },
      ],
    })),

  updateActivityStatus: (id, status, message) =>
    set((state) => ({
      activities: state.activities.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              status,
              ...(message ? { message } : {}),
            }
          : activity
      ),
    })),

  addSource: (source) =>
    set((state) => {
      // 检查是否已存在相同URL的来源
      if (state.sources.some((s) => s.url === source.url)) {
        return { sources: state.sources }; // 不添加重复的来源
      }
      return { sources: [...state.sources, source] };
    }),

  addFinding: (finding) =>
    set((state) => ({
      findings: [
        ...state.findings,
        {
          id: uuidv4(),
          ...finding,
        },
      ],
    })),

  setReport: (report) => set({ report }),

  reset: () => {
    // 先断开可能存在的流连接
    const { disconnectStream } = get();
    disconnectStream();

    // 重置所有状态
    set({
      topic: "",
      questions: [],
      currentQuestionIndex: 0,
      isCompleted: false,
      isLoading: false,
      isResearching: false,
      researchState: "idle",
      activities: [],
      sources: [],
      findings: [],
      report: null,
      streamingContent: "",
      isStreamConnected: false,
    });
  },
}));

// 从Markdown内容生成报告对象
function createReportFromMarkdown(topic: string, markdown: string): Report {
  // 提取标题
  const titleMatch = markdown.match(/^#\s+(.*?)$/m);
  const title = titleMatch ? titleMatch[1].trim() : `${topic}研究报告`;

  // 提取引言
  const introMatch = markdown.match(/##\s+引言\s+([\s\S]*?)(?=##|$)/);
  const introduction = introMatch ? introMatch[1].trim() : "";

  // 提取结论
  const conclusionMatch = markdown.match(/##\s+结论\s+([\s\S]*?)(?=##|$)/);
  const conclusion = conclusionMatch ? conclusionMatch[1].trim() : "";

  // 提取参考资料
  const referencesMatch = markdown.match(/##\s+参考资料\s+([\s\S]*?)(?=$)/);
  let references: any[] = [];

  if (referencesMatch) {
    const referencesText = referencesMatch[1];
    const refRegex = /\d+\.\s+\[(.*?)\]\((.*?)\)/g;
    let refMatch;

    while ((refMatch = refRegex.exec(referencesText)) !== null) {
      references.push({
        title: refMatch[1],
        url: refMatch[2],
      });
    }
  }

  // 提取各部分内容
  const sectionRegex = /##\s+(?!引言|结论|参考资料)(.*?)\s+([\s\S]*?)(?=##|$)/g;
  let sectionMatch;
  const sections = [];

  while ((sectionMatch = sectionRegex.exec(markdown)) !== null) {
    const sectionTitle = sectionMatch[1].trim();
    const sectionContent = sectionMatch[2].trim();

    // 提取发现点
    const findings: ResearchFinding[] = [];
    const findingRegex = /-\s+(.*?)(?=-|$)/g;
    let findingMatch;

    while ((findingMatch = findingRegex.exec(sectionContent)) !== null) {
      findings.push({
        id: uuidv4(),
        summary: findingMatch[1].trim(),
        details: "",
        sources: [],
      });
    }

    sections.push({
      id: uuidv4(),
      title: sectionTitle,
      content: sectionContent,
      findings,
    });
  }

  return {
    title,
    introduction,
    sections,
    conclusion,
    references,
    generatedAt: new Date(),
  };
}
