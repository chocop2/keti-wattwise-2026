// pvlib 방법론(태양위치·청천일사·경사면 전이·PVWatts)을 단순화한 위치기반 태양광 발전 추정.
// 정밀 산출이 필요하면 pvlib(파이썬) 마이크로서비스로 교체 가능. 여기선 월별 평균으로 근사.
import { won } from "@/lib/domain";

const D2R = Math.PI / 180;
const GSC = 1367; // W/m2
const REP_DAY = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
const DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export type City = { name: string; lat: number; kt: number };
export const CITIES: City[] = [
  { name: "서울", lat: 37.57, kt: 0.50 },
  { name: "강릉", lat: 37.75, kt: 0.53 },
  { name: "대전", lat: 36.35, kt: 0.51 },
  { name: "광주", lat: 35.16, kt: 0.52 },
  { name: "부산", lat: 35.18, kt: 0.52 },
  { name: "제주", lat: 33.51, kt: 0.49 },
];

// 월별 경사면 일일 일사량(kWh/m²/day) — 청천 H0 × 청명지수 × 경사/방위 전이
export function monthlyPOA(lat: number, kt: number, tilt: number, azimuth: number) {
  const phi = lat * D2R;
  const beta = tilt * D2R;
  return REP_DAY.map((n) => {
    const decl = 23.45 * Math.sin(2 * Math.PI * (284 + n) / 365) * D2R;
    const dr = 1 + 0.033 * Math.cos(2 * Math.PI * n / 365);
    const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(decl))));
    // 수평면 청천 일일 일사 (MJ/m²/day) → kWh
    const H0mj = (24 * 3600 / Math.PI) * GSC * dr *
      (Math.cos(phi) * Math.cos(decl) * Math.sin(ws) + ws * Math.sin(phi) * Math.sin(decl)) / 1e6;
    const ghi = kt * (H0mj / 3.6); // kWh/m²/day
    // 정오 기준 경사면 전이계수 Rb (남향 기준)
    const cosZ = Math.cos(phi - decl);
    const cosT = Math.cos(phi - decl - beta);
    let rb = cosZ > 0.05 ? cosT / cosZ : 1;
    const azFactor = Math.max(0.6, Math.cos(azimuth * D2R) * 0.4 + 0.6); // 남(0)=1, 동/서로 갈수록 감소
    let poa = ghi * rb * azFactor;
    poa = Math.max(0.6 * ghi, Math.min(1.7 * ghi, poa));
    return { ghi, poa };
  });
}

export type SolarPVInput = {
  lat: number;
  kt: number;
  systemKw: number;
  tilt: number;
  azimuth: number; // 0=남, +동 -서 (절대값만 사용)
  pr: number; // 시스템 효율
  consumptionYr: number; // 연 소비 kWh
  costPerKw: number;
  subsidy: number;
  savePerKwh: number; // 자가소비 절감단가
  sellPerKwh: number; // 잉여 판매단가(전력거래)
  selfRate: number; // 자가소비율 0~1
};

export function simulate(inp: SolarPVInput) {
  const poa = monthlyPOA(inp.lat, inp.kt, inp.tilt, Math.abs(inp.azimuth));
  const monthly = poa.map((m, i) => {
    const gen = inp.systemKw * m.poa * inp.pr * DIM[i]; // kWh/월
    return { month: MONTHS[i], gen: +gen.toFixed(0), ghi: +(m.ghi * DIM[i]).toFixed(0), poa: +m.poa.toFixed(2) };
  });
  const annualGen = monthly.reduce((s, m) => s + m.gen, 0);
  const selfUsed = annualGen * inp.selfRate;
  const surplus = annualGen - selfUsed;
  const annualRevenue = selfUsed * inp.savePerKwh + surplus * inp.sellPerKwh;
  const install = Math.max(0, inp.systemKw * inp.costPerKw - inp.subsidy);
  const bepYears = annualRevenue > 0 ? install / annualRevenue : Infinity;
  const re100 = Math.min(100, (annualGen / inp.consumptionYr) * 100);
  const cumulative = Array.from({ length: 26 }, (_, y) => {
    const rev = annualRevenue * y * (1 - 0.004 * Math.max(0, y - 1)); // 연 0.4% 열화 근사
    return { year: y, revenue: Math.round(rev), cost: install, net: Math.round(rev - install) };
  });
  return { monthly, annualGen, selfUsed, surplus, annualRevenue, install, bepYears, re100, cumulative };
}

// 도시별 연 발전량 비교(동일 시스템 조건)
export function cityCompare(base: SolarPVInput) {
  return CITIES.map((c) => {
    const poa = monthlyPOA(c.lat, c.kt, base.tilt, Math.abs(base.azimuth));
    const gen = poa.reduce((s, m, i) => s + base.systemKw * m.poa * base.pr * DIM[i], 0);
    return { name: c.name, gen: Math.round(gen) };
  }).sort((a, b) => b.gen - a.gen);
}

export const TARGETS = {
  가정: { systemKw: 3, consumptionYr: 4800, costPerKw: 1_600_000, subsidy: 600_000 },
  기업: { systemKw: 100, consumptionYr: 250_000, costPerKw: 1_300_000, subsidy: 0 },
  공공기관: { systemKw: 50, consumptionYr: 120_000, costPerKw: 1_400_000, subsidy: 20_000_000 },
} as const;
export type TargetKind = keyof typeof TARGETS;

export const fmtWon = won;
