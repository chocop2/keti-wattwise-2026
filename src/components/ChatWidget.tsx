"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { answer, SUGGESTIONS, type Msg } from "@/lib/chatbot";

export default function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요! 전력 AI 상담사 와티예요. 전기요금과 사용량을 물어보세요." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("ww_chat_dismissed") === "1") setDismissed(true);
    } catch {}
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open, loading]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("ww_chat_dismissed", "1");
    } catch {}
  }
  // 지금까지의 대화를 넘겨 상담센터(/chat)에서 크게 이어서 본다.
  function expand() {
    try {
      sessionStorage.setItem("ww_chat_msgs", JSON.stringify(msgs));
    } catch {}
    setOpen(false);
    router.push("/chat");
  }
  async function send(text: string) {
    const q = text.trim();
    if (!q) return;
    const next: Msg[] = [...msgs, { role: "user", text: q }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    const reply = await answer(next);
    setLoading(false);
    setMsgs((m) => [...m, { role: "bot", text: reply }]);
  }

  if (dismissed || pathname === "/chat") return null;

  return (
    <>
      {/* 플로팅 버튼 (닫혀 있을 때) */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setOpen(true)}
            aria-label="챗봇 열기"
            className="relative flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-amber-soft shadow-lg transition hover:-translate-y-1 hover:shadow-pop"
          >
            <Image src="/img/wattwise-ai-consultant.png" alt="전력 AI 상담사 와티" fill unoptimized className="object-contain p-1" />
          </button>
          <button
            onClick={dismiss}
            aria-label="챗봇 숨기기"
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-500 shadow hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 채팅 패널 */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[520px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-amber-soft"><Image src="/img/wattwise-ai-consultant.png" alt="" fill unoptimized className="object-contain" /></span>
              <div>
                <div className="text-sm font-bold">와티 · 전력 AI 상담사</div>
                <div className="text-[11px] text-white/60">상담 가능 · 로컬 AI</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={expand} disabled={loading} aria-label="크게 보기" title="크게 보기" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" /></svg>
              </button>
              <button onClick={() => setOpen(false)} aria-label="닫기" title="닫기" className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white">▾</button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user" ? "bg-teal text-white" : "border border-slate-200 bg-white text-slate-700"
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white px-3 pt-2">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex gap-2 pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="궁금한 걸 물어보세요…"
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal disabled:opacity-50"
              />
              <button disabled={loading} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">↑</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
