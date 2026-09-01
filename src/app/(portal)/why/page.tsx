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
            필요성 — <span className="text-amber">정책</span>적으로도, <span className="text-teal">방법</span>론적으로도
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            전력은 더 이상 &lsquo;쓰기만 하는 것&rsquo;이 아닙니다. 사고팔고, 아끼고, 위험을 읽는 대상이 되고 있습니다.
            우리 서비스가 왜 필요한지를 <b>미래 전력시장(정책)</b>과 <b>이상탐지 기법(방법론)</b> 두 축에서 설명합니다.
          </p>
        </div>
      </section>

      {/* 1. 정책적 필요성 */}
      <section>
        <h2 className="section-title">정책적 필요성 — 미래 전력시장은 &lsquo;거래&rsquo;로 간다</h2>
        <p className="mt-1 text-sm text-slate-500">가정이 전기를 사고파는 시대. 인프라(AMI)는 깔렸지만, 가구가 이를 활용할 도구가 없다.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <div className="text-2xl">🇪🇺</div>
            <div className="mt-2 font-bold">이미 사고파는 유럽·영국</div>
            <p className="mt-1 text-sm text-slate-500">
              도매가에 연동해 <b>30분 단위로 요금이 바뀌고</b>, 가정은 쌀 때 쓰고 태양광 잉여를 <b>피크(오후 4~7시)에 되판다.</b>
              전력이 남는 날은 요금이 마이너스가 되어 <b>오히려 돈을 받고</b> 쓰기도 한다.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-2xl">📈</div>
            <div className="mt-2 font-bold">국내도 같은 방향</div>
            <p className="mt-1 text-sm text-slate-500">
              재생에너지 확대 · 요금 체계 개편 · <b>AMI(스마트미터) 전국 2,005만 호 보급 완료(2024)</b>.
              실시간 요금·양방향 거래로 가는 흐름이 시작됐다.
            </p>
          </div>
          <div className="card p-5">
            <div className="text-2xl">🏠</div>
            <div className="mt-2 font-bold">그런데 &lsquo;가구용 도구&rsquo;가 없다</div>
            <p className="mt-1 text-sm text-slate-500">
              데이터(AMI)는 깔렸지만, <b>언제 사고 언제 팔지</b>를 가구가 스스로 판단할 도구는 없다.
              폭염 누진에 취약한 1인·저소득 가구일수록 이 격차가 크다.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr]">
          <div className="card bg-ink p-6 text-white">
            <div className="text-sm font-semibold text-amber">한 줄 결론</div>
            <p className="mt-2 text-lg font-bold leading-snug">
              &ldquo;비쌀 때 팔고 쌀 때 사는&rdquo; 판단을,
              <br />가구마다 <span className="text-amber">온디바이스로 자동화</span>하는 도구가 필요하다.
            </p>
            <p className="mt-3 text-xs text-white/70">
              태양광 잉여 판매 · 누진 회피 · 요금 절감을 하나의 알고리즘으로. 취약계층 에너지 비용·냉방권 보호와 직결.
            </p>
          </div>
          <Photo label="유럽 전력 실시간 요금 / 뉴스 캡처 자리" h="h-full" />
        </div>
      </section>

      {/* 2. 방법론적 필요성 */}
      <section>
        <h2 className="section-title">방법론적 필요성 — 왜 &lsquo;오토인코더&rsquo;인가</h2>
        <p className="mt-1 text-sm text-slate-500">응급·이상 상황은 정답 라벨이 없다. 그래서 &lsquo;정상&rsquo;만 배우는 비지도 방식이 맞다.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <div className="badge bg-slate-100 text-slate-600">문제</div>
            <div className="mt-2 font-bold">라벨이 없다</div>
            <p className="mt-1 text-sm text-slate-500">
              고독사·응급 같은 이상은 <b>드물고, &lsquo;정답&rsquo;이 붙어있지 않다.</b>
              정상/비정상을 사람이 표시한 데이터가 거의 없으니 <b>지도학습(정답 맞히기)이 불가능</b>하다.
            </p>
          </div>
          <div className="card p-6">
            <div className="badge bg-teal-soft text-teal">해법 · 오토인코더</div>
            <div className="mt-2 font-bold">&lsquo;정상&rsquo;만 배우고, 벗어나면 잡는다</div>
            <p className="mt-1 text-sm text-slate-500">
              평소 전력 패턴을 <b>압축했다 복원</b>하도록 학습(오토인코더). 정상은 잘 복원되지만,
              이상 상황이 오면 <b>복원 오차가 급증</b> → 그 오차를 &lsquo;이상 점수&rsquo;로 쓴다. <b>라벨 없이 작동.</b>
            </p>
          </div>
        </div>

        <div className="mt-4 card p-6">
          <div className="font-bold">예외까지 설계한다 — 오탐을 사후 알림으로</div>
          <p className="mt-1 text-sm text-slate-500">
            출장·여행처럼 <b>정상인데 이상처럼 보이는</b> 경우는 필연적 오탐이다. 이를 즉시 경보하지 않고,
            <b>사후 서비스 알림</b>으로 사용자에게 확인받는다. 예: <i>&ldquo;3일간 사용량이 급감했어요. 외출 중이신가요?&rdquo;</i>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip bg-teal-soft text-teal">정상 학습(비지도)</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-amber-soft text-amber">복원오차 = 이상 점수</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-slate-100 text-slate-600">응급 분류</span>
            <span className="text-slate-300">→</span>
            <span className="chip bg-slate-100 text-slate-600">예외(출장·여행) 사후 알림</span>
          </div>
        </div>
      </section>

      {/* 마무리 척추 */}
      <section className="card bg-gradient-to-br from-amber-soft to-teal-soft p-8 text-center">
        <div className="text-sm font-semibold text-ink">정책 + 방법론 = 우리 자리</div>
        <p className="mx-auto mt-2 max-w-3xl text-lg font-bold leading-snug text-ink">
          전기를 사고파는 시대에, 가구가 스스로 <span className="text-amber">거래하고</span> 스스로
          <span className="text-teal"> 위험을 읽는</span> 온디바이스 도구 — 라벨 없는 문제엔 오토인코더로.
        </p>
      </section>
    </div>
  );
}
