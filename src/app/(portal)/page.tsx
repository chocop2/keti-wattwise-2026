import Image from "next/image";
import Link from "next/link";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const photo = (name: string) => `${BP}/img/photos/${name}.jpg`;

export default function Home() {
  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
      <section className="relative min-h-[640px] overflow-hidden bg-[#FAF6EC] lg:min-h-[700px]">
        <Image src={photo("family-kitchen")} alt="" fill unoptimized className="hidden scale-110 object-cover blur-2xl lg:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#FAF6EC]/70 via-[#FAF6EC]/45 to-[#FAF6EC]/15 lg:block" />
        <div className="absolute inset-0 lg:left-[30%] lg:[mask-image:linear-gradient(to_right,transparent,black_20%)]">
          <Image src={photo("family-kitchen")} alt="주방에 모여 사진을 함께 보는 가족" fill priority unoptimized className="object-cover object-[60%_30%] lg:object-[35%_40%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6EC] via-[#FAF6EC]/90 via-45% to-transparent lg:hidden" />
        </div>
        <p className="absolute bottom-3 right-4 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[10px] leading-4 text-white/90 backdrop-blur">사진 <a href="https://commons.wikimedia.org/wiki/File:A_family_gathered_in_the_kitchen_at_home_looking_at_photographs_(16308914556).jpg" target="_blank" rel="noreferrer" className="underline">Personal Creations</a>, <a href="https://creativecommons.org/licenses/by/2.0" target="_blank" rel="noreferrer" className="underline">CC BY 2.0</a></p>
        <div className="relative mx-auto flex min-h-[640px] max-w-6xl items-end px-4 pb-14 pt-10 lg:min-h-[700px] lg:items-center lg:py-12">
          <div className="max-w-xl">
            <h1 className="break-keep text-4xl font-black leading-[1.35] tracking-[-0.03em] text-ink md:text-5xl md:leading-[1.35] lg:text-[3.4rem]">
              <span className="glow-brown">전기요금</span>부터<br /><span className="glow-brown">에너지 효율</span>까지<br />스마트하게
            </h1>
            <p className="mt-6 break-keep text-base font-semibold leading-8 text-ink md:text-lg">
              전력 사용량부터 예상 전기요금까지,<br />에너지 사용 현황을 한눈에 확인하세요.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/households" className="btn !rounded-full bg-[#3D2B1F] px-7 py-3.5 text-base text-white hover:bg-[#2C1F16]">우리 집 진단 시작</Link>
              <Link href="/analytics" className="btn !rounded-full border border-[#3D2B1F]/25 bg-white/60 px-7 py-3.5 text-base text-[#3D2B1F] hover:bg-white">요금 예측 보기</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="flex items-center justify-center gap-3 text-4xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-[2.75rem]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-10 md:w-10" fill="#3D2B1F" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
          WattWise Point
          <svg viewBox="0 0 24 24" className="h-8 w-8 md:h-10 md:w-10" fill="#3D2B1F" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <Tile href="/analytics" image={photo("kitchen-laptop")} title="사용량·요금 예측" body="내일 24시간 사용량과 이번 달 예상 요금" />
          <Tile href="/households" image={photo("feature-kettle")} title="가족 안부 확인" body="평소와 다른 생활 신호를 먼저 알림" />
          <Tile href="/solar" image={photo("solar-roof")} title="태양광 설치 계산" body="우리 집 발전량과 투자 회수 기간" />
          <Tile href="/trade" image={photo("power-lines")} title="남는 전기 거래" body="잉여 전력을 파는 과정 체험" />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl space-y-16 px-4 pb-6 md:space-y-24">
          <Feature
            image={photo("feature-app")}
            alt="휴대폰과 노트북에 띄운 가전별 전력 사용량 대시보드"
            title={<>이번 달 전기요금,<br />미리 예측하고 아껴 보세요</>}
            points={["내일 24시간 전력 사용량을 시간대별로 예측", "누진 구간까지 남은 사용량을 확인", "에어컨·TV·세탁기 등 주요 가전의 전력 소비를 분석"]}
            actions={[{ href: "/analytics", label: "요금 예측 보기" }]}
          />

          <Feature
            reverse
            image={photo("feature-kettle")}
            alt="거실 탁자 위 전기포트와 TV를 보며 차를 마시는 사람"
            title={<>멀리 있어도,<br />부모님의 일상을 살펴보세요</>}
            points={["집 안 기기의 전력 사용 패턴을 학습", "TV·전기포트 등의 활동 변화가 감지되면 알림", "전력 데이터는 집 안에서 처리해 개인정보를 보호"]}
            actions={[{ href: "/households", label: "안부 신호 보기" }]}
          />

          <Feature
            image={photo("feature-solar-house")}
            alt="지붕에 태양광 패널을 얹은 단독주택"
            title={<>우리 집 태양광,<br />얼마나 이득일까요?</>}
            points={["주소와 지붕 조건을 바탕으로 연간 발전량을 예측", "예상 설치비와 투자 회수 기간을 확인", "남는 전력의 판매 과정을 직접 체험"]}
            actions={[{ href: "/solar", label: "태양광 계산하기" }, { href: "/trade", label: "거래 체험", ghost: true }]}
          />
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid items-center gap-6 rounded-[2rem] bg-[#FAF6EC] px-6 py-10 md:grid-cols-[auto_1fr] md:gap-10 md:px-12 md:py-12">
          <div className="relative mx-auto h-40 w-36 md:h-52 md:w-44">
            <Image src={`${BP}/img/wattwise-ai-consultant.png`} alt="전력 AI 상담사 와티" fill unoptimized className="object-contain drop-shadow-xl" />
          </div>
          <div>
            <h2 className="break-keep text-center text-2xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-left md:text-4xl">궁금한 건 와티에게 물어보세요</h2>
            <form action="/chat" method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                name="q"
                required
                className="min-w-0 flex-1 rounded-2xl border-2 border-[#3D2B1F] bg-white px-5 py-4 text-base text-ink outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-[#3D2B1F]/15"
                placeholder="예: 이번 달 전기요금 얼마나 나올까?"
                aria-label="와티에게 물어볼 질문"
              />
              <button className="rounded-2xl bg-amber px-8 py-4 text-lg font-bold text-white transition hover:brightness-105 sm:w-auto">물어보기</button>
            </form>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              {["에어컨 하루에 얼마나 써?", "누진 구간 언제 넘어?", "전기 절약 팁 알려줘"].map((q) => (
                <Link key={q} href={`/chat?q=${encodeURIComponent(q)}`} className="rounded-full border border-[#3D2B1F]/20 bg-white px-4 py-2 text-sm text-[#3D2B1F] transition hover:border-[#3D2B1F]">{q}</Link>
              ))}
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}

function Tile({ href, image, title, body }: { href: string; image: string; title: string; body: string }) {
  return (
    <Link href={href} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#3D2B1F]/20 hover:shadow-[0_18px_40px_-12px_rgba(61,43,31,0.25)]">
      <div className="relative aspect-[4/3] overflow-hidden"><Image src={image} alt="" fill unoptimized className="object-cover transition duration-500 group-hover:scale-105" /></div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="text-base font-black text-ink md:text-lg">{title}</div>
        <div className="mt-1 break-keep text-xs leading-5 text-slate-500 md:text-sm md:leading-6">{body}</div>
        <div className="mt-auto pt-4 text-sm font-bold text-[#3D2B1F]">
          자세히 보기 <span className="inline-block transition group-hover:translate-x-1" aria-hidden>→</span>
        </div>
      </div>
    </Link>
  );
}

function Feature({ image, alt, credit, title, points, actions, reverse }: { image: string; alt: string; credit?: React.ReactNode; title: React.ReactNode; points: string[]; actions: { href: string; label: string; ghost?: boolean }[]; reverse?: boolean }) {
  return (
    <article className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={`relative aspect-[4/3] overflow-hidden rounded-[2rem] ${reverse ? "lg:order-2" : ""}`}>
        <Image src={image} alt={alt} fill unoptimized className="object-cover" />
        {credit && <p className="absolute bottom-3 left-4 rounded-full bg-black/45 px-2.5 py-1 text-[10px] leading-4 text-white/90 backdrop-blur">{credit}</p>}
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <h2 className="break-keep text-3xl font-black leading-[1.2] tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">{title}</h2>
        <ul className="mt-6 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-base font-medium leading-7 text-black">
              <svg viewBox="0 0 24 24" className="mt-1 h-5 w-5 shrink-0 text-teal" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12.5l5 5L20 6.5" /></svg>
              <span className="break-keep">{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className={`${a.ghost ? "btn-ghost" : "btn-primary"} flex-1 !rounded-2xl py-4 text-lg`}>{a.label}</Link>
          ))}
        </div>
      </div>
    </article>
  );
}
