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
    title: "유럽·영국은 벌써 되판다",
    body: "요금이 30분마다 바뀌고, 남는 태양광 전기는 비쌀 때 되팔아요. 전기가 남아도는 날엔 요금이 마이너스가 돼서 오히려 돈을 받고 쓰기도 하고요.",
    tag: "실시간 요금 · 양방향 거래",
  },
  {
    icon: "☀️",
    title: "태양광이 있으면 돈이 된다",
    body: "집에 태양광이 늘면서, 남는 전기를 언제 파느냐가 곧 수익이 돼요. 설치하면 몇 년에 본전 뽑는지, 언제 파는 게 이득인지 계산해줄 도구가 필요하죠.",
    tag: "발전 · 자가소비 · 판매",
  },
  {
    icon: "📡",
    title: "한국은 계량기가 다 깔렸다",
    body: "스마트미터가 전국 2,005만 호에 다 보급됐어요(2024). 데이터는 이미 흐르는데, 정작 집에서 이걸로 사고팔 수 있게 도와주는 건 아직 없어요.",
    tag: "인프라는 됐고, 도구가 없음",
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
              <span className="text-teal">지켜주는</span>
              <br />
              집 안의 전력 비서
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              라즈베리파이 한 대를 집에 두면, 전기가 쌀 때 쓰고 남는 태양광은 비쌀 때 파는 걸 알아서 챙겨줘요.
              혼자 사는 집이라면 이상 신호까지 같이 봐주고요. 데이터는 집 밖으로 나가지 않습니다.
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
        <h2 className="section-title">요즘 전기는 그냥 쓰기만 하는 게 아니다</h2>
        <p className="mt-1 text-sm text-slate-500">
          해외에선 집집마다 전기를 사고팔아요. 한국도 재생에너지가 늘고 요금제가 바뀌면서 그쪽으로 가는 중이고요.
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
        <h2 className="section-title">우리가 하는 건 크게 세 가지예요</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="card border-t-4 border-amber p-6">
            <div className="text-2xl">🔁</div>
            <div className="mt-2 font-bold text-amber">거래 · 쌀 때 사고 비쌀 때 판다</div>
            <p className="mt-1 text-sm text-slate-500">
              요금과 태양광 발전을 미리 예측해서, 언제 충전하고 언제 팔지를 알아서 잡아줘요.
            </p>
          </div>
          <div className="card border-t-4 border-teal p-6">
            <div className="text-2xl">💡</div>
            <div className="mt-2 font-bold text-teal">절감 · 누진 넘기기 전에 알려준다</div>
            <p className="mt-1 text-sm text-slate-500">
              이번 달 얼마나 쓸지 미리 보고, 누진 구간을 넘길 것 같으면 그 전에 알려줘요.
            </p>
          </div>
          <div className="card border-t-4 border-danger p-6">
            <div className="text-2xl">🛡️</div>
            <div className="mt-2 font-bold text-danger">안전 · 이상 신호를 잡아준다</div>
            <p className="mt-1 text-sm text-slate-500">
              평소 패턴을 배워두고 이상하면 알림을 줘요. 출장·여행처럼 정상인 경우는 나중에 확인받고요.
            </p>
          </div>
        </div>
      </section>

      {/* 미래 트렌드 배너 */}
      <section className="card bg-ink p-8 text-white">
        <div className="text-sm font-semibold text-amber">앞으로</div>
        <p className="mt-2 max-w-3xl text-lg font-bold leading-snug">
          전기를 사고파는 일은 점점 흔해질 거예요. 그때 집에서 알아서 사고팔고 챙겨주는 도구가 있으면 편하겠죠.
        </p>
        <div className="mt-4">
          <Link href="/why" className="inline-block rounded-lg bg-amber px-4 py-2 text-sm font-bold text-ink">
            왜 필요한지 보기 →
          </Link>
        </div>
      </section>
    </div>
  );
}
