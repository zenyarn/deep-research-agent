"use client";

import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityStatus, ActivityType } from "@/lib/types";
import {
  LucideIcon,
  Search,
  FileText,
  Brain,
  HelpCircle,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";

export function ResearchActivities() {
  const { activities } = useDeepResearchStore();

  if (activities.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>研究活动</span>
          <span className="text-sm font-normal text-muted-foreground">
            {activities.length} 项活动
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-md bg-white/5"
          >
            <ActivityIcon type={activity.type} status={activity.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-medium break-words">{activity.message}</p>
                <span className="text-xs whitespace-nowrap text-muted-foreground">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </div>
              {activity.details && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {activity.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// 根据活动类型和状态返回相应图标
function ActivityIcon({
  type,
  status,
}: {
  type: ActivityType;
  status: ActivityStatus;
}) {
  const iconMap: Record<ActivityType, LucideIcon> = {
    search: Search,
    extract: FileText,
    analyze: Brain,
    question: HelpCircle,
    summarize: FileText,
    clarify: HelpCircle,
    error: AlertCircle,
  };

  const Icon = iconMap[type] || HelpCircle;

  // 根据状态确定颜色和额外样式
  let className = "rounded-full p-1 ";
  let spin = false;

  switch (status) {
    case "pending":
      className += "bg-yellow-500/20 text-yellow-500";
      spin = true;
      break;
    case "complete":
      className += "bg-green-500/20 text-green-500";
      break;
    case "error":
      className += "bg-red-500/20 text-red-500";
      break;
    case "warning":
      className += "bg-orange-500/20 text-orange-500";
      break;
    default:
      className += "bg-blue-500/20 text-blue-500";
  }

  return (
    <div className={className}>
      {status === "pending" ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : status === "complete" ? (
        <Check className="w-5 h-5" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
    </div>
  );
}

// 格式化时间戳
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const date = new Date(timestamp);

  // 转换为毫秒
  const diffMs = now.getTime() - date.getTime();

  // 不到1分钟显示"刚刚"
  if (diffMs < 60000) {
    return "刚刚";
  }

  // 不到1小时显示分钟
  if (diffMs < 3600000) {
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes}分钟前`;
  }

  // 当天内显示时:分
  if (
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear()
  ) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // 其他情况显示年月日
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
