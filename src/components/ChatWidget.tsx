"use client";

import { useEffect, useRef, useState } from "react";
import { answer, SUGGESTIONS, type Msg } from "@/lib/chatbot";

export default function ChatWidget() {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요! WattWise 도우미예요 ⚡ 무엇이든 물어보세요." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("ww_chat_dismissed") === "1") setDismissed(true);
    } catch {}
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem("ww_chat_dismissed", "1");
    } catch {}
  }
  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: answer(q) }]), 350);
  }

  if (dismissed) return null;

  return (
    <>
      {/* 플로팅 버튼 (닫혀 있을 때) */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-50">
          <button
            onClick={() => setOpen(true)}
            aria-label="챗봇 열기"
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-ink text-2xl text-white shadow-lg transition hover:scale-105"
          >
            💬
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
              <span className="text-lg">⚡</span>
              <div>
                <div className="text-sm font-bold">WattWise 도우미</div>
                <div className="text-[11px] text-white/60">프로젝트 안내 · 지식기반</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="닫기" className="text-white/70 hover:text-white">▾</button>
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
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white px-3 pt-2">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50">
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
                placeholder="궁금한 걸 물어보세요…"
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-teal"
              />
              <button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">↑</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
