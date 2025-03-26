import Image from "next/image";
import { logEnvStatus } from "@/lib/utils/env-validator";
import { QnA } from "@/components/core/QnA";
import { StoreDebugger } from "@/components/core/StoreDebugger";

// 在服务器组件中执行环境变量检查
export function generateMetadata() {
  // 这会在服务器端控制台显示环境变量状态
  logEnvStatus();

  return {
    title: "Deep Research AI Agent",
    description: "一个强大的AI研究助手",
  };
}

export default function Home() {
  return (
    <main className="flex-1 relative overflow-hidden">
      {/* 背景图片 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/research-bg.jpg"
          alt="Research Background"
          fill
          priority
          className="object-cover opacity-20"
          sizes="100vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8 text-center">
        {/* 标题部分 */}
        <div className="max-w-4xl mx-auto mb-12 space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-primary-500 to-primary-700">
              Deep Research
            </span>
            <span className="block text-white mt-1">AI Agent</span>
          </h1>

          <p className="mt-6 text-xl sm:text-2xl text-white/80 max-w-2xl mx-auto">
            一个强大的AI研究助手，能够对任何主题进行深入、全面的研究
          </p>
        </div>

        {/* 问答组件部分 */}
        <div className="w-full max-w-4xl">
          <QnA />
        </div>

        {/* 特性描述 */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            title="深度研究"
            description="多轮、多步骤的迭代研究过程，确保全面且深入的探索"
          />
          <FeatureCard
            title="实时活动"
            description="展示研究过程中的每个步骤和发现，让您了解每个环节"
          />
          <FeatureCard
            title="结构化报告"
            description="自动生成组织良好的报告，包含见解、数据和引用"
          />
        </div>
      </div>

      {/* 状态调试器 - 仅开发环境显示 */}
      {process.env.NODE_ENV === "development" && <StoreDebugger />}
    </main>
  );
}

// 特性卡片组件
function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl">
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70">{description}</p>
    </div>
  );
}
