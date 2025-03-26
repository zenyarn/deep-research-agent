/**
 * 研究过程中使用的常量
 */

// 研究迭代限制
export const MAX_ITERATIONS = 3;

// 搜索结果限制
export const MAX_SEARCH_RESULTS = 5;

// 内容字符限制
export const MAX_CONTENT_CHARS = 15000;

// 重试配置
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 1000;

// 模型配置
export const MODELS = {
  // 问题生成模型
  questionGeneration: {
    id: "anthropic/claude-3-opus-20240229",
    temperature: 0.5,
    max_tokens: 1000,
  },

  // 信息提取模型
  informationExtraction: {
    id: "anthropic/claude-3-haiku-20240307",
    temperature: 0.2,
    max_tokens: 1000,
  },

  // 分析和综合模型
  analysisAndSynthesis: {
    id: "anthropic/claude-3-sonnet-20240229",
    temperature: 0.7,
    max_tokens: 2000,
  },

  // 报告生成模型
  reportGeneration: {
    id: "anthropic/claude-3-opus-20240229",
    temperature: 0.7,
    max_tokens: 4000,
  },
};
