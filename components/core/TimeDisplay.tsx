"use client";

import { useState, useEffect } from "react";

export function TimeDisplay() {
  const [time, setTime] = useState("");
  
  useEffect(() => {
    const fetchTime = async () => {
      try {
        const response = await fetch("/api/hello");
        const data = await response.json();
        setTime(data.datetime);
      } catch (error) {
        console.error("获取时间失败:", error);
        setTime("获取失败");
      }
    };
    
    fetchTime();
  }, []);
  
  return <span>{time || "加载中..."}</span>;
} 