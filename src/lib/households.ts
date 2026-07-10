// 5개 가정 × 가전별 소비 — 정격전력(W) × 일 사용시간으로 상향식(bottom-up) 산출.
import { bill, tierOf, TARIFF, won } from "@/lib/domain";

export type Appliance = { name: string; icon: string; watt: number; hours: number };
export type Household = {
  id: string;
  name: string;
  persons: string;
  emoji: string;
  note: string;
  elderly?: boolean;
  bIdx?: number; // 지도에서 하이라이트할 건물 인덱스
  loc?: [number, number]; // [lng, lat]
  solarKw?: number; // 권장 태양광 용량(kW)
  appliances: Appliance[];
};

export const HOUSEHOLDS: Household[] = [
  {
    id: "A",
    name: "가정 A · 4인 가족",
    persons: "4인 · 아파트 84㎡",
    emoji: "👨‍👩‍👧‍👦",
    note: "여름 냉방·건조기 사용이 많은 전형적 4인 가구",
    bIdx: 453,
    loc: [127.02104, 37.58371],
    solarKw: 0.8,
    appliances: [
      { name: "에어컨", icon: "❄️", watt: 1800, hours: 6 },
      { name: "냉장고", icon: "🧊", watt: 40, hours: 24 },
      { name: "의류건조기", icon: "🌀", watt: 1500, hours: 0.8 },
      { name: "인덕션", icon: "🍳", watt: 2000, hours: 0.5 },
      { name: "전기밥솥", icon: "🍚", watt: 700, hours: 0.6 },
      { name: "TV", icon: "📺", watt: 120, hours: 5 },
      { name: "세탁기", icon: "🧺", watt: 500, hours: 0.4 },
      { name: "헤어드라이기", icon: "💨", watt: 1200, hours: 0.4 },
      { name: "조명", icon: "💡", watt: 120, hours: 6 },
    ],
  },
  {
    id: "B",
    name: "가정 B · 1인 청년",
    persons: "1인 · 원룸 26㎡",
    emoji: "🧑‍💻",
    note: "재실 시간 짧고 소형 가전 위주. 사용량 낮음",
    bIdx: 105,
    loc: [127.02076, 37.59202],
    solarKw: 0.4,
    appliances: [
      { name: "냉장고", icon: "🧊", watt: 30, hours: 24 },
      { name: "에어컨", icon: "❄️", watt: 1500, hours: 2 },
      { name: "노트북·모니터", icon: "💻", watt: 150, hours: 4 },
      { name: "TV", icon: "📺", watt: 100, hours: 3 },
      { name: "인덕션", icon: "🍳", watt: 2000, hours: 0.2 },
      { name: "전기포트", icon: "☕", watt: 1200, hours: 0.1 },
      { name: "조명", icon: "💡", watt: 60, hours: 5 },
    ],
  },
  {
    id: "C",
    name: "가정 C · 고령 1인",
    persons: "1인 · 다세대 45㎡",
    emoji: "🧓",
    note: "냉장고·난방 비중 크고 활동가전 적음 (이상감지 대상)",
    elderly: true,
    bIdx: 118,
    loc: [127.02095, 37.5908],
    solarKw: 0.5,
    appliances: [
      { name: "냉장고", icon: "🧊", watt: 45, hours: 24 },
      { name: "전기장판", icon: "🛏️", watt: 120, hours: 9 },
      { name: "TV", icon: "📺", watt: 120, hours: 6 },
      { name: "전기밥솥", icon: "🍚", watt: 700, hours: 0.9 },
      { name: "전기포트", icon: "☕", watt: 1200, hours: 0.15 },
      { name: "에어컨", icon: "❄️", watt: 1500, hours: 1 },
      { name: "조명", icon: "💡", watt: 80, hours: 5 },
    ],
  },
  {
    id: "D",
    name: "가정 D · 맞벌이 부부",
    persons: "2인 · 아파트 59㎡",
    emoji: "👩‍❤️‍👨",
    note: "저녁 시간대 집중 사용 (건조기·식기세척기)",
    bIdx: 451,
    loc: [127.02041, 37.58384],
    solarKw: 0.6,
    appliances: [
      { name: "에어컨", icon: "❄️", watt: 1800, hours: 4 },
      { name: "냉장고", icon: "🧊", watt: 40, hours: 24 },
      { name: "의류건조기", icon: "🌀", watt: 1500, hours: 0.6 },
      { name: "식기세척기", icon: "🍽️", watt: 1200, hours: 0.3 },
      { name: "인덕션", icon: "🍳", watt: 2000, hours: 0.4 },
      { name: "TV", icon: "📺", watt: 120, hours: 4 },
      { name: "세탁기", icon: "🧺", watt: 500, hours: 0.3 },
      { name: "조명", icon: "💡", watt: 100, hours: 5 },
    ],
  },
  {
    id: "E",
    name: "가정 E · 재택근무",
    persons: "1인 · 오피스텔 40㎡",
    emoji: "🏠",
    note: "종일 재실 — 냉방·PC를 장시간 가동",
    bIdx: 325,
    loc: [127.03074, 37.58206],
    solarKw: 0.8,
    appliances: [
      { name: "에어컨", icon: "❄️", watt: 1800, hours: 8 },
      { name: "냉장고", icon: "🧊", watt: 40, hours: 24 },
      { name: "데스크톱·모니터", icon: "💻", watt: 260, hours: 10 },
      { name: "TV", icon: "📺", watt: 120, hours: 3 },
      { name: "전기포트", icon: "☕", watt: 1200, hours: 0.2 },
      { name: "공기청정기", icon: "🌫️", watt: 30, hours: 24 },
      { name: "조명", icon: "💡", watt: 100, hours: 8 },
    ],
  },
];

