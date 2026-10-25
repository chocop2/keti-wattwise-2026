import Shot from "@/components/Shot";
import ForecastLab from "./ForecastLab";
import DeployDataExplorer from "./DeployDataExplorer";
import DeployTabs from "./DeployTabs";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const KIT = [
  { n: "Raspberry Pi 5", d: "온디바이스 예측·이상탐지 구동 (클라우드 없이 집 안에서)" },
  { n: "CT 센서 (SCT-013)", d: "분전반에 물려 집 전체 전류를 실측" },
  { n: "브레드보드 · ADC", d: "센서 신호를 라즈베리파이가 읽도록 회로 구성" },
  { n: "로컬 저장", d: "1분 단위 시계열을 집 안에 저장 (데이터는 밖으로 나가지 않음)" },
];

const FLOW = [
  { title: "센서 설치 및 실측", body: "분전반과 콘센트에 센서를 설치해 전력 신호를 연속 수집했습니다." },
  { title: "데이터 정제 및 품질 검수", body: "시간 단위로 데이터를 집계하고, 수집률과 결측 여부를 기록해 모델 입력의 품질을 검수했습니다." },
  { title: "가전별 모델 학습", body: "가전별·실증 대상별 시계열 데이터를 구성하고 Chronos-2 체크포인트를 학습했습니다." },
  { title: "로컬 추론 및 검증", body: "저장된 모델을 직접 불러와 향후 24시간의 전력 사용량 예측과 불확실성 범위를 확인합니다." },
];

const SHOTS = [
  { src: "panel-ct.jpg", cap: "분전반 메인 전선에 CT센서(SCT-013 클램프)를 물려 집 전체 전류를 실측" },
  { src: "room-setup.jpg", cap: "자취방 현장 설치 · 벽 콘센트에서 라즈베리파이로 전력 측정" },
  { src: "lab-team.jpg", cap: "회로 구성·검증 · 멀티미터로 CT센서 신호를 확인" },
];

export default function DeployPage() {
  return (
    <div className="pb-6">
      <DeployTabs
        tabs={[
          { id: "process", label: "검증 과정", content: <>
          <section>
            <PageHeading title={<>측정부터 추론까지 이어지는 검증 파이프라인</>} body="각 단계의 결과가 다음 단계로 이어집니다. 실측 데이터부터 실제 모델의 예측 결과까지 한 페이지에서 확인할 수 있습니다." />
            <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{FLOW.map((step) => <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6"><svg viewBox="0 0 24 24" className="h-6 w-6 text-teal" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.5l5 5L20 6.5" /></svg><div className="mt-4 text-lg font-black text-[#3D2B1F]">{step.title}</div><p className="mt-2 break-keep text-sm leading-6 text-slate-600">{step.body}</p></div>)}</div>
          </section>
          {/* 왜 실측인가 */}
          <section className="rounded-[2rem] bg-[#FAF6EC] p-8 md:p-11">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]"><p className="max-w-3xl break-keep text-2xl font-black leading-snug text-[#3D2B1F] md:text-3xl">실측 데이터는 모델의 입력이 되고,<br />모델의 출력은 사용자의 판단으로 이어집니다.</p><p className="break-keep text-base leading-8 text-slate-600">WattWise의 실증은 단순히 그래프를 만드는 데 그치지 않습니다. 데이터 수집 품질부터 전처리, 로컬 추론, 예측 결과 제공까지 이어지는 전체 과정이 실제 서비스 환경에서 작동하는지 검증합니다.</p></div>
          </section>
          </> },
          { id: "data", label: "실측 데이터", content: <DeployDataExplorer /> },
          { id: "model", label: "모델 예측", content: <ForecastLab /> },
          { id: "site", label: "장비·현장", content: <>
          {/* 구성 키트 */}
          <section>
            <PageHeading title={<>무엇으로 측정하나</>} body="집 안에 두는 작은 장비만으로 전력 신호를 모읍니다." />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {KIT.map((k) => (
                <div key={k.n} className="card flex items-start gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FAF6EC]"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="#3D2B1F" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg></div>
                  <div>
                    <div className="text-lg font-black text-[#3D2B1F]">{k.n}</div>
                    <div className="mt-0.5 text-sm text-slate-500">{k.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {/* 실험 현장 사진 */}
          <section>
            <PageHeading title={<>설치·측정 현장</>} body="공개 데이터가 아니라, 팀원이 직접 설치하고 측정한 실제 실험 현장입니다." />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {SHOTS.map((s) => (
                <Shot key={s.src} src={`${BP}/deploy/${s.src}`} caption={s.cap} h="h-52" />
              ))}
            </div>
          </section>
          {/* 실측 데이터 */}
          <section>
            <PageHeading title={<>실제로 이렇게 데이터가 쌓입니다</>} body="라즈베리파이가 센서에서 읽은 전력값을 초 단위로 찍어 저장하는 실측 로그입니다." />
            <figure className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${BP}/deploy/data-log.jpg`} alt="라즈베리파이 실측 데이터 스트림 화면" className="w-full object-cover" />
              <figcaption className="bg-white px-4 py-2 text-xs text-slate-500">
                실제 수집 화면 · [2026-09-02 18:17:05] [Sensor 01] Power=0.2946 kWh …
              </figcaption>
            </figure>
          </section>
          </> },
        ]}
      />
    </div>
  );
}


function PageHeading({ title, body }: { title: React.ReactNode; body: string }) {
  return (
    <div>
      <h2 className="break-keep text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">{title}</h2>
      <p className="mt-3 break-keep text-base text-slate-600">{body}</p>
    </div>
  );
}
