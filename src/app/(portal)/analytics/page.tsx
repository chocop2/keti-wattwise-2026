"use client";

import { useEffect, useMemo, useState } from "react";
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
  won,
} from "@/lib/domain";

const AMBER = "#E39A00";
const TEAL = "#0A9AA8";
const INK = "#1F2328";

const APPLIANCE_ICONS: Record<string, string> = { tv: "📺", 에어컨: "❄️", 제습기: "💧", 세탁기: "🧺" };
const HOUSEHOLD: Record<string, string> = { 정빈: "1인가구", 진규: "1인가구", 채연: "4인가구" };

type ApplianceMeta = { id: string; label: string; seriesIds: string[] };
type ForecastPoint = { timestamp: string; actual?: number; prediction_kwh?: number; "0.1"?: number; "0.5"?: number; "0.9"?: number };
type ForecastResult = { seriesId: string; elapsedSeconds: number; history: ForecastPoint[]; forecast: ForecastPoint[] };
type ForecastState = { loading: boolean; error?: string; data?: ForecastResult };
type BenchmarkHouse = { id: string; label: string; start: string; split: string; type: string; area: string; channels: number; dailyAverage: number; values: number[] };
type HouseholdMeta = { id: string; type: string; area: string; city: string; start: string; end: string; rows: number; split?: string };

function buildApplianceChartData(result: ForecastResult) {
  const history = result.history.slice(-48).map((point) => ({ t: point.timestamp, actual: point.actual, pred: null as number | null, lo: null as number | null, hi: null as number | null }));
  const last = history.at(-1);
  const forecast = result.forecast.map((point) => {
    const p = point["0.5"] ?? point.prediction_kwh ?? 0;
    return { t: point.timestamp, actual: null as number | null, pred: p, lo: point["0.1"] ?? p, hi: point["0.9"] ?? p };
  });
  return last ? [...history, { ...last, pred: last.actual ?? null, lo: last.actual ?? null, hi: last.actual ?? null }, ...forecast] : forecast;
}

