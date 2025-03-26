"use client";

import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StoreDebugger() {
  const store = useDeepResearchStore();
  const [expanded, setExpanded] = useState(false);
  const [sourceCounter, setSourceCounter] = useState(1);

  const addExampleActivity = () => {
    store.addActivity({
      type: "search",
      status: "complete",
      message: "完成搜索'人工智能'相关内容",
    });
  };

  const addExampleSource = () => {
    store.addSource({
      url: `https://example.com/ai-research-${sourceCounter}`,
      title: `人工智能研究资源 #${sourceCounter}`,
    });
    setSourceCounter((prev) => prev + 1);
  };

  const addExampleQuestion = () => {
    store.addQuestion({
      id: uuidv4(),
      text: "人工智能的伦理问题有哪些？",
    });
  };

  const updateQuestionWithAnswer = () => {
    if (store.questions.length > 0) {
      store.updateQuestion(store.questions[0].id, {
        answer: "人工智能伦理问题包括隐私、安全、就业影响、偏见等多个方面...",
      });
    }
  };

  const generateExampleReport = () => {
    store.setReport({
      title: `关于"${store.topic || "示例主题"}"的研究报告`,
      introduction: "这是一份自动生成的研究报告...",
      sections: [
        {
          id: uuidv4(),
          title: "研究背景",
          content: "在当今信息爆炸的时代...",
          findings: [],
        },
        {
          id: uuidv4(),
          title: "研究方法",
          content: "本研究采用定性和定量相结合的方法...",
          findings: [],
        },
      ],
      conclusion: "综合以上分析，我们可以得出...",
      references: store.sources,
      generatedAt: new Date(),
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-auto max-w-[600px] shadow-xl">
        <CardHeader
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            状态调试面板
            <span>{expanded ? "▼" : "▲"}</span>
          </CardTitle>
          <CardDescription>
            {store.topic ? `当前主题: ${store.topic}` : "尚未设置主题"}
          </CardDescription>
        </CardHeader>

        {expanded && (
          <CardContent>
            <Tabs defaultValue="actions">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="actions">调试操作</TabsTrigger>
                <TabsTrigger value="state">当前状态</TabsTrigger>
              </TabsList>

              <TabsContent value="actions" className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addExampleActivity}
                  >
                    添加活动
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addExampleSource}
                  >
                    添加来源
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addExampleQuestion}
                  >
                    添加问题
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={updateQuestionWithAnswer}
                    disabled={store.questions.length === 0}
                  >
                    回答问题
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={generateExampleReport}
                  >
                    生成报告
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => store.reset()}
                  >
                    重置状态
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div>问题数量: {store.questions.length}</div>
                  <div>活动数量: {store.activities.length}</div>
                  <div>来源数量: {store.sources.length}</div>
                </div>
              </TabsContent>

              <TabsContent value="state">
                <div className="max-h-[300px] overflow-auto bg-black/10 p-2 rounded text-xs font-mono whitespace-pre">
                  {JSON.stringify(
                    {
                      topic: store.topic,
                      questions: store.questions,
                      currentQuestionIndex: store.currentQuestionIndex,
                      isCompleted: store.isCompleted,
                      isLoading: store.isLoading,
                      activities: store.activities,
                      sources: store.sources,
                      findings: store.findings,
                      report: store.report
                        ? { title: store.report.title }
                        : null,
                    },
                    null,
                    2
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
