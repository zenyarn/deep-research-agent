/**
 * Exa Search API集成
 * 提供高质量的网络信息搜索功能
 */

// 搜索结果文档接口
export interface SearchDocument {
  id: string;
  title: string;
  url: string;
  text: string;
  score: number;
  published_date?: string;
  author?: string;
  source?: string;
}

// 搜索选项接口
export interface SearchOptions {
  num_results?: number;
  start_published_date?: string;
  end_published_date?: string;
  include_domains?: string[];
  exclude_domains?: string[];
  type?: "keyword" | "neural";
  highlight_results?: boolean;
  use_autoprompt?: boolean;
}

/**
 * 使用Exa API搜索相关内容
 * @param query 搜索查询
 * @param options 搜索选项
 * @returns 搜索结果文档数组
 */
export async function exaSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchDocument[]> {
  const apiKey = process.env.EXA_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("缺少EXA_SEARCH_API_KEY环境变量");
  }

  const defaultOptions: SearchOptions = {
    num_results: 10,
    type: "neural",
    highlight_results: true,
    use_autoprompt: true,
  };

  const searchOptions = { ...defaultOptions, ...options };

  console.log(`正在使用Exa搜索: "${query}"`);

  try {
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        ...searchOptions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Exa搜索API错误:", response.status, errorText);
      throw new Error(`Exa搜索失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Exa搜索成功，找到${data.results?.length || 0}个结果`);

    // 转换为标准格式的文档
    return (data.results || []).map((result: any) => ({
      id:
        result.id ||
        `exa-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: result.title || "未知标题",
      url: result.url,
      text: result.text || result.content || result.extract || "",
      score: result.relevance_score || 0,
      published_date: result.published_date,
      author: result.author,
      source: result.source || new URL(result.url).hostname,
    }));
  } catch (error) {
    console.error("Exa搜索出错:", error);
    throw error;
  }
}

/**
 * 获取文档全文内容
 * @param url 文档URL
 * @returns 文档全文内容
 */
export async function exaGetContent(url: string): Promise<string> {
  const apiKey = process.env.EXA_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("缺少EXA_SEARCH_API_KEY环境变量");
  }

  console.log(`正在获取内容: ${url}`);

  try {
    const response = await fetch("https://api.exa.ai/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        url,
        include_html: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Exa内容提取API错误:", response.status, errorText);
      throw new Error(
        `Exa内容提取失败: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`Exa内容提取成功，内容长度: ${data.extract?.length || 0}字符`);

    return data.extract || "";
  } catch (error) {
    console.error("Exa内容提取出错:", error);
    throw error;
  }
}
