"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// 定义输入验证模式
const researchTopicSchema = z.object({
  topic: z
    .string()
    .min(2, { message: "研究主题至少需要2个字符" })
    .max(200, { message: "研究主题不能超过200个字符" }),
});

type ResearchTopicForm = z.infer<typeof researchTopicSchema>;

interface UserInputProps {
  onSubmit: (topic: string) => void;
  isLoading?: boolean;
}

export function UserInput({ onSubmit, isLoading = false }: UserInputProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResearchTopicForm>({
    resolver: zodResolver(researchTopicSchema),
    defaultValues: {
      topic: "",
    },
  });

  const submitHandler = async (data: ResearchTopicForm) => {
    onSubmit(data.topic);
    reset(); // 成功提交后重置表单
  };

  return (
    <form
      onSubmit={handleSubmit(submitHandler)}
      className="w-full max-w-3xl mx-auto space-y-2"
    >
      <div className="relative">
        <Input
          {...register("topic")}
          className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 h-14 pr-24"
          placeholder="请输入您想研究的主题..."
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="absolute right-1.5 top-1.5 bg-primary hover:bg-primary-700"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              <span>研究中...</span>
            </div>
          ) : (
            "开始研究"
          )}
        </Button>
      </div>
      {errors.topic && (
        <p className="text-red-400 text-sm mt-1">{errors.topic.message}</p>
      )}
    </form>
  );
}
