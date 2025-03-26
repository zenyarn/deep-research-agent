/**
 * 研究功能
 * 整合各种研究功能，协调模型调用和搜索请求
 */

import { exaSearch, exaGetContent, SearchDocument } from "./exa-search";
import { getModelForTask, getModelParams } from "./models";
import {
  buildPlanningPrompt,
  buildExtractionPrompt,
  buildAnalysisPrompt,
  buildReportPrompt,
  PLANNING_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  ANALYSIS_SYSTEM_PROMPT,
  REPORT_SYSTEM_PROMPT,
} from "./prompts";
import { ActivityTracker } from "./activity-tracker";
import { extractAndParseJSON } from "./utils";

// 获取OpenRouter API密钥
function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("缺少OPENROUTER_API_KEY环境变量");
  }
  return apiKey;
}

// 添加一个安全获取API响应内容的辅助函数
function safeGetContentFromApiResponse(data: any): string {
  try {
    // 检查data是否存在
    if (!data) {
      console.log("API响应为空");
      return "";
    }

    // 记录响应结构，帮助调试
    console.log(
      "API响应结构:",
      JSON.stringify({
        hasChoices: Array.isArray(data.choices),
        choicesLength: Array.isArray(data.choices) ? data.choices.length : 0,
        firstChoice:
          data.choices && data.choices.length > 0
            ? typeof data.choices[0]
            : "不存在",
        hasMessage:
          data.choices && data.choices.length > 0 && data.choices[0]
            ? "message" in data.choices[0]
            : false,
      })
    );

    // 如果是标准结构，按正常方式获取
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content || "";
    }

    // Claude直接输出模式
    if (data.content) {
      return data.content;
    }

    // 其他可能的结构
    if (data.choices && data.choices.length > 0) {
      // OpenAI格式变体
      if (data.choices[0].text) {
        return data.choices[0].text;
      }

      // 可能是直接内容
      if (typeof data.choices[0] === "string") {
        return data.choices[0];
      }

      // 其他可能的属性
      if (data.choices[0].content) {
        return data.choices[0].content;
      }
    }

    // 如果有message但结构不同
    if (data.message && typeof data.message === "object") {
      return data.message.content || "";
    }

    console.warn("无法从API响应中提取内容，使用空字符串");
    return "";
  } catch (error) {
    console.error("从API响应中提取内容时出错:", error);
    return "";
  }
}

/**
 * 生成搜索查询
 * @param topic 研究主题
 * @param questions 研究问题列表
 * @param activityTracker 活动跟踪器
 * @returns 生成的搜索查询列表
 */
