"use client";

import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState, useEffect } from "react";

export function ResearchReport() {
  const { report, isCompleted, isLoading, topic, streamingContent } =
    useDeepResearchStore();
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [renderError, setRenderError] = useState<string | null>(null);

  // 添加日志以便调试
  useEffect(() => {
    console.log(
      "ResearchReport组件接收到report:",
      report
        ? {
            title: report.title,
            isPlainText: report.isPlainText,
            contentLength: report.content ? report.content.length : 0,
            hasGeneratedAt: !!report.generatedAt,
            hasSections: !!report.sections,
            sectionsLength: report.sections ? report.sections.length : 0,
            reportType: typeof report,
            allKeys: Object.keys(report || {}),
            rawContentPreview: report.content
              ? `${report.content.substring(0, 100)}...`
              : "无内容",
          }
        : "无报告"
    );
    console.log(
      "流式内容长度:",
      streamingContent ? streamingContent.length : 0
    );
  }, [report, streamingContent]);

  // 生成Markdown内容
  useEffect(() => {
    if (!report) {
      console.log("无报告对象，不生成Markdown内容");

      // 如果没有报告但有流内容，可以显示流内容
      if (streamingContent && streamingContent.trim() !== "") {
        console.log("使用流内容作为备选，长度:", streamingContent.length);
        setMarkdownContent(streamingContent);
      }
      return;
    }

    try {
      // 如果是纯文本报告，直接使用内容
      if (report.isPlainText) {
        // 使用报告内容，如果没有则回退到流内容
        const content = report.content || streamingContent || "";

        if (content && content.trim() !== "") {
          console.log("使用纯文本报告内容，长度:", content.length);
          console.log(
            "纯文本内容前100字符:",
            content.substring(0, 100) + "..."
          );
          setMarkdownContent(content);
          setRenderError(null);
        } else {
          console.warn("警告: 报告内容和流内容都为空");
          setMarkdownContent("*报告内容为空*");
          setRenderError("报告内容为空，请重试研究过程");
        }
        return;
      }

      // 否则按照旧版本的结构化报告构建Markdown
      console.log("构建结构化报告的Markdown");
      let markdown = `# ${report.title || topic + "研究报告"}\n\n`;

      // 处理日期
      const reportDate = report.generatedAt || report.date;
      if (reportDate) {
        try {
          markdown += `*生成于 ${formatDate(reportDate)}*\n\n`;
        } catch (e) {
          console.error("格式化日期出错:", e);
          markdown += `*生成于 ${new Date().toLocaleString("zh-CN")}*\n\n`;
        }
      } else {
        markdown += `*生成于 ${new Date().toLocaleString("zh-CN")}*\n\n`;
      }

      markdown += `## 引言\n\n${report.introduction || ""}\n\n`;

      // 添加各部分内容
      if (report.sections && Array.isArray(report.sections)) {
        console.log(`处理${report.sections.length}个报告部分`);
        report.sections.forEach((section, idx) => {
          if (section && typeof section === "object") {
            console.log(
              `处理第${idx + 1}部分: ${section.title || "无标题部分"}`
            );
            markdown += `## ${section.title || `第${idx + 1}部分`}\n\n${
              section.content || ""
            }\n\n`;

            if (
              section.findings &&
              Array.isArray(section.findings) &&
              section.findings.length > 0
            ) {
              console.log(
                `第${idx + 1}部分有${section.findings.length}个发现点`
              );
              markdown += "### 主要发现\n\n";
              section.findings.forEach((finding) => {
                if (finding && typeof finding === "object") {
                  markdown += `- **${finding.summary || "未命名发现"}**`;
                  if (finding.details) {
                    markdown += `\n  ${finding.details}`;
                  }
                  markdown += "\n";
                }
              });
              markdown += "\n";
            }
          }
        });
      } else {
        console.log("报告没有sections数组或sections为空");
        // 如果没有sections但有content，把content作为主要内容
        if (report.content) {
          markdown += `## 主要内容\n\n${report.content}\n\n`;
        }
      }

      markdown += `## 结论\n\n${report.conclusion || ""}\n\n`;

      // 添加参考资料
      if (
        report.references &&
        Array.isArray(report.references) &&
        report.references.length > 0
      ) {
        console.log(`处理${report.references.length}个参考资料`);
        markdown += "## 参考资料\n\n";
        report.references.forEach((ref, index) => {
          if (ref && typeof ref === "object" && ref.url) {
            markdown += `${index + 1}. [${ref.title || ref.url}](${ref.url})`;
            if (ref.snippet) {
              markdown += ` - ${ref.snippet}`;
            }
            markdown += "\n";
          }
        });
      }

      console.log("生成的Markdown内容长度:", markdown.length);
      console.log("Markdown内容前100字符:", markdown.substring(0, 100) + "...");
      setMarkdownContent(markdown);
      setRenderError(null);
    } catch (error) {
      console.error("生成Markdown内容时出错:", error);

      // 如果生成Markdown失败但有原始内容，直接使用原始内容
      if (report.content || streamingContent) {
        const content = report.content || streamingContent;
        console.log("使用原始内容作为备选:", content.substring(0, 100) + "...");
        setMarkdownContent(content);
        setRenderError(
          `生成格式化报告失败，显示原始内容。错误: ${
            error instanceof Error ? error.message : "未知错误"
          }`
        );
      } else {
        setRenderError(
          `生成报告内容出错: ${
            error instanceof Error ? error.message : "未知错误"
          }`
        );
      }
    }
  }, [report, streamingContent, topic]);

  // 显示逻辑
  if (!isCompleted && !report && !streamingContent) {
    console.log("研究未完成且无报告和流内容，不显示组件");
    return null;
  }

  if (isLoading && !report && !streamingContent) {
    console.log("显示加载状态");
    return (
      <Card className="w-full max-w-4xl mx-auto mt-8 bg-white/90 dark:bg-slate-900/90">
        <CardHeader>
          <CardTitle>生成研究报告...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-10">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              正在生成报告，请稍候...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 如果没有报告对象但有流内容，我们可以渲染流内容
  if (!report && !markdownContent && !streamingContent) {
    console.log("无报告对象且无内容，不渲染");
    return null;
  }

  // 判断是否为纯文本内容
  const hasContent = !!markdownContent || !!streamingContent;
  const reportTitle = report?.title || `${topic}研究报告`;

  console.log("渲染报告:", {
    title: reportTitle,
    hasReport: !!report,
    isPlainText: report?.isPlainText,
    markdownContentLength: markdownContent.length,
    hasStreamingContent: !!streamingContent,
    streamingContentLength: streamingContent ? streamingContent.length : 0,
    hasError: !!renderError,
  });

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8 mb-16 bg-gray-600/80 text-slate-100 backdrop-blur-md border border-gray-500/50 shadow-xl">
      <CardHeader className="border-b border-gray-500/50 relative">
        <div className="absolute top-4 right-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkdownDownload}
            className="gap-1 bg-gray-700/80 border-gray-600 hover:bg-gray-600 text-gray-200"
          >
            <FileDown className="h-4 w-4" />
            <span>下载报告</span>
          </Button>
        </div>
        <CardTitle className="text-3xl mb-2 text-white">
          {reportTitle}
        </CardTitle>
        <p className="text-sm text-gray-300">
          生成于 {formatDate(report?.generatedAt || report?.date || new Date())}
        </p>
      </CardHeader>
      <CardContent className="p-6 prose prose-invert prose-headings:text-white prose-p:text-white prose-li:text-white max-w-none text-left">
        {renderError && (
          <div className="bg-red-900/50 p-4 mb-4 rounded-md text-red-200">
            <p className="font-medium">报告渲染警告</p>
            <p>{renderError}</p>
          </div>
        )}

        {hasContent ? (
          <div className="bg-gray-700/10 p-8 rounded-xl">
            <MarkdownRenderer>
              {markdownContent || streamingContent}
            </MarkdownRenderer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10">
            <p className="text-center text-gray-400">
              报告内容为空，请重试研究过程
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 处理Markdown下载
  function handleMarkdownDownload() {
    if (!markdownContent && !streamingContent) return;

    const contentToDownload = markdownContent || streamingContent;
    const filename = `${topic.replace(
      /\s+/g,
      "-"
    )}-research-report.md`.toLowerCase();
    const blob = new Blob([contentToDownload], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 清理
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// 格式化日期
function formatDate(date: Date | string | undefined): string {
  if (!date) {
    return "生成时间未知";
  }

  try {
    // 如果是字符串，先转为Date对象
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // 检查是否是有效的日期
    if (isNaN(dateObj.getTime())) {
      console.error("无效的日期对象:", date);
      return "生成时间未知";
    }

    return dateObj.toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("日期格式化错误:", e);
    return "生成时间未知";
  }
}

// Markdown渲染组件
function MarkdownRenderer({ children }: { children: string }) {
  return (
    <article className="prose prose-invert prose-headings:text-white prose-a:text-blue-400 prose-strong:text-white prose-code:bg-gray-800 prose-code:text-gray-200 prose-pre:bg-gray-800 prose-pre:text-gray-200 prose-blockquote:text-gray-300 prose-blockquote:border-gray-600 max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                style={nightOwl}
                language={match[1]}
                PreTag="div"
                className="rounded-md"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code
                {...props}
                className={`${
                  className || ""
                } px-1 py-0.5 rounded-md bg-gray-800 text-gray-200`}
              >
                {children}
              </code>
            );
          },
          h1({ node, className, ...props }: any) {
            return (
              <h1
                {...props}
                className="text-2xl font-bold mb-4 mt-6 text-white"
              />
            );
          },
          h2({ node, className, ...props }: any) {
            return (
              <h2
                {...props}
                className="text-xl font-semibold mb-3 mt-5 text-white"
              />
            );
          },
          h3({ node, className, ...props }: any) {
            return (
              <h3
                {...props}
                className="text-lg font-semibold mb-2 mt-4 text-white"
              />
            );
          },
          p({ node, className, ...props }: any) {
            return <p {...props} className="mb-4 text-slate-100" />;
          },
          // 自定义表格样式
          table({ node, ...props }: any) {
            return (
              <div className="overflow-x-auto mb-4">
                <table
                  {...props}
                  className="min-w-full divide-y divide-slate-600"
                />
              </div>
            );
          },
          tr({ node, ...props }: any) {
            return <tr {...props} className="even:bg-slate-800/50" />;
          },
          th({ node, ...props }: any) {
            return (
              <th
                {...props}
                className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
              />
            );
          },
          td({ node, ...props }: any) {
            return <td {...props} className="px-4 py-2 text-slate-200" />;
          },
          // 自定义引用样式
          blockquote({ node, ...props }: any) {
            return (
              <blockquote
                {...props}
                className="pl-4 border-l-4 border-slate-600 italic text-slate-300 my-4"
              />
            );
          },
          ul({ node, ...props }: any) {
            return (
              <ul {...props} className="list-disc pl-6 mb-4 text-slate-100" />
            );
          },
          ol({ node, ...props }: any) {
            return (
              <ol
                {...props}
                className="list-decimal pl-6 mb-4 text-slate-100"
              />
            );
          },
          li({ node, ...props }: any) {
            return <li {...props} className="mb-1 text-slate-100" />;
          },
          a({ node, ...props }: any) {
            return (
              <a
                {...props}
                className="text-blue-400 hover:text-blue-300 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </article>
  );
}
