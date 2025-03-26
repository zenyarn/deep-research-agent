"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

// 定义表单验证模式
const answerSchema = z.object({
  answer: z.string().min(1, { message: "请提供回答" }),
});

type AnswerForm = z.infer<typeof answerSchema>;

export function QuestionForm() {
  const {
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    updateQuestion,
    setIsCompleted,
  } = useDeepResearchStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnswerForm>({
    resolver: zodResolver(answerSchema),
    defaultValues: {
      answer: questions[currentQuestionIndex]?.answer || "",
    },
  });

  // 当问题索引变化时重置表单
  useState(() => {
    reset({
      answer: questions[currentQuestionIndex]?.answer || "",
    });
  });

  // 如果没有问题，返回空
  if (questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const onSubmit = (data: AnswerForm) => {
    // 更新当前问题的答案
    if (currentQuestion) {
      updateQuestion(currentQuestion.id, { answer: data.answer });
    }

    // 如果是最后一个问题，设置完成状态为 true
    if (isLastQuestion) {
      setIsCompleted(true);
    } else {
      // 否则移动到下一个问题
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // 重置表单，显示下一个问题的答案（如果存在）
      reset({
        answer: questions[currentQuestionIndex + 1]?.answer || "",
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      reset({
        answer: questions[currentQuestionIndex - 1]?.answer || "",
      });
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            问题 {currentQuestionIndex + 1}/{totalQuestions}
          </span>
          <span className="text-sm text-muted-foreground">
            已完成: {currentQuestionIndex}/{totalQuestions}
          </span>
        </CardTitle>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">{currentQuestion?.text}</h3>
            <Textarea
              {...register("answer")}
              rows={6}
              placeholder="请输入您的回答..."
              className="w-full resize-none"
            />
            {errors.answer && (
              <p className="text-red-500 text-sm">{errors.answer.message}</p>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              上一题
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isLastQuestion ? "完成" : "下一题"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
