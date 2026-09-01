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

const KIT = [
  { n: "Raspberry Pi 5", d: "온디바이스 예측·이상탐지 구동 (클라우드 없이 집 안에서)" },
  { n: "CT 센서 (SCT-013)", d: "분전반에 물려 집 전체 전류를 실측" },
  { n: "스마트플러그", d: "가전별 사용량 개별 측정 (TV·냉장고·전기포트 등)" },
  { n: "로컬 DB", d: "1분 단위 시계열을 집 안 저장 — 데이터는 밖으로 안 나감" },
];

const FLOW = [
  "분전반·콘센트에 센서 설치",
  "1분 단위로 전력 연속 수집",
  "정상 패턴 학습 (오토인코더)",
  "예측·이상탐지·거래 판단",
];

export default function DeployPage() {
  return (
    <div className="space-y-10">
      {/* 히어로 */}
      <section className="card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-[1.3fr_1fr] md:p-10">
          <div>
            <div className="badge bg-amber-soft text-amber">실증 · 우리가 직접 만든다</div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              자취방에서 <span className="text-amber">직접</span> 전력 데이터를 모읍니다
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              공개 데이터만 쓰지 않았습니다. 팀원이 <b>실제 자취방(1인가구)에 라즈베리파이와 CT센서를 설치</b>해
              전력을 직접 계측하고, 그 위에서 예측·이상탐지·거래 알고리즘을 검증합니다.
              한국 1인가구 고해상도 실측 데이터는 <b>우리만의 자산</b>입니다.
            </p>
          </div>
          <Photo label="자취방 설치 전경 사진 자리" h="h-full" />
        </div>
      </section>

      {/* 구성 키트 */}
      <section>
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
        <h2 className="section-title">설치·수집 현장</h2>
        <p className="mt-1 text-sm text-slate-500">아래 칸에 실제 설치·측정 사진을 넣으세요.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Photo label="Pi + 센서 세팅 사진" />
          <Photo label="분전반/콘센트 설치 사진" />
          <Photo label="측정 화면·데이터 사진" />
        </div>
      </section>

      {/* 수집 흐름 */}
      <section>
        <h2 className="section-title">수집 흐름</h2>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {FLOW.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                <span className="mr-1.5 text-amber">{i + 1}</span>{f}
              </div>
              {i < FLOW.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* 왜 실측인가 */}
      <section className="card bg-ink p-8 text-white">
        <div className="text-sm font-semibold text-amber">왜 직접 재는가</div>
        <p className="mt-2 max-w-3xl text-lg font-bold leading-snug">
          공개 데이터는 집계·과거의 것. 우리는 <span className="text-amber">지금·여기 1인가구</span>를 직접 재서,
          예측이 진짜 실가정에서 작동하는지 증명합니다.
        </p>
        <p className="mt-3 text-xs text-white/70">
          온디바이스 계측이라 전력 데이터(=생활 패턴)가 집 밖으로 나가지 않습니다 — 프라이버시까지 우리 방식의 강점.
        </p>
      </section>
    </div>
  );
}
