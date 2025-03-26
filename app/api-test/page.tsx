"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function APITest() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 测试问题生成API
  const generateQuestions = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) {
        throw new Error(`请求失败: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      console.log("生成问题响应:", data);

      // 处理不同的响应格式
      if (Array.isArray(data)) {
        // 直接返回的数组格式
        setQuestions(
          data.map((text, index) => ({
            id: `q-${index}`,
            text,
          }))
        );
      } else if (data.questions && Array.isArray(data.questions)) {
        // 包含questions字段的对象格式
        setQuestions(data.questions);
      } else {
        throw new Error("响应格式不正确");
      }
    } catch (err) {
      console.error("问题生成出错:", err);
      setError(
        `问题生成失败: ${err instanceof Error ? err.message : String(err)}`
      );
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试研究API
  const startResearch = async () => {
    if (!questions.length) return;

    setActivities([]);
    setIsResearching(true);
    setError(null);

    try {
      console.log("开始深度研究:", topic, questions);
      const response = await fetch("/api/deep-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          clarifications: questions.map((q) => ({
            ...q,
            answer: "这是一个测试回答，用于深度研究测试。",
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      console.log("研究API响应状态码:", response.status);
      console.log(
        "研究API响应头:",
        Object.fromEntries(response.headers.entries())
      );

      // 确保响应是流式的
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法获取响应流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      // 记录原始活动列表以便进行比较
      let receivedActivities = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("流读取完成");
          break;
        }

        // 解码二进制数据
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 按行分割并处理完整的行
        const lines = buffer.split("\n");
        // 保留最后一行（可能不完整）
        buffer = lines.pop() || "";

        console.log(`收到${lines.length}行数据`);

        // 处理每一行
        for (const line of lines) {
          if (!line.trim()) continue; // 跳过空行

          try {
            console.log("处理事件行:", line);
            const activity = JSON.parse(line);
            console.log("解析到活动:", activity);

            // 直接将解析到的活动添加到列表中
            receivedActivities.push(activity);

            // 在状态中更新活动，使用函数形式确保获取最新状态
            setActivities((currentActivities) => {
              // 检查活动是否已存在（基于ID）
              const exists = currentActivities.some(
                (a) => a.id === activity.id
              );
              if (exists) {
                // 如果存在，则更新它
                return currentActivities.map((a) =>
                  a.id === activity.id ? activity : a
                );
              } else {
                // 如果不存在，则添加它
                return [...currentActivities, activity];
              }
            });
          } catch (err) {
            console.error("解析事件失败:", err, line);
          }
        }
      }

      console.log("总共接收到活动数:", receivedActivities.length);
      console.log("最终接收到的活动:", receivedActivities);
    } catch (err) {
      console.error("研究过程出错:", err);
      setError(
        `研究过程失败: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      console.log("研究过程结束，状态设为false");
      setIsResearching(false);
    }
  };

  // 格式化时间戳
  const formatTime = (timestamp: string | Date) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 bg-white text-slate-900">
      <h1 className="text-3xl font-bold mb-8 text-center text-slate-900">
        API测试页面
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 问题生成API测试 */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50">
            <CardTitle className="text-slate-800">问题生成API测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="输入研究主题"
                  disabled={isLoading}
                  className="text-slate-900 border-slate-300"
                />
                <Button
                  onClick={generateQuestions}
                  disabled={!topic.trim() || isLoading}
                  className="whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    "生成问题"
                  )}
                </Button>
              </div>

              {questions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-slate-800">
                    生成的问题：
                  </h3>
                  <ul className="space-y-2">
                    {questions.map((q, index) => (
                      <li
                        key={q.id}
                        className="p-2 bg-slate-50 rounded-md text-slate-800 border border-slate-200"
                      >
                        {index + 1}. {q.text}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    <Button
                      onClick={startResearch}
                      disabled={isResearching}
                      variant="secondary"
                    >
                      {isResearching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          研究中...
                        </>
                      ) : (
                        "开始深度研究"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 研究活动显示 */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50">
            <CardTitle className="text-slate-800">研究活动</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                {isResearching ? "等待研究活动..." : "尚未开始研究"}
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 border border-slate-200 rounded-md bg-white"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(activity.status)}
                      <span className="font-medium text-slate-800">
                        {activity.message}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-slate-600">
                      <div>类型: {activity.type}</div>
                      <div>{formatTime(activity.timestamp)}</div>
                    </div>
                    {activity.details && (
                      <div className="mt-2 text-sm bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">
                        {activity.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
