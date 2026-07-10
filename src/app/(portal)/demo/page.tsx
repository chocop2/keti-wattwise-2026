"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { anomaly } from "@/lib/domain";
import { answer } from "@/lib/assistant";

const TONE = {
  관심: { c: "#12A150", soft: "#E3F5EA" },
  주의: { c: "#E39A00", soft: "#FBF3DE" },
  경보: { c: "#D8432B", soft: "#FBE7E1" },
} as const;

type Msg = { role: "user" | "bot"; text: string };
const CHIPS = ["쓰러진 상황 보여줘", "정상으로 되돌려", "지금 위험도 알려줘", "왜 위험하다고 판단했어?", "절전 팁 알려줘"];
const has = (q: string, ...k: string[]) => k.some((x) => q.includes(x));

export default function DemoPage() {
  const [from, setFrom] = useState(14);
  const [now, setNow] = useState(17);
  const nowH = Math.max(from, now);
  const st = useMemo(() => anomaly(from, nowH), [from, nowH]);
  const tone = TONE[st.tier];

  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "안녕하세요! 이 데모와 연동된 절전·안전 비서예요 🔋 ‘쓰러진 상황 보여줘’·‘정상으로 되돌려’ 같은 명령이나, 요금·누진·절전 질문을 해보세요." },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  function respond(text: string): { reply: string; set?: [number, number] } {
    const q = text.trim();
    if (has(q, "쓰러", "위험 상황", "이상 상황", "비상", "응급", "경보 재현", "위험한 상황"))
      return {
        set: [13, 20],
        reply: "⚠️ 위험 상황을 재현했어요. 오후 1시부터 활동가전이 멈춘 시나리오로 전환합니다. 냉장고는 정상 가동 중 — 상단 게이지와 차트가 ‘경보’로 바뀐 걸 확인하세요.",
      };
    if (has(q, "정상", "평소", "되돌", "괜찮", "해제", "원래"))
      return { set: [22, 22], reply: "✅ 정상 하루로 되돌렸어요. 활동가전이 평소 범위 안에 있어 위험도가 ‘관심’으로 내려갑니다." };
    if (has(q, "위험도", "현재", "지금", "상태", "얼마나", "스코어"))
      return {
        reply: `현재 위험도는 ‘${st.tier}’(${st.risk}/100)입니다. ${from}시부터 활동이 멈춰 ${nowH - from}시간째 정지 상태이고, 냉장고(상시부하)는 정상 가동 중이에요.`,
      };
    if (has(q, "왜", "근거", "판단", "이유", "어떻게 알"))
      return {
        reply: "판단 근거 — 낮 활동 시간대에 ‘활동 신호 가전(TV·전기포트·조명)’ 사용이 0인데 ‘상시부하(냉장고)’는 정상 가동 중이에요. 외출이라면 대기전력까지 깔끔히 내려가지만, 지금은 냉장고만 돌아 ‘집 안에서 활동이 멈춘’ 패턴 → 위험으로 봅니다.",
      };
    if (has(q, "시간", "마지막 활동", "몇 시간"))
      return { reply: `마지막 활동은 ${from}시로, 현재(${nowH}시) 기준 ${nowH - from}시간 전입니다.` };
    return { reply: answer(q) };
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    const r = respond(t);
    if (r.set) {
      setFrom(r.set[0]);
      setNow(r.set[1]);
    }
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: r.reply }]), 260);
  }

  const actData = st.activity.map((a) => ({
    hour: a.hour,
    lo: Math.max(0, a.base - a.band),
    band: 2 * a.band,
    base: a.base,
    today: a.hour <= nowH ? a.today : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">🛟 고령 1인가구 이상감지 데모</h1>
        <p className="mt-1 text-sm text-slate-500">
          모든 수치는 시뮬레이션입니다. 아래 슬라이더로, 또는 <b>💬 절전·안전 비서에게 명령</b>해서 <b>정상 하루 ↔ 활동이 멈춘 하루(쓰러짐)</b>를 바꿔보세요.
        </p>
      </div>

      {/* KPI + gauge */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card flex items-center gap-3 p-5" style={{ background: tone.soft }}>
          <div className="h-24 w-24 shrink-0">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ v: st.risk }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="v" cornerRadius={10} fill={tone.c} background={{ fill: "#ffffff" }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">현재 위험도</div>
            <div className="text-3xl font-extrabold" style={{ color: tone.c }}>{st.tier}</div>
            <div className="text-xs text-slate-500">위험 스코어 {st.risk}/100</div>
          </div>
        </div>
        <Kpi label="마지막 활동" value={`${nowH - from}시간 전`} sub={`${from}시 이후 활동 정지`} />
        <Kpi label="냉장고(상시부하)" value="정상 가동" sub="→ 외출 아닌 ‘집 안 정지’" />
        <Kpi label="판정 근거" value="활동가전 = 0" sub="평소 이 시간엔 활동" />
      </div>

      {/* controls */}
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div>
          <div className="label">활동 정지 시작 시각 · {from}시</div>
          <input type="range" min={6} max={22} value={from} onChange={(e) => setFrom(+e.target.value)} className="w-full accent-ink" />
        </div>
        <div>
          <div className="label">현재 시각 · {nowH}시</div>
          <input type="range" min={from} max={23} value={nowH} onChange={(e) => setNow(+e.target.value)} className="w-full accent-ink" />
        </div>
      </div>

      {/* activity chart */}
      <div className="card p-5">
        <div className="text-sm font-bold">활동 신호 가전 (TV·전기포트·조명) — 평소 범위 vs 오늘</div>
        <div className="mt-1 text-xs text-slate-400">회색 밴드 = 이 사람의 평소 활동 범위 · 굵은 선 = 오늘 · 밴드 아래로 이탈하면 위험</div>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <ComposedChart data={actData} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} tick={{ fontSize: 11, fill: "#94a3b8" }} interval={2} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} unit="W" width={44} />
              <Tooltip formatter={(v: number | null) => (v == null ? "-" : `${Math.round(v)}W`)} labelFormatter={(h) => `${h}시`} />
              <ReferenceArea x1={from} x2={nowH} fill={tone.c} fillOpacity={0.06} />
              <Area dataKey="lo" stackId="b" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area dataKey="band" stackId="b" stroke="none" fill="#cbd5e1" fillOpacity={0.45} name="평소 범위" isAnimationActive={false} />
              <Line dataKey="base" stroke="#94a3b8" strokeDasharray="4 4" dot={false} name="평소 평균" isAnimationActive={false} />
              <Line dataKey="today" stroke={tone.c} strokeWidth={3} dot={false} name="오늘" connectNulls isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* fridge + alert */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-5">
          <div className="text-sm font-bold">냉장고(상시부하) — 계속 가동 중</div>
          <div className="mt-1 text-xs text-slate-400">상시부하는 정상인데 활동가전만 멈춤 → ‘외출’이 아니라 ‘집 안에서 활동 정지’를 뜻함</div>
          <div className="mt-4 h-40">
            <ResponsiveContainer>
              <LineChart data={st.fridge} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} tick={{ fontSize: 11, fill: "#94a3b8" }} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} unit="W" width={44} domain={[0, 60]} />
                <Tooltip formatter={(v: number) => `${Math.round(v)}W`} labelFormatter={(h) => `${h}시`} />
                <Line dataKey="today" stroke="#0A9AA8" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5" style={{ background: tone.soft }}>
          <div className="text-sm font-bold" style={{ color: tone.c }}>🚨 자연어 경보 (LLM 생성 · 온디바이스)</div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">“{st.narrative}”</p>
          <div className="mt-4 rounded-lg bg-white/70 p-3 text-xs text-slate-500">
            ⚠️ 조기 경보 <b>보조 도구</b> · 복지사가 최종 판단하는 <b>human-in-the-loop</b> · 동의 기반 ‘감시 아닌 안심’.
          </div>
        </div>
      </div>

      {/* chatbot ── 데모 연동 */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="text-sm font-bold">🤖 AI 절전·안전 비서 <span className="ml-1 font-normal text-slate-400">· 이 데모와 연동됨</span></div>
          <span className="badge" style={{ background: tone.soft, color: tone.c }}>● 현재 ‘{st.tier}’</span>
        </div>

        <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-ink text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 px-5">
          {CHIPS.map((c) => (
            <button key={c} onClick={() => send(c)} className="chip hover:bg-slate-200">{c}</button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 p-5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input"
            placeholder="명령/질문을 입력하세요 — 예: 쓰러진 상황 보여줘, 누진 언제 넘어?"
          />
          <button type="submit" className="btn-primary shrink-0">전송</button>
        </form>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}