export default function AnalyticsPage() {
  const [monthKwh, setMonthKwh] = useState(366);
  const [appliances, setAppliances] = useState<ApplianceMeta[]>([]);
  const [selectedAppliance, setSelectedAppliance] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [forecast, setForecast] = useState<ForecastState>({ loading: true });
  const [households, setHouseholds] = useState<HouseholdMeta[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState("");
  const [householdForecast, setHouseholdForecast] = useState<{ loading: boolean; error?: string }>({ loading: true });
  const [benchmark, setBenchmark] = useState<BenchmarkHouse[]>([]);
  const [benchmarkId, setBenchmarkId] = useState("");
  const [fromDay, setFromDay] = useState(1);
  const [toDay, setToDay] = useState(31);

  useEffect(() => {
    fetch("/api/deploy/forecast")
      .then((res) => res.json())
      .then((data: { appliances: ApplianceMeta[] }) => {
        const list = data.appliances ?? [];
        setAppliances(list);
        setSelectedAppliance(list[0]?.id ?? "");
        setSelectedSeries(list[0]?.seriesIds[0] ?? "");
      })
      .catch(() => setForecast({ loading: false, error: "실측 목록을 불러오지 못했습니다." }));
  }, []);

  useEffect(() => {
    if (!selectedAppliance || !selectedSeries) return;
    let cancelled = false;
    setForecast({ loading: true });
    fetch("/api/deploy/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appliance: selectedAppliance, seriesId: selectedSeries }),
    })
      .then((res) => res.json())
      .then((result: ForecastResult & { error?: string }) => {
        if (cancelled) return;
        setForecast(result.error ? { loading: false, error: result.error } : { loading: false, data: result });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setForecast({ loading: false, error: e.message });
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAppliance, selectedSeries]);

  useEffect(() => {
    fetch("/api/household-forecast")
      .then((res) => res.json())
      .then((data: { houses?: HouseholdMeta[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        const list = data.houses ?? [];
        setHouseholds(list);
        setSelectedHousehold(list[0]?.id ?? "");
      })
      .catch((error: Error) => setHouseholdForecast({ loading: false, error: error.message }));
  }, []);

  useEffect(() => {
    if (!selectedHousehold) return;
    let cancelled = false;
    setHouseholdForecast({ loading: true });
    fetch("/api/household-forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ houseId: selectedHousehold }),
    })
      .then((res) => res.json())
      .then((data: { forecast?: { "0.5": number; prediction_kwh: number }[]; error?: string }) => {
        if (cancelled) return;
        if (data.error || !data.forecast?.length) throw new Error(data.error ?? "예측 결과가 없습니다.");
        const daily = data.forecast.reduce((sum, point) => sum + (point["0.5"] ?? point.prediction_kwh ?? 0), 0);
        setMonthKwh(Math.max(1, Math.round(daily * 30)));
        setHouseholdForecast({ loading: false });
      })
      .catch((error: Error) => { if (!cancelled) setHouseholdForecast({ loading: false, error: error.message }); });
    return () => { cancelled = true; };
  }, [selectedHousehold]);

  useEffect(() => {
    fetch("/api/benchmark")
      .then((res) => res.json())
      .then((data: { houses?: BenchmarkHouse[] }) => {
        const houses = data.houses ?? [];
        setBenchmark(houses);
        setBenchmarkId(houses[0]?.id ?? "");
      })
      .catch(() => setBenchmark([]));
  }, []);

  const activeAppliance = appliances.find((a) => a.id === selectedAppliance);
  const orderedHouseholds = useMemo(() => [...households].sort((a, b) => {
    const numberOf = (id: string) => Number(id.match(/\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER);
    return numberOf(a.id) - numberOf(b.id);
  }), [households]);

  function chooseAppliance(id: string) {
    const next = appliances.find((a) => a.id === id);
    setSelectedAppliance(id);
    setSelectedSeries(next?.seriesIds[0] ?? "");
  }

  const b = bill(monthKwh);
  const tier = tierOf(monthKwh);
  const dailyAvg = monthKwh / 30;
  const nxt = daysToNextTier(monthKwh, dailyAvg);
  const appl = useMemo(() => applianceBreakdown(monthKwh), [monthKwh]);
  const selectedBenchmark = benchmark.find((house) => house.id === benchmarkId);
  const eda = useMemo(() => {
    if (!selectedBenchmark) return null;
    const start = Math.max(1, Math.min(31, Math.min(fromDay, toDay)));
    const end = Math.max(start, Math.min(31, Math.max(fromDay, toDay)));
    const values = selectedBenchmark.values.slice((start - 1) * 24, end * 24);
    const hourly = Array.from({ length: 24 }, (_, hour) => {
      const points = values.filter((_, i) => i % 24 === hour);
      return { hour: `${hour}시`, kwh: points.length ? points.reduce((a, v) => a + v, 0) / points.length : 0 };
    });
    const weekdayNames = ["월", "화", "수", "목", "금", "토", "일"];
    const weekday = weekdayNames.map((day, index) => {
      const points = values.filter((_, i) => (start - 1 + Math.floor(i / 24)) % 7 === index);
      return { day, kwh: points.reduce((a, v) => a + v, 0) / Math.max(1, points.length) * 24 };
    });
    const daily = Array.from({ length: end - start + 1 }, (_, i) => {
      const day = start + i;
      const points = selectedBenchmark.values.slice((day - 1) * 24, day * 24);
      return { day: `${day}일`, kwh: points.reduce((a, v) => a + v, 0) };
    });
    const heat = weekdayNames.map((day, dayIndex) => Array.from({ length: 24 }, (_, hour) => {
      const points = values.filter((_, i) => Math.floor(i / 24) % 7 === dayIndex && i % 24 === hour);
      const kwh = points.length ? points.reduce((a, v) => a + v, 0) / points.length : 0;
      return { day, hour, v: kwh };
    }));
    return { start, end, values, hourly, weekday, daily, heat };
  }, [selectedBenchmark, fromDay, toDay]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="section-title">🔋 전력 분석 대시보드</h1>
      </div>

      {/* 가정 선택 */}
      <section className="card flex flex-wrap items-end gap-4 p-5">
        <label className="min-w-[260px] flex-1"><span className="label">가정 선택</span><select className="input" value={selectedHousehold} onChange={(e) => setSelectedHousehold(e.target.value)} disabled={!households.length}>
          {orderedHouseholds.map((house) => <option key={house.id} value={house.id}>{house.id.replace(/^house_/, "가구 ").replace(/^H0*/, "가구 ")} · {house.type}</option>)}
        </select></label>
        <div className="text-xs text-slate-500">{households.find((house) => house.id === selectedHousehold)?.area ?? "가정 목록을 불러오는 중"}</div>
        <div className={`text-xs ${householdForecast.error ? "text-danger" : "text-slate-400"}`}>{householdForecast.loading ? "Chronos-2 예측 중…" : householdForecast.error ?? "최근 실측 기반 예측 완료"}</div>
      </section>

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

      {/* 가전별 분해 */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <div className="text-sm font-bold">가전별 사용량 분해</div>
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

      {/* EDA */}
      <section className="space-y-4">
        <div>
          <h2 className="section-title">📊 탐색적 데이터 분석 (EDA)</h2>
          <p className="mt-1 text-sm text-slate-500">개발 과정의 AI Hub 벤치마크 실측 데이터(89가구)를 선택한 기간으로 분석합니다.</p>
        </div>
        <div className="card grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr]">
          <label><span className="label">가구 선택</span><select className="input" value={benchmarkId} onChange={(e) => setBenchmarkId(e.target.value)} disabled={!benchmark.length}>
            {benchmark.map((house) => <option key={house.id} value={house.id}>{house.label} · {house.type}{house.split === "cold" ? " · 콜드스타트" : ""}</option>)}
          </select></label>
          <label><span className="label">시작일 · {fromDay}일차</span><input className="w-full accent-ink" type="range" min={1} max={31} value={fromDay} onChange={(e) => setFromDay(+e.target.value)} /></label>
          <label><span className="label">종료일 · {toDay}일차</span><input className="w-full accent-ink" type="range" min={1} max={31} value={toDay} onChange={(e) => setToDay(+e.target.value)} /></label>
          {selectedBenchmark && <div className="text-xs text-slate-400 md:col-span-3">{selectedBenchmark.label} · {selectedBenchmark.area} · 채널 {selectedBenchmark.channels}개 · 측정 시작 {selectedBenchmark.start} · 현재 {Math.min(fromDay, toDay)}~{Math.max(fromDay, toDay)}일차 선택</div>}
        </div>
        {!eda ? <div className="card p-8 text-center text-sm text-slate-400">실측 벤치마크 데이터를 불러오는 중입니다…</div> : <>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="text-sm font-bold">시간대별 평균 사용량</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <ComposedChart data={eda.hourly} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}kWh`} />
                  <Area dataKey="kwh" stroke={TEAL} fill={TEAL} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">선택 기간의 시간대별 평균(kWh)입니다.</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold">요일별 평균 사용량</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <BarChart data={eda.weekday} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} domain={[0, 16]} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}kWh`} />
                  <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
                    {eda.weekday.map((d, i) => (
                      <Cell key={d.day} fill={i >= 5 ? AMBER : "#cbd5e1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">요일별 하루 평균 사용량입니다.</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold">월별 사용량 추세</div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <LineChart data={eda.daily} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={40} />
                  <Tooltip formatter={(v: number) => `${v}kWh`} />
                  <ReferenceLine y={400} stroke="#D8432B" strokeDasharray="4 4" label={{ value: "400kWh 참고선", fontSize: 10, fill: "#D8432B" }} />
                  <Line dataKey="kwh" stroke={INK} strokeWidth={2.5} dot={{ r: 2 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">선택 범위의 일별 총 사용량입니다.</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-bold">사용 히트맵 · 요일 × 시간</div>
            <Heatmap data={eda.heat} />
            <div className="mt-1 text-xs text-slate-400">색이 진할수록 선택 기간의 평균 사용량이 큽니다.</div>
          </div>
        </div>
        <div className="text-xs text-slate-400">총 {eda.values.length.toLocaleString()}시간 · 선택 기간 합계 {eda.values.reduce((a, v) => a + v, 0).toFixed(1)}kWh</div>
        </>}
      </section>

      {/* 가전별 예측 */}
      <section className="card p-5">
        <div className="text-sm font-bold">가전별 사용량 예측 · Chronos-2 (자취방 실측)</div>
        <div className="mt-1 text-xs text-slate-400">최근 48시간 실측(진한 선) + 향후 24시간 예측(주황 점선·10–90% 불확실성 밴드)</div>

        <div className="mt-4 flex flex-wrap gap-2">
          {appliances.map((a) => (
            <button
              key={a.id}
              onClick={() => chooseAppliance(a.id)}
              className={`rounded-xl border px-3 py-2 text-sm transition ${selectedAppliance === a.id ? "border-amber bg-amber-soft font-bold text-ink" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
            >
              <span className="mr-1.5">{APPLIANCE_ICONS[a.id]}</span>
              {a.id === "tv" ? "TV" : a.id}
            </button>
          ))}
        </div>

        {activeAppliance && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeAppliance.seriesIds.map((sid) => {
              const person = sid.split("_")[0];
              return (
                <button
                  key={sid}
                  onClick={() => setSelectedSeries(sid)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${selectedSeries === sid ? "border-teal bg-teal-soft font-bold text-teal" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                >
                  {person} · {HOUSEHOLD[person] ?? "가구 정보 없음"}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">
              <span className="mr-1.5">{APPLIANCE_ICONS[selectedAppliance]}</span>
              {selectedAppliance === "tv" ? "TV" : selectedAppliance}
            </div>
            {forecast.data && <div className="text-[11px] text-slate-400">{forecast.data.seriesId} · 추론 {forecast.data.elapsedSeconds.toFixed(1)}초</div>}
          </div>
          <div className="mt-2 h-64">
            {forecast.loading ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
                모델 예측 중… (첫 실행은 로딩으로 시간이 걸릴 수 있어요)
              </div>
            ) : forecast.error ? (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-danger">{forecast.error}</div>
            ) : forecast.data ? (
              <ResponsiveContainer>
                <ComposedChart data={buildApplianceChartData(forecast.data)} margin={{ left: -8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="t" hide />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={46} tickFormatter={(v) => v.toFixed(2)} />
                  <Tooltip formatter={(v) => (typeof v === "number" ? `${v.toFixed(3)}kWh` : "-")} />
                  <Area dataKey="lo" stroke="none" fill="transparent" isAnimationActive={false} />
                  <Area dataKey="hi" stroke="none" fill={AMBER} fillOpacity={0.14} isAnimationActive={false} />
                  <Line dataKey="actual" stroke={INK} strokeWidth={2.5} dot={false} name="실측" isAnimationActive={false} />
                  <Line dataKey="pred" stroke={AMBER} strokeWidth={2.5} strokeDasharray="5 4" dot={false} name="예측" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : null}
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
  const max = Math.max(...data.flat().map((cell) => cell.v), 0.001);
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
                style={{ background: `rgba(10,154,168,${0.06 + (c.v / max) * 0.9})` }}
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
