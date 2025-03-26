"use client";

import { useState } from "react";
import { useDeepResearchStore } from "@/lib/store/deepResearch";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ActivityStatus, ActivityType } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Brain,
  HelpCircle,
  AlertCircle,
  Check,
  Loader2,
  X,
  ExternalLink,
} from "lucide-react";

export function ResearchActivities() {
  const { activities, sources } = useDeepResearchStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"activities" | "sources">(
    "activities"
  );

  // 如果没有活动或来源，则不渲染
  if (activities.length === 0 && sources.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 shadow-lg rounded-lg bg-gray-600/70 backdrop-blur-md border border-gray-500/50 text-white transition-all">
      <Collapsible
        open={!isCollapsed}
        onOpenChange={(open) => setIsCollapsed(!open)}
      >
        <div className="flex items-center justify-between p-3 border-b border-gray-500/50">
          <h3 className="font-medium text-slate-100">
            {activeTab === "activities" ? "研究活动" : "信息来源"}
          </h3>
          <div className="flex gap-1">
            <CollapsibleTrigger asChild>
              <button className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "activities" | "sources")
            }
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 m-3 mb-0 bg-gray-600/50">
              <TabsTrigger
                value="activities"
                className="text-sm data-[state=active]:bg-gray-500 data-[state=active]:text-white"
                disabled={activities.length === 0}
              >
                活动 ({activities.length})
              </TabsTrigger>
              <TabsTrigger
                value="sources"
                className="text-sm data-[state=active]:bg-gray-500 data-[state=active]:text-white"
                disabled={sources.length === 0}
              >
                来源 ({sources.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="p-0 m-0">
              <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 p-2 rounded-md bg-gray-700/50"
                  >
                    <ActivityIcon
                      type={activity.type}
                      status={activity.status}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-slate-100 break-words">
                          {activity.message}
                        </p>
                        <span className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {activity.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sources" className="p-0 m-0">
              <div className="max-h-[400px] overflow-y-auto p-3 space-y-2">
                {sources.map((source) => (
                  <div
                    key={source.url}
                    className="p-2 rounded-md bg-gray-700/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-200 hover:underline flex items-center gap-1 break-words"
                      >
                        {source.title || getDomainFromUrl(source.url)}
                        <ExternalLink className="h-3 w-3 inline flex-shrink-0" />
                      </a>
                      {source.relevance && (
                        <span className="text-xs whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {Math.round(source.relevance * 100)}%
                        </span>
                      )}
                    </div>
                    {source.snippet && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {source.snippet}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// 从URL中获取域名
function getDomainFromUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
}

// 根据活动类型和状态返回相应图标
function ActivityIcon({
  type,
  status,
}: {
  type: ActivityType;
  status: ActivityStatus;
}) {
  const iconMap: Record<ActivityType, React.ElementType> = {
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

  switch (status) {
    case "pending":
      className += "bg-yellow-500/20 text-yellow-500";
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
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === "complete" ? (
        <Check className="w-4 h-4" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
    </div>
  );
}

// 格式化时间戳
function formatTimestamp(timestamp: Date): string {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: zhCN,
    });
  } catch (e) {
    return "未知时间";
  }
}
