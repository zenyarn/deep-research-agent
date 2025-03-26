import { NextResponse } from "next/server";

export async function GET() {
  // 获取当前日期时间
  const now = new Date();
  const formattedDate = now.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // 返回数据
  return NextResponse.json({
    message: "欢迎使用 Deep Research AI Agent!",
    datetime: formattedDate,
    timestamp: now.getTime(),
  });
}
