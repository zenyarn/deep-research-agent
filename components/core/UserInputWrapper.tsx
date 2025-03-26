"use client";

import { UserInput } from "./UserInput";
import { useState } from "react";
import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { v4 as uuidv4 } from "uuid";

export function UserInputWrapper() {
  const {
    setTopic,
    addActivity,
    setIsLoading,
    isLoading,
    setQuestions,
    reset,
    startResearch,
  } = useDeepResearchStore();

  const handleSubmit = async (topic: string) => {
    // 重置之前的研究状态
    reset();

    // 设置主题和加载状态
    setTopic(topic);
    setIsLoading(true);

    // 添加开始研究活动
    addActivity({
      type: "question",
      status: "pending",
      message: `开始研究主题: "${topic}"`,
    });

    try {
      // 调用API生成主题相关的问题
      const questionsResponse = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!questionsResponse.ok) {
        throw new Error(`生成问题请求失败: ${questionsResponse.status}`);
      }

      const questionTexts = await questionsResponse.json();

      // 转换为问题对象格式
      const generatedQuestions = questionTexts.map((text: string) => ({
        id: uuidv4(),
        text: text,
      }));

      // 更新questions状态
      setQuestions(generatedQuestions);

      // 更新活动状态
      addActivity({
        type: "question",
        status: "complete",
        message: `成功生成${generatedQuestions.length}个关于"${topic}"的研究问题`,
      });

      // 直接开始研究流程
      await startResearch();
    } catch (error) {
      console.error("研究启动失败:", error);

      // 添加错误活动
      addActivity({
        type: "error",
        status: "error",
        message: `研究启动失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return <UserInput onSubmit={handleSubmit} isLoading={isLoading} />;
}
