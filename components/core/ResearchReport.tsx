"use client";

import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ResearchReport() {
  const { report } = useDeepResearchStore();
  const [activeSection, setActiveSection] = useState<string | undefined>(
    undefined
  );

  if (!report) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl">{report.title}</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          生成于 {formatDate(report.generatedAt)}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 border-b">
          <h3 className="text-xl font-medium mb-3">引言</h3>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.introduction}
            </ReactMarkdown>
          </div>
        </div>

        <Accordion
          type="single"
          collapsible
          value={activeSection}
          onValueChange={setActiveSection}
          className="w-full"
        >
          {report.sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="px-6 py-4 text-lg font-medium">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-2">
                <div className="px-6 prose prose-neutral dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>

                  {section.findings.length > 0 && (
                    <div className="mt-4 mb-4">
                      <h4 className="text-base font-medium mb-2">主要发现</h4>
                      <ul className="space-y-2">
                        {section.findings.map((finding) => (
                          <li
                            key={finding.id}
                            className="bg-white/5 p-3 rounded-md"
                          >
                            <p className="font-medium">{finding.summary}</p>
                            {finding.details && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {finding.details}
                              </p>
                            )}
                            {finding.sources.length > 0 && (
                              <div className="mt-2 text-xs">
                                <span className="text-muted-foreground">
                                  来源：
                                </span>
                                {finding.sources.map((source, i) => (
                                  <span key={source.url}>
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {source.title || source.url}
                                    </a>
                                    {i < finding.sources.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="p-6 border-t">
          <h3 className="text-xl font-medium mb-3">结论</h3>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.conclusion}
            </ReactMarkdown>
          </div>
        </div>

        {report.references.length > 0 && (
          <div className="p-6 border-t">
            <h3 className="text-xl font-medium mb-3">参考资料</h3>
            <ul className="space-y-2">
              {report.references.map((reference) => (
                <li key={reference.url} className="text-sm">
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {reference.title || reference.url}
                  </a>
                  {reference.snippet && (
                    <p className="mt-1 text-muted-foreground">
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
}

// 格式化日期
function formatDate(date: Date): string {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
