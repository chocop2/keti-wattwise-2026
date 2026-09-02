"use client";

import { useEffect, useRef, useState } from "react";
import { answer, SUGGESTIONS, type Msg } from "@/lib/chatbot";

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요! WattWise 도우미예요 ⚡ 전력 거래·오토인코더·필요성·데이터·실험 결과 등 무엇이든 물어보세요." },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: answer(q) }]), 350);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <div className="badge bg-teal-soft text-teal">챗봇</div>
        <h1 className="mt-3 text-2xl font-extrabold">WattWise 도우미</h1>
        <p className="mt-1 text-sm text-slate-500">
          프로젝트에 대해 물어보세요. 지식기반(규칙형)이라 서버 없이 바로 답합니다. 실제 LLM 연동은 다음 단계입니다.
        </p>
      </div>

      <div className="card flex h-[62vh] min-h-[440px] flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-teal text-white" : "border border-slate-200 bg-white text-slate-700"
                }`}
                dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }}
              />
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t border-slate-100 bg-white p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="chip bg-slate-100 text-slate-600 hover:bg-slate-200">
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 걸 물어보세요…"
              className="input flex-1"
            />
            <button className="btn-primary shrink-0">보내기</button>
          </form>
        </div>
      </div>
    </div>
  );
}
