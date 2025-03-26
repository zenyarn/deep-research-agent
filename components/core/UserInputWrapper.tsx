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
      // 这里仅作演示，未来将替换为真正的API调用
      // 模拟API请求延迟
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 模拟生成问题
      const generatedQuestions = [
        {
          id: uuidv4(),
          text: `"${topic}"的主要发展历史是什么？`,
        },
        {
          id: uuidv4(),
          text: `"${topic}"目前面临的最大挑战是什么？`,
        },
        {
          id: uuidv4(),
          text: `"${topic}"的未来发展趋势如何？`,
        },
        {
          id: uuidv4(),
          text: `"${topic}"在全球范围内的影响力如何？`,
        },
        {
          id: uuidv4(),
          text: `如何评价"${topic}"的社会价值？`,
        },
      ];

      // 更新状态
      setQuestions(generatedQuestions);

      // 更新活动状态
      addActivity({
        type: "question",
        status: "complete",
        message: `成功生成5个关于"${topic}"的研究问题`,
      });
    } catch (error) {
      console.error("生成问题失败:", error);

      // 添加错误活动
      addActivity({
        type: "error",
        status: "error",
        message: `生成问题失败: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return <UserInput onSubmit={handleSubmit} isLoading={isLoading} />;
}
