// 온디바이스 절전 비서 — 대시보드 도메인 수치에 근거한 규칙형 응답기.
// 실제 LLM(Ollama/EXAONE, Gemini 등)으로 교체 시 answer()만 async fetch로 바꾸면 됨.
import {
  bill,
  tierOf,
  daysToNextTier,
  applianceBreakdown,
  solar,
  SOLAR_DEFAULT,
  anomaly,
  won,
} from "@/lib/domain";

const MONTH = 366; // 대시보드 기본 컨텍스트(kWh)

export const SUGGESTIONS = [
  "누진 언제 넘어?",
  "이번 달 요금 얼마?",
  "에어컨 절약 팁",
  "가전별 사용량은?",
  "태양광 손익분기?",
  "고령 이상감지가 뭐야?",
];

function has(q: string, ...keys: string[]) {
  return keys.some((k) => q.includes(k));
}

export function answer(raw: string): string {
  const q = raw.trim();
  if (!q) return "무엇이든 물어보세요 🙂 예: 누진 언제 넘어? / 이번 달 요금 / 절전 팁";

  const dailyAvg = MONTH / 30;
  const b = bill(MONTH);

  if (has(q, "태양", "패널", "손익", "BEP", "발전")) {
    const s = solar(SOLAR_DEFAULT);
    return (
      `☀️ 태양광 손익분기\n` +
      `패널 ${SOLAR_DEFAULT.panels}장(약 ${s.capacityKw.toFixed(2)}kW) 기준으로,\n` +
      `· 설치비 약 ${won(s.install)} (보조금 반영)\n` +
      `· 연간 발전량 ${s.annualGen.toFixed(0)}kWh · 연간 절감 ${won(s.annualSaving)}\n` +
      `→ 손익분기 약 ${s.bepYears.toFixed(1)}년입니다.\n` +
      `상위 누진구간을 상계할수록(절감 단가↑) 회수기간이 짧아져요. ‘전력 분석’ 페이지에서 직접 조절해볼 수 있어요.`
    );
  }
  if (has(q, "이상", "안부", "고령", "독거", "쓰러", "안전")) {
    const a = anomaly(14, 17);
    return (
      `🛟 고령 1인가구 이상감지\n` +
      `TV·전기포트 같은 ‘활동 신호 가전’과 냉장고 같은 ‘상시부하’를 구분해, 개인별 평소 활동 패턴을 학습합니다.\n` +
      `평소 활동하던 시간대에 활동가전이 멈췄는데 냉장고는 계속 돌면 → ‘외출’이 아니라 ‘집 안에서 활동 정지’로 보고 위험도를 올려요.\n` +
      `현재 데모는 위험도 ${a.risk}/100 · ‘${a.tier}’ 상태입니다. 자세한 건 ‘이상감지 데모’ 페이지를 보세요.`
    );
  }
  if (has(q, "누진", "구간") || (has(q, "언제") && has(q, "넘"))) {
    const n = daysToNextTier(MONTH, dailyAvg);
    if (!n) return `이미 최고 구간(3구간)입니다. 상위 단가(307.3원/kWh)가 적용되니 절전이 특히 중요해요.`;
    return (
      `⚡ 누진 구간\n` +
      `현재 ${MONTH}kWh로 ${tierOf(MONTH)}구간입니다.\n` +
      `${n.nextTier}구간(${n.limit}kWh)까지 ${Math.round(n.remain)}kWh 남았고, 최근 추세(일 ${dailyAvg.toFixed(1)}kWh)면 ` +
      `약 ${n.days.toFixed(0)}일 후 진입해요.\n` +
      `3구간 단가는 307.3원/kWh로 크게 뛰니, 이번 주 세탁·건조를 미루면 진입을 늦출 수 있어요.`
    );
  }
  if (has(q, "요금", "얼마", "청구", "비용")) {
    return (
      `💰 이번 달 예상 요금\n` +
      `${MONTH}kWh 기준 약 ${won(b.total)}입니다.\n` +
      `(기본요금 ${won(b.base)} + 전력량요금 ${won(b.energy)} → 전기요금계 ${won(b.supply)}, 부가세·전력기금 포함)`
    );
  }
  if (has(q, "에어컨", "냉방")) {
    const ac = applianceBreakdown(MONTH).find((a) => a.name === "에어컨")!;
    return (
      `❄️ 에어컨 절약\n` +
      `에어컨이 이번 달 약 ${ac.kwh.toFixed(0)}kWh(${won(ac.cost)})로 사용량 1위예요.\n` +
      `· 설정온도 +1℃ + 1시간 타이머 → 월 15~18kWh 절감\n` +
      `· 제습 모드 활용, 실외기 주변 통풍 확보도 도움돼요.`
    );
  }
  if (has(q, "절약", "절전", "팁", "아끼", "줄이")) {
    const top = applianceBreakdown(MONTH).slice(0, 3);
    return (
      `💡 맞춤 절전 팁 (사용량 상위 기준)\n` +
      top.map((a, i) => `${i + 1}. ${a.name} — 약 ${a.kwh.toFixed(0)}kWh(${won(a.cost)})`).join("\n") +
      `\n· 저녁 19~21시 피크 사용을 심야로 옮기면 월 약 12kWh 절감\n· 대기전력 차단만으로도 월 3~5% 절약돼요.`
    );
  }
  if (has(q, "예측", "내일", "언제 피크", "패턴")) {
    return (
      `📈 사용량 예측 (Chronos)\n` +
      `향후 12시간은 저녁 20시경 피크(약 440W)가 예상돼요. 아침 8시경 소규모 피크도 있습니다.\n` +
      `‘전력 분석’ 페이지에서 실측+예측 밴드를 볼 수 있어요.`
    );
  }
  if (has(q, "가전", "많이", "분해", "NILM")) {
    const top = applianceBreakdown(MONTH).slice(0, 4);
    return (
      `🔌 가전별 사용량(합성 NILM)\n` +
      top.map((a) => `· ${a.name}: ${a.kwh.toFixed(0)}kWh (${won(a.cost)})`).join("\n") +
      `\n전체 분해는 ‘전력 분석’ 페이지 파레토 차트를 참고하세요.`
    );
  }
  if (has(q, "안녕", "하이", "hi", "반가")) {
    return `안녕하세요! WattWise 절전 비서입니다 🔋 요금·누진·절전·태양광·이상감지 무엇이든 물어보세요.`;
  }
  return (
    `제가 도와드릴 수 있는 것들이에요 👇\n` +
    `· 누진 구간/진입 시점  · 이번 달 예상 요금\n` +
    `· 가전별 사용량 · 절전 팁 · 에어컨 절약\n` +
    `· 사용량 예측 · 태양광 손익분기 · 고령 이상감지\n` +
    `아래 추천 질문을 눌러보셔도 좋아요.`
  );
}
