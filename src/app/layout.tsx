import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WattWise Pi · 프로젝트 포털",
  description:
    "엣지 AI 기반 가정용 전력 예측 · 이상감지 · 절전 비서 — 고려대 팀 협업 포털",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
