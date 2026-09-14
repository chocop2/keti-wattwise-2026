"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Appliance = {
  id: string;
  label: string;
  seriesIds: string[];
  rows: number;
  periodStart: string;
  periodEnd: string;
};
type Point = { timestamp: string; actual?: number; prediction_kwh?: number; "0.1"?: number; "0.5"?: number; "0.9"?: number };
type Result = {
  appliance: string;
  seriesId: string;
  model: string;
  contextHours: number;
  horizonHours: number;
  elapsedSeconds: number;
  history: Point[];
  forecast: Point[];
};

const ICONS: Record<string, string> = { tv: "📺", 에어컨: "❄️", 제습기: "💧", 세탁기: "🧺" };
const fmt = (value: number) => `${value.toFixed(value < 0.1 ? 3 : 2)} kWh`;
const timeLabel = (raw: string) => new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit" }).format(new Date(raw));

export default function ForecastLab() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [appliance, setAppliance] = useState("tv");
  const [seriesId, setSeriesId] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/deploy/forecast")
      .then(async (response) => {
        if (!response.ok) throw new Error("실측 데이터 목록을 불러오지 못했습니다.");
        return response.json();
      })
      .then((data: { appliances: Appliance[] }) => {
        setAppliances(data.appliances);
        setSeriesId(data.appliances[0]?.seriesIds[0] ?? "");
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const selected = appliances.find((item) => item.id === appliance);
  const chartData = useMemo(() => {
    if (!result) return [];
    const history = result.history.map((point) => ({ ...point, kind: "실측" }));
    const last = history.at(-1);
    const forecast = result.forecast.map((point) => ({
      ...point,
      prediction: point["0.5"] ?? point.prediction_kwh,
      low: point["0.1"] ?? point.prediction_kwh,
      range: Math.max(0, (point["0.9"] ?? point.prediction_kwh ?? 0) - (point["0.1"] ?? point.prediction_kwh ?? 0)),
      kind: "예측",
    }));
    return last ? [...history, { ...last, prediction: last.actual }, ...forecast] : forecast;
  }, [result]);

  const total = result?.forecast.reduce((sum, point) => sum + (point["0.5"] ?? point.prediction_kwh ?? 0), 0) ?? 0;
  const peak = result?.forecast.reduce((best, point) => (point["0.5"] ?? point.prediction_kwh ?? 0) > (best["0.5"] ?? best.prediction_kwh ?? 0) ? point : best, result.forecast[0]) ?? null;

  function chooseAppliance(id: string) {
    const next = appliances.find((item) => item.id === id);
    setAppliance(id);
    setSeriesId(next?.seriesIds[0] ?? "");
    setResult(null);
    setError("");
  }

  async function runForecast() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/deploy/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appliance, seriesId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "예측에 실패했습니다.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "예측에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <div className="eyebrow">Live Forecast</div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">실측 데이터로 다음 24시간 예측</h2>
          <p className="section-sub">자취방에서 수집한 시계열을 학습된 Chronos-2 체크포인트에 직접 입력합니다.</p>
        </div>
        <span className="badge bg-ok-soft text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" />로컬 추론 · 데이터 외부 전송 없음</span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="card p-5">
          <div className="text-sm font-bold">예측 조건</div>
          <label className="label mt-5">가전 선택</label>
          <div className="grid grid-cols-2 gap-2">
            {appliances.map((item) => (
              <button key={item.id} onClick={() => chooseAppliance(item.id)} className={`rounded-xl border p-3 text-left text-sm transition ${appliance === item.id ? "border-amber bg-amber-soft font-bold text-ink" : "border-slate-200 hover:border-slate-300"}`}>
                <span className="mr-1.5">{ICONS[item.id]}</span>{item.label}
              </button>
            ))}
          </div>
          <label className="label mt-4" htmlFor="series">실측 대상</label>
          <select id="series" value={seriesId} onChange={(e) => { setSeriesId(e.target.value); setResult(null); }} className="input">
            {(selected?.seriesIds ?? []).map((id) => <option key={id} value={id}>{id.split("_")[0]}의 {selected?.label}</option>)}
          </select>
          {selected && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">실측 {selected.rows.toLocaleString()}시간 · {selected.periodStart.slice(0, 10)} — {selected.periodEnd.slice(0, 10)}<br />최근 336시간 입력 → 미래 24시간 출력</div>}
          <button onClick={runForecast} disabled={!seriesId || loading} className="btn-amber mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />모델 불러오는 중…</> : "24시간 예측 실행 →"}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">첫 실행은 모델 로딩으로 시간이 걸릴 수 있습니다.</p>
        </div>

        <div className="card min-h-[430px] p-5">
          {error ? (
            <div className="flex h-full min-h-[380px] items-center justify-center"><div className="max-w-md rounded-xl bg-danger-soft p-5 text-center"><div className="text-2xl">⚠️</div><div className="mt-2 text-sm font-bold text-danger">예측을 실행하지 못했습니다</div><p className="mt-1 text-xs text-slate-600">{error}</p></div></div>
          ) : !result ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-soft text-3xl">〽️</div><div className="mt-4 font-bold">실제 모델을 실행해 보세요</div><p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">가전과 실측 대상을 고르면 최근 7일 패턴과 다음 24시간 중앙 예측·불확실성 범위를 함께 보여줍니다.</p></div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="24시간 예상 사용량" value={fmt(total)} />
                <Metric label="예상 최대 사용" value={peak ? fmt(peak["0.5"] ?? peak.prediction_kwh ?? 0) : "-"} sub={peak ? timeLabel(peak.timestamp) : undefined} />
                <Metric label="실제 추론 시간" value={`${result.elapsedSeconds.toFixed(1)}초`} sub="로컬 체크포인트" />
              </div>
              <div className="mt-5 flex items-center justify-between"><div className="text-sm font-bold">최근 실측 · 24시간 예측</div><div className="flex gap-3 text-[11px] text-slate-500"><span>━ 실측</span><span className="text-teal">━ 중앙 예측</span><span>▰ 10–90% 범위</span></div></div>
              <div className="mt-2 h-72">
                <ResponsiveContainer>
                  <ComposedChart data={chartData} margin={{ left: 2, right: 8, top: 8 }}>
                    <CartesianGrid stroke="#eef1f4" strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={timeLabel} minTickGap={55} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={48} tickFormatter={(v) => `${v}k`} />
                    <Tooltip labelFormatter={(v) => timeLabel(String(v))} formatter={(v: number, name: string) => [fmt(v), name === "actual" ? "실측" : name === "prediction" ? "중앙 예측" : name === "range" ? "예측 범위" : "하한"]} />
                    <Area dataKey="low" stackId="interval" stroke="none" fill="transparent" isAnimationActive={false} />
                    <Area dataKey="range" stackId="interval" stroke="none" fill="#0A9AA8" fillOpacity={0.16} isAnimationActive={false} />
                    <Line dataKey="actual" stroke="#1F2328" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line dataKey="prediction" stroke="#0A9AA8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><span>{ICONS[result.appliance]} {result.seriesId} · 입력 {result.contextHours}시간</span><span>Chronos-2 appliance checkpoint</span></div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><div className="text-[11px] font-semibold text-slate-500">{label}</div><div className="mt-1 text-lg font-extrabold tracking-tight">{value}</div>{sub && <div className="text-[10px] text-slate-400">{sub}</div>}</div>;
}
