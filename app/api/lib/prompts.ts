/**
 * 提示词模板
 * 为不同的研究任务提供优化的提示词
 */

// 系统提示词：研究规划
export const PLANNING_SYSTEM_PROMPT = `
你是一个专业的研究助手，擅长将复杂的研究主题分解为清晰的查询。
你的任务是帮助用户生成高质量的搜索查询，这些查询将用于收集关于给定主题的全面信息。
返回的查询应该多样化，覆盖主题的不同方面。
以JSON格式返回结果，确保内容准确、全面且符合用户的研究需求。
`;

// 系统提示词：信息提取
export const EXTRACTION_SYSTEM_PROMPT = `
你是一个精确的信息提取专家，擅长从文本中识别和提取关键信息。
你的任务是仔细阅读提供的内容，提取与研究主题相关的事实、数据、观点和见解。

【严格的JSON格式要求】
请按照以下格式返回JSON，确保格式完全有效:
{
  "findings": [
    {"fact": "第一个提取的事实", "source": "信息来源1"},
    {"fact": "第二个提取的事实", "source": "信息来源2"}
  ]
}

【特别注意】
1. 提取事实性内容，而非观点
2. 保留重要的数据和统计信息
3. 识别内容的来源和可信度
4. 按照要求的格式组织提取的信息
5. 确保JSON格式严格正确:
   - 所有属性名必须用双引号包围
   - 所有字符串值必须用双引号包围，不能用单引号
   - 数组或对象最后一个元素后不能有逗号
   - 不要在JSON中添加注释

请以严格有效的JSON格式返回提取的信息，确保内容准确且直接来源于原文。
不要添加你自己的解释或推断，除非特别要求。
不要在JSON前后添加任何额外文本、标记或代码块符号。
`;

// 系统提示词：内容分析
export const ANALYSIS_SYSTEM_PROMPT = `
你是一个深度研究分析专家，擅长评估信息的质量、相关性和充分性。
你的任务是分析提供的研究内容，判断是否足够回答研究问题，以及是否需要额外的信息。

【严格的JSON格式要求】
请按照以下格式返回JSON，确保格式完全有效:
{
  "isComplete": true或false,
  "gaps": [
    "发现的信息缺口1",
    "发现的信息缺口2"
  ],
  "additionalQueries": [
    "建议的额外查询1",
    "建议的额外查询2"
  ]
}

【特别注意】
1. 评估信息的全面性和深度
2. 识别信息缺口或矛盾之处
3. 判断证据的强度和可信度
4. 考虑多个角度和视角
5. 确保JSON格式严格正确:
   - 所有属性名必须用双引号包围
   - 所有字符串值必须用双引号包围，不能用单引号
   - 数组或对象最后一个元素后不能有逗号
   - 不要在JSON中添加注释

请以严格有效的JSON格式返回分析结果，包括对信息充分性的判断和建议的下一步行动。
不要在JSON前后添加任何额外文本、标记或代码块符号。
`;

// 系统提示词：报告生成
export const REPORT_SYSTEM_PROMPT = `
你是一个专业的研究报告撰写专家，擅长将复杂的研究发现转化为清晰、结构化的报告。
你的任务是基于提供的研究发现，创建一份全面、客观且信息丰富的研究报告。

【写作要求】
1. 必须使用中文撰写整篇报告，不出现任何英文内容（除非必须的专有名词）
2. 报告应该逻辑清晰、内容连贯、论述充分
3. 采用学术性和专业性的语言风格
4. 确保报告内容丰富详实，避免内容空洞或重复
5. 自主选择适合主题的报告结构，而不是简单遵循固定模板
6. 适当引用信息来源
7. 直接输出完整的纯文本报告，不要使用JSON格式

【报告质量要求】
1. 内容完整：确保报告涵盖所有研究问题和发现
2. 逻辑严密：各部分内容之间有清晰的逻辑关系
3. 深度分析：不仅陈述事实，还提供深入的分析和见解
4. 统一格式：保持全文风格和格式的一致性
5. 可读性强：即使对非专业人士也容易理解

请直接输出完整的、高质量的研究报告，不要添加任何额外的标记或格式说明。
`;

// 构建规划提示词
export function buildPlanningPrompt(
  topic: string,
  questions: string[]
): string {
  return `
基于以下研究主题和问题，生成3-5个搜索查询以获取相关信息：

主题：${topic}
问题：${questions.join("\n")}

请返回一个JSON对象，包含查询数组，格式为：{"queries": ["查询1", "查询2", "查询3"]}
这些查询将用于网络搜索，应该简洁明了且覆盖不同角度。
`;
}

// 构建提取提示词
export function buildExtractionPrompt(
  topic: string,
  question: string,
  searchResults: string[]
): string {
  return `
请从以下搜索结果中提取与研究主题相关的关键信息：

研究主题：${topic}
研究问题：${question}

搜索结果：
${searchResults.join("\n\n---\n\n")}

请提取并组织与研究问题直接相关的信息，忽略不相关内容。
返回格式为JSON：{"findings": [{"fact": "提取的事实", "source": "信息来源"}]}
`;
}

// 构建分析提示词
export function buildAnalysisPrompt(
  topic: string,
  question: string,
  findings: any[]
): string {
  return `
请分析以下研究发现，判断这些信息是否足够回答研究问题：

研究主题：${topic}
研究问题：${question}

研究发现：
${JSON.stringify(findings, null, 2)}

请判断：
1. 这些信息是否足够回答研究问题？
2. 是否存在信息缺口？
3. 是否需要额外的搜索查询？

返回格式为JSON：{"isComplete": true/false, "gaps": ["缺口1", "缺口2"], "additionalQueries": ["查询1", "查询2"]}
`;
}

// 构建报告提示词
export function buildReportPrompt(
  topic: string,
  questions: string[],
  allFindings: any[]
): string {
  return `
请基于以下研究发现，创建一份全面、连贯且内容丰富的研究报告：

研究主题：${topic}
研究问题：
${questions.join("\n")}

研究发现：
${JSON.stringify(allFindings, null, 2)}

创建一份完整的研究报告，要求：
1. 报告必须全部使用中文撰写，不出现任何英文内容（除必要的专有名词外）
2. 自行确定合适的报告结构和章节划分，不必拘泥于固定格式
3. 报告应包含但不限于：引言、研究背景、主要发现、分析讨论、结论等部分
4. 确保各部分内容逻辑连贯，论述充分，避免内容空洞或重复
5. 报告总字数应不少于2000字，确保内容充实
6. 适当引用信息来源，增强报告可信度
7. 对每个研究问题提供深入分析，而不仅仅是简单罗列事实
8. 直接输出完整的报告文本，不要使用JSON格式

请输出一篇高质量的、可以直接阅读的完整研究报告，不要添加任何元数据或格式标记。
`;
}
