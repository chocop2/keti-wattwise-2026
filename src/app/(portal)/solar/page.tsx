"use client";

import Image from "next/image";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { CITIES } from "@/lib/solarpv";
import { won } from "@/lib/domain";
import {
  calculateSolarPlan,
  type HomeType,
  type Orientation,
  type RoofCondition,
  type UsagePattern,
} from "@/features/solar/calculator";
import dynamic from "next/dynamic";
import type { SearchedBuilding, SelectedSolarBuilding } from "@/components/BuildingSolarMap";

const BuildingSolarMap = dynamic(() => import("@/components/BuildingSolarMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">지도 로딩…</div>
  ),
});

const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
const GOOD = "#0ca30c";
const GRID = "#e1e0d9";
const AXIS = "#898781";
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function SolarPage() {
  const [cityIdx, setCityIdx] = useState(0);
  const [homeType, setHomeType] = useState<HomeType>("house");
  const [areaPyeong, setAreaPyeong] = useState(30);
  const [residents, setResidents] = useState(3);
  const [usagePattern, setUsagePattern] = useState<UsagePattern>("normal");
  const [roofCondition, setRoofCondition] = useState<RoofCondition>("good");
  const [orientation, setOrientation] = useState<Orientation>("south");
  const [knownMonthlyKwh, setKnownMonthlyKwh] = useState("");
  const [sellPerKwh, setSellPerKwh] = useState(130);
  const [subsidyOn, setSubsidyOn] = useState(true);
  const [locationQuery, setLocationQuery] = useState("");
  const [searchedPlace, setSearchedPlace] = useState<SearchedBuilding | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<SelectedSolarBuilding | null>(null);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">("idle");
  const [searchError, setSearchError] = useState("");

  const {
    city, estimatedMonthlyKwh, monthlyConsumption, annualConsumption,
    installableArea, maxPanels, orientationSetting, panelCount, systemKw,
    panelEquipmentCost, inverterCost, structureCost, installationCost,
    grossInstallCost, estimatedSubsidy, selfPay,
    result: r, monthlyEnergy, selfSaving, saleRevenue, gridUse, net25,
    buildingSaving, buildingSavingRate,
  } = calculateSolarPlan({
    cityIdx, homeType, areaPyeong, residents, usagePattern, roofCondition,
    orientation, knownMonthlyKwh, sellPerKwh, subsidyOn,
    searchedLocation: searchedPlace,
    selectedBuilding,
  });

  useEffect(() => {
    const profile = { version: 1, panelCount, systemKw, annualGen: r.annualGen, annualConsumption, selfUsed: r.selfUsed, surplus: r.surplus, annualRevenue: r.annualRevenue, location: searchedPlace?.label ?? city.name, updatedAt: new Date().toISOString() };
    try { localStorage.setItem("wattwise:solar-profile:v1", JSON.stringify(profile)); } catch { /* 브라우저 저장 불가 시 거래 화면 연동만 생략 */ }
  }, [annualConsumption, city.name, panelCount, r.annualGen, r.annualRevenue, r.selfUsed, r.surplus, searchedPlace?.label, systemKw]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")?.trim();
    if (!q) return;
    setLocationQuery(q);
    void runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function searchLocation(e: FormEvent) {
    e.preventDefault();
    void runSearch(locationQuery);
  }

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setSearchState("loading");
    setSearchError("");
    setSelectedBuilding(null);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSearchedPlace({ label: result.label, loc: [result.lon, result.lat], geometry: result.geometry, addressType: result.addressType });
      setSearchState("idle");
    } catch (error) {
      setSearchState("error");
      setSearchError(error instanceof Error ? error.message : "검색 결과를 불러오지 못했습니다.");
    }
  }

  const mapSection = (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle>건물별 일조량·발전 잠재량 지도</SectionTitle>
          <div className="mt-1 text-xs text-slate-400">
            도로명 주소의 정확한 좌표와 건물 경계를 확대해 보여줍니다. 청록색 검색 건물을 클릭하면 상세 발전·절감 정보를 확인할 수 있어요.
          </div>
        </div>
        {searchedPlace && (
          <button type="button" className="btn-ghost text-xs" onClick={() => { setSearchedPlace(null); setSelectedBuilding(null); setLocationQuery(""); }}>
            기본 보기로
          </button>
        )}
      </div>
      {searchedPlace && <div className="mt-3 rounded-lg bg-[#FAF6EC] px-3 py-2 text-sm font-semibold text-[#3D2B1F]">검색 위치 · {searchedPlace.label}</div>}
      <div className="mt-3">
        <BuildingSolarMap
          focusIdx={selectedBuilding?.idx}
          focusLoc={selectedBuilding?.loc ?? searchedPlace?.loc}
          searchedBuilding={searchedPlace ?? undefined}
          onBuildingSelect={setSelectedBuilding}
        />
      </div>
      <div className="mt-2 text-[11px] text-slate-400">
        ※ 검색 결과에 건물 경계가 제공되지 않는 주소는 정확한 좌표 주변을 대표 건물 영역으로 표시합니다. 옥상 구조물·음영을 반영한 시공 전 현장 실측이 필요합니다.
      </div>
    </section>
  );

  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
      <section className="relative flex min-h-[660px] items-center overflow-hidden bg-ink md:min-h-[500px]">
        <Image src={`${BP}/img/photos/feature-solar-house.jpg`} alt="" fill priority unoptimized className="object-cover saturate-[0.7] blur-[2px]" />
        <div className="absolute inset-0 bg-[#1a120c]/60" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-base font-bold tracking-wide text-white backdrop-blur md:text-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" fill="#F2C9A0" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
            태양광 시뮬레이터
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl break-keep text-2xl font-black leading-[1.5] tracking-[-0.03em] text-white md:text-[2rem]">
            우리 집 지붕과 전력 사용량을 바탕으로<br className="hidden md:block" /> <span className="glow-apricot">예상 발전량과 투자비 회수 기간</span>을 확인하세요.
          </h1>
          <form onSubmit={searchLocation} className="mx-auto mt-6 flex max-w-3xl flex-col gap-3 sm:flex-row">
            <input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="min-w-0 flex-1 rounded-2xl border-2 border-white/40 bg-white px-5 py-4 text-base text-ink outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/30"
              placeholder="도로명 주소 (예: 서울 성북구 안암로 145)"
              aria-label="태양광 분석 위치 검색"
            />
            <button className="rounded-2xl bg-[#F2C9A0] px-8 py-4 text-lg font-bold text-[#3D2B1F] transition hover:brightness-105 disabled:opacity-60" disabled={searchState === "loading"}>
              {searchState === "loading" ? "검색 중…" : "위치 검색"}
            </button>
          </form>
          {searchState === "error" && <div className="mt-3 text-sm font-semibold text-[#ffb4a8]">{searchError}</div>}
          <dl className="mx-auto mt-7 grid max-w-4xl grid-cols-2 gap-y-6 rounded-3xl border border-white/20 bg-white/10 py-6 backdrop-blur-md md:grid-cols-4 md:divide-x md:divide-white/15 md:py-7">
            <HeroFact value={`${r.annualGen.toLocaleString()}kWh`} label={`연간 발전량 · ${panelCount}장`} />
            <HeroFact value={`${r.re100.toFixed(0)}%`} label="에너지 자립률" />
            <HeroFact value={won(r.annualRevenue)} label="연 예상 수익" />
            <HeroFact value={isFinite(r.bepYears) ? `${r.bepYears.toFixed(1)}년` : "—"} label="투자 회수 기간" />
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 md:py-16">
      {searchedPlace && mapSection}

      {selectedBuilding && (
        <section className="card overflow-hidden">
          {selectedBuilding.address && <div className="border-b border-slate-100 px-6 py-4"><SectionTitle>검색 건물 상세</SectionTitle><div className="mt-1 text-sm font-bold">{selectedBuilding.address}</div><div className="mt-1 text-xs text-slate-400">좌표 {selectedBuilding.loc[1].toFixed(6)}, {selectedBuilding.loc[0].toFixed(6)} · OpenStreetMap 주소 경계 기반</div></div>}
          <div className="grid gap-0 md:grid-cols-[1fr_1fr_0.8fr]">
            <div className="p-6 md:p-7">
              <div className="text-xs font-semibold text-slate-500">선택 건물 연간 절감량</div>
              <div className="mt-1 text-4xl font-black tracking-tight text-[#3D2B1F]">{Math.min(selectedBuilding.kwh, annualConsumption).toLocaleString()}<span className="ml-1 text-lg">kWh</span></div>
              <div className="mt-2 text-xs text-slate-400">예상 발전 잠재량 {selectedBuilding.kwh.toLocaleString()}kWh 기준</div>
            </div>
            <div className="border-t border-slate-100 p-6 md:border-l md:border-t-0 md:p-7">
              <div className="text-xs font-semibold text-slate-500">전력 사용 절감 비율</div>
              <div className="mt-1 text-4xl font-black tracking-tight text-[#3D2B1F]">{buildingSavingRate.toFixed(0)}%</div>
              <div className="mt-2 text-xs text-slate-400">예상 연 소비 {annualConsumption.toLocaleString()}kWh 대비</div>
            </div>
            <div className="border-t border-slate-100 p-6 md:border-l md:border-t-0 md:p-7">
              <div className="text-xs font-semibold text-slate-500">예상 연 절감액</div>
              <div className="mt-1 text-4xl font-black tracking-tight text-[#3D2B1F]">{won(buildingSaving)}</div>
              <div className="mt-2 text-xs text-slate-400">추정 옥상 {selectedBuilding.area.toLocaleString()}㎡ · {selectedBuilding.source === "search" ? "주소 건물 경계 기준" : `높이 ${selectedBuilding.h}m`}</div>
            </div>
          </div>
        </section>
      )}

      <PageHeading title={<>우리 집 <span className="hl">설치 조건</span></>} body="생활 정보와 설치 공간을 입력하면 전력 사용량과 권장 패널 수를 자동으로 계산해요." />
      <section className="card overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4">
          <SectionTitle>설치 조건 입력</SectionTitle>
          <div className="mt-1 text-xs text-slate-400">생활 정보와 실제 설치 공간을 바탕으로 전력 사용량과 권장 패널 수를 자동 계산합니다.</div>
        </div>
        <div className="grid lg:grid-cols-[1.35fr_0.85fr]">
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="주거 형태">
              <select value={homeType} onChange={(e) => setHomeType(e.target.value as typeof homeType)} className="input">
                <option value="apartment">아파트 · 베란다</option>
                <option value="villa">빌라 · 공동 옥상</option>
                <option value="house">단독주택 · 개인 옥상</option>
              </select>
            </Field>
            <Field label="집 크기">
              <div className="relative"><input type="number" min="5" max="150" value={areaPyeong} onChange={(e) => setAreaPyeong(Math.max(5, Number(e.target.value)))} className="input pr-10" /><span className="absolute right-3 top-2 text-sm text-slate-400">평</span></div>
            </Field>
            <Field label="거주 인원">
              <div className="relative"><input type="number" min="1" max="10" value={residents} onChange={(e) => setResidents(Math.max(1, Number(e.target.value)))} className="input pr-10" /><span className="absolute right-3 top-2 text-sm text-slate-400">명</span></div>
            </Field>
            <Field label="평소 전기 사용">
              <select value={usagePattern} onChange={(e) => setUsagePattern(e.target.value as typeof usagePattern)} className="input">
                <option value="low">적은 편 · 낮 시간 외출</option>
                <option value="normal">보통 · 일반 가정</option>
                <option value="high">많은 편 · 재택/가전 많음</option>
              </select>
            </Field>
            <Field label="패널 설치 공간">
              <select value={roofCondition} onChange={(e) => setRoofCondition(e.target.value as typeof roofCondition)} className="input">
                <option value="good">충분함 · 장애물 거의 없음</option>
                <option value="partial">일부 가능 · 실외기/구조물 있음</option>
                <option value="limited">협소함 · 사용 가능 공간 적음</option>
              </select>
            </Field>
            <Field label="지붕 방향">
              <select value={orientation} onChange={(e) => setOrientation(e.target.value as typeof orientation)} className="input">
                <option value="south">남향 경사지붕</option>
                <option value="southeast">남동·남서향</option>
                <option value="east">동·서향</option>
                <option value="flat">평지붕</option>
              </select>
            </Field>
            <Field label="최근 월 사용량 (선택)" hint="고지서 값이 있으면 추정보다 우선합니다.">
              <div className="relative"><input type="number" min="0" placeholder={`${estimatedMonthlyKwh}`} value={knownMonthlyKwh} onChange={(e) => setKnownMonthlyKwh(e.target.value)} className="input pr-14" /><span className="absolute right-3 top-2 text-sm text-slate-400">kWh</span></div>
            </Field>
            <Field label="기준 지역">
              <select value={cityIdx} onChange={(e) => setCityIdx(+e.target.value)} className="input" disabled={Boolean(searchedPlace)}>
                {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="잉여 전력 판매단가">
              <div className="relative"><input type="number" min="50" max="300" value={sellPerKwh} onChange={(e) => setSellPerKwh(Number(e.target.value))} className="input pr-20" /><span className="absolute right-3 top-2 text-sm text-slate-400">원/kWh</span></div>
            </Field>
          </div>
          <div className="bg-slate-50 p-5 lg:border-l lg:border-slate-100">
            <SectionTitle>자동 산정 결과</SectionTitle>
            <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="text-xs text-slate-400">추천 설치량</div>
              <div className="mt-1 text-3xl font-black text-[#3D2B1F]">{panelCount}장 <span className="text-lg">· {systemKw}kW</span></div>
              <div className="mt-2 text-xs text-slate-400">450W 패널 · 패널당 약 2.1㎡ 기준</div>
            </div>
            <div className="mt-3 space-y-2 rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200">
              <Row k={knownMonthlyKwh ? "입력 월 사용량" : "예상 월 사용량"} v={`${monthlyConsumption.toLocaleString()}kWh`} strong />
              <Row k="예상 연 사용량" v={`${annualConsumption.toLocaleString()}kWh`} />
              <Row k="설치 가능 면적" v={`약 ${installableArea.toFixed(1)}㎡`} />
              <Row k="최대 설치 가능" v={`${maxPanels}장`} />
              <Row k="적용 방향" v={orientationSetting.label} />
            </div>
            <div className="mt-3 text-[11px] leading-5 text-slate-400">추천량은 예상 연 사용량의 약 85% 충당을 목표로 하되, 실제 설치 가능 면적을 넘지 않도록 산정합니다.</div>
          </div>
        </div>
      </section>

      <PageHeading title={<>우리 집 <span className="hl">추천 견적</span></>} body="추천 설치량과 예상 비용, 보조금을 반영한 자부담을 한눈에 확인하세요." />
      <section className="card overflow-hidden">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-[#FAF6EC] p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle>추천 견적</SectionTitle>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#3D2B1F]">예상 견적</span>
            </div>
            <div className="mt-6 flex items-end gap-3">
              <div className="text-4xl font-black tracking-tight text-[#3D2B1F]">{won(selfPay)}</div>
              <div className="pb-1 text-sm text-slate-500">예상 자부담</div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <QuoteStat label="설치 용량" value={`${systemKw}kW`} />
              <QuoteStat label="패널 구성" value={`450W × ${panelCount}`} />
              <QuoteStat label="회수 예상" value={`${r.bepYears.toFixed(1)}년`} />
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <div>
                <div className="text-sm font-semibold">지자체 보조금 반영</div>
                <div className="mt-0.5 text-xs text-slate-400">거주 지역과 공고 시점에 따라 달라질 수 있어요.</div>
              </div>
              <button type="button" aria-label="보조금 반영 여부" aria-pressed={subsidyOn} onClick={() => setSubsidyOn((v) => !v)} className={`relative h-6 w-11 rounded-full transition ${subsidyOn ? "bg-[#3D2B1F]" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${subsidyOn ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          </div>
          <div className="p-6 md:p-7">
            <div className="flex items-center justify-between">
              <SectionTitle>예상 비용 내역</SectionTitle>
              <div className="text-xs text-slate-400">VAT 포함</div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <Row k={`고효율 450W 패널 × ${panelCount}장`} v={won(panelEquipmentCost)} />
              <Row k="인버터·전기 설비" v={won(inverterCost)} />
              <Row k="구조물·고정 자재" v={won(structureCost)} />
              <Row k="설치·전기 공사" v={won(installationCost)} />
              <div className="border-t border-dashed border-slate-200 pt-3"><Row k="설치비 합계" v={won(grossInstallCost)} strong /></div>
              <Row k="예상 보조금" v={estimatedSubsidy ? `− ${won(estimatedSubsidy)}` : "미반영"} />
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[#FAF6EC] px-4 py-4">
              <span className="text-sm font-bold text-slate-700">최종 예상 자부담</span>
              <span className="text-xl font-black text-[#3D2B1F]">{won(selfPay)}</span>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">현장 실측 전 간이 견적입니다. 분전반 증설, 크레인 사용, 방수·보강 공사는 실제 견적에서 추가될 수 있습니다.</p>
          </div>
        </div>
      </section>

      <PageHeading title={<>발전량과 <span className="hl">투자 회수</span> 전망</>} body="월별 발전량, 에너지 자립률, 누적 수익을 함께 살펴보세요." />
      {/* 월별 발전량 + 에너지 자립률 게이지 */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-3"><div><SectionTitle>월별 에너지 예상</SectionTitle><Insight>{`${peakMonth(monthlyEnergy)}에 가장 많이 발전해요`}</Insight></div><div className="flex gap-3 text-xs text-slate-500"><span className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: ORANGE }} />발전</span><span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-4" style={{ background: BLUE }} />소비</span></div></div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <ComposedChart data={monthlyEnergy} margin={{ left: -8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: AXIS }} />
                <YAxis tick={{ fontSize: 10, fill: AXIS }} width={44} />
                <Tooltip formatter={(v: number, n) => [`${v.toLocaleString()}kWh`, n]} />
                <Bar dataKey="gen" name="발전량" radius={[4, 4, 0, 0]} fill={ORANGE} />
                <Line dataKey="consumption" name="사용량" stroke={BLUE} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card flex flex-col items-center justify-center p-6">
          <div className="self-start"><SectionTitle>에너지 자립률</SectionTitle><Insight>{r.re100 >= 100 ? "쓰는 전기보다 더 많이 만들어요" : `쓰는 전기의 ${r.re100.toFixed(0)}%를 직접 만들어요`}</Insight></div>
          <div className="relative h-48 w-48">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ v: r.re100 }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="v" cornerRadius={12} fill={r.re100 >= 100 ? GOOD : BLUE} background={{ fill: "#efeee9" }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-extrabold">{r.re100.toFixed(0)}%</div>
              <div className="text-xs text-slate-400">연간 소비 대비</div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-slate-500">
            연 발전 {r.annualGen.toLocaleString()}kWh / 예상 소비 {annualConsumption.toLocaleString()}kWh
          </div>
        </div>
      </div>

      {/* 투자 회수 + 에너지 흐름 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <SectionTitle>투자비 회수 전망</SectionTitle>
          <Insight>{isFinite(r.bepYears) ? `약 ${r.bepYears.toFixed(1)}년이면 설치비를 회수해요` : "현재 조건으로는 회수가 어려워요"}</Insight>
          <div className="mt-1 text-xs text-slate-400">자가소비 절감과 잉여 전력 판매 수익 · 연 0.4% 성능 저하 반영</div>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={r.cumulative} margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: AXIS }} unit="년" />
                <YAxis tick={{ fontSize: 9, fill: AXIS }} width={52} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => won(v)} labelFormatter={(y) => `${y}년차`} />
                <ReferenceLine y={selfPay} stroke={AXIS} strokeDasharray="4 4" label={{ value: "자부담", fontSize: 10, fill: AXIS }} />
                {isFinite(r.bepYears) && <ReferenceLine x={Math.round(r.bepYears)} stroke={ORANGE} strokeDasharray="4 4" label={{ value: "회수 시점", fontSize: 10, fill: ORANGE }} />}
                <Line dataKey="revenue" name="누적 수익" stroke={BLUE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <SectionTitle>연간 에너지 흐름</SectionTitle>
          <div className="mt-1 text-xs text-slate-400">발전한 전기가 어디에 사용되고, 어떤 경제 효과를 만드는지 보여줍니다.</div>
          <div className="mt-6 space-y-5">
            <EnergyFlow label="집에서 바로 사용" value={r.selfUsed} total={annualConsumption} color="bg-[#2a78d6]" note={`${won(selfSaving)} 절감`} />
            <EnergyFlow label="잉여 전력 판매" value={r.surplus} total={annualConsumption} color="bg-[#eb6834]" note={`${won(saleRevenue)} 수익`} />
            <EnergyFlow label="전력망에서 구매" value={gridUse} total={annualConsumption} color="bg-slate-300" note="발전 부족분" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Mini label="연간 경제 효과" value={won(r.annualRevenue)} sub="절감액 + 판매수익" tone="text-[#3D2B1F]" />
            <Mini label="25년 예상 순이익" value={won(net25)} sub="성능 저하·자부담 반영" tone={net25 >= 0 ? "text-ok" : "text-slate-500"} />
          </div>
        </div>
      </div>

      {!searchedPlace && mapSection}

      <section className="card p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><SectionTitle>설치 전 확인사항</SectionTitle><div className="mt-1 text-xs text-slate-400">실제 신청 전 아래 항목을 확인하면 정확한 견적을 받을 수 있습니다.</div></div><span className="badge bg-[#FAF6EC] text-[#3D2B1F]">현장 실측 필요</span></div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["01", "전기 고지서", "최근 12개월 사용량으로 권장 용량을 보정합니다."],
            ["02", "옥상·베란다 실측", "음영, 방수 상태와 구조물 설치 공간을 확인합니다."],
            ["03", "보조금 공고", "지자체 접수 기간과 지원 잔여 예산을 확인합니다."],
            ["04", "계통 연결", "한전 연계 가능 여부와 분전반 상태를 점검합니다."],
          ].map(([number, title, body]) => <div key={number} className="rounded-xl border border-slate-200 p-4"><svg viewBox="0 0 24 24" className="h-5 w-5 text-teal" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.5l5 5L20 6.5" /></svg><div className="mt-2 text-sm font-bold">{title}</div><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div>)}
        </div>
        <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-xl bg-slate-50 px-4 py-4 sm:flex-row sm:items-center"><div><div className="text-sm font-bold">현재 결과를 상담용으로 활용하세요</div><div className="mt-1 text-xs text-slate-400">추천 {systemKw}kW · 예상 자부담 {won(selfPay)} · 연간 경제 효과 {won(r.annualRevenue)}</div></div><button type="button" onClick={() => window.print()} className="btn-primary shrink-0">결과 인쇄하기</button></div>
      </section>
      </div>
    </div>
  );
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

function PageHeading({ title, body }: { title: ReactNode; body: string }) {
  return (
    <div>
      <h2 className="break-keep text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">{title}</h2>
      <p className="mt-3 break-keep text-base text-slate-600">{body}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-black tracking-[-0.02em] text-[#3D2B1F]">{children}</h3>;
}

function Insight({ children }: { children: ReactNode }) {
  return <p className="mt-2 break-keep text-lg font-black tracking-[-0.01em] text-ink md:text-xl">&ldquo;{children}&rdquo;</p>;
}

function peakMonth(rows: { month: string; gen: number }[]) {
  return rows.reduce((best, row) => (row.gen > best.gen ? row : best)).month;
}

function QuoteStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-base font-bold text-[#3D2B1F]">{value}</div>
    </div>
  );
}
function EnergyFlow({ label, value, total, color, note }: { label: string; value: number; total: number; color: string; note: string }) {
  const percentage = Math.min(100, Math.max(2, value / total * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="text-slate-400">{Math.round(value).toLocaleString()}kWh · {note}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div>
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
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[10px] leading-4 text-slate-400">{hint}</div>}
    </div>
  );
}
