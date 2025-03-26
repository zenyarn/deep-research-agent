"use client";

import { useState, useEffect } from "react";
import { ResearchActivities } from "./ResearchActivities";
import { ResearchTimer } from "./ResearchTimer";
import { ResearchReport } from "./ResearchReport";
import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Button } from "@/components/ui/button";
import { Loader2, PlayIcon } from "lucide-react";
import { ResearchActivities as AdvancedResearchActivities } from "@/components/ui/deep-research/ResearchActivities";
import { ResearchReport as AdvancedResearchReport } from "@/components/ui/deep-research/ResearchReport";
import { UserInputWrapper } from "./UserInputWrapper";

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

      {/* 显示报告或研究界面 */}
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
          {/* 主题输入和研究活动区域 */}
          <div
            className={`${
              isResearching ? "lg:col-span-2" : "w-full"
            } space-y-8`}
          >
            {/* 主题输入 - 当不在研究中时始终显示 */}
            {!isResearching ? (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                  输入您想研究的主题
                </h2>
                <UserInputWrapper />
              </div>
            ) : (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center text-white mb-6">
                  研究进行中
                </h2>
                <p className="text-center text-muted-foreground">
                  系统正在自动研究您的问题，请稍候...
                </p>
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
