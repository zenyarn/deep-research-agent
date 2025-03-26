import { ResearchState, Activity } from "./activity-tracker";

// 定义研究发现和来源的类型接口
interface ResearchFinding {
  id: string;
  summary: string;
  details?: string;
  sources: ResearchSource[];
  confidence?: number;
}

interface ResearchSource {
  url: string;
  title: string;
}

/**
 * 创建延迟的Promise
 * @param ms 延迟的毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 将研究发现合并为一个文本字符串
 * @param state 研究状态
 * @returns 合并后的文本
 */
export function combineFindings(state: ResearchState): string {
  if (!state.findings || state.findings.length === 0) {
    return "";
  }

  return state.findings
    .map((finding: ResearchFinding) => {
      let text = `## ${finding.summary}\n\n`;

      if (finding.details) {
        text += `${finding.details}\n\n`;
      }

      if (finding.sources && finding.sources.length > 0) {
        text += "来源：\n";
        finding.sources.forEach((source: ResearchSource) => {
          text += `- ${source.title} (${source.url})\n`;
        });
      }

      return text;
    })
    .join("\n\n");
}

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param context 错误上下文
 * @returns 格式化的错误对象
 */
export function handleError(error: unknown, context: string = "未知上下文") {
  const errorObject = error instanceof Error ? error : new Error(String(error));

  console.error(`错误 (${context}):`, errorObject);

  return {
    message: errorObject.message,
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 解析流式响应的JSON数据
 * @param chunk JSON字符串
 * @returns 解析后的对象或null
 */
export function parseStreamChunk(chunk: string) {
  try {
    return JSON.parse(chunk);
  } catch (error) {
    console.warn("解析流数据失败:", error);
    return null;
  }
}
