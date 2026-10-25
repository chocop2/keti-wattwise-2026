"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { answer, type Msg } from "@/lib/chatbot";

const TOPICS = [
  { title: "이번 달 요금 진단", prompt: "이번 달 전기요금과 누진 구간을 어떻게 관리하면 좋을지 알려줘", icon: "₩" },
  { title: "가전 사용량 비교", prompt: "우리 집에서 어떤 가전의 전력 사용량이 가장 큰지 분석해줘", icon: "⌁" },
  { title: "태양광 설치 상담", prompt: "우리 집 태양광 설치 전에 어떤 정보를 확인해야 해?", icon: "☀" },
  { title: "이상 사용 확인", prompt: "전력 이상탐지는 어떤 기준으로 판단하는지 설명해줘", icon: "!" },
];

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "안녕하세요. WattWise 전력 AI 상담사 **와티**입니다.\n전기요금, 가전 사용량, 태양광과 이상 사용에 대해 무엇이든 물어보세요." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  // 페이지 전체가 아니라 대화 목록만 아래로 내린다.
  useEffect(() => { const list = listRef.current; if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" }); }, [msgs, loading]);
  const askedFromUrl = useRef(false);
  useEffect(() => {
    // 플로팅 채팅에서 '크게 보기'로 넘어온 대화를 이어서 보여준다.
    try {
      const saved = sessionStorage.getItem("ww_chat_msgs");
      if (saved) {
        sessionStorage.removeItem("ww_chat_msgs");
        const restored = JSON.parse(saved) as Msg[];
        if (Array.isArray(restored) && restored.length > 1) setMsgs(restored);
      }
    } catch {}
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (!q || askedFromUrl.current) return;
    askedFromUrl.current = true;
    void send(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const next: Msg[] = [...msgs, { role: "user", text: q }];
    setMsgs(next); setInput(""); setLoading(true);
    const reply = await answer(next);
    setLoading(false); setMsgs((current) => [...current, { role: "bot", text: reply }]);
  }

  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">전력 AI 상담센터</h1><p className="mt-3 text-base text-slate-600">실측 데이터와 WattWise의 서비스 정보를 바탕으로 우리 집 전력 사용에 대한 답변을 제공합니다.</p></div><div className="inline-flex items-center gap-2 rounded-full bg-[#FAF6EC] px-4 py-2 text-sm font-bold text-[#3D2B1F]"><span className="h-2.5 w-2.5 rounded-full bg-[#0ca30c]" />상담 가능 · 로컬 AI 연결</div></div>

      <div className="grid min-h-[690px] overflow-hidden rounded-3xl border border-slate-200 bg-white lg:grid-cols-[300px_1fr]">
        <aside className="relative overflow-hidden bg-[#FAF6EC] p-6">
          <div className="relative flex h-full flex-col">
            <div className="relative mx-auto h-48 w-44"><Image src="/img/wattwise-ai-consultant.png" alt="WattWise 번개 모양 전력 AI 상담사 와티" fill priority unoptimized className="object-contain drop-shadow-xl" /></div>
            <div className="text-center"><div className="text-2xl font-black text-[#3D2B1F]">와티</div><div className="mt-1 text-sm font-semibold text-[#3D2B1F]/70">WattWise 전력 상담사</div></div>
            <div className="mt-7 space-y-2">{["전기요금·누진제 상담", "가전별 사용량 분석", "태양광 수익성 안내", "이상 사용 패턴 설명"].map((item) => <div key={item} className="flex items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 text-sm font-medium text-ink"><svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#3D2B1F]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.5l5 5L20 6.5" /></svg>{item}</div>)}</div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col bg-slate-50/70">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4"><div><div className="text-base font-black text-[#3D2B1F]">와티와 상담 중</div><div className="mt-0.5 text-xs text-slate-400">로컬 AI · 실측 데이터 기반 답변</div></div><button type="button" onClick={() => setMsgs([{ role: "bot", text: "새 상담을 시작할게요. 어떤 전력 문제가 궁금하신가요?" }])} className="btn-ghost !py-1.5 text-xs">새 상담</button></div>
          <div ref={listRef} className="h-[520px] flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
            {msgs.length === 1 && <div className="grid gap-2 sm:grid-cols-2">{TOPICS.map((topic) => <button key={topic.title} type="button" onClick={() => send(topic.prompt)} className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#3D2B1F]/40"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FAF6EC] text-sm font-black text-[#3D2B1F]">{topic.icon}</span><span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#3D2B1F]">→</span></div><div className="mt-3 text-base font-black text-ink">{topic.title}</div><div className="mt-1 text-xs text-slate-400">상담 시작하기</div></button>)}</div>}
            {msgs.map((message, index) => <div key={index} className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "bot" && <div className="relative mt-1 h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-amber-soft"><Image src="/img/wattwise-ai-consultant.png" alt="" fill unoptimized className="object-contain p-0.5" /></div>}<div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.role === "user" ? "rounded-br-md bg-[#3D2B1F] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`} dangerouslySetInnerHTML={{ __html: message.text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} /></div>)}
            {loading && <div className="flex items-center gap-2.5"><div className="relative h-9 w-9 overflow-hidden rounded-xl bg-amber-soft"><Image src="/img/wattwise-ai-consultant.png" alt="" fill unoptimized className="object-contain p-0.5" /></div><div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3"><div className="flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3D2B1F] [animation-delay:-.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3D2B1F] [animation-delay:-.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#3D2B1F]" /></div></div></div>}
          </div>
          <div className="border-t border-slate-200 bg-white p-4"><form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:border-[#3D2B1F] focus-within:ring-2 focus-within:ring-[#3D2B1F]/10"><textarea rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(input); } }} disabled={loading} placeholder="전기요금, 가전 사용량, 태양광에 대해 물어보세요" className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button disabled={loading || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D2B1F] font-bold text-white transition hover:bg-[#2C1F16] disabled:opacity-30">↑</button></form><div className="mt-2 flex items-center justify-between text-[10px] text-slate-400"><span>Enter 전송 · Shift+Enter 줄바꿈</span><Link href="/analytics" className="font-semibold hover:text-[#3D2B1F]">내 전력 대시보드 보기 →</Link></div></div>
        </main>
      </div>
    </div>
    </div>
  );
}
