import Link from "next/link";

function Photo({ label, h = "h-44" }: { label: string; h?: string }) {
  return (
    <div className={`flex ${h} w-full items-center justify-center rounded-xl border border-dashed border-white/25 bg-white/5 text-center text-sm text-sage/60`}>
      <div>
        <div className="text-2xl">📷</div>
        <div className="mt-1">{label}</div>
      </div>
    </div>
  );
}

const CASES = [
  {
    icon: "💶",
    title: "유럽·영국은 이미 되판다",
    body: "요금이 30분 단위로 바뀌어 쌀 때 쓰고, 남는 태양광 전기는 비쌀 때 되팝니다. 공급이 넘치는 날에는 요금이 마이너스가 되어, 오히려 보상을 받고 전기를 쓰기도 합니다.",
    tag: "실시간 요금 · 양방향 거래",
  },
  {
    icon: "☀️",
    title: "태양광은 수익 자산이 된다",
    body: "가정용 태양광이 확대되면서, 남는 전기를 언제 파느냐가 곧 수익으로 이어집니다. 투자 회수 시점과 최적 판매 시점을 계산해 주는 도구가 필요합니다.",
    tag: "발전 · 자가소비 · 판매",
  },
  {
    icon: "📡",
    title: "한국도 기반은 갖춰졌다",
    body: "한국전력의 지능형 원격검침 인프라(AMI)가 2024년 전국 약 2,005만 호에 구축을 마치며 실시간 전력 데이터 기반이 마련됐습니다. 다만 이 데이터를 가정이 직접 거래·절감에 활용하도록 돕는 서비스는 아직 부족합니다.",
    tag: "AMI 전국 구축 완료",
  },
];

const ROLES = [
  {
    eng: "Trade",
    color: "text-amber",
    border: "border-amber",
    title: "쌀 때 사서, 비쌀 때 팝니다",
    body: "실시간 요금과 태양광 발전량을 미리 예측해, 충전과 판매 시점을 자동으로 정합니다.",
  },
  {
    eng: "Save",
    color: "text-teal",
    border: "border-teal",
    title: "누진 구간을 넘기 전에 알립니다",
    body: "이번 달 사용량을 미리 예측하고, 누진 구간 초과가 예상되면 미리 알려 드립니다.",
  },
  {
    eng: "Protect",
    color: "text-danger",
    border: "border-danger",
    title: "이상 신호를 놓치지 않습니다",
    body: "평소 패턴을 학습해 이상을 감지하면 알립니다. 출장·여행처럼 정상인 경우는 사후에 확인합니다.",
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* 히어로 — 자연 패널 */}
      <section className="hero-nature rounded-3xl border border-white/10 shadow-pop">
        <div className="relative z-10 grid gap-6 p-8 md:grid-cols-[1.45fr_1fr] md:p-12">
          <div className="self-center text-white">
            <div className="badge bg-white/10 text-mint">
              ① 사회문제 해결을 위한 AI · 융합·응용기술 아이디어
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-[2.7rem]">
              전기를 <span className="text-amber">사고팔고</span>, 아끼고,{" "}
              <span className="text-mint">지켜주는</span>
              <br />
              집 안의 전력 비서
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-sage/85">
              라즈베리파이 한 대만 두면, 전기가 쌀 때 쓰고 남는 태양광은 비쌀 때 파는 것까지 알아서 관리합니다.
              혼자 사는 집이라면 이상 신호도 함께 살핍니다. 모든 데이터는 집 밖으로 나가지 않습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/why" className="btn-amber">왜 필요한가</Link>
              <Link href="/solar" className="btn-primary">☀️ 태양광·거래</Link>
              <Link href="/anomaly" className="btn-ghost">이상탐지 방법</Link>
            </div>
          </div>
          <div className="self-center rounded-2xl border border-white/15 bg-black/15 p-1.5 backdrop-blur-sm">
            <Photo label="자연·태양광 대표 사진 자리" h="h-56 md:h-full" />
          </div>
        </div>
      </section>

      {/* 전력은 이제 사고파는 것 */}
      <section>
        <div className="eyebrow">The Shift</div>
        <h2 className="section-title">전기는 이제 쓰기만 하는 대상이 아닙니다</h2>
        <p className="section-sub">
          해외에서는 이미 가정 단위로 전기를 사고팝니다. 한국도 재생에너지 확대와 요금제 개편으로 같은 방향을 향하고 있습니다.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CASES.map((c) => (
            <div key={c.title} className="card p-6">
              <div className="text-3xl">{c.icon}</div>
              <div className="mt-3 font-bold">{c.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{c.body}</p>
              <div className="mt-3">
                <span className="chip bg-slate-100 text-slate-600">{c.tag}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Photo label="유럽 실시간 요금 / 전력거래 사진 자리" />
          <Photo label="가정 태양광 · 잉여 판매 사례 사진 자리" />
        </div>
      </section>

      {/* What We Do */}
      <section>
        <div className="eyebrow">What We Do</div>
        <h2 className="section-title">한 대의 라즈베리파이가 맡는 세 가지 역할</h2>
        <p className="section-sub">거래로 벌고, 예측으로 아끼고, 이상탐지로 지킵니다.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.eng} className={`card border-t-4 p-6 ${r.border}`}>
              <div className={`text-xs font-bold uppercase tracking-[0.18em] ${r.color}`}>{r.eng}</div>
              <div className="mt-2 text-[1.05rem] font-bold text-ink">{r.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 미래 트렌드 배너 */}
      <section className="hero-nature rounded-2xl border border-white/10 p-8 shadow-pop">
        <div className="relative z-10">
          <div className="eyebrow">Looking Ahead</div>
          <p className="max-w-3xl text-lg font-bold leading-snug text-white">
            전기를 사고파는 일은 점점 일상이 됩니다. 그때 가정에서 알아서 거래하고 관리해 주는 도구가 있다면, 누구나 손쉽게 참여할 수 있습니다.
          </p>
          <div className="mt-4">
            <Link href="/why" className="inline-block rounded-lg bg-amber px-4 py-2 text-sm font-bold text-white">
              왜 필요한지 보기 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
