import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { pythonExecutable } from "@/lib/pythonRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.WATTWISE_CHAT_MODEL ?? "qwen2.5:1.5b";

const SYSTEM_PROMPT = `당신은 WattWise Pi 프로젝트를 설명하는 도우미입니다. 라즈베리파이 한 대로 가정 전력을 거래(Trade)·절감(Save)·이상탐지(Protect)하는 온디바이스 전력 비서를 만드는 프로젝트입니다.

핵심 사실:
- Trade(전력 거래): 실시간 요금과 태양광 발전량을 예측해 쌀 때 충전, 비쌀 때 판매 시점을 자동 판단합니다.
- Save(전기요금 절감): 이번 달 사용량을 예측해 누진 3구간(450kWh 초과 시 단가 급등, 307.3원/kWh) 진입 전 미리 경고합니다.
- Protect(이상 사용 감지): 오토인코더(비지도학습)로 평소 전력 패턴을 학습하고, 복원 오차가 급증하면 이상으로 판단합니다. 실험 결과 F1 0.90·재현율 0.93·오탐률 0.10·리드타임 1일.
- 데이터: 공개 데이터(AI Hub NILM 110가구) + 팀원이 직접 자취방에 라즈베리파이·CT센서를 설치해 수집한 실측 데이터. 정빈·진규는 1인가구(TV·에어컨·세탁기 3종 측정), 채연은 4인가구(TV·에어컨·제습기·세탁기 4종 측정 — 제습기는 채연 가정에만 있음).
- 예측 모델: Chronos-2 시계열 모델을 가전·사람별로 파인튜닝해 로컬에서 24시간 예측을 수행합니다. '자취방 실증'과 '전력 분석' 페이지에서 실제 확인 가능합니다.
- 태양광: 위치·경사·방위 기반 발전량 추정과 손익분기(BEP) 계산을 제공합니다.
- 프라이버시: 모든 예측·이상탐지가 온디바이스(집 안 라즈베리파이)에서 실행되어 데이터가 집 밖으로 나가지 않습니다.
- 팀: 고려대 팀, 멘토는 조인표 연구원(에너지AI연구센터), KETI 경진대회 출품작이며 마감은 2026년 10월 말입니다.

답변 규칙: 한국어로 3~5문장 이내로 간결하게 답하세요. 모르는 내용은 지어내지 말고 모른다고 하세요.`;

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

const APPLIANCES = ["tv", "에어컨", "제습기", "세탁기"] as const;
type Appliance = (typeof APPLIANCES)[number];
const APPLIANCE_ALIASES: Record<string, Appliance> = {
  tv: "tv",
  티비: "tv",
  텔레비전: "tv",
  에어컨: "에어컨",
  에어콘: "에어컨",
  냉방: "에어컨",
  제습기: "제습기",
  제습: "제습기",
  세탁기: "세탁기",
  세탁: "세탁기",
  빨래: "세탁기",
};

const HOUSEHOLD: Record<string, string> = { 정빈: "1인가구", 진규: "1인가구", 채연: "4인가구" };
const PEOPLE = Object.keys(HOUSEHOLD);

function detectAppliance(text: string): Appliance | null {
  for (const [alias, id] of Object.entries(APPLIANCE_ALIASES)) {
    if (text.includes(alias)) return id;
  }
  return null;
}

function detectPerson(text: string): { person: string; guessed: boolean } | null {
  for (const name of PEOPLE) {
    if (text.includes(name)) return { person: name, guessed: false };
  }
  if (text.includes("4인") || text.includes("네 식구") || text.includes("네식구")) {
    return { person: PEOPLE.find((p) => HOUSEHOLD[p] === "4인가구")!, guessed: false };
  }
  if (text.includes("1인") || text.includes("혼자")) {
    const solo = PEOPLE.filter((p) => HOUSEHOLD[p] === "1인가구");
    return { person: solo[Math.floor(Math.random() * solo.length)], guessed: true };
  }
  return null;
}

type UsageSummary = {
  error?: string;
  periodStart?: string;
  periodEnd?: string;
  last24hTotalKwh?: number;
  last7dDailyAvgKwh?: number;
  peakKwh?: number;
  peakTime?: string;
};

async function fetchUsageSummary(appliance: Appliance, seriesId: string): Promise<UsageSummary> {
  const root = process.cwd();
  const python = await pythonExecutable(root);
  const script = path.join(root, "dashboard", "usage_summary.py");
  const { stdout } = await execFileAsync(
    python,
    [script, "--appliance", appliance, "--series-id", seriesId],
    { cwd: path.join(root, "dashboard"), timeout: 15_000 },
  );
  return JSON.parse(stdout.trim()) as UsageSummary;
}

const WANTS_USAGE = /사용량|전력|얼마|kwh/i;

