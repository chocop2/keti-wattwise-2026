function HeroBg() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(150deg, #FBF3DE 0%, #F7FAFB 45%, #E1F5F7 100%)" }}
      />
      <div className="absolute -left-10 -top-14 h-56 w-56 rounded-full bg-amber opacity-20 blur-3xl" />
      <div className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-teal opacity-20 blur-3xl" />
    </div>
  );
}

function HeroArt({ h = "h-72 md:h-80 lg:h-96" }: { h?: string }) {
  return (
    <div className={`relative ${h} w-full`}>
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
      <g transform="translate(200,150) scale(1.35) translate(-200,-150)">
        <path
          d="M70 230 Q140 150 200 190 T330 130"
          fill="none"
          stroke="#0A9AA8"
          strokeWidth="2"
          strokeDasharray="2 8"
          strokeLinecap="round"
          opacity="0.6"
        />
        <circle cx="330" cy="130" r="4" fill="#0A9AA8" />
        <circle cx="200" cy="190" r="3" fill="#0A9AA8" opacity="0.7" />
        <g transform="translate(120,120)">
          <rect x="-6" y="52" width="92" height="6" rx="2" fill="#1F2328" opacity="0.15" />
          <path d="M0 60 V20 L40 -10 L80 20 V60 Z" fill="#ffffff" stroke="#1F2328" strokeWidth="2.5" strokeLinejoin="round" />
          <g transform="translate(10,-2) rotate(-18)">
            <rect x="0" y="0" width="46" height="26" rx="2" fill="#0A9AA8" opacity="0.85" />
            <line x1="0" y1="8.6" x2="46" y2="8.6" stroke="#E1F5F7" strokeWidth="1" />
            <line x1="0" y1="17.2" x2="46" y2="17.2" stroke="#E1F5F7" strokeWidth="1" />
            <line x1="15.3" y1="0" x2="15.3" y2="26" stroke="#E1F5F7" strokeWidth="1" />
            <line x1="30.6" y1="0" x2="30.6" y2="26" stroke="#E1F5F7" strokeWidth="1" />
          </g>
          <path d="M44 26 L28 46 H40 L26 68 L54 42 H42 Z" fill="#E39A00" />
        </g>
        <g transform="translate(300,60)" opacity="0.9">
          <circle cx="0" cy="0" r="16" fill="#FBF3DE" stroke="#E39A00" strokeWidth="2" />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * Math.PI) / 4;
            const x1 = Math.cos(a) * 22, y1 = Math.sin(a) * 22;
            const x2 = Math.cos(a) * 28, y2 = Math.sin(a) * 28;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E39A00" strokeWidth="2" strokeLinecap="round" />;
          })}
        </g>
      </g>
      </svg>
    </div>
  );
}

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

