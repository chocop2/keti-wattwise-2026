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

const KIT = [
  { n: "Raspberry Pi 5", d: "온디바이스 예측·이상탐지 구동 (클라우드 없이 집 안에서)" },
  { n: "CT 센서 (SCT-013)", d: "분전반에 물려 집 전체 전류를 실측" },
  { n: "스마트플러그", d: "가전별 사용량 개별 측정 (TV·냉장고·전기포트 등)" },
  { n: "로컬 DB", d: "1분 단위 시계열을 집 안에 저장 (데이터는 밖으로 나가지 않음)" },
];

const FLOW = [
  "분전반·콘센트에 센서 설치",
  "1분 단위로 전력 연속 수집",
  "정상 패턴 학습 (오토인코더)",
  "예측·이상탐지·거래 판단",
];

export default function DeployPage() {
  return (
    <div className="space-y-12">
      {/* 히어로 — 자연 패널 */}
      <section className="hero-nature rounded-3xl border border-white/10 shadow-pop">
        <div className="relative z-10 grid gap-6 p-8 md:grid-cols-[1.3fr_1fr] md:p-12">
          <div className="self-center text-white">
            <div className="badge bg-white/10 text-mint">실증 · 직접 측정한 데이터</div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              자취방에서 <span className="text-amber">직접</span> 전력 데이터를 모읍니다
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-sage/85">
              공개 데이터만 사용하지 않았습니다. 팀원이 실제 자취방에 라즈베리파이와 CT센서를 설치해 전기를 직접 측정하고 있습니다.
              이 데이터로 예측·이상탐지·거래가 실제 가정에서 동작하는지 검증합니다.
              한국 1인가구를 이만큼 촘촘히 잰 데이터는 흔치 않습니다.
            </p>
          </div>
          <div className="self-center rounded-2xl border border-white/15 bg-black/15 p-1.5 backdrop-blur-sm">
            <Photo label="자취방 설치 전경 사진 자리" h="h-56 md:h-full" />
          </div>
        </div>
      </section>

      {/* 구성 키트 */}
      <section>
        <div className="eyebrow">Hardware</div>
        <h2 className="section-title">무엇으로 측정하나</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {KIT.map((k) => (
            <div key={k.n} className="card flex items-start gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-soft text-lg">🔌</div>
              <div>
                <div className="font-bold">{k.n}</div>
                <div className="mt-0.5 text-sm text-slate-500">{k.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 사진 갤러리 자리 */}
      <section>
        <div className="eyebrow">On Site</div>
        <h2 className="section-title">설치·수집 현장</h2>
        <p className="section-sub">아래 칸에 실제 설치·측정 사진을 넣으세요.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Photo label="Pi + 센서 세팅 사진" />
          <Photo label="분전반/콘센트 설치 사진" />
          <Photo label="측정 화면·데이터 사진" />
        </div>
      </section>

      {/* 수집 흐름 */}
      <section>
        <div className="eyebrow">Pipeline</div>
        <h2 className="section-title">수집 흐름</h2>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {FLOW.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-sage">
                <span className="mr-1.5 text-amber">{i + 1}</span>{f}
              </div>
              {i < FLOW.length - 1 && <span className="text-sage/40">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* 왜 실측인가 */}
      <section className="hero-nature rounded-2xl border border-white/10 p-8 shadow-pop">
        <div className="relative z-10">
          <div className="text-sm font-semibold text-amber">왜 직접 측정하는가</div>
          <p className="mt-2 max-w-3xl text-lg font-bold leading-snug text-white">
            공개 데이터는 대개 오래됐거나 뭉뚱그려져 있습니다. 우리는 <span className="text-amber">지금 사는 집</span>을 직접 측정해,
            예측이 실제로 잘 맞는지 검증합니다.
          </p>
          <p className="mt-3 text-xs text-sage/75">
            또한 집 안에서 측정하고 처리하기 때문에, 생활 패턴이 담긴 전력 데이터가 밖으로 나가지 않습니다. 프라이버시도 함께 지키는 방식입니다.
          </p>
        </div>
      </section>
    </div>
  );
}
