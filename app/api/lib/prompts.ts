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

【严格的JSON格式要求】
请按照以下格式返回JSON，确保格式完全有效:
{
  "title": "报告标题",
  "date": "2024-03-26T00:00:00Z",
  "introduction": "引言内容",
  "methodology": "研究方法描述",
  "findings": [
    {
      "question": "研究问题1",
      "answer": "综合回答",
      "details": ["详细发现1", "详细发现2"]
    }
  ],
  "conclusion": "结论内容",
  "references": ["参考资料1", "参考资料2"]
}

【特别注意】
1. 创建逻辑清晰的报告结构
2. 准确表达研究发现，避免添加未经支持的信息
3. 突出关键结论和洞见
4. 适当引用信息来源
5. 使用专业但易于理解的语言
6. 确保JSON格式严格正确:
   - 所有属性名必须用双引号包围
   - 所有字符串值必须用双引号包围，不能用单引号
   - 数组或对象最后一个元素后不能有逗号
   - 不要在JSON中添加注释

请按照要求的格式创建报告，确保内容准确、客观且有深度。
不要在JSON前后添加任何额外文本、标记或代码块符号。
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
请基于以下研究发现，创建一份全面的研究报告：

研究主题：${topic}
研究问题：
${questions.join("\n")}

研究发现：
${JSON.stringify(allFindings, null, 2)}

请创建一份包含以下部分的研究报告：
1. 引言 - 简要介绍研究主题和目的
2. 研究方法 - 简要说明研究方法
3. 主要发现 - 按研究问题组织
4. 结论 - 总结主要发现和洞见
5. 参考资料 - 列出信息来源

返回格式为JSON：
{
  "title": "报告标题",
  "date": "${new Date().toISOString()}",
  "introduction": "引言内容",
  "methodology": "研究方法",
  "findings": [
    {
      "question": "研究问题1",
      "answer": "综合回答",
      "details": ["详细发现1", "详细发现2"]
    }
  ],
  "conclusion": "结论内容",
  "references": ["参考资料1", "参考资料2"]
}
`;
}
