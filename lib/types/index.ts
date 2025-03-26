/**
 * 活动类型 - 表示研究过程中的各种活动
 */
export type ActivityType =
  | "search" // 搜索活动
  | "extract" // 信息提取活动
  | "analyze" // 分析活动
  | "question" // 生成问题活动
  | "summarize" // 总结活动
  | "clarify" // 澄清问题活动
  | "error"; // 错误活动

/**
 * 活动状态 - 表示活动的当前状态
 */
export type ActivityStatus =
  | "pending" // 活动正在进行中
  | "complete" // 活动已完成
  | "error" // 活动出错
  | "warning"; // 活动有警告

/**
 * 活动接口 - 表示研究过程中的一个活动
 */
export interface Activity {
  id: string; // 活动的唯一ID
  type: ActivityType; // 活动类型
  status: ActivityStatus; // 活动状态
  message: string; // 活动消息
  timestamp: Date; // 活动时间戳
  details?: string; // 活动的更多详细信息（可选）
}

/**
 * 来源接口 - 表示研究信息的来源
 */
export interface Source {
  url: string; // 来源的URL
  title: string; // 来源的标题
  snippet?: string; // 来源的摘要（可选）
  relevance?: number; // 与研究主题的相关性（可选）
}

/**
 * 问题接口 - 表示研究过程中生成的问题
 */
export interface Question {
  id: string; // 问题的唯一ID
  text: string; // 问题文本
  answer?: string; // 问题的答案（可选）
  sources?: Source[]; // 与问题相关的来源（可选）
}

/**
 * 研究发现接口 - 表示研究过程中的发现
 */
export interface ResearchFinding {
  id: string; // 发现的唯一ID
  summary: string; // 发现摘要
  details?: string; // 发现的详细信息（可选）
  sources: Source[]; // 发现的来源
  confidence?: number; // 发现的置信度（可选）
}

/**
 * 研究报告部分接口 - 表示研究报告的一个部分
 */
export interface ReportSection {
  id: string; // 部分的唯一ID
  title: string; // 部分标题
  content: string; // 部分内容
  findings: ResearchFinding[]; // 部分包含的发现
}

/**
 * 研究报告接口 - 表示最终的研究报告
 */
export interface Report {
  title: string; // 报告标题
  introduction: string; // 报告介绍
  sections: ReportSection[]; // 报告部分
  conclusion: string; // 报告结论
  references: Source[]; // 报告引用
  generatedAt: Date; // 报告生成时间
  isPlainText?: boolean;
  content?: string;
  date?: string; // ISO格式的日期字符串
}

/**
 * 研究状态类型 - 表示研究的当前阶段
 */
export type ResearchState =
  | "idle" // 初始状态，未开始研究
  | "researching" // 研究进行中
  | "completed" // 研究已完成
  | "error"; // 研究出错

/**
 * 深度研究状态接口 - 表示整个研究过程的状态
 */
export interface DeepResearchState {
  // 研究基本信息
  topic: string; // 研究主题

  // 问题和答案跟踪
  questions: Question[]; // 生成的问题列表
  currentQuestionIndex: number; // 当前问题索引

  // 研究进度跟踪
  isCompleted: boolean; // 研究是否完成
  isLoading: boolean; // 是否正在加载
  isResearching: boolean; // 是否正在进行研究
  researchState: ResearchState; // 研究状态

  // 活动和来源跟踪
  activities: Activity[]; // 研究活动列表
  sources: Source[]; // 信息来源列表

  // 研究结果
  findings: ResearchFinding[]; // 研究发现
  report: Report | null; // 最终研究报告

  // 流式数据状态
  streamConnection: {
    reader: ReadableStreamDefaultReader<Uint8Array>;
    active: boolean;
  } | null; // 流连接
  streamingContent: string; // 流式内容
  isStreamConnected: boolean; // 是否已连接到流

  // 状态管理函数
  setTopic: (topic: string) => void;
  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setIsCompleted: (isCompleted: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setResearchState: (state: ResearchState) => void; // 设置研究状态

  // 流式研究相关函数
  connectToStream: (topic: string, questions: string[]) => Promise<void>; // 连接到流
  disconnectStream: () => void; // 断开流连接
  handleActivityEvent: (activity: any) => void; // 处理活动事件
  handleSourceEvent: (source: any) => void; // 处理来源事件
  handleReportEvent: (payload: { content: string }) => void; // 处理报告事件
  handleCompleteEvent: (payload: any) => void; // 处理完成事件
  handleErrorEvent: (payload: { message: string }) => void; // 处理错误事件

  startResearch: () => Promise<void>; // 开始研究过程
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
  updateActivityStatus: (
    id: string,
    status: ActivityStatus,
    message?: string
  ) => void;
  addSource: (source: Source) => void;
  addFinding: (finding: Omit<ResearchFinding, "id">) => void;
  setReport: (report: Report) => void;
  reset: () => void;
}
