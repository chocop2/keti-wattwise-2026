"use client";

import { useEffect, useRef, useState } from "react";
import { answer, SUGGESTIONS, type Msg } from "@/lib/chatbot";

export default function ChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요. 무엇이든 물어보세요!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="mt-3 text-2xl font-extrabold">⚡️WattWise 상담사 ⚡️</h1>
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
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-slate-100 bg-white p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading} className="chip bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">
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
              disabled={loading}
              placeholder="궁금한 걸 물어보세요…"
              className="input flex-1 disabled:opacity-50"
            />
            <button disabled={loading} className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-50">보내기</button>
          </form>
        </div>
      </div>
    </div>
  );
}
