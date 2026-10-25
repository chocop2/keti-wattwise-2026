import Image from "next/image";
import Link from "next/link";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const photo = (name: string) => `${BP}/img/photos/${name}.jpg`;

export default function WhyPage() {
  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
      <section className="relative min-h-[420px] overflow-hidden bg-ink lg:min-h-[460px]">
        <Image src={photo("power-lines")} alt="노을 진 하늘 아래 늘어선 송전탑" fill priority unoptimized className="object-cover object-[50%_60%]" />
        <div className="absolute inset-0 bg-[#1a120c]/45" />
        <div className="relative mx-auto flex min-h-[420px] max-w-6xl items-center justify-center px-4 py-12 text-center lg:min-h-[460px]">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-white/90 backdrop-blur md:text-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#F2C9A0" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
              WattWise, 왜 필요할까?
            </span>
            <h1 className="mt-6 break-keep text-3xl font-black leading-[1.35] tracking-[-0.03em] text-white md:text-5xl md:leading-[1.35] lg:text-[3.4rem]">
              전력 데이터로, <span className="glow-apricot">더 나은 선택을</span>
            </h1>
            <p className="mt-5 break-keep text-lg font-medium leading-8 text-white/85 md:text-xl md:leading-9">
              매일 쌓이는 전력 데이터를 요금 절약부터<br className="hidden md:block" /> 안전 관리, 에너지 거래까지 연결합니다.
            </p>
            <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-white/15 rounded-3xl border border-white/20 bg-white/10 py-6 backdrop-blur-md md:py-7">
              <HeroFact value="42%" label="국내 1인 세대 비중" />
              <HeroFact value="24시간" label="사용량·요금 예측" />
              <HeroFact value="1분" label="단위 전력 측정" />
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 md:space-y-24 md:py-20">
      <section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mt-4 break-keep text-3xl font-black tracking-[-0.04em] md:text-5xl">왜 지금, 전력 데이터에 주목해야 할까요?</h2>
        </div>

        <div className="mt-12 space-y-16 md:space-y-24">
          <ReasonSection
            title={<>전기요금은 사용한 뒤가 아니라,<br /><span className="hl">사용하기 전에 알아야 합니다.</span></>}
            body={<>전기요금은 고지서를 받고 나서야 부담을 실감하는 경우가 많습니다.<br className="hidden lg:block" /> 앞으로의 전력 사용량과 예상 요금을 미리 알 수 있다면,<br className="hidden lg:block" /> 요금이 커지기 전에 사용 시간과 가전 운용을 조정할 수 있습니다.</>}
            takeaway="지난달 요금 확인에서, 내일의 사용량 예측으로."
            href="/analytics"
            link="24시간 사용량 예측하기"
            photo={photo("living-room")}
            reverse={false}
          />

          <ReasonSection
            title={<>혼자 사는 가구가 늘어날수록,<br /><span className="hl">일상의 변화를 더 빨리 알아야 합니다.</span></>}
            body={<>2024년 국내 1인 세대는 약 1,012만 세대로 전체의 42%를 차지합니다.<br className="hidden lg:block" /> 혼자 사는 가구는 평소와 다른 생활 변화가 생겨도 주변에서 바로 알아차리기 어렵습니다.<br className="hidden lg:block" /> 가전의 전력 사용 패턴을 분석하면, 평소와 다른 활동을 감지해 안부 확인이 필요한 상황을 더 일찍 파악할 수 있습니다.</>}
            takeaway="평소를 학습하고, 평소와 다른 순간을 알립니다."
            href="/households"
            link="생활 이상 신호 확인하기"
            photo={photo("apartment-windows")}
            reverse
          />

          <ReasonSection
            title={<>태양광으로 생산한 전력,<br /><span className="hl">예측을 넘어 활용까지 연결해야 합니다.</span></>}
            body={<>태양광과 같은 분산형 에너지가 늘면서 생산한 전력을 어떻게 소비하고 활용할지에 대한 관심도 커지고 있습니다. 해외에서는 분산형 에너지와 잉여 전력 거래를 연계하는 다양한 모델이 운영되고 있으며, 국내에서도 제한적인 실증과 제도적 기반 마련이 진행되고 있습니다. 이제는 예상 발전량을 확인하는 데서 나아가, 생산한 전력의 활용 가능성과 경제성을 판단할 수 있는 서비스가 필요합니다.</>}
            takeaway="남는 태양광의 가치를 계산하고, 더 나은 활용을 설계합니다."
            href="/solar"
            link="태양광 활용 가능성 보기"
            photo={photo("freiburg-solar")}
            credit={<>독일 프라이부르크 태양광 마을 · 사진 <a href="https://commons.wikimedia.org/wiki/File:Freiburg_071ss.jpg" target="_blank" rel="noreferrer" className="underline">Arnold Plesse</a>, <a href="https://creativecommons.org/licenses/by/3.0" target="_blank" rel="noreferrer" className="underline">CC BY 3.0</a></>}
            reverse={false}
          />
        </div>
      </section>

      <section className="rounded-[2rem] bg-[#FAF6EC] px-6 py-10 md:px-12 md:py-12">
        <h2 className="text-center break-keep text-2xl font-black tracking-[-0.03em] text-ink md:text-4xl">지금 바로 우리 집 태양광을 계산해 보세요.</h2>
        <form action="/solar" method="get" className="mt-8 flex flex-col gap-3 md:flex-row md:gap-6">
          <input
            name="q"
            required
            className="min-w-0 flex-1 rounded-2xl border-2 border-[#3D2B1F] bg-white px-5 py-4 text-base text-ink outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-[#3D2B1F]/15"
            placeholder="도로명 주소 (예: 서울 성북구 안암로 145)"
            aria-label="도로명 주소"
          />
          <button className="rounded-2xl bg-[#3D2B1F] px-8 py-4 text-lg font-bold text-white transition hover:bg-[#2C1F16] md:w-1/3">발전량 계산하기</button>
        </form>
      </section>
      </div>
    </div>
  );
}

function ReasonSection({ title, body, takeaway, href, photo, credit, reverse }: { title: React.ReactNode; body: React.ReactNode; takeaway: string; href: string; link: string; photo: string; credit?: React.ReactNode; reverse: boolean }) {
  return (
    <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-[2rem] ${reverse ? "lg:order-2" : ""}`}>
        <Image src={photo} alt="" fill unoptimized className="object-cover" />
        {credit && <p className="absolute bottom-3 left-4 rounded-full bg-black/45 px-2.5 py-1 text-[10px] leading-4 text-white/90 backdrop-blur">{credit}</p>}
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <h3 className="break-keep text-3xl font-black leading-tight tracking-[-0.035em]">{title}</h3>
        <p className="mt-5 break-keep text-base leading-8 text-ink">{body}</p>
        <p className="mt-5 border-l-4 border-[#FFD54A] pl-4 text-[1.3rem] font-bold leading-8 text-ink">{takeaway}</p>
        <Link href={href} className="btn-primary mt-8 w-full !rounded-2xl py-4 text-lg">더 자세히 알아보세요</Link>
      </div>
    </article>
  );
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <dt className="sr-only">{label}</dt>
      <dd className="text-3xl font-black tracking-tight text-[#F2C9A0] drop-shadow-[0_2px_6px_rgba(26,18,12,0.45)] md:text-[2.75rem]">{value}</dd>
      <dd className="mt-2 break-keep text-xs font-medium text-white/80 md:text-sm">{label}</dd>
    </div>
  );
}