async function fetchAllApplianceSummaries(person: string) {
  const results = await Promise.all(
    APPLIANCES.map(async (appliance) => {
      try {
        const summary = await fetchUsageSummary(appliance, `${person}_${appliance}`);
        return summary.error ? null : { appliance, summary };
      } catch (e) {
        console.error(`usage summary lookup failed for ${appliance}`, e);
        return null;
      }
    }),
  );
  return results.filter((r): r is { appliance: Appliance; summary: UsageSummary } => r !== null);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ChatMsg[] };
    const history = (body.messages ?? []).filter((m) => m.role === "user" || m.role === "assistant");
    if (history.length === 0) {
      return NextResponse.json({ error: "메시지가 비어 있습니다." }, { status: 400 });
    }

    const messages: ChatMsg[] = [{ role: "system", content: SYSTEM_PROMPT }];

    const lastUser = [...history].reverse().find((m) => m.role === "user");
    const appliance = lastUser ? detectAppliance(lastUser.content) : null;
    const detected = lastUser ? detectPerson(lastUser.content) : null;

    if (appliance && detected) {
      const { person, guessed } = detected;
      try {
        const summary = await fetchUsageSummary(appliance, `${person}_${appliance}`);
        if (!summary.error) {
          const whoNote = guessed
            ? `사용자가 특정 이름 없이 '1인가구'라고만 물어서, 1인가구 두 명(정빈, 진규) 중 무작위로 ${person}의 데이터를 사용합니다. 답변 맨 앞에 반드시 "1인가구(${person})" 형태로 누구의 데이터인지 밝히세요.`
            : `이 데이터는 ${person}(${HOUSEHOLD[person]})의 것입니다.`;
          messages.push({
            role: "system",
            content: `[실측 데이터] ${appliance} 실측 전력 사용량입니다. ${whoNote} 반드시 이 수치를 근거로 답변하세요.
- 측정 기간: ${summary.periodStart} ~ ${summary.periodEnd}
- 최근 24시간 총 사용량: ${summary.last24hTotalKwh}kWh
- 최근 7일 일평균 사용량: ${summary.last7dDailyAvgKwh}kWh
- 최근 7일 중 최대 사용량: ${summary.peakKwh}kWh (${summary.peakTime})`,
          });
        }
      } catch (e) {
        console.error("usage summary lookup failed", e);
      }
    } else if (!appliance && detected && lastUser && WANTS_USAGE.test(lastUser.content)) {
      // 특정 가전을 짚지 않고 "총 사용량"처럼 물으면 4개 가전을 전부 합산한다.
      const { person, guessed } = detected;
      const perAppliance = await fetchAllApplianceSummaries(person);
      if (perAppliance.length > 0) {
        const total24h = perAppliance.reduce((sum, r) => sum + (r.summary.last24hTotalKwh ?? 0), 0);
        const applianceNames = perAppliance.map((r) => r.appliance).join("·");
        const breakdown = perAppliance
          .map((r) => `  · ${r.appliance}: ${r.summary.last24hTotalKwh}kWh`)
          .join("\n");
        const whoNote = guessed
          ? `사용자가 특정 이름 없이 '1인가구'라고만 물어서, 1인가구 두 명(정빈, 진규) 중 무작위로 ${person}의 데이터를 사용합니다. 답변 맨 앞에 반드시 "1인가구(${person})" 형태로 누구의 데이터인지 밝히세요.`
          : `이 데이터는 ${person}(${HOUSEHOLD[person]})의 것입니다.`;
        messages.push({
          role: "system",
          content: `[실측 데이터] ${person} 가정에는 실측 데이터가 있는 가전이 ${perAppliance.length}개(${applianceNames})뿐입니다. 이 ${perAppliance.length}개의 최근 24시간 실측 전력 사용량 합계입니다. ${whoNote} 반드시 실제 존재하는 가전 개수(${perAppliance.length}개)와 이 수치를 근거로 답변하세요. 없는 가전을 있다고 말하지 마세요.
- 최근 24시간 총 사용량(${perAppliance.length}개 합계): ${total24h.toFixed(4)}kWh
- 가전별 내역:
${breakdown}`,
        });
      }
    }

    messages.push(...history);

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages, stream: false }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Ollama ${res.status}: ${detail}`);
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const reply = data.message?.content?.trim();
    if (!reply) throw new Error("Ollama가 빈 응답을 반환했습니다.");

    return NextResponse.json({ reply });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const connectionRefused = /ECONNREFUSED|fetch failed/i.test(detail);
    return NextResponse.json(
      {
        error: connectionRefused
          ? `로컬 Ollama 서버에 연결할 수 없습니다. 'ollama serve'가 실행 중인지, '${MODEL}' 모델이 받아져 있는지 확인해 주세요.`
          : "로컬 모델 응답 중 오류가 발생했습니다.",
        detail,
      },
      { status: 500 },
    );
  }
}
