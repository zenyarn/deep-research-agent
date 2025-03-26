"use client";

import { useState, useEffect } from "react";
import { QuestionForm } from "./QuestionForm";
import { CompletedQuestions } from "./CompletedQuestions";
import { ResearchActivities } from "./ResearchActivities";
import { ResearchTimer } from "./ResearchTimer";
import { ResearchReport } from "./ResearchReport";
import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Button } from "@/components/ui/button";
import { Loader2, PlayIcon } from "lucide-react";
import { ResearchActivities as AdvancedResearchActivities } from "@/components/ui/deep-research/ResearchActivities";
import { ResearchReport as AdvancedResearchReport } from "@/components/ui/deep-research/ResearchReport";

export function QnA() {
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    questions,
    isResearching,
    startResearch,
    report,
    setResearchState,
    researchState,
  } = useDeepResearchStore();

  const [loading, setLoading] = useState(false);

  // 检查是否所有问题都已回答
  const allQuestionsAnswered = questions.every(
    (q) => q.answer && q.answer.trim() !== ""
  );

  // 检查是否有至少一个问题已回答（用于启用研究按钮）
  const hasAnsweredQuestions = questions.some(
    (q) => q.answer && q.answer.trim() !== ""
  );

  // 开始研究过程
  const handleStartResearch = async () => {
    if (!hasAnsweredQuestions || isResearching) return;

    setLoading(true);

    try {
      // 调用store中的startResearch方法，该方法会向后端API发起请求
      await startResearch();
    } catch (error) {
      console.error("研究过程出错:", error);
      setResearchState("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      {/* 显示当前研究状态 */}
      {researchState !== "idle" && (
        <div className="text-center">
          <div className="inline-block px-4 py-2 rounded-full text-sm font-medium bg-muted">
            {researchState === "researching" && "AI正在研究中..."}
            {researchState === "completed" && "研究已完成"}
            {researchState === "error" && "研究过程出错"}
          </div>
        </div>
      )}

      {/* 显示报告或问答流程 */}
      {report ? (
        <AdvancedResearchReport />
      ) : (
        <div
          className={`${
            isResearching
              ? "grid grid-cols-1 lg:grid-cols-3 gap-8"
              : "space-y-6"
          }`}
        >
          {/* 问题和已完成问题区域 */}
          <div
            className={`${
              isResearching ? "lg:col-span-2" : "w-full"
            } space-y-8`}
          >
            {/* 问题表单 */}
            <QuestionForm />

            {/* 已完成的问题列表 */}
            <CompletedQuestions />

            {/* 开始研究按钮 */}
            {!isResearching && !report && hasAnsweredQuestions && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleStartResearch}
                  disabled={loading || isResearching || !hasAnsweredQuestions}
                  className="w-full max-w-md"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      正在准备研究...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="mr-2 h-4 w-4" />
                      开始深度研究
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* 研究活动和计时器 */}
          {isResearching && (
            <div className="lg:col-span-1 space-y-6">
              <AdvancedResearchActivities />
              <ResearchTimer />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
