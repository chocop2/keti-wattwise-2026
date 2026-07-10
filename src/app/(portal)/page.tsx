import Link from "next/link";
import { getDB } from "@/lib/store";

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="card p-5">
      <div className="stat">{n}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  );
}

function Layer({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <div className="card p-4">
      <div className={`text-sm font-bold ${tone}`}>{title}</div>
      <ul className="mt-2 space-y-1 text-xs text-slate-500">
        {items.map((i) => (
          <li key={i}>· {i}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const db = getDB();
  const openIssues = db.issues.filter((i) => i.lane !== "done").length;
  const doneIssues = db.issues.filter((i) => i.lane === "done").length;
  return (
    <div className="space-y-8">
      <section className="card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div>
            <div className="badge bg-amber-soft text-amber">
              ① 사회문제 해결을 위한 AI · 융합·응용기술 아이디어
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              WattWise Pi — 엣지 AI 기반
              <br />
              가정용 전력 예측 · <span className="text-teal">이상감지</span> 비서
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              소형 SBC 한 대에서 시계열 예측 모델과 경량 LLM을 동시에 구동해, 외부
              서버 없이 가정 내부에서 <b>요금 예측 · 누진제 경고 · 절전 상담</b>과
              <b> 고령 1인가구 안부(이상감지)</b>까지 완결되는 온디바이스 AI 비서.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/analytics" className="btn-amber">🔋 전력 분석 대시보드</Link>
              <Link href="/households" className="btn-primary">🏠 스마트홈 진단 (전력·이상감지)</Link>
              <Link href="/ideas" className="btn-ghost">💡 아이디어 논의</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            <Stat n={db.ideas.length} label="탐색 중 아이디어" />
            <Stat n={openIssues} label="진행 중 이슈" />
            <Stat n={doneIssues} label="완료 이슈" />
            <Stat n={"v0.2"} label="프로젝트 단계" />
          </div>
        </div>
      </section>

      <section>
        <h2 className="section-title">시스템 아키텍처</h2>
        <p className="mt-1 text-sm text-slate-500">
          데이터 → 예측 → 지능 → 인터페이스로 흐르는 4계층 온디바이스 파이프라인
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Layer
            title="데이터 계층"
            tone="text-slate-700"
            items={["스마트플러그 API (Tapo·SmartThings)", "SCT-013 CT 센서", "SQLite 1분 단위 시계열"]}
          />
          <Layer
            title="예측 계층"
            tone="text-amber"
            items={["Chronos-Bolt-Tiny", "6~24시간 사용량 예측", "누진 진입 시점 추정"]}
          />
          <Layer
            title="지능 계층"
            tone="text-teal"
            items={["Ollama + 경량 LLM (EXAONE·Qwen)", "누진 분석 · What-if · 절전 조언", "이상감지 자연어 경보"]}
          />
          <Layer
            title="인터페이스 계층"
            tone="text-slate-700"
            items={["Web Dashboard", "Telegram Bot", "가족·복지사 알림"]}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-400">멘토</div>
          <div className="mt-1 font-bold">조인표 책임 · 에너지AI연구센터</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-400">마감 목표</div>
          <div className="mt-1 font-bold">2026년 10월 말 · 데모 + 성능 보고서</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-400">플랫폼 · 예산</div>
          <div className="mt-1 font-bold">Raspberry Pi 5 (8GB) · 50만원 이내</div>
        </div>
      </section>
    </div>
  );
}
