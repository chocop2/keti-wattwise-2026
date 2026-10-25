"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { displayName, useCurrentUser } from "@/components/CurrentUser";
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
} from "recharts";
import {
  APPLIANCES,
  bill,
  tierOf,
  daysToNextTier,
  applianceBreakdown,
  won,
} from "@/lib/domain";
import {
  buildBenchmarkAnalysis,
  type BenchmarkHouse,
  type HouseholdMeta,
} from "@/features/analytics/benchmark";

// 데이터 시각화 기준 팔레트(범주형 8색, 순서 고정 = 색각이상 구분 검증 순서)
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const BLUE = SERIES[0];
const ORANGE = SERIES[1];
const GRID = "#e1e0d9";
const AXIS = "#898781";
// 색은 순위가 아니라 가전에 고정한다(정렬이 바뀌어도 같은 가전은 같은 색).
const APPLIANCE_COLOR: Record<string, string> = Object.fromEntries(APPLIANCES.map((a, i) => [a.name, SERIES[i % SERIES.length]]));
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function AnalyticsPage() {
  const user = useCurrentUser();
  const [monthKwh, setMonthKwh] = useState(366);
  const [households, setHouseholds] = useState<HouseholdMeta[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState("");
  const [householdForecast, setHouseholdForecast] = useState<{ loading: boolean; error?: string }>({ loading: true });
  const [benchmark, setBenchmark] = useState<BenchmarkHouse[]>([]);
  const [benchmarkId, setBenchmarkId] = useState("");
  const [fromDay, setFromDay] = useState(1);
  const [toDay, setToDay] = useState(31);

  useEffect(() => {
    fetch("/api/household-forecast")
      .then((res) => res.json())
      .then((data: { houses?: HouseholdMeta[]; error?: string }) => {
        if (data.error) throw new Error(data.error);
        const list = data.houses ?? [];
        setHouseholds(list);
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
        const selected = houses[Math.floor(Math.random() * houses.length)];
        setBenchmarkId(selected?.id ?? "");
        setSelectedHousehold(selected?.id ?? "");
      })
      .catch(() => setBenchmark([]));
  }, []);

  const b = bill(monthKwh);
  const tier = tierOf(monthKwh);
  const dailyAvg = monthKwh / 30;
  const nxt = daysToNextTier(monthKwh, dailyAvg);
  const appl = useMemo(() => applianceBreakdown(monthKwh), [monthKwh]);
  const selectedHouseholdMeta = households.find((house) => house.id === selectedHousehold);
  const selectedBenchmark = benchmark.find((house) => house.id === benchmarkId);
  const eda = useMemo(
    () => buildBenchmarkAnalysis(selectedBenchmark, fromDay, toDay),
    [selectedBenchmark, fromDay, toDay],
  );
  const insights = useMemo(() => {
    if (!eda) return null;
    const maxBy = <T,>(items: T[], value: (item: T) => number) => items.reduce((best, item) => (value(item) > value(best) ? item : best));
    const peakHour = maxBy(eda.hourly, (h) => h.kwh);
    const weekdayAvg = eda.weekday.slice(0, 5).reduce((sum, d) => sum + d.kwh, 0) / 5;
    const weekendAvg = eda.weekday.slice(5).reduce((sum, d) => sum + d.kwh, 0) / 2;
    const weekendDiff = weekdayAvg > 0 ? Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100) : 0;
    const peakDay = maxBy(eda.daily, (d) => d.kwh);
    const peakCell = maxBy(eda.heat.flat(), (c) => c.v);
    return {
      hourly: `${peakHour.hour} 무렵에 가장 많이 써요`,
      weekday: weekendDiff === 0 ? "주말과 평일 사용량이 비슷해요" : `주말이 평일보다 ${Math.abs(weekendDiff)}% ${weekendDiff > 0 ? "더" : "덜"} 써요`,
      daily: `${peakDay.day}에 가장 많이 썼어요 (${peakDay.kwh.toFixed(1)}kWh)`,
      heat: `${peakCell.day}요일 ${peakCell.hour}시가 가장 붐벼요`,
    };
  }, [eda]);
  const totalCost = appl.reduce((sum, a) => sum + a.cost, 0);
  const topShare = appl.length && totalCost > 0 ? Math.round((appl[0].cost / totalCost) * 100) : 0;

  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
      <section className="relative flex min-h-[660px] items-center overflow-hidden bg-ink md:min-h-[500px]">
        <Image src={`${BP}/img/photos/apartment-windows.jpg`} alt="" fill priority unoptimized className="object-cover saturate-[0.35] blur-[2px]" />
        <div className="absolute inset-0 bg-[#1a120c]/50" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:py-20 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-base font-bold tracking-wide text-white backdrop-blur md:text-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" fill="#F2C9A0" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
            전력 대시보드
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl break-keep text-2xl font-black leading-[1.5] tracking-[-0.03em] text-white md:text-[2rem]">
            최근 전력 사용 패턴을 바탕으로 <span className="glow-apricot">향후 24시간의 사용량</span>을 예측하고,<br className="hidden md:block" /> 예상 전기요금과 <span className="glow-apricot">누진 구간 변화</span>를 한눈에 확인해보세요.
          </h1>
          <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-y-6 rounded-3xl border border-white/20 bg-white/10 py-6 backdrop-blur-md md:grid-cols-4 md:divide-x md:divide-white/15 md:py-7">
            <HeroFact value={`${monthKwh}kWh`} label="이번 달 예상 사용량" />
            <HeroFact value={won(b.total)} label="예상 청구요금" />
            <HeroFact value={`${tier}구간`} label="현재 누진 구간" />
            <HeroFact value={nxt ? `${Math.round(nxt.remain)}kWh` : "최고 구간"} label={nxt ? `다음 구간까지 · 약 ${nxt.days.toFixed(0)}일` : "3구간 유지 중"} />
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 md:py-16">
      {/* 분석 대상 정보 */}
      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-xl font-black text-ink">안녕하세요, <span className="text-3xl text-[#3D2B1F] md:text-[2rem]">{user ? displayName(user.name) : "회원"}</span>님!</span><span className="text-xl font-black text-ink">{selectedHouseholdMeta ? `${selectedHouseholdMeta.type} · ${selectedHouseholdMeta.area}` : "분석 데이터를 불러오는 중"}</span></div>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold md:text-base ${householdForecast.error ? "bg-danger-soft text-danger" : "bg-[#FAF6EC] text-[#3D2B1F]"}`}>{!householdForecast.error && <span className={`h-2.5 w-2.5 rounded-full ${householdForecast.loading ? "animate-pulse bg-[#eda100]" : "bg-[#0ca30c]"}`} aria-hidden />}{householdForecast.loading ? "사용량 분석 중…" : householdForecast.error ?? "최근 실제 사용량 기반 분석 완료"}</div>
      </section>

      <section className="space-y-4">
        <div className="pt-2">
          <h2 className="break-keep text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">이번 달 <span className="hl">요금 분석</span></h2>
          <p className="mt-3 text-base text-slate-600">예상 사용량으로 누진 구간과 가전별 요금을 계산합니다.</p>
        </div>
      {/* 누진 경고 바 */}
      <section className="card p-6">
        <SectionTitle>누진제 진입 모니터</SectionTitle>
        <Insight>{nxt ? `약 ${nxt.days.toFixed(0)}일 후 ${nxt.nextTier}구간에 들어가요` : "이미 가장 비싼 3구간이에요"}</Insight>
        <TierBar monthKwh={monthKwh} />
        {nxt ? (
          <p className="mt-3 text-sm text-slate-600">
            다음 구간까지 <b>{Math.round(nxt.remain)}kWh</b> 남음 · 현재 추세(일 {dailyAvg.toFixed(1)}kWh)로 <b>약 {nxt.days.toFixed(0)}일 후 {nxt.nextTier}구간</b> 진입 예상
          </p>
        ) : null}
        <div className="mt-2 text-xs text-slate-400">
          기본요금 {won(b.base)} + 전력량요금 {won(b.energy)} → 전기요금계 {won(b.supply)} · 청구금액(부가세·기금 포함) <b>{won(b.total)}</b>
        </div>
      </section>

      {/* 가전별 분해 */}
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <SectionTitle>가전별 사용량 분해</SectionTitle>
          {appl[0] && <Insight>{withSubject(appl[0].name)} 가장 많이 써요</Insight>}
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={appl} layout="vertical" margin={{ left: 30, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: AXIS }} unit="k" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#5C4A3D" }} width={110} />
                <Tooltip formatter={(v: number) => `${v.toFixed(0)}kWh`} />
                <Bar dataKey="kwh" radius={[0, 4, 4, 0]}>
                  {appl.map((a) => (
                    <Cell key={a.name} fill={APPLIANCE_COLOR[a.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <SectionTitle>가전별 예상 요금 기여</SectionTitle>
          {appl[0] && <Insight>{withSubject(appl[0].name)} 이번 달 요금의 {topShare}%를 차지해요</Insight>}
          <div className="mt-3 divide-y divide-slate-100">
            {appl.map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2 text-sm">
                <span className="flex items-center gap-2.5 text-slate-600"><span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: APPLIANCE_COLOR[a.name] }} aria-hidden />{a.name}</span>
                <span className="text-right">
                  <b>{won(a.cost)}</b>
                  <span className="ml-2 text-xs text-slate-400">{a.kwh.toFixed(0)}kWh</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
      </section>

      {/* EDA */}
      <section className="space-y-4">
        <div className="pt-6">
          <h2 className="break-keep text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">기간별 <span className="hl">사용 패턴 분석</span></h2>
          <p className="mt-3 text-base text-slate-600">연결된 실측 데이터를 기간별·시간대별로 분석합니다.</p>
        </div>
        <div className="card grid gap-4 p-5 md:grid-cols-2">
          <label><span className="label">시작일 · {fromDay}일차</span><input className="w-full accent-ink" type="range" min={1} max={31} value={fromDay} onChange={(e) => setFromDay(+e.target.value)} /></label>
          <label><span className="label">종료일 · {toDay}일차</span><input className="w-full accent-ink" type="range" min={1} max={31} value={toDay} onChange={(e) => setToDay(+e.target.value)} /></label>
          {selectedBenchmark && <div className="text-xs text-slate-400 md:col-span-2">실측 데이터 · {selectedBenchmark.area} · 측정 채널 {selectedBenchmark.channels}개 · 측정 시작 {selectedBenchmark.start} · 현재 {Math.min(fromDay, toDay)}~{Math.max(fromDay, toDay)}일차 선택</div>}
        </div>
        {!eda ? <div className="card p-8 text-center text-sm text-slate-400">실측 벤치마크 데이터를 불러오는 중입니다…</div> : <>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="text-base font-black text-[#3D2B1F]">시간대별 평균 사용량</div>
            {insights && <Insight>{insights.hourly}</Insight>}
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <ComposedChart data={eda.hourly} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: AXIS }} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: AXIS }} width={40} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)}kWh`} />
                  <Area dataKey="kwh" stroke={BLUE} fill={BLUE} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">선택 기간의 시간대별 평균(kWh)입니다.</div>
          </div>
          <div className="card p-5">
            <div className="text-base font-black text-[#3D2B1F]">요일별 평균 사용량</div>
            {insights && <Insight>{insights.weekday}</Insight>}
            <div className="mt-2 flex gap-4 text-xs text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: BLUE }} />평일</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />주말</span></div>
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <BarChart data={eda.weekday} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: AXIS }} />
                  <YAxis tick={{ fontSize: 10, fill: AXIS }} width={40} domain={[0, 16]} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}kWh`} />
                  <Bar dataKey="kwh" radius={[4, 4, 0, 0]}>
                    {eda.weekday.map((d, i) => (
                      <Cell key={d.day} fill={i >= 5 ? ORANGE : BLUE} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">요일별 하루 평균 사용량입니다.</div>
          </div>
          <div className="card p-5">
            <div className="text-base font-black text-[#3D2B1F]">일별 사용량 추세</div>
            {insights && <Insight>{insights.daily}</Insight>}
            <div className="mt-3 h-56">
              <ResponsiveContainer>
                <LineChart data={eda.daily} margin={{ left: -12, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: AXIS }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: AXIS }} width={40} />
                  <Tooltip formatter={(v: number) => `${v}kWh`} />
                  <Line dataKey="kwh" stroke={BLUE} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: BLUE, stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 text-xs text-slate-400">선택 범위의 일별 총 사용량입니다.</div>
          </div>
          <div className="card p-5">
            <div className="text-base font-black text-[#3D2B1F]">사용 히트맵 · 요일 × 시간</div>
            {insights && <Insight>{insights.heat}</Insight>}
            <Heatmap data={eda.heat} />
            <div className="mt-1 text-xs text-slate-400">색이 진할수록 선택 기간의 평균 사용량이 큽니다.</div>
          </div>
        </div>
        <div className="text-xs text-slate-400">총 {eda.values.length.toLocaleString()}시간 · 선택 기간 합계 {eda.values.reduce((a, v) => a + v, 0).toFixed(1)}kWh</div>
        </>}
      </section>
      </div>
    </div>
  );
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-black tracking-tight text-[#F2C9A0] drop-shadow-[0_2px_6px_rgba(26,18,12,0.45)] md:text-[2rem]">{value}</dd>
      <dd className="mt-2 break-keep text-xs font-medium text-white/80 md:text-sm">{label}</dd>
    </div>
  );
}

// 마지막 글자 받침 유무로 주격 조사(이/가)를 고른다.
function withSubject(word: string) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 && code % 28 !== 0;
  return `${word}${hasFinal ? "이" : "가"}`;
}

function Insight({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 break-keep text-lg font-black tracking-[-0.01em] text-ink md:text-xl">&ldquo;{children}&rdquo;</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-black tracking-[-0.02em] text-[#3D2B1F]">{children}</h3>;
}
function TierBar({ monthKwh }: { monthKwh: number }) {
  const max = 500;
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;
  return (
    <div className="mt-4">
      <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="absolute inset-y-0 left-0 bg-[#0ca30c]/30" style={{ width: pct(200) }} />
        <div className="absolute inset-y-0 bg-[#fab219]/40" style={{ left: pct(200), width: pct(200) }} />
        <div className="absolute inset-y-0 bg-[#d03b3b]/35" style={{ left: pct(400), right: 0 }} />
        <div className="absolute inset-y-0 w-1 rounded-full bg-ink" style={{ left: pct(monthKwh) }} />
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
                style={{ background: `rgba(42,120,214,${0.08 + (c.v / max) * 0.92})` }}
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
