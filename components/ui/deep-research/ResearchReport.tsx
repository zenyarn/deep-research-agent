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
  const { report, isCompleted, isLoading, topic } = useDeepResearchStore();
  const [markdownContent, setMarkdownContent] = useState<string>("");

  // 生成Markdown内容
  useEffect(() => {
    if (!report) return;

    // 构建Markdown内容
    let markdown = `# ${report.title}\n\n`;
    markdown += `*生成于 ${formatDate(report.generatedAt)}*\n\n`;

    markdown += `## 引言\n\n${report.introduction}\n\n`;

    // 添加各部分内容
    report.sections.forEach((section) => {
      markdown += `## ${section.title}\n\n${section.content}\n\n`;

      if (section.findings.length > 0) {
        markdown += "### 主要发现\n\n";
        section.findings.forEach((finding) => {
          markdown += `- **${finding.summary}**`;
          if (finding.details) {
            markdown += `\n  ${finding.details}`;
          }
          markdown += "\n";
        });
        markdown += "\n";
      }
    });

    markdown += `## 结论\n\n${report.conclusion}\n\n`;

    // 添加参考资料
    if (report.references.length > 0) {
      markdown += "## 参考资料\n\n";
      report.references.forEach((ref, index) => {
        markdown += `${index + 1}. [${ref.title || ref.url}](${ref.url})`;
        if (ref.snippet) {
          markdown += ` - ${ref.snippet}`;
        }
        markdown += "\n";
      });
    }

    setMarkdownContent(markdown);
  }, [report]);

  // 显示逻辑
  if (!isCompleted && !report) {
    return null;
  }

  if (isLoading && !report) {
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

  if (!report) return null;

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
          {report.title}
        </CardTitle>
        <p className="text-sm text-gray-300">
          生成于 {formatDate(report.generatedAt)}
        </p>
      </CardHeader>
      <CardContent className="p-6 prose prose-invert prose-headings:text-white prose-p:text-white prose-li:text-white max-w-none text-left">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">引言</h2>
          <div className="text-left">
            <MarkdownRenderer>{report.introduction}</MarkdownRenderer>
          </div>
        </div>

        {report.sections.map((section) => (
          <div key={section.id} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            <div className="text-left">
              <MarkdownRenderer>{section.content}</MarkdownRenderer>
            </div>

            {section.findings.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">主要发现</h3>
                <div className="space-y-4">
                  {section.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className="bg-gray-700/50 p-4 rounded-lg"
                    >
                      <p className="font-medium text-white">
                        {finding.summary}
                      </p>
                      {finding.details && (
                        <p className="mt-2 text-white">{finding.details}</p>
                      )}
                      {finding.sources.length > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-300">来源：</span>
                          {finding.sources.map((source, i) => (
                            <span key={source.url}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-white hover:underline"
                              >
                                {source.title || source.url}
                              </a>
                              {i < finding.sources.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">结论</h2>
          <div className="text-left">
            <MarkdownRenderer>{report.conclusion}</MarkdownRenderer>
          </div>
        </div>

        {report.references.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">参考资料</h2>
            <ul className="space-y-2 list-decimal pl-5">
              {report.references.map((reference) => (
                <li key={reference.url} className="text-white">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 hover:underline"
                  >
                    {reference.title || reference.url}
                  </a>
                  {reference.snippet && (
                    <p className="mt-1 text-sm text-gray-300">
                      {reference.snippet}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // 处理Markdown下载
  function handleMarkdownDownload() {
    if (!report) return;

    const filename = `${topic.replace(
      /\s+/g,
      "-"
    )}-research-report.md`.toLowerCase();
    const blob = new Blob([markdownContent], { type: "text/markdown" });
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
function formatDate(date: Date): string {
  try {
    return new Date(date).toLocaleString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "未知时间";
  }
}

// Markdown渲染组件
function MarkdownRenderer({ children }: { children: string }) {
  return (
    <div className="text-left">
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
                className={`${className} px-1 py-0.5 rounded-md bg-gray-700 text-gray-200`}
              >
                {children}
              </code>
            );
          },
          // 自定义表格样式
          table({ node, ...props }: any) {
            return (
              <div className="overflow-x-auto">
                <table
                  {...props}
                  className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
                />
              </div>
            );
          },
          tr({ node, ...props }: any) {
            return (
              <tr
                {...props}
                className="even:bg-slate-50 dark:even:bg-slate-800/50"
              />
            );
          },
          th({ node, ...props }: any) {
            return (
              <th
                {...props}
                className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              />
            );
          },
          td({ node, ...props }: any) {
            return <td {...props} className="px-4 py-2" />;
          },
          // 自定义引用样式
          blockquote({ node, ...props }: any) {
            return (
              <blockquote
                {...props}
                className="pl-4 border-l-4 border-slate-300 dark:border-slate-700 italic text-slate-700 dark:text-slate-300"
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