function CardWatermark({ variant }: { variant: "clock" | "sun" | "data" }) {
  const cls = "pointer-events-none absolute -right-5 -bottom-5 h-32 w-32 opacity-[0.07]";
  if (variant === "clock") {
    return (
      <svg viewBox="0 0 100 100" className={cls} aria-hidden>
        <circle cx="50" cy="50" r="42" fill="none" stroke="#0A9AA8" strokeWidth="6" />
        <line x1="50" y1="50" x2="50" y2="24" stroke="#0A9AA8" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="50" x2="70" y2="60" stroke="#0A9AA8" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  if (variant === "sun") {
    return (
      <svg viewBox="0 0 100 100" className={cls} aria-hidden>
        <circle cx="50" cy="50" r="22" fill="none" stroke="#E39A00" strokeWidth="6" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const x1 = 50 + Math.cos(a) * 32, y1 = 50 + Math.sin(a) * 32;
          const x2 = 50 + Math.cos(a) * 44, y2 = 50 + Math.sin(a) * 44;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E39A00" strokeWidth="6" strokeLinecap="round" />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={cls} aria-hidden>
      <circle cx="30" cy="70" r="6" fill="#0A9AA8" />
      <circle cx="55" cy="45" r="6" fill="#0A9AA8" />
      <circle cx="80" cy="60" r="6" fill="#0A9AA8" />
      <circle cx="70" cy="25" r="6" fill="#0A9AA8" />
      <path d="M30 70 L55 45 L80 60 L70 25" fill="none" stroke="#0A9AA8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CASES = [
  {
    title: "전기는 이제 ‘언제 쓰느냐’가 중요",
    body: ["유럽에서는 시간에 따라 전기요금이 달라지고,", "남는 태양광 전력을 판매하는 가정도 늘고 있음"],
    watermark: "clock" as const,
  },
  {
    title: "태양광으로 수익 창출",
    body: ["생산한 전력을 언제 사용하고, 얼마나 남기고,", "어떻게 활용하느냐에 따라 경제성이 달라짐"],
    watermark: "sun" as const,
  },
  {
    title: "한국도 전력 데이터를 활용 가능",
    body: ["AMI 구축으로 가정의 전력 데이터를 활용할 기반은 충분 이제 이 데이터를 실제 절감과 의사결정으로 연결해야 함"],
    watermark: "data" as const,
  },
];

const ROLES = [
  {
    eng: "Trade",
    color: "text-amber",
    border: "border-amber/50",
    bg: "bg-amber-soft",
    sub: "전력 거래",
    title: "더 유리한 시간에 전력을 활용하세요",
    body: ["전력 가격과 태양광 발전량을 확인하고", "구매·판매 시점을 판단할 수 있습니다."],
  },
  {
    eng: "Save",
    color: "text-teal",
    border: "border-teal/50",
    bg: "bg-teal-soft",
    sub: "전기요금 절감",
    title: "이번 달 전기요금을 미리 확인하세요",
    body: ["예상 사용량과 누진 구간을 분석해", "요금이 크게 늘기 전에 알려드립니다."],
  },
  {
    eng: "Protect",
    color: "text-danger",
    border: "border-danger/50",
    bg: "bg-danger-soft",
    sub: "이상 사용 감지",
    title: "평소와 다른 전력 사용을 찾아냅니다",
    body: ["가전별 전력 패턴을 분석해", "평소와 다른 사용이 발생하면 알려드립니다."],
  },
];

export default function Home() {
  return (
    <div className="space-y-12">
      {/* 히어로 */}
      <section className="card relative overflow-hidden">
        <HeroBg />
        <div className="relative grid gap-6 px-8 py-6 md:grid-cols-[1.45fr_1fr] md:px-10 md:py-7">
          <div className="self-center">
            <div className="badge bg-amber-soft text-amber">
              ① 사회문제 해결을 위한 AI · 융합·응용기술 아이디어
            </div>
            <p className="mt-1.5 text-base font-semibold text-slate-500">
              WattWise Pi — 엣지 AI 기반 가정용 전력 예측·맞춤형 절전 비서
            </p>
            <h1 className="mt-3 whitespace-nowrap text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-[2.1rem] lg:text-[2.6rem] xl:text-[2.9rem]">
              우리 집 전력, <span className="text-amber">한눈에</span> 보고 <span className="text-teal">똑똑하게</span> 관리하세요
            </h1>
            <div className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              <p className="text-xl font-bold text-ink">사용량 확인부터 태양광 수익 계산까지</p>
              <ul className="mt-1.5 space-y-1">
                <li>· 지금 우리 집은 전기를 얼마나 쓰고 있을까요?</li>
                <li>· 태양광을 설치하면 전기요금은 얼마나 줄어들까요?</li>
                <li>· 남는 전력은 판매하면 얼마를 받을 수 있을까요?</li>
              </ul>
              <p className="mt-2 font-bold">전력 데이터를 바탕으로 절감액과 예상 수익을 직접 확인해보세요.</p>
            </div>
          </div>
          <div className="self-center">
            <HeroArt h="h-64 md:h-72 lg:h-80" />
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section>
        <div className="eyebrow !text-ink text-center text-2xl normal-case tracking-normal md:text-3xl">전력 관리, 한곳에서</div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.eng} className={`card border-t-4 p-6 ${r.border}`}>
              <div className={`text-base font-bold ${r.color}`}>{r.sub}</div>
              <div className="mt-2 text-[1.05rem] font-bold text-ink">{r.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {r.body.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < r.body.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 전력은 이제 사고파는 것 */}
      <section>
        <h2 className="section-title text-center text-2xl md:text-3xl">전력을 사고파는 시대가 시작됐습니다</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CASES.map((c) => (
            <div key={c.title} className="card relative overflow-hidden p-6 text-center">
              <CardWatermark variant={c.watermark} />
              <div className="relative text-lg font-bold text-ink">{c.title}</div>
              <p className="relative mt-1.5 text-sm leading-relaxed text-slate-500">
                {c.body.map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < c.body.length - 1 && <br />}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
