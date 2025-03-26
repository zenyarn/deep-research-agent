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
      activities: [],
      sources: [],
      findings: [],
      report: null,
    }),
}));
