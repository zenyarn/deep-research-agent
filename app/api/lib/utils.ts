/**
 * 工具函数
 */

/**
 * 清理和修复不规范的JSON字符串
 *
 * 修复常见的JSON格式问题:
 * 1. 数组末尾多余的逗号: [1,2,] -> [1,2]
 * 2. 对象末尾多余的逗号: {"a":1,} -> {"a":1}
 * 3. 未加引号的属性名: {name:"value"} -> {"name":"value"}
 * 4. 单引号替换为双引号: {'name':'value'} -> {"name":"value"}
 * 5. 修复嵌套数组和对象中的格式问题
 * 6. 清除非法控制字符
 *
 * @param jsonStr 可能包含格式问题的JSON字符串
 * @returns 修复后的JSON字符串
 */
export function sanitizeJSON(jsonStr: string): string {
  if (!jsonStr) return "{}";

  // 移除非法控制字符 (ASCII 0-31，保留Tab, CR, LF)
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const code = jsonStr.charCodeAt(i);
    // 允许tab(9), 换行(10), 回车(13)和所有>=32的字符
    if (code >= 32 || code === 9 || code === 10 || code === 13) {
      result += jsonStr[i];
    } else {
      // 替换控制字符为空格
      result += " ";
    }
  }

  // 继续进行其他清理
  result = result
    // 替换数组末尾多余的逗号: [1,2,] -> [1,2]
    .replace(/,(\s*[\]}])/g, "$1")

    // 替换对象末尾多余的逗号: {"a":1,} -> {"a":1}
    .replace(/,(\s*})/g, "$1")

    // 确保属性名使用双引号: {name: -> {"name":
    .replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3')

    // 替换单引号为双引号: 'value' -> "value"
    .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')

    // 处理字符串中可能存在的转义问题
    .replace(/\\([^"\\\/bfnrtu])/g, "$1") // 移除无效的转义符号

    // 处理字符串中的特殊字符
    .replace(/[\u0000-\u001F]+/g, "") // 移除剩余的所有控制字符

    // 修复一些常见的错误格式
    .replace(/([^\\])"(])/g, '$1"]') // 修复 "example"] -> "example"]
    .replace(/([^\\])"(})/g, '$1"}'); // 修复 "example"} -> "example"}

  // 尝试去除行尾注释
  result = result.replace(/\/\/.*?(\r?\n|\r|$)/g, "$1");

  // 尝试处理JSON对象和数组的嵌套情况下的格式问题
  let openBrackets = 0;
  let openBraces = 0;
  let inString = false;
  let escape = false;
  let chars = result.split("");

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    // 处理转义字符
    if (inString && char === "\\") {
      escape = !escape;
      continue;
    }

    // 处理字符串区域
    if (char === '"' && !escape) {
      inString = !inString;
    }

    escape = false;

    // 只对非字符串区域内的括号计数
    if (!inString) {
      if (char === "[") openBrackets++;
      if (char === "]") openBrackets--;
      if (char === "{") openBraces++;
      if (char === "}") openBraces--;

      // 检查并修复数组内最后一个元素后的逗号
      if (char === "," && (chars[i + 1] === "]" || chars[i + 1] === "}")) {
        chars[i] = " "; // 用空格替换多余的逗号
      }
    }
  }

  result = chars.join("");

  return result;
}

/**
 * 解析可能包含Markdown代码块的JSON文本
 *
 * 处理以下几种情况:
 * 1. ```json\n{...}\n```
 * 2. 直接的JSON字符串: {...}
 * 3. 带有前缀或后缀文本的JSON: 这是JSON: {...} 结束
 *
 * @param content 从API返回的可能包含Markdown格式的JSON文本
 * @returns 解析后的JSON对象
 */
export function extractAndParseJSON(content: string): any {
  if (!content || typeof content !== "string") {
    console.log("内容为空或非字符串格式");
    return {};
  }

  // 记录原始内容用于调试
  console.log("尝试解析的原始文本:");
  console.log(content.substring(0, 500) + (content.length > 500 ? "..." : ""));

  // 查找并显示可能的控制字符
  const problematicIndices = [];
  for (let i = 0; i < Math.min(content.length, 500); i++) {
    const code = content.charCodeAt(i);
    // 检查特殊控制字符 (0-31 范围，除了常见的 9=\t, 10=\n, 13=\r)
    if (code < 32 && ![9, 10, 13].includes(code)) {
      problematicIndices.push({ index: i, charCode: code, char: content[i] });
    }
  }

  if (problematicIndices.length > 0) {
    console.log(
      "检测到可能导致问题的控制字符:",
      JSON.stringify(problematicIndices, null, 2)
    );
  }

  // 预处理步骤：直接移除Markdown代码块标记
  let processedContent = content;

  // 1. 移除开头的 ```json 或 ``` 标记
  processedContent = processedContent.replace(/^```(?:json)?\s*\n/, "");

  // 2. 移除结尾的 ``` 标记
  processedContent = processedContent.replace(/\n```\s*$/, "");

  // 3. 处理可能存在的其他markdown或格式问题
  processedContent = processedContent.trim();

  // 4. 应用JSON清理函数修复格式问题
  const sanitizedContent = sanitizeJSON(processedContent);

  // 记录处理后的内容
  console.log("清理后的JSON:");
  console.log(
    sanitizedContent.substring(0, 500) +
      (sanitizedContent.length > 500 ? "..." : "")
  );

  // 尝试解析清理后的内容
  try {
    return JSON.parse(sanitizedContent);
  } catch (e) {
    console.log("清理后解析失败:", e);
    console.log("错误位置附近的内容:");

    // 尝试找出错误位置附近的内容
    try {
      const errorMatch = (e as Error).toString().match(/position (\d+)/);
      if (errorMatch && errorMatch[1]) {
        const errorPos = parseInt(errorMatch[1]);
        const start = Math.max(0, errorPos - 50);
        const end = Math.min(sanitizedContent.length, errorPos + 50);
        console.log(`位置 ${errorPos} 附近 (${start}-${end}):`);
        console.log(JSON.stringify(sanitizedContent.substring(start, end)));

        // 输出错误位置的具体字符信息
        if (errorPos < sanitizedContent.length) {
          const problematicChar = sanitizedContent.charAt(errorPos);
          const charCode = sanitizedContent.charCodeAt(errorPos);
          console.log(`问题字符: '${problematicChar}', 字符代码: ${charCode}`);
        }
      }
    } catch (debugError) {
      console.log("尝试调试错误位置时出错:", debugError);
    }

    // 尝试更严格的修复，去除所有可疑字符
    try {
      // 只保留最可能是JSON的部分，即从第一个{到最后一个}
      const startIdx = sanitizedContent.indexOf("{");
      const endIdx = sanitizedContent.lastIndexOf("}") + 1;

      if (startIdx >= 0 && endIdx > startIdx) {
        const strictJsonCandidate = sanitizedContent.substring(
          startIdx,
          endIdx
        );
        console.log(
          "尝试严格解析:",
          strictJsonCandidate.substring(0, 200) + "..."
        );
        return JSON.parse(strictJsonCandidate);
      }
    } catch (e) {
      console.log("严格解析失败:", e);
    }
  }

  // 所有尝试都失败，返回空对象但保留基本结构
  console.log("所有解析尝试失败，返回默认对象");

  // 尝试从内容中提取出findings字段结构
  if (content.includes('"findings"')) {
    return { findings: [] };
  }
  // 尝试从内容中提取出analysis字段结构
  else if (content.includes('"isComplete"')) {
    return {
      isComplete: false,
      gaps: ["解析错误，无法获取完整数据"],
      additionalQueries: [],
    };
  }
  // 如果是报告格式
  else if (content.includes('"title"')) {
    return {
      title: "研究报告",
      date: new Date().toISOString(),
      introduction: "解析错误，无法获取完整数据",
      methodology: "",
      findings: [],
      conclusion: "",
      references: [],
    };
  }

  return {};
}

/**
 * 解析延迟函数
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 截断文本到指定长度
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number = 1000): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
