import Link from "next/link";

function Photo({ label, h = "h-44" }: { label: string; h?: string }) {
  return (
    <div className={`flex ${h} w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-400`}>
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
    title: "전기를 되파는 유럽·영국",
    body: "도매가에 연동해 30분마다 요금이 바뀌고, 태양광 잉여 전력을 피크 시간에 되팔아 수익을 낸다. 전력이 남는 날은 요금이 마이너스가 되기도 한다.",
    tag: "실시간 요금 · 양방향 거래",
  },
  {
    icon: "☀️",
    title: "태양광이 곧 자산",
    body: "가정 태양광이 늘며, 남는 전기를 언제 팔지가 곧 돈이 된다. 설치 손익분기·판매 타이밍을 계산해주는 도구의 가치가 커진다.",
    tag: "발전 · 자가소비 · 판매",
  },
  {
    icon: "📡",
    title: "AMI가 깔린 한국",
    body: "스마트미터가 전국 2,005만 호에 보급 완료(2024). 데이터는 이미 흐르지만, 가구가 이를 활용해 사고팔 도구는 아직 없다.",
    tag: "인프라는 완성, 도구는 공백",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      {/* 히어로 */}
      <section className="card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-[1.4fr_1fr] md:p-10">
          <div className="self-center">
            <div className="badge bg-amber-soft text-amber">
              ① 사회문제 해결을 위한 AI · 융합·응용기술 아이디어
            </div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-[2.6rem]">
              전기를 <span className="text-amber">사고팔고</span>, 아끼고,{" "}
              <span className="text-teal">지키는</span>
              <br />
              가정용 온디바이스 전력 비서
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              라즈베리파이 한 대로, 외부 서버 없이 집 안에서{" "}
              <b>비쌀 때 팔고 쌀 때 사는 전력 거래</b>와 <b>태양광 수익 최적화</b>,
              그리고 <b>오토인코더 기반 응급상황 감지</b>까지 완결되는 비서.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/why" className="btn-amber">왜 필요한가</Link>
              <Link href="/solar" className="btn-primary">☀️ 태양광·거래</Link>
              <Link href="/anomaly" className="btn-ghost">이상탐지 방법</Link>
            </div>
          </div>
          <Photo label="대표 이미지(전력 거래·태양광) 자리" h="h-full" />
        </div>
      </section>

      {/* 전력은 이제 사고파는 것 */}
      <section>
        <h2 className="section-title">전력은 이제 &lsquo;쓰는 것&rsquo;이 아니라 &lsquo;사고파는 것&rsquo;</h2>
        <p className="mt-1 text-sm text-slate-500">
          해외는 이미 가정이 전기를 거래한다. 한국도 재생에너지·요금 개편으로 같은 방향으로 간다.
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
          <Photo label="유럽 실시간 요금 / 전력거래 뉴스 캡처 자리" />
          <Photo label="가정 태양광 · 잉여 판매 사례 사진 자리" />
        </div>
      </section>

      {/* 3대 가치 */}
      <section>
        <h2 className="section-title">그래서 우리가 하는 것 — 세 가지</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="card border-t-4 border-amber p-6">
            <div className="text-2xl">🔁</div>
            <div className="mt-2 font-bold text-amber">거래 — 비쌀 때 팔고, 쌀 때 산다</div>
            <p className="mt-1 text-sm text-slate-500">
              실시간 요금·태양광 발전을 예측해 <b>충전/판매 타이밍</b>을 자동으로 잡는다.
            </p>
          </div>
          <div className="card border-t-4 border-teal p-6">
            <div className="text-2xl">💡</div>
            <div className="mt-2 font-bold text-teal">절감 — 누진을 넘기 전에 막는다</div>
            <p className="mt-1 text-sm text-slate-500">
              월말 사용량을 확률로 예측해 <b>누진 구간 초과를 사전 경고</b>·조정한다.
            </p>
          </div>
          <div className="card border-t-4 border-danger p-6">
            <div className="text-2xl">🛡️</div>
            <div className="mt-2 font-bold text-danger">안전 — 이상은 오토인코더로</div>
            <p className="mt-1 text-sm text-slate-500">
              평소 패턴을 학습해 <b>응급상황을 분류</b>, 예외(출장·여행)는 사후 알림으로.
            </p>
          </div>
        </div>
      </section>

      {/* 미래 트렌드 배너 */}
      <section className="card bg-ink p-8 text-white">
        <div className="text-sm font-semibold text-amber">앞으로</div>
        <p className="mt-2 max-w-3xl text-lg font-bold leading-snug">
          전력을 사고파는 시장은 더 활발해진다. 그 시대에{" "}
          <span className="text-amber">가구가 스스로 거래하고 스스로 지키는</span> 도구가 표준이 된다.
        </p>
        <div className="mt-4">
          <Link href="/why" className="inline-block rounded-lg bg-amber px-4 py-2 text-sm font-bold text-ink">
            필요성 자세히 보기 →
          </Link>
        </div>
      </section>
    </div>
  );
}
