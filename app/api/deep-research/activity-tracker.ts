import { v4 as uuidv4 } from "uuid";

// 活动类型和状态
export type ActivityType =
  | "search"
  | "extract"
  | "analyze"
  | "question"
  | "summarize"
  | "clarify"
  | "error";

export type ActivityStatus = "pending" | "complete" | "error" | "warning";

// 活动数据结构
export interface Activity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  message: string;
  timestamp: Date;
  details?: string;
}

// 研究状态接口
export interface ResearchState {
  activities: Activity[];
  [key: string]: any;
}

// 简化的流接口，使我们的代码不依赖于特定的流实现
export interface SimpleStream {
  append(data: any): void;
}

// 活动跟踪器接口
export interface ActivityTracker {
  add(activity: Omit<Activity, "id" | "timestamp">): string;
  update(
    id: string,
    updates: Partial<Omit<Activity, "id" | "timestamp">>
  ): void;
}

/**
 * 创建活动跟踪器
 * @param stream 数据流
 * @param state 研究状态
 * @returns 活动跟踪器
 */
export function createActivityTracker(
  stream: SimpleStream,
  state: ResearchState
): ActivityTracker {
  return {
    /**
     * 添加新活动
     */
    add(activity) {
      const newActivity: Activity = {
        id: uuidv4(),
        timestamp: new Date(),
        ...activity,
      };

      // 更新状态
      state.activities.push(newActivity);

      // 发送活动数据到流
      stream.append({
        type: "activity",
        data: newActivity,
      });

      // 返回活动ID以便后续更新
      return newActivity.id;
    },

    /**
     * 更新现有活动
     */
    update(id, updates) {
      // 查找活动
      const activityIndex = state.activities.findIndex((a) => a.id === id);
      if (activityIndex === -1) {
        console.warn(`活动ID不存在: ${id}`);
        return;
      }

      // 更新活动
      const updatedActivity = {
        ...state.activities[activityIndex],
        ...updates,
      };

      // 更新状态
      state.activities[activityIndex] = updatedActivity;

      // 发送更新后的活动数据到流
      stream.append({
        type: "activity_update",
        data: updatedActivity,
      });
    },
  };
}
