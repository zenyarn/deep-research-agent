// 活动类型
export type ActivityType =
  | "planning"
  | "search"
  | "extract"
  | "analyze"
  | "generate";

// 活动状态
export type ActivityStatus = "pending" | "complete" | "warning" | "error";

// 活动接口
export interface Activity {
  id: string;
  type: ActivityType;
  status: ActivityStatus;
  message: string;
  timestamp: number;
}

// 活动跟踪器接口
export interface ActivityTracker {
  add(type: ActivityType, status: ActivityStatus, message: string): string;
  update(id: string, status: ActivityStatus, message?: string): Activity | null;
  getActivities(): Activity[];
  clear(): void;
}

// 简单流接口
export interface SimpleStream {
  write(data: string): void;
  end(): void;
}

// 活动跟踪器实现
export class StreamingActivityTracker implements ActivityTracker {
  private activities: Activity[] = [];
  private stream: SimpleStream;

  constructor(stream: SimpleStream) {
    this.stream = stream;
  }

  add(type: ActivityType, status: ActivityStatus, message: string): string {
    const activity: Activity = {
      id: crypto.randomUUID(),
      type,
      status,
      message,
      timestamp: Date.now(),
    };

    this.activities.push(activity);
    this.stream.write(JSON.stringify(activity));
    return activity.id;
  }

  update(
    id: string,
    status: ActivityStatus,
    message?: string
  ): Activity | null {
    const index = this.activities.findIndex((a) => a.id === id);
    if (index >= 0) {
      const activity = this.activities[index];
      const updatedActivity: Activity = {
        ...activity,
        status,
        message: message || activity.message,
        timestamp: Date.now(),
      };
      this.activities[index] = updatedActivity;
      this.stream.write(JSON.stringify(updatedActivity));
      return updatedActivity;
    }
    return null;
  }

  getActivities(): Activity[] {
    return this.activities;
  }

  clear() {
    this.activities = [];
  }
}