export async function generateSearchQueries(
  topic: string,
  questions: string[],
  activityTracker: ActivityTracker
): Promise<string[]> {
  console.log("生成搜索查询，主题:", topic);
  const apiKey = getApiKey();

  const model = getModelForTask("PLANNING");
  const modelParams = getModelParams(model);
  const prompt = buildPlanningPrompt(topic, questions);

  try {
    console.log("开始调用OpenRouter API生成搜索查询...");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Deep Research AI Agent",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: PLANNING_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: modelParams.temperature,
          top_p: modelParams.top_p,
          max_tokens: modelParams.max_tokens,
        }),
      }
    );

    console.log("API响应状态:", response.status);

    if (!response.ok) {
      let errorText = "";
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
        console.error("OpenRouter API错误响应:", errorData);
      } catch (e) {
        errorText = await response.text();
        console.error("无法解析错误响应:", errorText);
      }

      throw new Error(`API调用失败(${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log("API响应消息:", JSON.stringify(data).substring(0, 100) + "...");

    // 使用安全获取内容的函数
    const content = safeGetContentFromApiResponse(data);
    let queries = [];

    try {
      // 使用增强的解析函数处理可能包含Markdown代码块的JSON
      const parsed = extractAndParseJSON(content);
      if (
        parsed &&
        Array.isArray(parsed.queries) &&
        parsed.queries.length > 0
      ) {
        queries = parsed.queries;
        console.log("成功解析查询:", queries);
      }
    } catch (e) {
      console.log("无法解析JSON响应:", e);
    }

    if (queries.length === 0) {
      // 返回默认查询
      return [`${topic} 最新研究`, `${topic} 关键问题`, `${topic} 重要影响`];
    }

    return queries;
  } catch (error) {
    console.error("生成搜索查询出错:", error);
    return [`${topic} 最新研究`, `${topic} 关键问题`, `${topic} 重要影响`];
  }
}

/**
 * 执行搜索
 * @param queries 搜索查询列表
 * @param activityTracker 活动跟踪器
 * @returns 搜索结果列表
 */
export async function performSearch(
  queries: string[],
  activityTracker: ActivityTracker
): Promise<SearchDocument[]> {
  const results: SearchDocument[] = [];

  for (const query of queries) {
    try {
      const searchResults = await exaSearch(query, {
        num_results: 5,
        type: "neural",
        highlight_results: true,
      });

      results.push(...searchResults);
      console.log(`查询 "${query}" 返回 ${searchResults.length} 个结果`);
    } catch (error) {
      console.error(`搜索查询 "${query}" 出错:`, error);
    }
  }

  // 去重
  const uniqueResults = Array.from(
    new Map(results.map((item) => [item.url, item])).values()
  );

  console.log(`总共找到 ${uniqueResults.length} 个唯一结果`);
  return uniqueResults;
}

/**
 * 提取搜索结果中的信息
 * @param topic 研究主题
 * @param question 研究问题
 * @param searchResults 搜索结果
 * @param activityTracker 活动跟踪器
 * @returns 提取的研究发现
 */
export async function extractInformation(
  topic: string,
  question: string,
  searchResults: SearchDocument[],
  activityTracker: ActivityTracker
): Promise<any> {
  console.log(`为问题 "${question}" 提取信息`);
  const apiKey = getApiKey();

  const model = getModelForTask("EXTRACTION");
  const modelParams = getModelParams(model);

  // 截取限制
  const MAX_TEXT_LENGTH = 8000; // 限制每个结果文本长度
  const MAX_RESULTS = 5; // 限制处理的结果数量

  // 准备搜索结果文本，限制结果数量和每个结果的文本长度
  const limitedResults = searchResults.slice(0, MAX_RESULTS);

  const searchTexts = limitedResults.map((result) => {
    const limitedText =
      result.text.length > MAX_TEXT_LENGTH
        ? result.text.substring(0, MAX_TEXT_LENGTH) + "..."
        : result.text;

    return `来源: ${result.url}\n标题: ${result.title}\n\n${limitedText}`;
  });

  const prompt = buildExtractionPrompt(topic, question, searchTexts);

  try {
    console.log("开始调用OpenRouter API提取信息...");
    console.log(
      `处理了 ${limitedResults.length} 个结果，限制每个文本长度为 ${MAX_TEXT_LENGTH} 字符`
    );

    // 确定是否为Gemini模型
    const isGeminiModel = model.includes("gemini");

    // 请求体基本结构
    const requestBody: any = {
      model,
      messages: [
        {
          role: "system",
          content: EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: modelParams.temperature,
      top_p: modelParams.top_p,
      max_tokens: modelParams.max_tokens,
    };

    // 如果是JSON输出型任务且使用支持的模型，添加response_format
    if (isGeminiModel) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Deep Research AI Agent",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`API调用失败(${response.status})`);
    }

    const data = await response.json();
    // 使用安全获取内容的函数
    const content = safeGetContentFromApiResponse(data);

    // 记录原始响应用于调试
    console.log(
      "API返回的原始内容:",
      content.substring(0, 500) + (content.length > 500 ? "..." : "")
    );

    try {
      // 尝试直接解析JSON
      if (isGeminiModel) {
        try {
          // Gemini通常返回格式良好的JSON
          const findings = JSON.parse(content);
          console.log("Gemini模型返回的JSON解析成功");
          return findings;
        } catch (e) {
          console.log("Gemini返回的内容解析失败，尝试使用通用解析函数:", e);
        }
      }

      // 使用增强的JSON解析函数
      const findings = extractAndParseJSON(content);

      // 确保返回正确的格式，即使解析失败也提供基本结构
      if (!findings.findings || !Array.isArray(findings.findings)) {
        console.warn("解析后的findings不是数组，创建默认结构");
        return { findings: [] };
      }

      return findings;
    } catch (e) {
      console.error("解析提取结果出错:", e);
      return { findings: [] };
    }
  } catch (error) {
    console.error("信息提取出错:", error);
    return { findings: [] };
  }
}

/**
 * 分析研究发现
 * @param topic 研究主题
 * @param question 研究问题
 * @param findings 研究发现
 * @param activityTracker 活动跟踪器
 * @returns 分析结果
 */
export async function analyzeFindings(
  topic: string,
  question: string,
  findings: any,
  activityTracker: ActivityTracker
): Promise<any> {
  console.log(`分析问题 "${question}" 的研究发现`);
  const apiKey = getApiKey();

  const model = getModelForTask("ANALYSIS");
  const modelParams = getModelParams(model);

  const prompt = buildAnalysisPrompt(topic, question, findings.findings || []);

  try {
    console.log("开始调用OpenRouter API分析发现...");

    // 确定是否为Gemini模型
    const isGeminiModel = model.includes("gemini");

    // 请求体基本结构
    const requestBody: any = {
      model,
      messages: [
        {
          role: "system",
          content: ANALYSIS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: modelParams.temperature,
      top_p: modelParams.top_p,
      max_tokens: modelParams.max_tokens,
    };

    // 如果是JSON输出型任务且使用支持的模型，添加response_format
    if (isGeminiModel) {
      requestBody.response_format = { type: "json_object" };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Deep Research AI Agent",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`API调用失败(${response.status})`);
    }

    const data = await response.json();
    // 使用安全获取内容的函数
    const content = safeGetContentFromApiResponse(data);

    // 记录原始响应用于调试
    console.log(
      "API返回的原始内容:",
      content.substring(0, 500) + (content.length > 500 ? "..." : "")
    );

    try {
      // 尝试直接解析JSON
      if (isGeminiModel) {
        try {
          // Gemini通常返回格式良好的JSON
          const analysis = JSON.parse(content);
          console.log("Gemini模型返回的JSON解析成功");
          return analysis;
        } catch (e) {
          console.log("Gemini返回的内容解析失败，尝试使用通用解析函数:", e);
        }
      }

      // 使用增强的JSON解析函数
      const analysis = extractAndParseJSON(content);
      return analysis;
    } catch (e) {
      console.error("解析分析结果出错:", e);
      return {
        isComplete: false,
        gaps: ["解析错误，无法获取分析结果"],
        additionalQueries: [],
      };
    }
  } catch (error) {
    console.error("分析发现出错:", error);
    return {
      isComplete: false,
      gaps: ["API调用错误，无法进行分析"],
      additionalQueries: [],
    };
  }
}

/**
 * 生成研究报告
 * @param topic 研究主题
 * @param questions 研究问题列表
 * @param allFindings 所有研究发现
 * @param activityTracker 活动跟踪器
 * @returns 生成的研究报告
 */
export async function generateReport(
  topic: string,
  questions: string[],
  allFindings: any[],
  activityTracker: ActivityTracker
): Promise<any> {
  console.log("生成研究报告");
  const apiKey = getApiKey();

  const model = getModelForTask("REPORT");
  const modelParams = getModelParams(model);

  const prompt = buildReportPrompt(topic, questions, allFindings);

  try {
    console.log("开始调用OpenRouter API生成报告...");

    // 确定是否为Gemini模型
    const isGeminiModel = model.includes("gemini");

    // 请求体基本结构
    const requestBody: any = {
      model,
      messages: [
        {
          role: "system",
          content: REPORT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: modelParams.temperature,
      top_p: modelParams.top_p,
      max_tokens: modelParams.max_tokens,
    };

    // 移除response_format要求，我们需要的是纯文本格式的报告
    // 不再需要指定JSON格式

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Deep Research AI Agent",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`API调用失败(${response.status})`);
    }

    const data = await response.json();
    // 使用安全获取内容的函数
    const content = safeGetContentFromApiResponse(data);

    // 记录原始响应用于调试
    console.log(
      "API返回的原始内容:",
      content.substring(0, 500) + (content.length > 500 ? "..." : "")
    );

    // 确保我们有报告内容，即使是空的
    if (content && content.trim() !== "") {
      // 为活动跟踪器添加报告内容
      if ("sendReportUpdate" in activityTracker) {
        (activityTracker as any).sendReportUpdate(content);
      }

      return { content, title: `${topic}研究报告` };
    } else {
      // 生成一个基本的报告结构，避免完全失败
      const fallbackReport = `# ${topic}研究报告\n\n由于技术原因，无法生成完整报告。请稍后再试。\n\n`;

      // 为活动跟踪器添加报告内容
      if ("sendReportUpdate" in activityTracker) {
        (activityTracker as any).sendReportUpdate(fallbackReport);
      }

      return { content: fallbackReport, title: `${topic}研究报告` };
    }
  } catch (error) {
    console.error("生成报告出错:", error);
    return {
      title: `${topic}研究报告`,
      date: new Date().toISOString(),
      content: "生成报告时出错，请重试。",
      introduction: "API调用错误，无法生成报告",
      methodology: "",
      findings: [],
      conclusion: "",
      references: [],
      isPlainText: true,
    };
  }
}

