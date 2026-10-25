"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { bill, tierOf, won } from "@/lib/domain";
import {
  CATALOG,
  INITIAL_SETTINGS,
  SCENARIOS,
  SCENARIO_COPY,
  calculateHouseholdUsage,
  type ApplianceSetting,
  type DemoResult,
  type ForecastPoint,
  type HouseholdMeta,
  type Occupancy,
  type Sensitivity,
} from "@/features/households/model";

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
const GRID = "#e1e0d9";
const AXIS = "#898781";
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function HouseholdsPage() {
  const [mode, setMode] = useState<"demo" | "direct">("demo");
  const [homeType, setHomeType] = useState("아파트");
  const [residents, setResidents] = useState(2);
  const [occupancy, setOccupancy] = useState<Occupancy>("normal");
  const [sensitivity, setSensitivity] = useState<Sensitivity>("normal");
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [demoState, setDemoState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [demoError, setDemoError] = useState("");
  const [demo, setDemo] = useState<DemoResult | null>(null);

  const result = useMemo(
    () => calculateHouseholdUsage(settings, residents, occupancy, sensitivity),
    [occupancy, residents, sensitivity, settings],
  );

  const riskTone = result.score >= 70 ? "text-danger" : result.score >= 35 ? "text-amber" : "text-ok";
  const status = result.score >= 70 ? "확인 필요" : result.score >= 35 ? "주의 관찰" : "정상 범위";
  const sensitivityLabel = sensitivity === "sensitive" ? "민감하게" : sensitivity === "relaxed" ? "낮게" : "보통";

  function update(id: string, patch: Partial<ApplianceSetting>) {
    setSettings((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  const loadDemo = useCallback(async () => {
    setDemoState("loading");
    setDemoError("");
    try {
      const listResponse = await fetch("/api/household-forecast");
      const listData = await listResponse.json() as { houses?: HouseholdMeta[]; error?: string };
      if (!listResponse.ok || !listData.houses?.length) throw new Error(listData.error ?? "진단할 가구 데이터를 찾지 못했습니다.");
      const stored = sessionStorage.getItem("wattwise-demo");
      const saved = stored ? JSON.parse(stored) as { houseId?: string; scenario?: string } : null;
      const available = listData.houses.filter((house) => /^(H\d{3}|house_\d+)$/.test(house.id));
      const house = available.find((item) => item.id === saved?.houseId) ?? available[Math.floor(Math.random() * available.length)];
      const scenario = SCENARIOS.includes(saved?.scenario as typeof SCENARIOS[number]) ? saved!.scenario! : SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      sessionStorage.setItem("wattwise-demo", JSON.stringify({ houseId: house.id, scenario }));
      const [forecastResponse, anomalyResponse] = await Promise.all([
        fetch("/api/household-forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ houseId: house.id }) }),
        fetch("/api/anomaly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenario }) }),
      ]);
      const forecastData = await forecastResponse.json() as { forecast?: ForecastPoint[]; error?: string };
      const anomalyData = await anomalyResponse.json() as DemoResult["anomaly"] & { error?: string };
      if (!forecastResponse.ok || !forecastData.forecast?.length) throw new Error(forecastData.error ?? "예측 결과를 만들지 못했습니다.");
      if (!anomalyResponse.ok || anomalyData.error) throw new Error(anomalyData.error ?? "이상탐지 결과를 만들지 못했습니다.");
      const forecast = forecastData.forecast.map((point, index) => {
        const rawExpected = point["0.5"] ?? point.prediction_kwh ?? 0;
        const date = point.timestamp ? new Date(point.timestamp) : null;
        const low = point["0.1"] ?? rawExpected * 0.8;
        const high = point["0.9"] ?? rawExpected * 1.2;
        return { hour: date && !Number.isNaN(date.getTime()) ? `${date.getHours()}시` : `${index}시`, low, expected: rawExpected, high, range: Math.max(0, high - low) };
      });
      const daily = forecast.reduce((sum, point) => sum + point.expected, 0);
      setDemo({ house, forecast, monthly: daily * 30, anomaly: anomalyData });
      setDemoState("done");
    } catch (error) {
      setDemoState("error");
      setDemoError(error instanceof Error ? error.message : "자동 진단에 실패했습니다.");
    }
  }, []);

  useEffect(() => { void loadDemo(); }, [loadDemo]);

  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
      <section className="relative flex min-h-[660px] items-center overflow-hidden bg-ink md:min-h-[500px]">
        <Image src={`${BP}/img/photos/feature-kettle.jpg`} alt="" fill priority unoptimized className="object-cover saturate-[0.6]" />
        <div className="absolute inset-0 bg-[#1a120c]/55" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:py-20 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-base font-bold tracking-wide text-white backdrop-blur md:text-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" fill="#F2C9A0" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
            스마트홈 진단
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl break-keep text-2xl font-black leading-[1.5] tracking-[-0.03em] text-white md:text-[2rem]">
            평소 생활 패턴과 오늘의 전력 사용을 비교해,<br className="hidden md:block" /> <span className="glow-apricot">평소와 다른 변화</span>를 감지해보세요.
          </h1>
          <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-y-6 rounded-3xl border border-white/20 bg-white/10 py-6 backdrop-blur-md md:grid-cols-4 md:divide-x md:divide-white/15 md:py-7">
            {mode === "demo" ? (
              demo ? <>
                <HeroFact value={demo.anomaly.isAnomaly ? "확인 필요" : "정상 범위"} label="현재 진단 상태" />
                <HeroFact value={`${Math.min(999, Math.round(demo.anomaly.score / Math.max(0.001, demo.anomaly.threshold) * 100))}%`} label="기준선 편차" />
                <HeroFact value={SCENARIO_COPY[demo.anomaly.scenario]?.title ?? "패턴 점검"} label="탐지 결과" />
                <HeroFact value={demo.anomaly.threshold.toFixed(2)} label={`판단 기준 · 점수 ${demo.anomaly.score.toFixed(2)}`} />
              </> : <>
                <HeroFact value="점검 중" label="현재 진단 상태" />
                <HeroFact value="-" label="기준선 편차" />
                <HeroFact value="-" label="탐지 결과" />
                <HeroFact value="-" label="판단 기준" />
              </>
            ) : <>
              <HeroFact value={status} label="현재 진단 상태" />
              <HeroFact value={`${result.score}/100`} label={`편차 점수 · 기준 ${(result.threshold * 100).toFixed(0)}%`} />
              <HeroFact value={`${result.unusual.length}개`} label={`확인 필요 가전 · 전체 ${result.selected.length}개`} />
              <HeroFact value={sensitivityLabel} label="감지 민감도" />
            </>}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 md:py-16">
      <section className="grid gap-3 sm:grid-cols-2">
        <ModeButton active={mode === "demo"} onClick={() => setMode("demo")} title="이상 신호 자동 점검" body="최근 전력 패턴에서 평소와 다른 신호를 바로 확인해요" badge="추천" />
        <ModeButton active={mode === "direct"} onClick={() => setMode("direct")} title="내 가전 직접 점검" body="평소와 오늘의 사용시간을 입력해 이상 여부를 확인해요" />
      </section>

      {mode === "demo" ? (
        <>
          <PageHeading title={<>오늘의 <span className="hl">생활 신호 점검</span></>} body="최근 전력 신호를 우리 집의 평소 기준선과 비교해 이상 징후를 찾고, 확인 방법을 안내합니다." />

          {demoState === "error" && <div className="rounded-xl bg-danger-soft p-5 text-sm text-danger">{demoError}<button type="button" className="ml-3 underline" onClick={() => void loadDemo()}>다시 시도</button></div>}
          {demoState === "loading" && !demo && <div className="card flex min-h-[360px] flex-col items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-4 border-[#3D2B1F]/15 border-t-[#3D2B1F]" /><div className="mt-4 font-bold">이상 신호를 점검하고 있습니다</div><p className="mt-1 text-xs text-slate-400">최근 전력 패턴을 평소 기준선과 비교합니다.</p></div>}
          {demo && <>
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <AnomalyCard anomaly={demo.anomaly} />
              <section className="card p-6"><div className="flex flex-wrap items-start justify-between gap-2"><div><SectionTitle>참고 · 다음 24시간 사용량</SectionTitle><Insight>{`${peakForecastHour(demo.forecast)}에 가장 많이 쓸 것으로 보여요`}</Insight></div><div className="flex items-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4 align-middle" style={{ background: BLUE }} />중앙 예측</span><span className="flex items-center gap-1.5"><i className="inline-block h-2 w-4 align-middle" style={{ background: BLUE, opacity: 0.15 }} />10–90% 범위</span></div></div><div className="mt-4 h-72"><ResponsiveContainer><ComposedChart data={demo.forecast} margin={{ left: -8, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} /><XAxis dataKey="hour" interval={2} tick={{ fontSize: 10, fill: AXIS }} axisLine={false} tickLine={false} /><YAxis width={42} tick={{ fontSize: 10, fill: AXIS }} unit="k" axisLine={false} tickLine={false} /><Tooltip formatter={(v: number, name: string) => [`${v.toFixed(2)}kWh`, name === "expected" ? "중앙 예측" : name === "range" ? "예측 구간 폭" : "하한"]} /><Area dataKey="low" stackId="interval" stroke="none" fill="transparent" isAnimationActive={false} /><Area dataKey="range" stackId="interval" stroke="none" fill={BLUE} fillOpacity={0.15} isAnimationActive={false} /><Line dataKey="expected" stroke={BLUE} strokeWidth={2} dot={false} isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div><div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-xs text-slate-400"><span>{demo.house.type} · {demo.house.area}</span><span>{demo.house.rows.toLocaleString()}시간 데이터</span></div></section>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Kpi label="참고 · 내일 예상 사용량" value={`${(demo.monthly / 30).toFixed(1)}kWh`} sub="향후 24시간 중앙 예측" />
              <Kpi label="참고 · 월 예상 사용량" value={`${Math.round(demo.monthly)}kWh`} sub="24시간 예측 × 30일" />
              <Kpi label="참고 · 예상 전기요금" value={won(bill(demo.monthly).total)} tone="text-amber" sub={`${tierOf(demo.monthly)}구간 요금`} />
            </div>
          </>}
        </>
      ) : (
        <>
      <PageHeading title={<>우리 집 <span className="hl">가전 직접 점검</span></>} body="가구 조건과 가전별 사용시간을 입력하면, 평소와 오늘을 비교해 이상 여부를 알려드려요." />

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4"><SectionTitle>우리 집 기본 조건</SectionTitle><div className="mt-1 text-xs text-slate-400">가구 조건은 기본 부하와 시간대별 사용 패턴에 반영됩니다.</div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="label">주거 형태</span><select className="input" value={homeType} onChange={(e) => setHomeType(e.target.value)}><option>아파트</option><option>빌라·다세대</option><option>단독주택</option><option>오피스텔·원룸</option></select></label>
          <label><span className="label">거주 인원</span><div className="relative"><input className="input pr-9" type="number" min="1" max="10" value={residents} onChange={(e) => setResidents(Math.max(1, +e.target.value))} /><span className="absolute right-3 top-2 text-sm text-slate-400">명</span></div></label>
          <label><span className="label">평소 재실 패턴</span><select className="input" value={occupancy} onChange={(e) => setOccupancy(e.target.value as typeof occupancy)}><option value="away">낮 시간 외출</option><option value="normal">출퇴근·일반</option><option value="home">재택·종일 재실</option></select></label>
          <label><span className="label">이상 감지 민감도</span><select className="input" value={sensitivity} onChange={(e) => setSensitivity(e.target.value as typeof sensitivity)}><option value="relaxed">낮게</option><option value="normal">보통</option><option value="sensitive">민감하게</option></select></label>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4"><SectionTitle>가전과 사용시간 선택</SectionTitle><div className="mt-1 text-xs text-slate-400">평소 시간은 예측 기준, 오늘 시간은 이상탐지 관측값으로 사용합니다.</div></div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG.map((item) => {
            const setting = settings[item.id];
            return <div key={item.id} className={`bg-white p-4 transition ${setting.enabled ? "" : "opacity-55"}`}>
              <div className="flex items-center justify-between"><label className="flex cursor-pointer items-center gap-2 font-semibold"><input type="checkbox" checked={setting.enabled} onChange={(e) => update(item.id, { enabled: e.target.checked })} className="h-4 w-4 accent-ink" /><span>{item.icon} {item.name}</span></label><span className="text-xs text-slate-400">{item.watt.toLocaleString()}W</span></div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label><span className="text-[10px] font-semibold text-slate-400">평소 하루</span><div className="relative mt-1"><input className="input !py-1.5 pr-7" type="number" min="0" max="24" step="0.5" disabled={!setting.enabled} value={setting.hours} onChange={(e) => update(item.id, { hours: Math.min(24, Math.max(0, +e.target.value)) })} /><span className="absolute right-2 top-1.5 text-xs text-slate-400">h</span></div></label>
                <label><span className="text-[10px] font-semibold" style={{ color: BLUE }}>오늘 관측</span><div className="relative mt-1"><input className="input !py-1.5 pr-7" type="number" min="0" max="24" step="0.5" disabled={!setting.enabled} value={setting.todayHours} onChange={(e) => update(item.id, { todayHours: Math.min(24, Math.max(0, +e.target.value)) })} /><span className="absolute right-2 top-1.5 text-xs text-slate-400">h</span></div></label>
              </div>
            </div>;
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-2"><div><SectionTitle>평소 패턴과 오늘 사용 비교</SectionTitle><Insight>{result.unusual.length ? `${result.unusual.length}개 가전이 평소와 다르게 쓰였어요` : "모든 가전이 평소 범위 안이에요"}</Insight></div><div className="flex gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4" style={{ background: BLUE }} />오늘 관측</span><span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4" style={{ background: ORANGE }} />평소 예상</span></div></div>
          <div className="mt-4 h-72"><ResponsiveContainer><ComposedChart data={result.hourly} margin={{ left: -8, right: 8 }}><CartesianGrid strokeDasharray="3 3" stroke={GRID} /><XAxis dataKey="hour" interval={2} tick={{ fontSize: 10, fill: AXIS }} /><YAxis width={42} tick={{ fontSize: 10, fill: AXIS }} unit="k" /><Tooltip formatter={(v: number, name) => [`${v.toFixed(2)}kWh`, name]} /><Area dataKey="high" stroke="none" fill={ORANGE} fillOpacity={0.1} /><Area dataKey="low" stroke="none" fill="white" /><Line dataKey="expected" name="평소 예상" stroke={ORANGE} strokeWidth={2} dot={false} /><Line dataKey="observed" name="오늘 관측" stroke={BLUE} strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer></div>
        </section>
        <section className="card p-6">
          <SectionTitle>이상 신호 및 권장 조치</SectionTitle>
          <div className={`mt-4 text-3xl font-black ${riskTone}`}>{status}</div>
          <div className="mt-1 text-xs text-slate-400">민감도 기준 편차 {(result.threshold * 100).toFixed(0)}% 초과 감지</div>
          <div className="mt-5 space-y-2">
            {result.unusual.length ? result.unusual.slice(0, 4).map((item) => <div key={item.id} className="rounded-lg bg-danger-soft p-3"><div className="flex items-center justify-between text-sm"><b>{item.icon} {item.name}</b><span className="font-bold text-danger">{item.deviation > 1 ? "+100%" : `${Math.round(item.deviation * 100)}%`} 편차</span></div><div className="mt-1 text-xs text-slate-500">평소 {settings[item.id].hours}h → 오늘 {settings[item.id].todayHours}h</div></div>) : <div className="rounded-lg bg-ok-soft p-4 text-sm leading-6 text-slate-600">선택한 모든 가전이 평소 사용 범위 안에 있습니다.</div>}
          </div>
          <p className="mt-4 text-[11px] leading-5 text-slate-400">전력 패턴의 편차를 감지하는 간이 모델이며, 고장이나 응급상황을 확정하지 않습니다.</p>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4"><SectionTitle>가전별 이상 신호 상세</SectionTitle><div className="mt-1 text-xs text-slate-400">평소 사용량과 오늘 관측값의 차이를 가전별로 확인합니다.</div></div>
        <div className="divide-y divide-slate-100 px-5">
          {result.applianceRows.map((item) => <div key={item.id} className="grid items-center gap-2 py-3 text-sm sm:grid-cols-[1fr_120px_120px]"><div className="font-medium">{item.icon} {item.name} <span className="ml-2 text-xs font-normal text-slate-400">{item.watt.toLocaleString()}W</span></div><div><span className="text-xs text-slate-400">월 예상 </span><b>{item.normal.toFixed(1)}kWh</b></div><div className={item.deviation > result.threshold ? "font-bold text-danger" : "text-slate-500"}>오늘 {item.today.toFixed(1)}kWh</div></div>)}
        </div>
      </section>
        </>
      )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone = "text-ink" }: { label: string; value: string; sub?: string; tone?: string }) {
  return <div className="card p-5"><div className="text-xs font-semibold text-slate-500">{label}</div><div className={`mt-1 text-2xl font-extrabold ${tone}`}>{value}</div>{sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}</div>;
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <dt className="sr-only">{label}</dt>
      <dd className="break-keep text-xl font-black tracking-tight text-[#F2C9A0] drop-shadow-[0_2px_6px_rgba(26,18,12,0.45)] md:text-[1.75rem]">{value}</dd>
      <dd className="mt-2 break-keep text-xs font-medium text-white/80 md:text-sm">{label}</dd>
    </div>
  );
}

function ModeButton({ active, onClick, title, body, badge }: { active: boolean; onClick: () => void; title: string; body: string; badge?: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-3xl border-2 px-6 py-4 text-center transition ${active ? "border-[#3D2B1F] bg-[#FAF6EC]" : "border-slate-200 bg-white hover:border-[#3D2B1F]/40"}`}>
      <div className="flex items-center justify-center gap-2"><span className={`text-2xl font-black md:text-[1.75rem] ${active ? "text-[#3D2B1F]" : "text-ink"}`}>{title}</span>{badge && <span className="rounded-full bg-[#3D2B1F] px-2.5 py-0.5 text-xs font-bold text-white md:text-sm">{badge}</span>}</div>
      <div className="mt-1 break-keep text-base text-slate-500">{body}</div>
    </button>
  );
}

function PageHeading({ title, body }: { title: React.ReactNode; body: string }) {
  return (
    <div>
      <h2 className="break-keep text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">{title}</h2>
      <p className="mt-3 break-keep text-base text-slate-600">{body}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-black tracking-[-0.02em] text-[#3D2B1F]">{children}</h3>;
}

function Insight({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 break-keep text-lg font-black tracking-[-0.01em] text-ink md:text-xl">&ldquo;{children}&rdquo;</p>;
}

function peakForecastHour(points: { hour: string; expected: number }[]) {
  return points.reduce((best, p) => (p.expected > best.expected ? p : best)).hour;
}

function AnomalyCard({ anomaly }: { anomaly: DemoResult["anomaly"] }) {
  const copy = SCENARIO_COPY[anomaly.scenario] ?? SCENARIO_COPY.normal;
  const ratio = anomaly.score / Math.max(0.001, anomaly.threshold);
  const gauge = Math.min(100, Math.round(ratio * 50));
  return (
    <section className={`card overflow-hidden border ${anomaly.isAnomaly ? "border-danger/30" : "border-ok/30"}`}>
      <div className={`p-6 ${anomaly.isAnomaly ? "bg-danger-soft" : "bg-ok-soft"}`}>
        <div className="flex items-center justify-between"><span className="text-base font-black text-[#3D2B1F]">이상 신호 진단</span><span className={`badge bg-white ${anomaly.isAnomaly ? "text-danger" : "text-ok"}`}>{anomaly.isAnomaly ? "확인 필요" : "정상"}</span></div>
        <div className={`mt-4 text-2xl font-black ${anomaly.isAnomaly ? "text-danger" : "text-ok"}`}>{copy.title}</div>
        <p className="mt-2 break-keep text-sm leading-6 text-slate-600">{copy.detail}</p>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-600">기준선 편차</span><span className="text-slate-400">모델 점수 {anomaly.score.toFixed(2)} / 기준 {anomaly.threshold.toFixed(2)}</span></div>
        <div className="relative mt-2 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${anomaly.isAnomaly ? "bg-danger" : "bg-ok"}`} style={{ width: `${gauge}%` }} /><div className="absolute -top-1 left-1/2 h-4 w-px bg-slate-400" title="이상 판단 기준" /></div>
        <div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>평소 범위</span><span>판단 기준</span><span>높은 편차</span></div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4"><div className="text-xs font-bold text-ink">권장 조치</div><p className="mt-1 break-keep text-xs leading-5 text-slate-500">{copy.action}</p></div>
        <p className="mt-4 text-[10px] leading-4 text-slate-400">이 결과는 전력 패턴 편차에 대한 AI 보조 진단이며, 기기 고장이나 응급상황을 확정하지 않습니다.</p>
      </div>
    </section>
  );
}
