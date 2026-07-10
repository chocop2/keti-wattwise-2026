import fs from "fs";
import path from "path";

export type Status = "열림" | "검토중" | "채택" | "보류";
export type Comment = { id: number; author: string; body: string; at: string };
export type Idea = {
  id: number;
  title: string;
  body: string;
  author: string;
  at: string;
  votes: number;
  status: Status;
  tags: string[];
  comments: Comment[];
};
export type Decision = {
  id: number;
  date: string;
  title: string;
  background: string;
  decision: string;
  attendees: string;
  recorder: string;
};
export type Lane = "todo" | "doing" | "done";
export type Issue = {
  id: number;
  title: string;
  lane: Lane;
  assignee?: string;
  tag?: string;
};
export type Post = {
  id: number;
  title: string;
  body: string;
  author: string;
  at: string;
  pinned?: boolean;
  comments: number;
};
export type FileItem = {
  id: number;
  name: string;
  desc: string;
  by: string;
  at: string;
  size: string;
};

export type DB = {
  ideas: Idea[];
  decisions: Decision[];
  issues: Issue[];
  posts: Post[];
  files: FileItem[];
  seq: number;
};

const DB_PATH = path.join(process.cwd(), ".data", "db.json");

function seed(): DB {
  return {
    seq: 100,
    ideas: [
      {
        id: 9,
        title: "고령 1인가구 전력 이상감지 (안전망)",
        body: "같은 전력 데이터로 ‘안부’까지: 활동 신호 가전(TV·전기포트·조명)과 상시부하(냉장고)를 구분하고, 개인별 평소 활동 패턴을 학습해 ‘집에 있는데 활동 정지’를 조기 경보. 요금 예측(주연) + 이상감지(강력 조연) = 한 대의 라즈베리파이, 두 개의 얼굴.",
        author: "korea_03",
        at: "2026-07-10",
        votes: 3,
        status: "검토중",
        tags: ["사회문제", "이상감지", "킥"],
        comments: [
          { id: 1, author: "조인표 · 멘토", body: "이거다. 카테고리 ① 명분이 산다. 오탐 관리 방안 같이 보자.", at: "2026-07-10" },
        ],
      },
      {
        id: 1,
        title: "누진제 진입 사전 경고 UX",
        body: "‘다음 구간까지 32kWh / 약 5일 후 진입’ 같은 카운트다운형 경고가 직관적. Telegram 푸시로 임계 도달 시 알림.",
        author: "korea_03",
        at: "2026-06-29",
        votes: 2,
        status: "채택",
        tags: ["UX", "누진제", "알림"],
        comments: [],
      },
      {
        id: 2,
        title: "경량 LLM 후보: EXAONE 2.4B를 기본으로",
        body: "한국어 누진제/요금 도메인 설명에는 EXAONE 2.4B가 유리할 듯. 라즈베리파이 5(8GB)에서 토큰 속도 벤치 먼저 돌려보자.",
        author: "korea_02",
        at: "2026-06-29",
        votes: 2,
        status: "열림",
        tags: ["LLM", "Ollama", "벤치마크"],
        comments: [],
      },
      {
        id: 3,
        title: "인터페이스 우선순위: 웹 대시보드 먼저",
        body: "데모/심사에는 웹 대시보드가 임팩트가 크다. Telegram 봇은 알림 위주로 후순위.",
        author: "korea_03",
        at: "2026-06-29",
        votes: 1,
        status: "열림",
        tags: ["UX", "우선순위"],
        comments: [],
      },
      {
        id: 4,
        title: "What-if 시뮬레이션 범위 정의",
        body: "에어컨/난방/세탁기 등 주요 가전의 사용시간을 조절했을 때 월 예상 사용량·요금·누진구간 변화를 보여주는 수준으로 1차 한정.",
        author: "korea_02",
        at: "2026-06-29",
        votes: 1,
        status: "검토중",
        tags: ["기능", "시뮬레이션"],
        comments: [],
      },
      {
        id: 5,
        title: "데이터 수집: CT 센서 vs 스마트플러그 API 우선순위",
        body: "SCT-013 CT 센서는 전체 가구 전력을 잡지만 설치/안전 이슈가 있고, 스마트플러그 API는 콘센트 단위라 설치가 쉬움. MVP는 어느 쪽을 메인으로 갈지 정하자.",
        author: "korea_01",
        at: "2026-06-29",
        votes: 1,
        status: "검토중",
        tags: ["데이터", "센서", "MVP"],
        comments: [],
      },
    ],
    decisions: [
      {
        id: 2,
        date: "2026.06.24",
        title: "예측 모델은 Chronos-Bolt-Tiny로 시작",
        background: "T5-Tiny 대비 경량/속도 우위. 6~24시간 예측 정확도는 실데이터로 추후 비교.",
        decision: "Chronos-Bolt-Tiny를 기본 예측 모델로 채택하고 베이스라인 구축.",
        attendees: "korea_01, korea_02",
        recorder: "팀원 korea_01",
      },
      {
        id: 1,
        date: "2026.06.20",
        title: "킥오프 — 플랫폼은 Raspberry Pi 5 (8GB) 채택",
        background: "Jetson Orin Nano와 비교. 예산(50만원 이내)과 커뮤니티 자료, 전력 소모를 고려.",
        decision: "1차 데모는 Raspberry Pi 5 (8GB)로 진행. 성능 부족 시 Jetson 재검토.",
        attendees: "조인표, korea_01, korea_02, korea_03",
        recorder: "조인표 · 멘토",
      },
    ],
    issues: [
      { id: 1, title: "AI Hub 가정용 전력 데이터셋 다운로드·전처리", lane: "todo", assignee: "korea_01", tag: "데이터" },
      { id: 2, title: "누진제 요금표 코드 반영 (주택용 저압)", lane: "todo", assignee: "korea_02", tag: "도메인" },
      { id: 3, title: "태양광 1패널 손익분기 계산기", lane: "todo", assignee: "korea_03", tag: "기능" },
      { id: 4, title: "이상감지 baseline 프로토타입 (활동가전 vs 냉장고)", lane: "doing", assignee: "korea_03", tag: "이상감지" },
      { id: 5, title: "프로젝트 협업 포털 셋업", lane: "done", assignee: "korea_03", tag: "인프라" },
    ],
    posts: [
      {
        id: 1,
        title: "📢 WattWise Pi 프로젝트 킥오프 안내",
        body: "온디바이스 · No Cloud · Privacy-first. 10월 말 데모+성능 보고서를 목표로 진행합니다.",
        author: "조인표 · 멘토",
        at: "2026-06-29",
        pinned: true,
        comments: 1,
      },
      {
        id: 2,
        title: "자료) 주택용 전력 누진제 요금표 정리",
        body: "주택용 저압 3구간 기본요금/전력량요금 정리. 분석 페이지 계산 로직에 반영함.",
        author: "팀원 korea_01",
        at: "2026-06-29",
        comments: 0,
      },
    ],
    files: [],
  };
}

let cache: DB | null = null;

export function getDB(): DB {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    cache = JSON.parse(raw) as DB;
  } catch {
    cache = seed();
    saveDB(cache);
  }
  return cache;
}

export function saveDB(db: DB) {
  cache = db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function nextId(): number {
  const db = getDB();
  db.seq += 1;
  saveDB(db);
  return db.seq;
}
