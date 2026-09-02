"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  CITIES,
  TARGETS,
  simulate,
  cityCompare,
  type TargetKind,
  type SolarPVInput,
} from "@/lib/solarpv";
import { won } from "@/lib/domain";
import dynamic from "next/dynamic";

const BuildingSolarMap = dynamic(() => import("@/components/BuildingSolarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">지도 로딩…</div>
  ),
});

const AMBER = "#E39A00";
const TEAL = "#0A9AA8";
const OK = "#12A150";

// 실제 시장가 기준 (사용자 제공 표, 단위 만원 · 정부지원 반영)
const COST = [
  {
    name: "아파트 베란다형",
    spec: "400~800W",
    emoji: "🏢",
    fit: "아파트·빌라 등 공동주택",
    install: "60~100만원 (400W 평균 ~90만)",
    subsidy: "30~72만원",
    selfWith: 35, // 자부담(보조금 수령) 평균 만원 (10~60)
    selfWithout: 80, // 자부담(미수령) 평균 만원 (60~100)
    genMonth: "40~50kWh",
    saveYear: 18, // 연 절감 만원 (월 ~1.5만)
  },
  {
    name: "단독주택 주택형",
    spec: "3kW",
    emoji: "🏠",
    fit: "단독주택·농가",
    install: "493~600만원 (상한 493.1만)",
    subsidy: "179~350만원",
    selfWith: 193, // 자부담(보조금 수령) 평균 만원 (150~250)
    selfWithout: 550, // 자부담(미수령) 평균 만원 (500~600)
    genMonth: "288~400kWh",
    saveYear: 75, // 연 절감 만원 (월 평균 ~6.3만)
  },
];

