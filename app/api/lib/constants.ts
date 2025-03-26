// 重试配置
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1000;

// 搜索配置
export const MAX_SEARCH_RESULTS = 5;
export const MAX_CONTENT_CHARS = 10000;
export const MAX_ITERATIONS = 3;

// 模型配置
export const MODELS = {
  PLANNING: "google/gemini-2.0-flash-lite-preview-02-05:free",
  EXTRACTION: "google/gemini-2.0-flash-lite-preview-02-05:free",
  ANALYSIS: "google/gemini-2.0-flash-lite-preview-02-05:free",
  REPORT: "google/gemini-2.0-flash-lite-preview-02-05:free",
} as const;

// 系统提示词
export const PLANNING_SYSTEM_PROMPT = `You are a research planning assistant. Your task is to help break down research topics into specific, searchable queries.`;

export const EXTRACTION_SYSTEM_PROMPT = `You are a content extraction specialist. Your task is to extract and summarize relevant information from source content.`;

export const ANALYSIS_SYSTEM_PROMPT = `You are a research analysis expert. Your task is to analyze collected information and identify gaps in research.`;

export const REPORT_SYSTEM_PROMPT = `You are a professional report writer. Your task is to synthesize research findings into a comprehensive, well-structured report.`;
