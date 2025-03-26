"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";

export default function ComponentsPreview() {
  const [isLoading, setIsLoading] = useState(false);

  const toggleLoading = () => {
    setIsLoading((prev) => !prev);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">组件预览</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 按钮组件 */}
        <Card>
          <CardHeader>
            <CardTitle>按钮组件</CardTitle>
            <CardDescription>各种按钮样式和状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button>默认按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="outline">轮廓按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="destructive">危险按钮</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button disabled>禁用按钮</Button>
              <Button onClick={toggleLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>加载中...</span>
                  </div>
                ) : (
                  "切换加载状态"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 输入组件 */}
        <Card>
          <CardHeader>
            <CardTitle>输入组件</CardTitle>
            <CardDescription>文本输入和表单元素</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="基本输入框" />
            <Input placeholder="禁用状态" disabled />
            <div className="flex space-x-2">
              <Input placeholder="带按钮的输入框" />
              <Button>提交</Button>
            </div>
          </CardContent>
        </Card>

        {/* 标签页组件 */}
        <Card>
          <CardHeader>
            <CardTitle>标签页组件</CardTitle>
            <CardDescription>用于切换不同内容区域</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tab1">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="tab1">标签 1</TabsTrigger>
                <TabsTrigger value="tab2">标签 2</TabsTrigger>
                <TabsTrigger value="tab3">标签 3</TabsTrigger>
              </TabsList>
              <TabsContent
                value="tab1"
                className="p-4 mt-2 bg-white/5 rounded-md"
              >
                标签 1 的内容区域
              </TabsContent>
              <TabsContent
                value="tab2"
                className="p-4 mt-2 bg-white/5 rounded-md"
              >
                标签 2 的内容区域
              </TabsContent>
              <TabsContent
                value="tab3"
                className="p-4 mt-2 bg-white/5 rounded-md"
              >
                标签 3 的内容区域
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 手风琴组件 */}
        <Card>
          <CardHeader>
            <CardTitle>手风琴组件</CardTitle>
            <CardDescription>可折叠的内容区域</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>研究方法</AccordionTrigger>
                <AccordionContent>
                  本研究使用了多种方法，包括定性分析、数据挖掘和专家访谈，以确保结果的全面性和准确性。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>关键发现</AccordionTrigger>
                <AccordionContent>
                  研究表明，在所考察的案例中，有超过80%的情况显示了明显的相关性，这远高于之前研究中报告的比例。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>未来展望</AccordionTrigger>
                <AccordionContent>
                  基于当前的研究结果，我们建议未来的研究应该专注于更细粒度的分析，并探索更多潜在的影响因素。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
