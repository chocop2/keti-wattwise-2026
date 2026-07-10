// ── 순수 도메인 로직 + 결정론적 합성 데이터 (서버 불필요, 차트에서 직접 사용) ──

export const won = (n: number) => `${Math.round(n).toLocaleString("ko-KR")}원`;
export const kwh = (n: number) => `${n.toFixed(0)}kWh`;

// 결정론적 유사난수 (SSR/CSR 일치)
function rng(seed: number) {
  let t = seed + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────── 누진제 (주택용 저압, 예시 단가 · 수정가능) ───────────────── */
export const TARIFF = [
  { upto: 200, base: 910, per: 120.0 },
  { upto: 400, base: 1600, per: 214.6 },
  { upto: Infinity, base: 7300, per: 307.3 },
];
export const TIER_LIMIT = [200, 400]; // 구간 경계

export function tierOf(monthKwh: number) {
  if (monthKwh <= 200) return 1;
  if (monthKwh <= 400) return 2;
  return 3;
}

export function bill(monthKwh: number) {
  let energy = 0;
  let prev = 0;
  let base = TARIFF[0].base;
  for (const t of TARIFF) {
    const portion = Math.max(0, Math.min(monthKwh, t.upto) - prev);
    if (portion > 0) {
      energy += portion * t.per;
      base = t.base;
    }
    prev = t.upto;
    if (monthKwh <= t.upto) break;
  }
  const supply = base + energy;
  const total = Math.round(supply * 1.137); // 부가세10% + 전력기금3.7%
  return { base, energy: Math.round(energy), supply: Math.round(supply), total, tier: tierOf(monthKwh) };
}

export function daysToNextTier(currentKwh: number, dailyAvg: number) {
  const tier = tierOf(currentKwh);
  if (tier >= 3) return null;
  const limit = TIER_LIMIT[tier - 1];
  const remain = limit - currentKwh;
  return { limit, remain: Math.max(0, remain), days: Math.max(0, remain / dailyAvg), nextTier: tier + 1 };
}

/* ───────────────── 태양광 손익분기 ───────────────── */
export type SolarInput = {
  panels: number;
  wattPerPanel: number; // W
  costPerKw: number; // 원/kW (설치단가)
  subsidy: number; // 원 (보조금 총액)
  sunHours: number; // 일 평균 발전시간
  savePerKwh: number; // 절감 단가 (원/kWh, 상위구간 상계일수록 큼)
};
export const SOLAR_DEFAULT: SolarInput = {
  panels: 6,
  wattPerPanel: 450,
  costPerKw: 1_600_000,
  subsidy: 600_000,
  sunHours: 3.5,
  savePerKwh: 250,
};
export function solar(inp: SolarInput) {
  const capacityKw = (inp.panels * inp.wattPerPanel) / 1000;
  const annualGen = capacityKw * inp.sunHours * 365;
  const annualSaving = annualGen * inp.savePerKwh;
  const install = Math.max(0, capacityKw * inp.costPerKw - inp.subsidy);
  const bepYears = annualSaving > 0 ? install / annualSaving : Infinity;
  const cumulative = Array.from({ length: 21 }, (_, y) => ({
    year: y,
    saving: Math.round(annualSaving * y),
    cost: install,
    net: Math.round(annualSaving * y - install),
  }));
  return { capacityKw, annualGen, annualSaving, install, bepYears, cumulative };
}

/* ───────────────── 가전별 사용량 분해 (합성 NILM) ───────────────── */
export const APPLIANCES = [
  { name: "에어컨", share: 0.24, type: "냉방" },
  { name: "냉장고", share: 0.18, type: "상시" },
  { name: "인덕션·전기밥솥", share: 0.12, type: "조리" },
  { name: "세탁·건조기", share: 0.10, type: "세탁" },
  { name: "TV·셋톱", share: 0.08, type: "활동" },
  { name: "조명", share: 0.08, type: "활동" },
  { name: "전기포트·기타 소형", share: 0.07, type: "활동" },
  { name: "대기전력·기타", share: 0.13, type: "기타" },
];
export function applianceBreakdown(monthKwh: number) {
  const marginal = TARIFF[tierOf(monthKwh) - 1].per;
  return APPLIANCES.map((a) => {
    const k = monthKwh * a.share;
    return { ...a, kwh: k, cost: k * marginal };
  }).sort((x, y) => y.kwh - x.kwh);
}

/* ───────────────── EDA / 예측용 시계열 ───────────────── */
export function hourlyProfile() {
  // 24h 평균 사용량(kWh) — 저녁 피크
  const r = rng(7);
  return Array.from({ length: 24 }, (_, h) => {
    const peak = 0.35 * Math.exp(-((h - 20) ** 2) / 8) + 0.18 * Math.exp(-((h - 8) ** 2) / 6);
    const base = 0.12 + peak + (r() - 0.5) * 0.02;
    return { hour: `${h}시`, kwh: +(base).toFixed(3) };
  });
}

export function weekdayProfile() {
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const vals = [11.8, 11.5, 11.9, 12.1, 12.6, 14.2, 13.8];
  return days.map((d, i) => ({ day: d, kwh: vals[i] }));
}

export function monthlyTrend() {
  const vals = [310, 300, 290, 280, 290, 330, 420, 470, 400, 320, 300, 320];
  return vals.map((v, i) => ({ month: `${i + 1}월`, kwh: v, base: v, scenario: v }));
}

export function forecastSeries() {
  // 최근 24시간 실측 + 향후 12시간 예측 (W), 예측 상/하한 밴드
  const r = rng(21);
  const pts: { t: string; actual: number | null; pred: number | null; lo: number | null; hi: number | null }[] = [];
  for (let h = 0; h <= 36; h++) {
    const clock = (h) % 24;
    const shape = 260 * Math.exp(-((clock - 20) ** 2) / 10) + 160 * Math.exp(-((clock - 8) ** 2) / 8) + 180;
    if (h <= 24) {
      pts.push({ t: `${clock}시`, actual: Math.round(shape + (r() - 0.5) * 40), pred: null, lo: null, hi: null });
    } else {
      const p = Math.round(shape);
      const spread = 40 + (h - 24) * 6;
      pts.push({ t: `+${h - 24}h`, actual: null, pred: p, lo: p - spread, hi: p + spread });
    }
  }
  // 연결점
  const j = pts[24];
  pts[24] = { ...j, pred: j.actual, lo: j.actual, hi: j.actual };
  return pts;
}

export function usageHeatmap() {
  // 요일(7) × 시간(24) 강도 0~1
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const r = rng(99);
  return days.map((d, di) =>
    Array.from({ length: 24 }, (_, h) => {
      const evening = Math.exp(-((h - 20) ** 2) / 9);
      const morning = 0.5 * Math.exp(-((h - 8) ** 2) / 7);
      const weekend = di >= 5 ? 0.2 * Math.exp(-((h - 14) ** 2) / 20) : 0;
      const v = Math.min(1, evening + morning + weekend + (r() - 0.5) * 0.05);
      return { day: d, hour: h, v: +v.toFixed(3) };
    })
  );
}

/* ───────────────── 이상감지 (고령 1인가구) ───────────────── */
export type AnomalyState = {
  activity: { hour: number; base: number; band: number; today: number }[];
  fridge: { hour: number; today: number }[];
  risk: number; // 0~100
  tier: "관심" | "주의" | "경보";
  lastActiveHour: number;
  nowHour: number;
  narrative: string;
};

export function anomaly(anomalyFrom = 14, nowHour = 17): AnomalyState {
  const r = rng(3);
  const activity = Array.from({ length: 24 }, (_, h) => {
    // 평소 활동 가전 전력(W) — 아침/저녁 활동
    const typical =
      120 * Math.exp(-((h - 8) ** 2) / 6) +
      90 * Math.exp(-((h - 12) ** 2) / 4) +
      170 * Math.exp(-((h - 19) ** 2) / 7) +
      15;
    const band = 25 + typical * 0.25;
    let today = typical + (r() - 0.5) * 20;
    if (h >= anomalyFrom && h <= nowHour) today = 4 + r() * 4; // 활동 정지
    return { hour: h, base: +typical.toFixed(1), band: +band.toFixed(1), today: +Math.max(0, today).toFixed(1) };
  });
  const fridge = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    today: +(38 + Math.sin(h / 2) * 6 + (r() - 0.5) * 4).toFixed(1), // 상시부하: 계속 가동
  }));
  const hoursStopped = nowHour - anomalyFrom;
  const risk = Math.min(100, Math.round(30 + hoursStopped * 16));
  const tier = risk >= 75 ? "경보" : risk >= 45 ? "주의" : "관심";
  const narrative =
    `어르신 댁, ${anomalyFrom}시부터 활동가전(TV·전기포트) 사용이 멈췄습니다. ` +
    `평소 이 시간대엔 활동이 있었습니다. 냉장고는 정상 가동 중 — ` +
    `외출이 아닐 가능성이 있어 안부 확인을 권합니다.`;
  return { activity, fridge, risk, tier, lastActiveHour: anomalyFrom, nowHour, narrative };
}
