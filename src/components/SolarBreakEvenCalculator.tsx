"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { solar, SOLAR_DEFAULT, won, type SolarInput } from "@/lib/domain";

const AMBER = "#E39A00";
const TEAL = "#0A9AA8";

export default function SolarBreakEvenCalculator() {
  const [sol, setSol] = useState<SolarInput>(SOLAR_DEFAULT);
  const s = useMemo(() => solar(sol), [sol]);

  return (
      <section className="card p-5">
        <div className="text-sm font-bold">☀️ 태양광 손익분기 (BEP) 계산기</div>
        <p className="mt-1 text-xs text-slate-400">패널 수·절감 단가·설치비·보조금에 따른 단순 절감액 시뮬레이션입니다. 일 평균 발전시간 3.5시간, 패널당 450W를 가정합니다.</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <div className="space-y-4">
            <Slider label={`패널 수 · ${sol.panels}장 (≈${s.capacityKw.toFixed(2)}kW)`} min={1} max={16} v={sol.panels} on={(v) => setSol({ ...sol, panels: v })} />
            <Slider label={`절감 단가 · ${sol.savePerKwh}원/kWh`} min={120} max={310} v={sol.savePerKwh} on={(v) => setSol({ ...sol, savePerKwh: v })} />
            <Slider label={`설치 단가 · ${(sol.costPerKw / 10000).toFixed(0)}만원/kW`} min={1000000} max={2500000} step={50000} v={sol.costPerKw} on={(v) => setSol({ ...sol, costPerKw: v })} />
            <Slider label={`보조금 · ${(sol.subsidy / 10000).toFixed(0)}만원`} min={0} max={2000000} step={50000} v={sol.subsidy} on={(v) => setSol({ ...sol, subsidy: v })} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Mini label="설치비" value={won(s.install)} />
              <Mini label="연간 발전량" value={`${s.annualGen.toFixed(0)}kWh`} />
              <Mini label="연간 절감액" value={won(s.annualSaving)} />
              <Mini label="손익분기" value={isFinite(s.bepYears) ? `${s.bepYears.toFixed(1)}년` : "—"} tone="text-amber" />
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={s.cumulative} margin={{ left: 8, right: 12, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} unit="년" />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={54} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => won(v)} labelFormatter={(y) => `${y}년차`} />
                <ReferenceLine y={s.install} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "설치비", fontSize: 10, fill: "#94a3b8" }} />
                {isFinite(s.bepYears) && <ReferenceLine x={Math.round(s.bepYears)} stroke={AMBER} strokeDasharray="4 4" label={{ value: "BEP", fontSize: 10, fill: AMBER }} />}
                <Line dataKey="saving" stroke={TEAL} strokeWidth={2.5} dot={false} name="누적 절감액" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
  );
}

function Mini({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-sm font-bold ${tone}`}>{value}</div>
    </div>
  );
}
function Slider({ label, min, max, v, on, step = 1 }: { label: string; min: number; max: number; v: number; on: (v: number) => void; step?: number }) {
  return (
    <div>
      <div className="label">{label}</div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => on(+e.target.value)} className="w-full accent-ink" />
    </div>
  );
}

