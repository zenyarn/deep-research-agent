/**
 * 模型配置
 * 为不同的研究任务配置适合的模型
 */

// 定义模型参数接口
interface ModelParams {
  temperature: number;
  top_p: number;
  max_tokens: number;
}

// 定义模型参数映射类型
interface ModelParamsMap {
  [modelId: string]: ModelParams;
}

// 为不同任务配置适合的模型
export const MODELS = {
  // 用于生成搜索查询
  PLANNING: "google/gemini-2.0-flash-thinking-exp:free",

  // 用于从搜索结果中提取信息 - 使用更擅长JSON输出的模型
  EXTRACTION: "google/gemini-2.0-flash-lite-preview-02-05:free",

  // 用于分析研究发现 - 使用更擅长JSON输出的模型
  ANALYSIS: "google/gemini-2.0-flash-lite-preview-02-05:free",

  // 用于生成研究报告 - 使用更擅长JSON输出的模型
  REPORT: "google/gemini-2.0-flash-lite-preview-02-05:free",
};

// 模型参数配置
export const MODEL_PARAMS: ModelParamsMap = {
  "google/gemini-2.0-flash-thinking-exp:free": {
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 2000,
  },
  // Gemini JSON输出模型参数
  "google/gemini-2.0-flash-lite-preview-02-05:free": {
    temperature: 0.3, // 降低温度以增加输出的确定性
    top_p: 0.95,
    max_tokens: 2000,
  },
  // 可以为其他模型添加不同的参数配置
};

// 获取任务的模型配置
export function getModelForTask(task: keyof typeof MODELS) {
  return MODELS[task];
}

// 获取模型的参数配置
export function getModelParams(modelId: string): ModelParams {
  return (
    MODEL_PARAMS[modelId] ||
    MODEL_PARAMS["google/gemini-2.0-flash-thinking-exp:free"]
  );
}
