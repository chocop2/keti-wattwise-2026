"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { HOUSEHOLDS, allCalc, calc, houseAnswer, homeSolar, type HouseholdCalc } from "@/lib/households";
import { anomaly, won } from "@/lib/domain";
import dynamic from "next/dynamic";

const BuildingSolarMap = dynamic(() => import("@/components/BuildingSolarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">지도 로딩…</div>
  ),
});

const AMBER = "#E39A00";
const TEAL = "#0A9AA8";
const DANGER = "#D8432B";

type Msg = { role: "user" | "bot"; text: string };
const has = (q: string, ...k: string[]) => k.some((x) => q.includes(x));

export default function HouseholdsPage() {
  const cards = useMemo(() => allCalc(), []);
  const [sel, setSel] = useState<string | null>(null);
  const c = sel ? calc(HOUSEHOLDS.find((h) => h.id === sel)!) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">🏠 스마트홈 진단 — 가정별 전력·이상감지</h1>
        <p className="mt-1 text-sm text-slate-500">
          가정을 선택하면 가전별 사용량을 뜯어보고, 통합 전력량·요금과 절약 포인트를 챗봇에게 물어볼 수 있어요. 모든 수치는 정격전력×사용시간 기반 추정입니다.
        </p>
      </div>

      {!c ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((cc) => (
            <button
              key={cc.hh.id}
              onClick={() => setSel(cc.hh.id)}
              className={`card p-5 text-left transition hover:shadow-pop ${cc.hh.elderly ? "ring-2 ring-danger/30" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl">{cc.hh.emoji}</div>
                {cc.hh.elderly && <span className="badge bg-danger-soft text-danger">🛟 관심 필요</span>}
              </div>
              <div className="mt-3 font-bold">{cc.hh.name}</div>
              <div className="text-xs text-slate-400">{cc.hh.persons}</div>
              <p className="mt-2 line-clamp-2 text-xs text-slate-500">{cc.hh.note}</p>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-extrabold">{cc.monthly.toFixed(0)}<span className="text-sm">kWh</span></div>
                  <div className="text-xs text-slate-400">월 예상 · {won(cc.billTotal)}</div>
                </div>
                <span className={`badge ${cc.tier === 3 ? "bg-danger-soft text-danger" : "bg-slate-100 text-slate-500"}`}>{cc.tier}구간</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Detail c={c} onBack={() => setSel(null)} />
      )}
    </div>
  );
}

function Kpi({ label, value, sub, tone = "text-ink" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function Detail({ c, onBack }: { c: HouseholdCalc; onBack: () => void }) {
  const elderly = !!c.hh.elderly;
  const [aFrom, setAFrom] = useState(14);
  const [aNow, setANow] = useState(17);
  const aNowH = Math.max(aFrom, aNow);
  const an = useMemo(() => (elderly ? anomaly(aFrom, aNowH) : null), [elderly, aFrom, aNowH]);
  const anTone = an ? (an.tier === "경보" ? "#D8432B" : an.tier === "주의" ? "#E39A00" : "#12A150") : "#D8432B";
  const chartData = c.items.map((a) => ({ name: `${a.icon} ${a.name}`, kwh: +a.monthlyKwh.toFixed(1) }));

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "bot",
      text: `${c.hh.name} 데이터예요 🔌 “제일 많이 쓰는 가전?”, “뭘 줄여야 해?”${elderly ? ", “이 어르신 이상 있어?”" : ""} 물어보세요.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [subsidyOn, setSubsidyOn] = useState(true);
  const hs = homeSolar(c.hh.solarKw ?? 0.4, c.monthly * 12, subsidyOn);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  function reply(q: string): { text: string; set?: [number, number] } {
    if (elderly) {
      if (has(q, "쓰러", "위험 상황", "이상 상황", "비상", "응급", "위험한"))
        return { set: [13, 20], text: "⚠️ 위험 상황을 재현했어요. 오후 1시부터 활동가전이 멈춘 시나리오로 전환합니다 — 위 이상감지 패널이 ‘경보’로 바뀐 걸 확인하세요." };
      if (has(q, "정상", "평소", "되돌", "괜찮", "해제", "원래"))
        return { set: [22, 22], text: "✅ 정상 하루로 되돌렸어요. 활동가전이 평소 범위 안에 있어 위험도가 ‘관심’으로 내려갑니다." };
      if (an && has(q, "이상", "안부", "위험", "상태", "안전", "지금"))
        return { text: `🛟 이상 패턴 점검 — 현재 위험도 ‘${an.tier}’(${an.risk}/100). ${an.narrative}` };
    }
    return { text: houseAnswer(q, c) };
  }
  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setInput("");
    const r = reply(t);
    if (r.set) {
      setAFrom(r.set[0]);
      setANow(r.set[1]);
    }
    setTimeout(() => setMsgs((m) => [...m, { role: "bot", text: r.text }]), 240);
  }

  const chips = elderly
    ? ["쓰러진 상황 보여줘", "정상으로 되돌려", "이 어르신 이상 있어?", "뭘 줄여야 해?"]
    : ["제일 많이 쓰는 가전?", "뭘 줄여야 해?", "이 집 요금 얼마?", "에어컨 사용량은?"];

  const actData = an
    ? an.activity.map((a) => ({
        hour: a.hour,
        lo: Math.max(0, a.base - a.band),
        band: 2 * a.band,
        base: a.base,
        today: a.hour <= an.nowHour ? a.today : null,
      }))
    : [];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-slate-500 hover:underline">← 가정 목록</button>

      <div className="card flex flex-wrap items-center gap-4 p-6">
        <div className="text-4xl">{c.hh.emoji}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-xl font-extrabold">{c.hh.name}</div>
            {elderly && <span className="badge bg-danger-soft text-danger">🛟 관심 필요</span>}
          </div>
          <div className="text-xs text-slate-400">{c.hh.persons} · {c.hh.note}</div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="통합 월 사용량" value={`${c.monthly.toFixed(0)}kWh`} sub="가전 합산(상향식)" />
        <Kpi label="예상 청구요금" value={won(c.billTotal)} tone="text-amber" />
        <Kpi label="누진 구간" value={`${c.tier}구간`} tone={c.tier === 3 ? "text-danger" : "text-ink"} />
        <Kpi label="최다 사용 가전" value={`${c.top.icon} ${c.top.name}`} sub={`${(c.top.share * 100).toFixed(0)}% · ${won(c.top.cost)}`} tone="text-teal" />
      </div>

      {/* 이상 패턴 (노령 가정만) */}
      {an && (
        <section className="card border-danger/30 p-5" style={{ background: "#FDF4F2" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-danger">🛟 이상 패턴 감지 — 이 가정은 노령 1인가구로 관심이 필요합니다</div>
            <span className="badge bg-white" style={{ color: anTone }}>위험도 {an.risk}/100 · {an.tier}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            활동 신호 가전(TV·전기포트·조명)이 평소 범위를 벗어나 <b>{an.lastActiveHour}시부터 활동 정지</b> — 냉장고는 정상 가동 중(외출 아님). 슬라이더나 아래 챗봇으로 상황을 바꿔보세요.
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="label">활동 정지 시작 · {aFrom}시</div>
              <input type="range" min={6} max={22} value={aFrom} onChange={(e) => setAFrom(+e.target.value)} className="w-full accent-danger" />
            </div>
            <div>
              <div className="label">현재 시각 · {aNowH}시</div>
              <input type="range" min={aFrom} max={23} value={aNowH} onChange={(e) => setANow(+e.target.value)} className="w-full accent-danger" />
            </div>
          </div>
          <div className="mt-3 h-56">
            <ResponsiveContainer>
              <ComposedChart data={actData} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1e4e2" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}시`} tick={{ fontSize: 10, fill: "#b08a84" }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: "#b08a84" }} unit="W" width={42} />
                <Tooltip formatter={(v: number | null) => (v == null ? "-" : `${Math.round(v)}W`)} labelFormatter={(h) => `${h}시`} />
                <Area dataKey="lo" stackId="b" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area dataKey="band" stackId="b" stroke="none" fill="#e7cfca" fillOpacity={0.6} isAnimationActive={false} />
                <Line dataKey="base" stroke="#c9a59e" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                <Line dataKey="today" stroke={anTone} strokeWidth={3} dot={false} connectNulls isAnimationActive={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 rounded-lg bg-white/70 p-3 text-xs text-slate-600">“{an.narrative}”</div>
        </section>
      )}

      {/* 가전별 상세 */}
      <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="card p-5">
          <div className="text-sm font-bold">가전별 월 사용량</div>
          <div className="mt-3 h-80">
            <ResponsiveContainer>
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} unit="k" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} width={130} />
                <Tooltip formatter={(v: number) => `${v.toFixed(0)}kWh`} />
                <Bar dataKey="kwh" radius={[0, 6, 6, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? AMBER : i === 1 ? TEAL : "#cbd5e1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-bold">가전별 상세 (정격전력 × 사용시간)</div>
          <div className="mt-3 divide-y divide-slate-100">
            {c.items.map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>{a.icon}</span>
                  <div>
                    <div className="font-medium text-slate-700">{a.name}</div>
                    <div className="text-xs text-slate-400">{a.watt}W × {a.hours}h/일</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{a.monthlyKwh.toFixed(0)}kWh</div>
                  <div className="text-xs text-slate-400">{won(a.cost)} · {(a.share * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 태양광 설치 시뮬레이션 */}
      {c.hh.bIdx != null && (
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold">☀️ 이 가정 태양광 설치 시뮬레이션 (베란다형)</div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              보조금 수령
              <button
                onClick={() => setSubsidyOn((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition ${subsidyOn ? "bg-ok" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${subsidyOn ? "left-4" : "left-0.5"}`} />
              </button>
            </label>
          </div>
          <div className="mt-1 text-xs text-slate-400">지도에서 이 가정 건물(하이라이트)을 확인하고, 권장 용량 기준 발전·절감·회수를 실제 시장가로 계산합니다.</div>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <BuildingSolarMap focusIdx={c.hh.bIdx} focusLoc={c.hh.loc} height={380} />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["권장 용량", `${hs.kw}kW`, "text-ink"],
                  ["연 발전량", `${hs.genYr.toLocaleString()}kWh`, "text-ink"],
                  ["RE100 달성률", `${hs.re100.toFixed(0)}%`, "text-teal"],
                  ["투자 회수", `${hs.bep.toFixed(1)}년`, "text-amber"],
                ].map(([l, v, t]) => (
                  <div key={l} className="rounded-lg border border-slate-200 p-3 text-center">
                    <div className="text-xs text-slate-400">{l}</div>
                    <div className={`text-lg font-extrabold ${t}`}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">자부담 ({subsidyOn ? "보조금 수령" : "미수령"})</span><b>약 {hs.selfPay}만원</b></div>
                <div className="flex justify-between"><span className="text-slate-400">연 절감액</span><span>약 {hs.saveYr}만원</span></div>
                <div className="flex justify-between"><span className="text-slate-400">25년 순이익</span><b className="text-ok">{hs.net25.toLocaleString()}만원</b></div>
              </div>
              <div className="text-[11px] text-slate-400">※ 실제 시장가 표(400W 단위) 선형 환산 추정. 건물 그림자 등 정밀 산출은 별도 분석 필요.</div>
            </div>
          </div>
        </section>
      )}

      {/* 챗봇 */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="text-sm font-bold">🤖 절전 비서 <span className="ml-1 font-normal text-slate-400">· {c.hh.name} 연동</span></div>
          <span className="badge bg-slate-100 text-slate-500">최다: {c.top.icon} {c.top.name}</span>
        </div>
        <div ref={listRef} className="max-h-72 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === "user" ? "bg-ink text-white" : "bg-slate-100 text-slate-700"}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 px-5">
          {chips.map((ch) => (
            <button key={ch} onClick={() => send(ch)} className="chip hover:bg-slate-200">{ch}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 p-5">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="input" placeholder="이 가정에 대해 물어보세요 — 예: 뭘 줄여야 해?" />
          <button type="submit" className="btn-primary shrink-0">전송</button>
        </form>
      </div>
    </div>
  );
}
