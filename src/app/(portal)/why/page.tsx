import Image from "next/image";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const policyCards = [
  { icon: "🌍", tag: "해외 전력시장", title: "전력은 이미 실시간 상품이 됐습니다", body: "유럽·영국에서는 가격이 시간대별로 움직입니다. 공급이 넘치는 날에는 도매가격이 0원 이하로 내려가고, 가정은 배터리·전기차·태양광을 가격에 맞춰 충전하거나 판매합니다." },
  { icon: "🇰🇷", tag: "국내 기반", title: "한국도 데이터를 갖췄습니다", body: "스마트미터(AMI)가 2024년 전국 약 2,005만 호에 보급되며 실시간 사용량과 양방향 전력 서비스의 기반이 마련됐습니다. 이제 가정에서 데이터를 해석하고 행동으로 바꾸는 도구가 필요합니다." },
  { icon: "🏢", tag: "아파트형 VPP", title: "개별 주택의 한계는 단지로 확장합니다", body: "옥상 태양광과 각 가정의 스마트미터를 묶으면 아파트 단지 전체를 하나의 가상발전소처럼 운영할 수 있습니다. 생산 전력을 단지 안에서 공유하거나 공용 전기료를 낮추는 모델입니다." },
];

const pillars = [
  { n: "01", title: "Trade", label: "사고팔고", body: "가격과 예측 분포를 읽어 구매·판매 시점을 제안합니다.", color: "bg-amber-soft text-amber" },
  { n: "02", title: "Save", label: "아끼고", body: "누진 구간과 가전별 사용 패턴에서 절감 지점을 찾습니다.", color: "bg-teal-soft text-teal" },
  { n: "03", title: "Protect", label: "지켜주고", body: "가구의 평소 패턴에서 벗어난 변화를 조기에 알려줍니다.", color: "bg-danger-soft text-danger" },
];

