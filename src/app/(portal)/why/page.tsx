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
            전기는 이제 쓰기만 하는 대상이 아니라, 사고팔고 아끼고 위험을 읽어 내는 대상이 되고 있습니다.
            이 서비스가 왜 필요한지를 <b>정책 측면</b>(전력시장이 향하는 방향)과 <b>기술 측면</b>(왜 오토인코더인가)으로 나누어 정리했습니다.
          </p>
        </div>
      </section>

      {/* 1. 정책적 필요성 */}
      <section>
        <h2 className="section-title">정책 측면 — 전기를 거래하는 시대</h2>
        <p className="mt-1 text-sm text-slate-500">집에서 전기를 사고파는 시대이지만, 정작 가정이 쓸 도구는 없습니다.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <div className="text-2xl">🇪🇺</div>
            <div className="mt-2 font-bold">유럽·영국은 이미 거래 중</div>
            <p className="mt-1 text-sm text-slate-500">
              요금이 30분마다 바뀌어 쌀 때 쓰고, 남는 태양광은 비쌀 때 되팝니다.
              전기가 남는 날에는 요금이 마이너스가 되어, 오히려 돈을 받고 쓰기도 합니다.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-2xl">📈</div>
            <div className="mt-2 font-bold">한국도 같은 방향으로</div>
            <p className="mt-1 text-sm text-slate-500">
              재생에너지가 늘고 요금제도 바뀌고 있습니다. 스마트미터도 2024년 전국 2,005만 호에 보급을 마쳤습니다.
              실시간 요금·양방향 거래로 갈 기반은 갖춰진 셈입니다.
            </p>
          </div>
          <div className="card p-5">
            <div className="mt-0 text-2xl">🏠</div>
            <div className="mt-2 font-bold">그런데 정작 쓸 도구가 없다</div>
            <p className="mt-1 text-sm text-slate-500">
              데이터는 이미 있지만, 언제 사고 언제 팔지를 가정에서 판단할 방법이 없습니다.
              폭염 누진에 취약한 1인·저소득 가구일수록 이 격차가 큽니다.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="card bg-ink p-6 text-white">
            <p className="text-lg font-bold leading-snug">
              그래서 <span className="text-amber">쌀 때 사고 비쌀 때 파는 판단</span>을,
              집집마다 라즈베리파이가 알아서 내리도록 하는 것이 목표입니다.
            </p>
            <p className="mt-3 text-xs text-white/70">
              태양광 판매, 누진 회피, 요금 절감을 한 번에. 취약계층 요금 부담과 냉방 문제 해소로도 이어집니다.
            </p>
          </div>
          <Photo label="유럽 전력 실시간 요금 / 뉴스 캡처 자리" h="h-full" />
        </div>
      </section>

      {/* 2. 방법론적 필요성 */}
      <section>
        <h2 className="section-title">기술 측면 — 왜 오토인코더인가</h2>
        <p className="mt-1 text-sm text-slate-500">응급·이상 상황은 정답이 붙어 있지 않기 때문에, 정상만 학습하는 방식이 적합합니다.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <div className="badge bg-slate-100 text-slate-600">문제</div>
            <div className="mt-2 font-bold">정답 라벨이 없다</div>
            <p className="mt-1 text-sm text-slate-500">
              고독사나 응급 같은 이상은 드물고, 데이터에 &lsquo;이상&rsquo;이라고 표시된 사례가 거의 없습니다.
              그래서 정답을 맞히는 일반적인 학습(지도학습)은 적용하기 어렵습니다.
            </p>
          </div>
          <div className="card p-6">
            <div className="badge bg-teal-soft text-teal">해법 · 오토인코더</div>
            <div className="mt-2 font-bold">평소만 배우고, 벗어나면 잡는다</div>
            <p className="mt-1 text-sm text-slate-500">
              평소 전력 패턴을 압축했다가 다시 되살리도록 학습시킵니다. 평소와 비슷하면 잘 복원하지만,
              이상이 오면 복원이 크게 어긋납니다. 그 어긋난 정도를 이상 신호로 사용하며, 별도의 정답 라벨이 필요 없습니다.
            </p>
          </div>
        </div>

        <div className="mt-4 card p-6">
          <div className="font-bold">출장·여행 같은 예외는 사후에 확인한다</div>
          <p className="mt-1 text-sm text-slate-500">
            출장이나 여행처럼 정상이지만 이상하게 보이는 경우가 있습니다. 이런 경우는 곧바로 경보하지 않고,
            사후에 &ldquo;3일째 사용량이 크게 줄었는데 외출 중이신가요?&rdquo;라고 확인해 걸러냅니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip bg-teal-soft text-teal">평소 학습</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-amber-soft text-amber">복원 어긋남 = 이상</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-slate-100 text-slate-600">응급 판단</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-slate-100 text-slate-600">예외는 사후 확인</span>
          </div>
        </div>
      </section>

      {/* 마무리 */}
      <section className="card bg-gradient-to-br from-amber-soft to-teal-soft p-8 text-center">
        <p className="mx-auto max-w-3xl text-lg font-bold leading-snug text-ink">
          전기를 사고파는 시대에, 집에서 알아서 <span className="text-amber">거래하고</span>
          <span className="text-teal"> 위험까지 살피는</span> 도구. 라벨 없는 문제는 오토인코더로 해결합니다.
        </p>
      </section>
    </div>
  );
}
