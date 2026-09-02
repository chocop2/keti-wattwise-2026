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

export default function WhyPage() {
  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <section className="card overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="badge bg-amber-soft text-amber">왜 지금, 왜 이 방법인가</div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            필요성
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            전기는 이제 쓰기만 하는 게 아니라, 사고팔고 아끼고 위험을 읽는 대상이 되고 있어요.
            우리 서비스가 왜 필요한지를 <b>정책 쪽</b>(전력시장이 어디로 가는지)과 <b>기술 쪽</b>(왜 하필 오토인코더인지)으로 나눠서 정리했습니다.
          </p>
        </div>
      </section>

      {/* 1. 정책적 필요성 */}
      <section>
        <h2 className="section-title">정책 쪽 — 전기를 거래하는 시대가 온다</h2>
        <p className="mt-1 text-sm text-slate-500">집에서 전기를 사고파는 시대인데, 정작 가구가 쓸 도구가 없어요.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <div className="text-2xl">🇪🇺</div>
            <div className="mt-2 font-bold">유럽·영국은 벌써 거래 중</div>
            <p className="mt-1 text-sm text-slate-500">
              요금이 30분마다 바뀌어서 쌀 때 쓰고, 남는 태양광은 비쌀 때 되팔아요.
              전기가 남는 날엔 요금이 마이너스가 돼서 오히려 돈을 받고 쓰기도 하고요.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-2xl">📈</div>
            <div className="mt-2 font-bold">한국도 그 방향으로</div>
            <p className="mt-1 text-sm text-slate-500">
              재생에너지가 늘고 요금제도 바뀌는 중이에요. 스마트미터도 2024년에 전국 2,005만 호에 다 깔렸고요.
              실시간 요금·양방향 거래로 갈 준비가 된 셈이죠.
            </p>
          </div>
          <div className="card p-5">
            <div className="mt-0 text-2xl">🏠</div>
            <div className="mt-2 font-bold">그런데 정작 쓸 도구가 없다</div>
            <p className="mt-1 text-sm text-slate-500">
              데이터는 이미 있는데, 언제 사고 언제 팔지를 집에서 판단할 방법이 없어요.
              폭염 누진에 약한 1인·저소득 가구일수록 이 차이가 크고요.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="card bg-ink p-6 text-white">
            <p className="text-lg font-bold leading-snug">
              그래서 <span className="text-amber">쌀 때 사고 비쌀 때 파는 판단</span>을,
              집집마다 라즈베리파이가 알아서 해주면 좋겠다는 생각이에요.
            </p>
            <p className="mt-3 text-xs text-white/70">
              태양광 판매, 누진 회피, 요금 절감을 한꺼번에. 취약계층 요금 부담이나 냉방 문제와도 이어지고요.
            </p>
          </div>
          <Photo label="유럽 전력 실시간 요금 / 뉴스 캡처 자리" h="h-full" />
        </div>
      </section>

      {/* 2. 방법론적 필요성 */}
      <section>
        <h2 className="section-title">기술 쪽 — 왜 하필 오토인코더인가</h2>
        <p className="mt-1 text-sm text-slate-500">응급·이상 상황은 정답이 붙어있지 않아서, 정상만 배우는 방식이 맞아요.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <div className="badge bg-slate-100 text-slate-600">문제</div>
            <div className="mt-2 font-bold">정답 라벨이 없다</div>
            <p className="mt-1 text-sm text-slate-500">
              고독사나 응급 같은 이상은 드물고, 데이터에 &lsquo;이건 이상&rsquo;이라고 표시된 게 거의 없어요.
              그래서 정답을 맞히는 보통의 학습(지도학습)이 안 됩니다.
            </p>
          </div>
          <div className="card p-6">
            <div className="badge bg-teal-soft text-teal">해법 · 오토인코더</div>
            <div className="mt-2 font-bold">평소만 배우고, 벗어나면 잡는다</div>
            <p className="mt-1 text-sm text-slate-500">
              평소 전력 패턴을 압축했다 다시 되살리도록 학습시켜요. 평소랑 비슷하면 잘 되살리는데,
              이상이 오면 되살리기가 크게 어긋나거든요. 그 어긋난 정도를 이상 신호로 씁니다. 라벨이 없어도 되고요.
            </p>
          </div>
        </div>

        <div className="mt-4 card p-6">
          <div className="font-bold">출장·여행 같은 예외는 나중에 확인받는다</div>
          <p className="mt-1 text-sm text-slate-500">
            출장이나 여행처럼 정상인데 이상하게 보이는 경우가 있어요. 이런 건 바로 경보하지 않고,
            나중에 &ldquo;3일째 사용량이 확 줄었는데 외출 중이세요?&rdquo; 하고 물어봐서 걸러냅니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip bg-teal-soft text-teal">평소 배우기</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-amber-soft text-amber">되살리기 어긋남 = 이상</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-slate-100 text-slate-600">응급 판단</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-slate-100 text-slate-600">예외는 나중에 확인</span>
          </div>
        </div>
      </section>

      {/* 마무리 */}
      <section className="card bg-gradient-to-br from-amber-soft to-teal-soft p-8 text-center">
        <p className="mx-auto max-w-3xl text-lg font-bold leading-snug text-ink">
          전기를 사고파는 시대에, 집에서 알아서 <span className="text-amber">거래하고</span>
          <span className="text-teal"> 위험도 챙겨주는</span> 도구. 라벨 없는 문제는 오토인코더로 풉니다.
        </p>
      </section>
    </div>
  );
}
