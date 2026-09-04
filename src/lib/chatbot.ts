// WattWise 챗봇 — 로컬 Ollama(qwen2.5:1.5b)로 실제 LLM 응답을 받아온다.
export type Msg = { role: "user" | "bot"; text: string };

export const SUGGESTIONS = [
  "4인가구 전력 총 사용량 알려줘",
  "1인가구 세탁기 사용량 알려줘",
  "TV는 하루에 얼마나 써?",
  "전력 거래가 뭐야?",
];

export async function answer(history: Msg[]): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "응답에 실패했습니다.");
    return data.reply as string;
  } catch (e) {
    return e instanceof Error ? `⚠️ ${e.message}` : "⚠️ 응답 중 오류가 발생했습니다.";
  }
}
