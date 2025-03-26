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
} from "@/lib/types";

/**
 * 创建深度研究状态管理Store
 */
export const useDeepResearchStore = create<DeepResearchState>((set) => ({
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

  startResearch: async () => {
    // 设置研究状态为进行中
    set({ isResearching: true, researchState: "researching" });

    // 添加一个开始研究的活动
    const activityId = uuidv4();
    set((state) => ({
      activities: [
        ...state.activities,
        {
          id: activityId,
          type: "analyze",
          status: "pending",
          message: "开始深度研究...",
          timestamp: new Date(),
        },
      ],
    }));

    try {
      // 这里应该调用后端API进行研究
      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 更新活动状态为完成
      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === activityId
            ? {
                ...activity,
                status: "complete",
                message: "深度研究已启动",
              }
            : activity
        ),
      }));

      // TODO: 在实际实现中，这里需要调用后端API
      // 创建模拟搜索活动
      const searchActivityId = uuidv4();
      set((state) => ({
        activities: [
          ...state.activities,
          {
            id: searchActivityId,
            type: "search",
            status: "pending",
            message: "搜索相关资料...",
            timestamp: new Date(),
          },
        ],
      }));

      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 更新搜索活动状态为完成
      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === searchActivityId
            ? {
                ...activity,
                status: "complete",
                message: "找到10条相关资料",
              }
            : activity
        ),
      }));

      // 模拟添加几个来源
      set((state) => ({
        sources: [
          ...state.sources,
          {
            url: "https://example.com/source1",
            title: "深度研究指南",
            snippet: "详细介绍了如何进行深度研究的方法和步骤。",
            relevance: 0.95,
          },
          {
            url: "https://example.com/source2",
            title: "AI辅助研究方法论",
            snippet: "探讨了人工智能如何辅助学术研究的最新进展。",
            relevance: 0.89,
          },
        ],
      }));

      // 创建模拟分析活动
      const analyzeActivityId = uuidv4();
      set((state) => ({
        activities: [
          ...state.activities,
          {
            id: analyzeActivityId,
            type: "analyze",
            status: "pending",
            message: "分析收集的资料...",
            timestamp: new Date(),
          },
        ],
      }));

      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // 更新分析活动状态为完成
      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === analyzeActivityId
            ? {
                ...activity,
                status: "complete",
                message: "资料分析完成",
              }
            : activity
        ),
      }));

      // 创建模拟总结活动
      const summarizeActivityId = uuidv4();
      set((state) => ({
        activities: [
          ...state.activities,
          {
            id: summarizeActivityId,
            type: "summarize",
            status: "pending",
            message: "生成研究报告...",
            timestamp: new Date(),
          },
        ],
      }));

      // 模拟异步操作
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // 生成模拟报告
      const mockReport: Report = {
        title: "深度研究AI代理：实现与应用",
        introduction:
          "本报告探讨了深度研究AI代理的设计、实现和应用场景。通过结合用户提供的问题和答案，系统能够进行深入的在线研究，并生成全面的报告。",
        sections: [
          {
            id: uuidv4(),
            title: "研究方法论",
            content:
              "本研究采用了混合方法论，结合自然语言处理技术和知识图谱来增强研究深度。系统能够自动提取关键概念，建立概念间的关联，并进行跨来源的信息验证。",
            findings: [
              {
                id: uuidv4(),
                summary: "AI辅助研究可显著提高研究效率",
                details:
                  "研究表明，使用AI辅助工具可将研究时间减少40-60%，同时保持或提高研究质量。",
                sources: [
                  {
                    url: "https://example.com/source1",
                    title: "深度研究指南",
                  },
                ],
              },
            ],
          },
          {
            id: uuidv4(),
            title: "技术实现",
            content:
              "深度研究AI代理采用了现代前端技术栈（React，Next.js，Tailwind CSS）结合大型语言模型API，实现了高度交互式的用户界面和强大的后端处理能力。系统架构采用了模块化设计，便于扩展和维护。",
            findings: [
              {
                id: uuidv4(),
                summary: "模块化设计提高了系统可维护性",
                details:
                  "通过将系统分解为状态管理、UI组件和API通信等模块，大大提高了代码的可维护性和可测试性。",
                sources: [
                  {
                    url: "https://example.com/source2",
                    title: "AI辅助研究方法论",
                  },
                ],
              },
            ],
          },
        ],
        conclusion:
          "深度研究AI代理代表了研究工具的未来发展方向。通过融合人类洞察力和AI的处理能力，它能够帮助研究者更快、更全面地探索复杂主题。随着技术的不断进步，我们可以期待这类工具在学术、商业和个人研究中发挥越来越重要的作用。",
        references: [
          {
            url: "https://example.com/source1",
            title: "深度研究指南",
            snippet: "详细介绍了如何进行深度研究的方法和步骤。",
          },
          {
            url: "https://example.com/source2",
            title: "AI辅助研究方法论",
            snippet: "探讨了人工智能如何辅助学术研究的最新进展。",
          },
        ],
        generatedAt: new Date(),
      };

      // 更新总结活动状态为完成
      set((state) => ({
        activities: state.activities.map((activity) =>
          activity.id === summarizeActivityId
            ? {
                ...activity,
                status: "complete",
                message: "研究报告已生成",
              }
            : activity
        ),
        // 设置报告
        report: mockReport,
        // 设置研究完成状态
        isResearching: false,
        researchState: "completed",
        isCompleted: true,
      }));
    } catch (error) {
      console.error("研究过程出错:", error);

      // 设置研究状态为错误
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
            message: "研究过程中发生错误",
            timestamp: new Date(),
            details: error instanceof Error ? error.message : String(error),
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

  reset: () =>
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
    }),
}));