export default function SolarPage() {
  const [target, setTarget] = useState<TargetKind>("가정");
  const [cityIdx, setCityIdx] = useState(0);
  const [systemKw, setSystemKw] = useState(TARGETS["가정"].systemKw);
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(0);
  const [selfRate, setSelfRate] = useState(0.5);
  const [sellPerKwh, setSellPerKwh] = useState(130);
  const [subsidyOn, setSubsidyOn] = useState(true);

  const t = TARGETS[target];
  const city = CITIES[cityIdx];
  const inp: SolarPVInput = {
    lat: city.lat,
    kt: city.kt,
    systemKw,
    tilt,
    azimuth,
    pr: 0.8,
    consumptionYr: t.consumptionYr,
    costPerKw: t.costPerKw,
    subsidy: t.subsidy,
    savePerKwh: 150,
    sellPerKwh,
    selfRate,
  };
  const r = useMemo(() => simulate(inp), [JSON.stringify(inp)]);
  const cc = useMemo(() => cityCompare(inp), [systemKw, tilt, azimuth]);

  function pick(k: TargetKind) {
    setTarget(k);
    setSystemKw(TARGETS[k].systemKw);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">☀️ RE100 태양광 시뮬레이터</h1>
        <p className="section-sub">
          위치·경사·방위에 따른 발전량을 추정하고, 자가소비 절감 + 잉여 전력 판매(전력거래) 수익으로 <b className="text-white">RE100 달성률·손익분기</b>를 계산합니다.
          <span className="ml-1 text-sage/50">모델: pvlib 방법론(청천일사·경사면 전이·PVWatts) 간이 구현.</span>
        </p>
      </div>

      {/* 대상 유형 */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TARGETS) as TargetKind[]).map((k) => (
          <button key={k} onClick={() => pick(k)} className={`btn ${target === k ? "btn-primary" : "btn-ghost"}`}>
            {k === "가정" ? "🏠 가정" : k === "기업" ? "🏢 기업" : "🏛️ 공공기관"}
          </button>
        ))}
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="연간 발전량" value={`${r.annualGen.toLocaleString()}kWh`} sub={`${city.name} · ${systemKw}kW`} tone="text-amber" />
        <Kpi label="RE100 달성률" value={`${r.re100.toFixed(0)}%`} sub={`소비 ${t.consumptionYr.toLocaleString()}kWh 대비`} tone={r.re100 >= 100 ? "text-ok" : "text-ink"} />
        <Kpi label="연 예상 수익" value={won(r.annualRevenue)} sub="자가소비 절감 + 판매수익" tone="text-teal" />
        <Kpi label="손익분기" value={isFinite(r.bepYears) ? `${r.bepYears.toFixed(1)}년` : "—"} sub={`설치비 ${won(r.install)}`} />
      </div>

      {/* 실제 시장가 기준 비용·회수 계산 (사용자 제공 표) */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-bold">💰 실제 시장가 기준 설치 비용·회수 계산</div>
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
        <div className="mt-1 text-xs text-slate-400">2024 정부지원 기준 · 표 값을 근거로 자부담·회수기간·25년 순이익을 계산합니다.</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {COST.map((c) => {
            const self = subsidyOn ? c.selfWith : c.selfWithout; // 만원
            const payback = c.saveYear > 0 ? self / c.saveYear : Infinity; // 년
            const net25 = c.saveYear * 25 - self; // 만원
            return (
              <div key={c.name} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.emoji}</span>
                  <div>
                    <div className="font-bold">{c.name} <span className="text-xs font-normal text-slate-400">· {c.spec}</span></div>
                    <div className="text-xs text-slate-400">{c.fit}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <Row k="총 설치비" v={c.install} />
                  <Row k="보조금" v={c.subsidy} />
                  <Row k={`자부담 (${subsidyOn ? "보조금 수령" : "미수령"})`} v={`약 ${self}만원`} strong />
                  <Row k="월 발전량" v={c.genMonth} />
                  <Row k="연 절감액" v={`약 ${c.saveYear}만원`} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-amber-soft p-3 text-center">
                    <div className="text-xs text-slate-500">투자 회수기간</div>
                    <div className="text-lg font-extrabold text-amber">{isFinite(payback) ? `${payback.toFixed(1)}년` : "—"}</div>
                  </div>
                  <div className="rounded-lg bg-ok-soft p-3 text-center">
                    <div className="text-xs text-slate-500">25년 누적 순이익</div>
                    <div className="text-lg font-extrabold text-ok">{net25.toLocaleString()}만원</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          ※ 회수기간 = 자부담 ÷ 연 절감액 · 25년 순이익 = 연 절감액×25 − 자부담. 보조금·자부담은 지자체 지원 규모에 따라 범위 내에서 달라집니다.
        </div>
      </section>

      {/* 입력 */}
      <div className="card grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="label">설치 지역</div>
          <select value={cityIdx} onChange={(e) => setCityIdx(+e.target.value)} className="input">
            {CITIES.map((c, i) => (
              <option key={c.name} value={i}>{c.name} (위도 {c.lat}°)</option>
            ))}
          </select>
        </div>
        <Slider label={`시스템 용량 · ${systemKw}kW`} min={1} max={target === "가정" ? 10 : 300} v={systemKw} on={setSystemKw} />
        <Slider label={`설치 경사각 · ${tilt}°`} min={0} max={60} v={tilt} on={setTilt} />
        <Slider label={`방위 · ${azimuth === 0 ? "정남" : azimuth < 0 ? `동${-azimuth}°` : `서${azimuth}°`}`} min={-90} max={90} v={azimuth} on={setAzimuth} />
        <Slider label={`자가소비율 · ${(selfRate * 100).toFixed(0)}%`} min={0} max={100} v={Math.round(selfRate * 100)} on={(v) => setSelfRate(v / 100)} />
        <Slider label={`전력 판매단가 · ${sellPerKwh}원/kWh`} min={50} max={300} v={sellPerKwh} on={setSellPerKwh} />
      </div>

      {/* 월별 발전량 + RE100 게이지 */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-5">
          <div className="text-sm font-bold">월별 발전량 · {city.name} (위치 기반)</div>
          <div className="mt-1 text-xs text-slate-400">위도·경사·방위에 따라 계절별 일사량이 반영됩니다 (여름↑·겨울↓)</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <ComposedChart data={r.monthly} margin={{ left: -8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={44} />
                <Tooltip formatter={(v: number, n) => (n === "발전량" ? [`${v}kWh`, "발전량"] : [`${v}kWh/m²`, "일사량"])} />
                <Bar dataKey="gen" name="발전량" radius={[5, 5, 0, 0]} fill={AMBER} />
                <Line dataKey="ghi" name="일사량" stroke={TEAL} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card flex flex-col items-center justify-center p-5">
          <div className="text-sm font-bold self-start">RE100 달성률</div>
          <div className="relative h-48 w-48">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ v: r.re100 }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="v" cornerRadius={12} fill={r.re100 >= 100 ? OK : AMBER} background={{ fill: "#f1f5f9" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-extrabold">{r.re100.toFixed(0)}%</div>
              <div className="text-xs text-slate-400">RE100</div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            연 발전 {r.annualGen.toLocaleString()}kWh / 소비 {t.consumptionYr.toLocaleString()}kWh
          </div>
        </div>
      </div>

      {/* 손익분기 + 도시 비교 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="text-sm font-bold">누적 수익 vs 설치비 (손익분기)</div>
          <div className="mt-1 text-xs text-slate-400">유럽식 전력거래(잉여 판매) 가정 · 연 0.4% 열화 반영</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={r.cumulative} margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#94a3b8" }} unit="년" />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} width={52} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => won(v)} labelFormatter={(y) => `${y}년차`} />
                <ReferenceLine y={r.install} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "설치비", fontSize: 10, fill: "#94a3b8" }} />
                {isFinite(r.bepYears) && <ReferenceLine x={Math.round(r.bepYears)} stroke={AMBER} strokeDasharray="4 4" label={{ value: "BEP", fontSize: 10, fill: AMBER }} />}
                <Line dataKey="revenue" name="누적 수익" stroke={OK} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-bold">도시별 연 발전량 비교 (동일 시스템)</div>
          <div className="mt-1 text-xs text-slate-400">같은 {systemKw}kW·경사 {tilt}°라도 위치(위도·기후)에 따라 발전량이 달라져요</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={cc} margin={{ left: -8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} width={44} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()}kWh`} />
                <Bar dataKey="gen" radius={[5, 5, 0, 0]}>
                  {cc.map((c) => (
                    <Cell key={c.name} fill={c.name === city.name ? AMBER : "#cbd5e1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 건물별 일조량 지도 */}
      <section className="card p-5">
        <div className="text-sm font-bold">🗺️ 건물별 일조량·발전 잠재량 지도 (서울 실제 건물)</div>
        <div className="mt-1 text-xs text-slate-400">
          OSM 실제 건물에 옥상 면적 × 위치별 연 일사량(pvlib 방법론)을 적용해 건물별 발전 잠재량을 색으로 표시합니다. 건물에 마우스를 올리면 상세, 드래그·휠로 회전·줌.
        </div>
        <div className="mt-3">
          <BuildingSolarMap />
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          ※ 위도·경사 기반 모델 추정치입니다. 주변 건물 그림자(차폐)·옥상 구조물까지 반영한 정밀 산출은 LiDAR/DSM + pvlib 파이프라인이 필요합니다.
        </div>
      </section>

      {/* 수익 구성 */}
      <div className="card p-5">
        <div className="text-sm font-bold">연간 수익 구성</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Mini label="자가소비 절감" value={won(r.selfUsed * inp.savePerKwh)} sub={`${r.selfUsed.toFixed(0)}kWh × ${inp.savePerKwh}원`} />
          <Mini label="잉여 판매수익" value={won(r.surplus * sellPerKwh)} sub={`${r.surplus.toFixed(0)}kWh × ${sellPerKwh}원`} />
          <Mini label="연 합계" value={won(r.annualRevenue)} sub={`설치비 ${won(r.install)} 회수 ${isFinite(r.bepYears) ? r.bepYears.toFixed(1) : "—"}년`} tone="text-amber" />
        </div>
      </div>
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
function Mini({ label, value, sub, tone = "text-ink" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-bold ${tone}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-slate-400">{k}</span>
      <span className={`text-right ${strong ? "font-bold text-ink" : "text-slate-600"}`}>{v}</span>
    </div>
  );
}
function Slider({ label, min, max, v, on }: { label: string; min: number; max: number; v: number; on: (v: number) => void }) {
  return (
    <div>
      <div className="label">{label}</div>
      <input type="range" min={min} max={max} value={v} onChange={(e) => on(+e.target.value)} className="w-full accent-ink" />
    </div>
  );
}