export default function WhyPage() {
  return (
    <div className="space-y-16 pb-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-white shadow-pop md:px-12 md:py-16">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-teal/20 blur-3xl" /><div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-amber/20 blur-3xl" />
        <div className="relative max-w-3xl"><div className="eyebrow !text-amber">WHY WATTWISE</div><h1 className="mt-3 text-4xl font-black leading-tight tracking-tight md:text-6xl">전기를 쓰는 집에서<br /><span className="text-amber">판단하는 집</span>으로</h1><p className="mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">WattWise는 라즈베리파이 한 대로 가정의 전력 데이터를 집 안에서 해석합니다. 전기를 사고팔고, 아끼고, 위험 신호를 살피는 세 가지 행동을 하나의 생활 패턴 위에 연결합니다.</p><div className="mt-8 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/10 px-4 py-2">On-device</span><span className="rounded-full bg-white/10 px-4 py-2">No cloud</span><span className="rounded-full bg-white/10 px-4 py-2">One household, one model</span></div></div>
      </section>

      <section><div className="eyebrow">Policy</div><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="section-title text-2xl md:text-3xl">전력 정책의 방향은 이미 바뀌고 있습니다</h2><p className="section-sub max-w-2xl">전력시장·주거 환경·데이터 인프라의 변화를 가정의 행동으로 연결합니다.</p></div><div className="rounded-2xl bg-amber-soft px-5 py-3 text-right"><div className="text-2xl font-black text-amber">2,005만 호</div><div className="text-xs text-slate-500">2024년 AMI 보급 규모</div></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">{policyCards.map((card) => <article key={card.tag} className="card group p-6 transition hover:-translate-y-1 hover:shadow-pop"><div className="flex items-center justify-between"><span className="badge bg-slate-100 text-slate-600">{card.tag}</span><span className="text-3xl transition group-hover:scale-110">{card.icon}</span></div><h3 className="mt-5 text-lg font-bold leading-snug">{card.title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{card.body}</p></article>)}</div>
        <div className="mt-5 grid gap-5 overflow-hidden rounded-3xl bg-gradient-to-br from-teal-soft via-white to-amber-soft md:grid-cols-[1.1fr_0.9fr]"><div className="p-7 md:p-10"><div className="badge bg-white text-teal shadow-sm">정책이 만드는 기회</div><h3 className="mt-5 text-2xl font-black leading-tight text-ink">데이터는 흐르고 있습니다.<br />가정의 의사결정만 비어 있습니다.</h3><p className="mt-4 text-sm leading-7 text-slate-600">폭염 누진과 에너지 비용에 취약한 1인·저소득 가구일수록 이 격차가 커집니다. WattWise는 개인 주택을 넘어 아파트 단지형 VPP까지 확장할 수 있는 작은 실행 단위를 제안합니다.</p></div><div className="relative min-h-[240px]"><Image src={`${BP}/img/eu-solar.jpg`} alt="태양광 패널이 설치된 주택" fill unoptimized className="object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" /><div className="absolute bottom-5 left-5 text-xs text-white/80">태양광 생산과 수요를 연결하는 가정</div></div></div><p className="mt-2 text-[11px] text-slate-400">이미지 · Marta Victoria · Wikimedia Commons (CC BY-SA 4.0)</p>
      </section>

      <section><div className="eyebrow">The Gap</div><h2 className="section-title text-2xl md:text-3xl">기존 해법은 기능별로 나뉘어 있습니다</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{[{ t: "사업자 중심 거래", d: "개인 단위로 사고파는 해외 흐름과 달리, 국내 가정이 활용할 거래 경험은 부족합니다." }, { t: "중앙 관리형 데이터", d: "전력은 곧 생활 패턴인데, 클라우드 수집만으로는 개인의 평소를 세밀하게 반영하기 어렵습니다." }, { t: "파편화된 서비스", d: "안부·요금·태양광 데이터가 따로 관리되어 하나의 행동으로 이어지지 않습니다." }].map((item, i) => <div key={item.t} className="card p-6"><div className="text-4xl font-black text-slate-200">0{i + 1}</div><h3 className="mt-4 font-bold">{item.t}</h3><p className="mt-2 text-sm leading-7 text-slate-500">{item.d}</p></div>)}</div><div className="mt-5 rounded-2xl border border-ink/10 bg-ink p-7 text-white md:p-9"><div className="text-sm font-bold text-amber">WattWise의 한 문장</div><p className="mt-3 text-xl font-bold leading-relaxed md:text-2xl">한 가구의 전력 데이터를 <span className="text-teal">온디바이스로 학습</span>해, 이상 탐지와 전력 거래를 <span className="text-amber">하나의 플랫폼</span>으로 통합합니다.</p></div></section>

      <section><div className="eyebrow">One Household, Three Actions</div><h2 className="section-title text-2xl md:text-3xl">같은 데이터에서 세 가지 가치가 나옵니다</h2><p className="section-sub">가구의 평소 패턴을 이해하면, 거래·절감·안전이 서로 연결됩니다.</p><div className="mt-6 grid gap-4 md:grid-cols-3">{pillars.map((pillar) => <div key={pillar.title} className="card p-6"><div className={`inline-flex rounded-xl px-3 py-2 text-xs font-black ${pillar.color}`}>{pillar.n} · {pillar.title}</div><h3 className="mt-5 text-xl font-black">{pillar.label}</h3><p className="mt-2 text-sm leading-7 text-slate-500">{pillar.body}</p></div>)}</div></section>

      <section><div className="eyebrow">Method & Roadmap</div><div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]"><div className="card p-7"><h2 className="text-2xl font-black">왜 온디바이스인가</h2><p className="mt-3 text-sm leading-7 text-slate-500">거래·절감은 확률 예측으로, 안전은 정상 패턴 학습으로 처리합니다. 데이터가 집 밖으로 나가지 않아 사생활을 지키면서도, 라즈베리파이 한 대로 취약계층에 접근할 수 있습니다.</p><div className="mt-6 space-y-3 text-sm"><div className="flex gap-3"><span className="text-teal">✓</span><span>정답 라벨이 적은 이상 상황도 정상 패턴으로 학습</span></div><div className="flex gap-3"><span className="text-teal">✓</span><span>점이 아닌 분포로 누진 초과 가능성과 불확실성 제시</span></div><div className="flex gap-3"><span className="text-teal">✓</span><span>클라우드 없이 집 안에서 추론·알림</span></div></div></div><div className="card p-7"><h2 className="text-2xl font-black">다음 단계</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{[{ n: "01", t: "개념 검증", d: "웹 데모·거래 로직·이상탐지 PoC" }, { n: "02", t: "실측 데이터 검증", d: "자취방 연속 측정, 합성→실측 재검증" }, { n: "03", t: "온디바이스 통합", d: "Pi 5 경량화·지연·소비전력 프로파일링" }, { n: "04", t: "실증 및 공개", d: "실가정 시범 운영·성능 보고서·오픈소스" }].map((step) => <div key={step.n} className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-black text-amber">STEP {step.n}</span><div className="mt-2 font-bold">{step.t}</div><div className="mt-1 text-xs leading-5 text-slate-500">{step.d}</div></div>)}</div></div></div></section>

      <section className="rounded-3xl bg-gradient-to-r from-amber-soft to-teal-soft p-8 text-center md:p-12"><p className="mx-auto max-w-3xl text-2xl font-black leading-snug text-ink md:text-3xl">가정이 스스로 전기를 <span className="text-amber">사고팔고</span>, <span className="text-teal">아끼고</span>, <span className="text-danger">지키는</span> 세상</p><p className="mt-4 text-sm text-slate-600">WattWise · 집 안의 전력 비서</p></section>
    </div>
  );
}
