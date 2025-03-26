"use client";

import { useState, useEffect } from "react";
import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Card, CardContent } from "@/components/ui/card";

export function ResearchTimer() {
  const { activities, report } = useDeepResearchStore();
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);

  // 当活动存在且没有报告时，开始计时
  useEffect(() => {
    if (activities.length > 0 && !report) {
      if (!isActive) {
        setIsActive(true);
        setStartTime(Date.now());
      }
    } else if (report) {
      // 有报告时停止计时
      setIsActive(false);
    } else if (activities.length === 0) {
      // 重置活动时重置计时器
      setIsActive(false);
      setElapsedTime(0);
      setStartTime(null);
    }
  }, [activities, report, isActive]);

  // 计时器逻辑
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isActive) {
      intervalId = setInterval(() => {
        if (startTime) {
          setElapsedTime(Date.now() - startTime);
        }
      }, 10); // 每10毫秒更新一次，确保毫秒显示流畅
    } else if (!isActive && intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, startTime]);

  // 如果没有活动，不显示计时器
  if (activities.length === 0) {
    return null;
  }

  // 格式化时间显示
  const formatTime = (time: number): string => {
    const seconds = Math.floor(time / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    if (seconds < 60) {
      return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}.${milliseconds
        .toString()
        .padStart(2, "0")}s`;
    }
  };

  return (
    <Card className="max-w-[200px] bg-white/10 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="text-sm text-white/70">研究耗时</div>
          <div className="text-xl font-mono font-semibold mt-1">
            {formatTime(elapsedTime)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
