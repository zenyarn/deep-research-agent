import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deep Research AI Agent",
  description: "一个强大的AI研究助手，能够对任何主题进行深入、全面的研究",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
