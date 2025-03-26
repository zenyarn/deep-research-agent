"use client";

import { useDeepResearchStore } from "@/lib/store/deepResearch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CompletedQuestions() {
  const { questions, isCompleted } = useDeepResearchStore();

  // 只在所有问题都已回答完毕时显示
  if (!isCompleted || questions.length === 0) {
    return null;
  }

  // 过滤出有答案的问题
  const answeredQuestions = questions.filter((question) => question.answer);

  return (
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>已完成问题与回答</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="questions">
            <AccordionTrigger className="text-lg font-medium">
              查看所有问题和回答
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 space-y-4">
                {answeredQuestions.map((question, index) => (
                  <Accordion
                    key={question.id}
                    type="single"
                    collapsible
                    className="bg-white/5 rounded-md"
                  >
                    <AccordionItem value={question.id}>
                      <AccordionTrigger className="px-4">
                        <span className="text-left">
                          <span className="font-medium">问题 {index + 1}:</span>{" "}
                          {question.text}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="bg-white/10 px-4 py-3 rounded-b-md">
                        <div className="whitespace-pre-wrap">
                          {question.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