/**
 * 执行完整的研究流程
 * @param topic 研究主题
 * @param questions 研究问题列表
 * @param activityTracker 活动跟踪器
 * @returns 研究报告和研究过程数据
 */
export async function conductResearch(
  topic: string,
  questions: string[],
  activityTracker: ActivityTracker
): Promise<any> {
  // 步骤1: 生成搜索查询
  const planningId = activityTracker.add(
    "planning",
    "pending",
    `开始研究主题: ${topic}`
  );
  const queries = await generateSearchQueries(
    topic,
    questions,
    activityTracker
  );
  activityTracker.update(
    planningId,
    "complete",
    `已生成搜索查询: ${queries.join(", ")}`
  );

  // 步骤2: 执行搜索
  const searchId = activityTracker.add(
    "search",
    "pending",
    "正在搜索相关信息..."
  );
  const searchResults = await performSearch(queries, activityTracker);
  activityTracker.update(
    searchId,
    "complete",
    `已完成信息搜索，找到 ${searchResults.length} 个结果`
  );

  // 将搜索结果添加为来源
  searchResults.forEach((result) => {
    if ("addSource" in activityTracker) {
      (activityTracker as any).addSource({
        url: result.url,
        title: result.title,
        snippet: result.text.substring(0, 200) + "...",
        relevance: 0.7, // 使用默认相关度
      });
    }
  });

  // 步骤3: 提取和分析信息
  const extractId = activityTracker.add(
    "extract",
    "pending",
    "正在从搜索结果中提取信息..."
  );

  // 为每个问题提取信息
  const allFindings = [];
  for (const question of questions) {
    const findings = await extractInformation(
      topic,
      question,
      searchResults,
      activityTracker
    );
    const analysis = await analyzeFindings(
      topic,
      question,
      findings,
      activityTracker
    );

    allFindings.push({
      question,
      findings: findings.findings || [],
      analysis,
    });

    // 移除部分报告更新逻辑，等待完整报告生成后再发送
    // 不再发送部分报告更新
    /* 
    if ("sendReportUpdate" in activityTracker) {
      // 创建该问题的部分报告内容
      const partialReport = `
## ${question}

### 主要发现

${(findings.findings || []).map((f: any) => `- ${f.fact}`).join("\n")}

### 分析

${analysis.summary || "正在分析..."} 
${analysis.details || ""}
`;

      (activityTracker as any).sendReportUpdate(partialReport);
    }
    */
  }

  activityTracker.update(extractId, "complete", "已完成信息提取和分析");

  // 步骤4: 生成报告
  const generateId = activityTracker.add(
    "generate",
    "pending",
    "正在生成研究报告..."
  );
  const report = await generateReport(
    topic,
    questions,
    allFindings,
    activityTracker
  );

  activityTracker.update(generateId, "complete", "研究报告生成完成");

  // 返回研究结果
  return report;
}
