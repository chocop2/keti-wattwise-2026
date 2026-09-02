"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  bill,
  tierOf,
  daysToNextTier,
  applianceBreakdown,
  solar,
  SOLAR_DEFAULT,
  forecastSeries,
  hourlyProfile,
  weekdayProfile,
  monthlyTrend,
  usageHeatmap,
  won,
  type SolarInput,
} from "@/lib/domain";

const AMBER = "#E39A00";
const TEAL = "#0A9AA8";
const INK = "#1F2328";

export default function AnalyticsPage() {
  const [monthKwh, setMonthKwh] = useState(366);
  const [sol, setSol] = useState<SolarInput>(SOLAR_DEFAULT);

  const b = bill(monthKwh);
  const tier = tierOf(monthKwh);
  const dailyAvg = monthKwh / 30;
  const nxt = daysToNextTier(monthKwh, dailyAvg);
  const appl = useMemo(() => applianceBreakdown(monthKwh), [monthKwh]);
  const s = useMemo(() => solar(sol), [sol]);
  const fc = useMemo(() => forecastSeries(), []);
  const hp = useMemo(() => hourlyProfile(), []);
  const wp = useMemo(() => weekdayProfile(), []);
  const mt = useMemo(() => monthlyTrend(), []);
  const heat = useMemo(() => usageHeatmap(), []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">🔋 전력 분석 대시보드</h1>
        <p className="mt-1 text-sm text-slate-500">
          예측 · 누진 경고 · 가전별 분해 · 태양광 손익분기 · 탐색적 데이터 분석(EDA). 모든 수치는 시뮬레이션/예시 단가입니다.
        </p>
      </div>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="이번 달 예상 사용량" value={`${monthKwh}kWh`} tone="text-ink" />
        <Kpi label="예상 청구요금" value={won(b.total)} tone="text-amber" />
        <Kpi label="현재 누진 구간" value={`${tier}구간`} tone={tier === 3 ? "text-danger" : "text-ink"} />
        <Kpi
          label="다음 구간까지"
          value={nxt ? `${Math.round(nxt.remain)}kWh` : "최고 구간"}
          tone="text-teal"
          sub={nxt ? `현재 추세로 약 ${nxt.days.toFixed(0)}일 후 ${nxt.nextTier}구간` : "3구간 유지 중"}
        />
      </div>

      {/* month usage slider */}
      <div className="card p-5">
        <div className="label">이번 달 예상 사용량 조절 · {monthKwh}kWh</div>
        <input type="range" min={100} max={550} value={monthKwh} onChange={(e) => setMonthKwh(+e.target.value)} className="w-full accent-ink" />
      </div>

      {/* 누진 경고 바 */}
      <section className="card p-5">
        <div className="text-sm font-bold">누진제 진입 모니터</div>
        <TierBar monthKwh={monthKwh} />
        {nxt ? (
          <p className="mt-3 text-sm text-slate-600">
            ⏳ 다음 구간까지 <b>{Math.round(nxt.remain)}kWh</b> 남음 · 현재 추세(일 {dailyAvg.toFixed(1)}kWh)로 <b>약 {nxt.days.toFixed(0)}일 후 {nxt.nextTier}구간</b> 진입 예상
          </p>
        ) : (
          <p className="mt-3 text-sm text-danger">이미 최고 구간(3구간)입니다. 절전 조언을 확인하세요.</p>
        )}
        <div className="mt-2 text-xs text-slate-400">
          기본요금 {won(b.base)} + 전력량요금 {won(b.energy)} → 전기요금계 {won(b.supply)} · 청구금액(부가세·기금 포함) <b>{won(b.total)}</b>
        </div>
      </section>

      {/* 예측 */}
      <section className="card p-5">
        <div className="text-sm font-bold">사용량 예측 · Chronos-Bolt-Tiny</div>
        <div className="mt-1 text-xs text-slate-400">최근 24시간 실측(진한 선) + 향후 12시간 예측(점선·불확실성 밴드)</div>
        <div className="mt-4 h-64">
          <ResponsiveContainer>
            <ComposedChart data={fc} margin={{ left: -8, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} unit="W" width={46} />
              <Tooltip formatter={(v: number | null) => (v == null ? "-" : `${Math.round(v)}W`)} />
              <Area dataKey="lo" stroke="none" fill="transparent" isAnimationActive={false} />
              <Area dataKey="hi" stroke="none" fill={AMBER} fillOpacity={0.12} isAnimationActive={false} />
              <Line dataKey="actual" stroke={INK} strokeWidth={2.5} dot={false} name="실측" isAnimationActive={false} />
              <Line dataKey="pred" stroke={AMBER} strokeWidth={2.5} strokeDasharray="5 4" dot={false} name="예측" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 가전별 분해 */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <div className="text-sm font-bold">가전별 사용량 분해 (합성 NILM)</div>
          <div className="mt-1 text-xs text-slate-400">이번 달 {monthKwh}kWh 기준 · 파레토 정렬</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={appl} layout="vertical" margin={{ left: 30, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} unit="k" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} width={110} />
                <Tooltip formatter={(v: number) => `${v.toFixed(0)}kWh`} />
                <Bar dataKey="kwh" radius={[0, 6, 6, 0]}>
                  {appl.map((a, i) => (
                    <Cell key={a.name} fill={i === 0 ? AMBER : i === 1 ? TEAL : "#cbd5e1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-bold">가전별 예상 요금 기여</div>
          <div className="mt-3 divide-y divide-slate-100">
            {appl.map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-600">{a.name}</span>
                <span className="text-right">
                  <b>{won(a.cost)}</b>
                  <span className="ml-2 text-xs text-slate-400">{a.kwh.toFixed(0)}kWh</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 태양광 손익분기 */}
      <section className="card p-5">
        <div className="text-sm font-bold">☀️ 태양광 손익분기 (BEP) 계산기</div>
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

      {/* EDA */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title">📊 탐색적 데이터 분석 (EDA)</h2>
          <p className="mt-1 text-sm text-slate-500">사용 패턴을 여러 각도로 시각화합니다. 시간대·요일·월별·요일×시간 히트맵.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="text-sm font-bold">시간대별 평균 사용량</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <ComposedChart data={hp} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}kWh`} />
                  <Area dataKey="kwh" stroke={TEAL} fill={TEAL} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">저녁 피크가 뚜렷 — 세탁·건조를 심야로 옮기면 절감 여지.</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold">요일별 평균 사용량</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <BarChart data={wp} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} domain={[0, 16]} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}kWh`} />
                  <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
                    {wp.map((d, i) => (
                      <Cell key={d.day} fill={i >= 5 ? AMBER : "#cbd5e1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">주말(토·일) 사용량이 평일보다 높음.</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold">월별 사용량 추세</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <LineChart data={mt} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} />
                  <Tooltip formatter={(v: number) => `${v}kWh`} />
                  <ReferenceLine y={400} stroke="#D8432B" strokeDasharray="4 4" label={{ value: "3구간 400", fontSize: 10, fill: "#D8432B" }} />
                  <Line dataKey="kwh" stroke={INK} strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">여름(7·8월) 냉방으로 3구간 근접 — 누진 경고 집중 시기.</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold">사용 히트맵 · 요일 × 시간</div>
            <Heatmap data={heat} />
            <div className="mt-1 text-xs text-slate-400">색이 진할수록 사용량↑ · 저녁 시간대와 주말 오후에 집중.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
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

function TierBar({ monthKwh }: { monthKwh: number }) {
  const max = 500;
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="mt-4">
      <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 bg-ok/30" style={{ width: pct(200) }} />
        <div className="absolute inset-y-0 bg-amber/30" style={{ left: pct(200), width: pct(200) }} />
        <div className="absolute inset-y-0 bg-danger/30" style={{ left: pct(400), right: 0 }} />
        <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: pct(monthKwh) }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span>200 (1→2구간)</span>
        <span>400 (2→3구간)</span>
        <span>{max}kWh</span>
      </div>
    </div>
  );
}

function Heatmap({ data }: { data: { day: string; hour: number; v: number }[][] }) {
  return (
    <div className="mt-4 space-y-1">
      {data.map((row) => (
        <div key={row[0].day} className="flex items-center gap-1">
          <span className="w-4 text-xs text-slate-400">{row[0].day}</span>
          <div className="flex flex-1 gap-[2px]">
            {row.map((c) => (
              <div
                key={c.hour}
                className="h-4 flex-1 rounded-[2px]"
                title={`${c.day} ${c.hour}시 · ${(c.v * 100).toFixed(0)}%`}
                style={{ background: `rgba(10,154,168,${0.06 + c.v * 0.9})` }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-between pl-5 text-[10px] text-slate-400">
        <span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span>
      </div>
    </div>
  );
}
