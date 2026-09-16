import type { Household } from "./households";

export type AnomalyScenario = "normal" | "always_on" | "cooking_loss" | "inactive" | "night_loss" | "away";

// Household appliance estimates shape a synthetic profile; this does not run a trained model.
export function householdAnomaly(household: Household, scenario: AnomalyScenario, from = 14, now = 17) {
  const start = Math.max(0, Math.min(23, Math.round(from)));
  const hour = Math.max(start, Math.min(23, Math.round(now)));
  const active = household.appliances.filter((a) => a.hours < 24);
  const dailyWh = active.reduce((sum, a) => sum + a.watt * a.hours, 0);
  const baselineWatts = household.appliances.filter((a) => a.hours === 24).reduce((sum, a) => sum + a.watt, 0);
  const peakHour: Record<string, number> = { A: 19, B: 21, C: 18, D: 20, E: 14 };
  const shape = Array.from({ length: 24 }, (_, h) => 0.15 + 0.4 * Math.exp(-((h - 8) ** 2) / 6) + Math.exp(-((h - (peakHour[household.id] ?? 19)) ** 2) / (household.id === "E" ? 32 : 12)));
  const sum = shape.reduce((total, value) => total + value, 0);
  const activity = shape.map((weight, h) => {
    const base = dailyWh * weight / sum;
    const noise = base * (1 + Math.sin(h + household.id.charCodeAt(0)) * 0.06);
    const reduced = scenario === "inactive" && h >= start && h <= hour;
    const cookingLost = scenario === "cooking_loss" && h >= 17 && h <= 22;
    const nightLost = scenario === "night_loss" && (h < 6 || h >= 23);
    const alwaysOn = scenario === "always_on" && (h < 6 || h >= 23);
    return { hour: h, base, band: base * 0.2, today: reduced || cookingLost || nightLost ? base * 0.03 : alwaysOn ? base + dailyWh * 0.08 / 24 : noise };
  });
  const duration = hour - start;
  const risk = scenario === "inactive" ? Math.min(100, 30 + duration * 16) : scenario === "normal" || scenario === "away" ? 0 : scenario === "always_on" ? 72 : 68;
  const tier = scenario === "away" ? "예외" : risk >= 75 ? "경보" : risk >= 45 ? "주의" : risk > 0 ? "관심" : "정상";
  const narrative = scenario === "normal"
    ? `${household.name}의 정상 시나리오입니다. 생성한 활동가전 사용량이 예시 범위 안에 있습니다.`
    : scenario === "away"
      ? `${household.name}의 외출·여행을 가정한 예외 시나리오입니다. ${start}시 이후 사용량 감소를 표시하며, 실제 외출 여부를 자동으로 판단한 결과는 아닙니다.`
      : scenario === "always_on"
        ? `${household.name}에서 TV·조명이 밤에도 켜져 있는 상시 ON 이상을 주입한 시나리오입니다. exp.py PoC의 이상 유형을 재현합니다.`
        : scenario === "cooking_loss"
          ? `${household.name}에서 17~22시 취사·활동 부하가 사라지는 시나리오입니다. exp.py PoC의 이상 유형을 재현합니다.`
          : scenario === "night_loss"
            ? `${household.name}에서 야간 활동이 평탄해지는 시나리오입니다. exp.py PoC의 이상 유형을 재현합니다.`
      : `${household.name}에서 ${start}시부터 활동가전 사용량이 감소한 시나리오입니다. 설정상 ${duration}시간 경과로 ${tier} 단계입니다. 전력 패턴만으로 재실 여부나 응급상황을 확정할 수 없습니다.`;
  return { activity, baselineWatts, risk, tier, narrative, nowHour: hour, lastActiveHour: start, duration };
}