export type ApplianceCalc = Appliance & { dailyKwh: number; monthlyKwh: number; cost: number; share: number };
export type HouseholdCalc = {
  hh: Household;
  items: ApplianceCalc[];
  monthly: number;
  tier: number;
  billTotal: number;
  top: ApplianceCalc;
};

export function calc(hh: Household): HouseholdCalc {
  const raw = hh.appliances.map((a) => {
    const dailyKwh = (a.watt * a.hours) / 1000;
    return { ...a, dailyKwh, monthlyKwh: dailyKwh * 30, cost: 0, share: 0 };
  });
  const monthly = raw.reduce((s, a) => s + a.monthlyKwh, 0);
  const marginal = TARIFF[tierOf(monthly) - 1].per;
  const items = raw
    .map((a) => ({ ...a, cost: a.monthlyKwh * marginal, share: a.monthlyKwh / monthly }))
    .sort((x, y) => y.monthlyKwh - x.monthlyKwh);
  const b = bill(monthly);
  return { hh, items, monthly, tier: tierOf(monthly), billTotal: b.total, top: items[0] };
}

export function allCalc() {
  return HOUSEHOLDS.map(calc);
}

// 가정 태양광(베란다형) 설치 시뮬 — 실제 시장가 표(400W 단위) 기준 선형 환산
export function homeSolar(kw: number, consumptionYr: number, subsidyOn: boolean) {
  const units = kw / 0.4; // 400W 단위 수
  const genYr = Math.round(units * 45 * 12); // 연 발전량 kWh (월 ~45kWh/400W)
  const selfPay = Math.round(units * (subsidyOn ? 35 : 80)); // 자부담 만원
  const saveYr = Math.round(units * 18); // 연 절감 만원 (월 ~1.5만/400W)
  const bep = saveYr > 0 ? selfPay / saveYr : Infinity; // 회수기간(년)
  const re100 = Math.min(100, (genYr / consumptionYr) * 100);
  const net25 = saveYr * 25 - selfPay; // 25년 순이익 만원
  return { kw, genYr, selfPay, saveYr, bep, re100, net25 };
}

// 가정별 챗봇 응답 (선택된 가정 데이터 기반)
export function houseAnswer(raw: string, c: HouseholdCalc): string {
  const q = raw.trim();
  const has = (...k: string[]) => k.some((x) => q.includes(x));
  const top3 = c.items.slice(0, 3);

  if (has("제일", "가장", "많이", "1위", "최다", "높은"))
    return (
      `${c.hh.name}에서 가장 많이 쓰는 가전은 ${c.top.icon} ${c.top.name}입니다.\n` +
      `월 약 ${c.top.monthlyKwh.toFixed(0)}kWh(${won(c.top.cost)}) · 전체의 ${(c.top.share * 100).toFixed(0)}%를 차지해요.`
    );
  if (has("줄", "절약", "절전", "뭘", "아끼", "낮추", "권장"))
    return (
      `💡 ${c.hh.name} 절약 우선순위\n` +
      top3.map((a, i) => `${i + 1}. ${a.icon} ${a.name} — 월 ${a.monthlyKwh.toFixed(0)}kWh (${won(a.cost)})`).join("\n") +
      `\n→ ${c.top.name} 사용시간을 20% 줄이면 월 약 ${(c.top.monthlyKwh * 0.2).toFixed(0)}kWh(${won(c.top.cost * 0.2)}) 절감돼요.`
    );
  if (has("요금", "얼마", "총", "청구", "비용"))
    return `${c.hh.name}의 월 예상 사용량은 ${c.monthly.toFixed(0)}kWh(${c.tier}구간), 예상 청구요금은 약 ${won(c.billTotal)}입니다.`;
  if (has("구간", "누진"))
    return `현재 월 ${c.monthly.toFixed(0)}kWh로 ${c.tier}구간입니다.${c.tier === 3 ? " 최고 구간이라 상위 단가가 적용돼요." : ` 400kWh를 넘으면 3구간(307.3원/kWh)으로 크게 오릅니다.`}`;
  const hit = c.items.find((a) => q.includes(a.name) || (a.name === "에어컨" && has("냉방")) || (a.name === "냉장고" && has("냉장")));
  if (hit)
    return `${hit.icon} ${hit.name}는 정격 ${hit.watt}W로 하루 ${hit.hours}시간 → 월 약 ${hit.monthlyKwh.toFixed(0)}kWh(${won(hit.cost)}), 이 집 사용량의 ${(hit.share * 100).toFixed(0)}%예요.`;
  return (
    `${c.hh.name} 데이터로 답해드릴게요 👇\n` +
    `· 제일 많이 쓰는 가전? · 뭘 줄여야 해?\n· 이 집 요금 얼마? · (가전명) 사용량은?`
  );
}
