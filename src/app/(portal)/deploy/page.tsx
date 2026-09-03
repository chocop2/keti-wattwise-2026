import Shot from "@/components/Shot";
import ForecastLab from "./ForecastLab";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const KIT = [
  { n: "Raspberry Pi 5", d: "온디바이스 예측·이상탐지 구동 (클라우드 없이 집 안에서)" },
  { n: "CT 센서 (SCT-013)", d: "분전반에 물려 집 전체 전류를 실측" },
  { n: "브레드보드 · ADC", d: "센서 신호를 라즈베리파이가 읽도록 회로 구성" },
  { n: "로컬 저장", d: "1분 단위 시계열을 집 안에 저장 (데이터는 밖으로 나가지 않음)" },
];

const FLOW = [
  "분전반·콘센트에 센서 설치",
  "1분 단위로 전력 연속 수집",
  "정상 패턴 학습 (오토인코더)",
  "예측·이상탐지·거래 판단",
];

const SHOTS = [
  { src: "panel-ct.jpg", cap: "분전반 메인 전선에 CT센서(SCT-013 클램프)를 물려 집 전체 전류를 실측" },
  { src: "room-setup.jpg", cap: "자취방 현장 설치 · 벽 콘센트에서 라즈베리파이로 전력 측정" },
  { src: "lab-team.jpg", cap: "회로 구성·검증 · 멀티미터로 CT센서 신호를 확인" },
];

export default function DeployPage() {
  return (
    <div className="space-y-12">
      {/* 히어로 */}
      <section className="card overflow-hidden">
        <div className="grid gap-6 p-8 md:grid-cols-[1.3fr_1fr] md:p-10">
          <div className="self-center">
            <div className="badge bg-amber-soft text-amber">실증 · 직접 측정한 데이터</div>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              자취방에서 <span className="text-amber">직접</span> 전력 데이터를 모읍니다
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              공개 데이터만 사용하지 않았습니다. 팀원이 실제 자취방에 라즈베리파이와 CT센서를 설치해 전기를 직접 측정하고 있습니다.
              이 데이터로 예측·이상탐지·거래가 실제 가정에서 동작하는지 검증합니다.
              한국 1인가구를 이만큼 촘촘히 잰 데이터는 흔치 않습니다.
            </p>
          </div>
          <div className="self-center">
            <Shot src={`${BP}/deploy/kit.jpg`} caption="측정 키트 · 라즈베리파이 5, CT센서, 브레드보드, 저항·ADC 부품" h="h-64 md:h-full" />
          </div>
        </div>
      </section>

      {/* 실제 모델 예측 */}
      <ForecastLab />

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

      {/* 실험 현장 사진 */}
      <section>
        <div className="eyebrow">On Site</div>
        <h2 className="section-title">설치·측정 현장</h2>
        <p className="section-sub">공개 데이터가 아니라, 팀원이 직접 손으로 재고 있는 실제 실험 현장입니다.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {SHOTS.map((s) => (
            <Shot key={s.src} src={`${BP}/deploy/${s.src}`} caption={s.cap} h="h-52" />
          ))}
        </div>
      </section>

      {/* 수집 흐름 */}
      <section>
        <div className="eyebrow">Pipeline</div>
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

      {/* 실측 데이터 */}
      <section>
        <div className="eyebrow">Live Data</div>
        <h2 className="section-title">실제로 이렇게 데이터가 쌓입니다</h2>
        <p className="section-sub">라즈베리파이가 센서에서 읽은 전력값을 초 단위로 찍어 저장하는 실측 로그입니다.</p>
        <figure className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BP}/deploy/data-log.jpg`} alt="라즈베리파이 실측 데이터 스트림 화면" className="w-full object-cover" />
          <figcaption className="bg-white px-4 py-2 text-xs text-slate-500">
            실제 수집 화면 · [2026-09-02 18:17:05] [Sensor 01] Power=0.2946 kWh …
          </figcaption>
        </figure>
      </section>

      {/* 왜 실측인가 */}
      <section className="card bg-ink p-8 text-white">
        <div className="text-sm font-semibold text-amber">왜 직접 측정하는가</div>
        <p className="mt-2 max-w-3xl text-lg font-bold leading-snug">
          공개 데이터는 대개 오래됐거나 뭉뚱그려져 있습니다. 우리는 <span className="text-amber">지금 사는 집</span>을 직접 측정해,
          예측이 실제로 잘 맞는지 검증합니다.
        </p>
        <p className="mt-3 text-xs text-white/70">
          또한 집 안에서 측정하고 처리하기 때문에, 생활 패턴이 담긴 전력 데이터가 밖으로 나가지 않습니다. 프라이버시도 함께 지키는 방식입니다.
        </p>
      </section>
    </div>
  );
}
