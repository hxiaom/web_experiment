import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "优衣库风格实验站",
  description: "用于研究的优衣库风格电商模拟站点（含聊天与埋点）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-950">{children}</body>
    </html>
  );
}
