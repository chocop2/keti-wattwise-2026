function Photo({ label, h = "h-44" }: { label: string; h?: string }) {
  return (
    <div className={`flex ${h} w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-400`}>
      <div>
        <div className="text-2xl">🖼️</div>
        <div className="mt-1">{label}</div>
      </div>
    </div>
  );
}

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const STEPS = [
  { t: "전력 시계열 입력", d: "1분 단위 사용량·가전 신호", c: "bg-slate-100 text-slate-700" },
  { t: "인코더", d: "핵심 패턴만 압축", c: "bg-teal-soft text-teal" },
  { t: "잠재 표현", d: "그 가구의 &lsquo;평소&rsquo;", c: "bg-ink text-white" },
  { t: "디코더", d: "패턴 복원", c: "bg-teal-soft text-teal" },
  { t: "복원 오차", d: "= 이상 점수", c: "bg-amber-soft text-amber" },
];

const CLASSES = [
  { k: "정상", d: "복원 오차 낮음 — 평소와 같음", c: "border-ok text-ok", tag: "bg-ok-soft text-ok" },
  { k: "응급 의심", d: "오차 급증 + 활동 신호 소실이 지속", c: "border-danger text-danger", tag: "bg-danger-soft text-danger" },
  { k: "예외", d: "오차는 크지만 출장·여행 패턴 → 사후 알림으로 확인", c: "border-amber text-amber", tag: "bg-amber-soft text-amber" },
];

export default function AnomalyPage() {
  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <section className="card overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="badge bg-teal-soft text-teal">방법론</div>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            이상탐지 — <span className="text-teal">오토인코더</span>로 응급상황을 분류한다
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            정답 라벨이 없는 문제에서, <b>&lsquo;정상&rsquo; 전력 패턴만 학습</b>해 벗어남을 잡습니다.
            응급/정상/예외를 나누고, 예외(출장·여행)는 사후 알림으로 걸러 오탐을 줄입니다.
          </p>
        </div>
      </section>

      {/* 데이터셋 */}
      <section>
        <h2 className="section-title">1. 어떤 데이터로 배우나</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="badge bg-slate-100 text-slate-600">공개 데이터</span>
              <span className="font-bold">AI Hub NILM · 110가구</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              가전기기 전력 사용량 데이터로 &lsquo;정상 생활 패턴&rsquo;을 폭넓게 학습.
              train / holdout으로 나눠 <b>처음 보는 가구</b>에서도 재현되는지 검증.
            </p>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="badge bg-amber-soft text-amber">자체 실측</span>
              <span className="font-bold">자취방 직접 계측</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              라즈베리파이 + CT센서로 <b>실제 1인가구</b> 전력을 직접 수집(자세히는 &lsquo;자취방 실증&rsquo; 페이지).
              한국 1인가구 고해상도 실측은 <b>우리만의 데이터 자산</b>.
            </p>
          </div>
        </div>
      </section>

      {/* 오토인코더 파이프라인 */}
      <section>
        <h2 className="section-title">2. 오토인코더는 이렇게 작동한다</h2>
        <p className="mt-1 text-sm text-slate-500">평소를 &lsquo;압축했다 복원&rsquo;하도록 배운다. 이상이 오면 복원이 어긋난다.</p>
        <div className="mt-5 flex flex-wrap items-stretch gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`min-w-[128px] rounded-xl px-4 py-3 text-center ${s.c}`}>
                <div className="text-sm font-bold" dangerouslySetInnerHTML={{ __html: s.t }} />
                <div className="mt-0.5 text-[11px] opacity-80" dangerouslySetInnerHTML={{ __html: s.d }} />
              </div>
              {i < STEPS.length - 1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.1fr]">
          <div className="card p-6">
            <div className="font-bold">왜 복원 오차가 이상 신호인가</div>
            <p className="mt-1 text-sm text-slate-500">
              모델은 &lsquo;정상&rsquo;만 잘 복원하도록 학습됐다. TV·조명이 종일 켜진 채 방치되거나,
              취사·활동 부하가 통째로 사라지면 <b>평소와 달라 복원이 크게 틀리고</b>, 그 오차가 이상 점수로 튄다.
            </p>
          </div>
          <div className="card self-center p-3">
            <img src={`${BP}/anomaly/recon_compare.png`} alt="정상 vs 이상 복원 비교" className="w-full rounded-lg" />
            <div className="px-1 pt-2 text-center text-xs text-slate-400">정상은 AE가 잘 복원(오차↓), 이상은 크게 어긋남(오차↑)</div>
          </div>
        </div>
      </section>

      {/* 3분류 */}
      <section>
        <h2 className="section-title">3. 응급상황 분류 — 정상 / 응급 / 예외</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CLASSES.map((c) => (
            <div key={c.k} className={`card border-l-4 p-5 ${c.c.split(" ")[0]}`}>
              <span className={`chip ${c.tag}`}>{c.k}</span>
              <p className="mt-2 text-sm text-slate-600">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 card bg-ink p-6 text-white">
          <div className="text-sm font-semibold text-amber">오탐 설계</div>
          <p className="mt-1 text-sm leading-relaxed text-white/85">
            예외(출장·여행)는 즉시 경보하지 않고 <b>사후 알림</b>으로 확인받는다. 예:
            <i> &ldquo;3일간 사용량이 급감했어요. 외출 중이신가요?&rdquo;</i> — 오탐은 곧 복지 인력의 헛출동 비용이므로,
            <b> 오탐률(FPR)</b>을 탐지 F1·리드타임과 함께 핵심 지표로 관리한다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="chip bg-white/15 text-white">지표 · 탐지 F1</span>
            <span className="chip bg-white/15 text-white">리드타임(얼마나 빨리)</span>
            <span className="chip bg-white/15 text-white">오탐률(FPR)</span>
          </div>
        </div>
      </section>

      {/* 4. 실험 결과 */}
      <section>
        <h2 className="section-title">4. 실험 결과 — 합성 자취방 데이터로 검증 (PoC)</h2>
        <p className="mt-1 text-sm text-slate-500">
          실측 데이터 확보 전, <b>1인가구 전력을 합성 생성</b>해 오토인코더를 학습하고 이상 4종을 주입해 성능을 확인했다.
          (실데이터 검증은 다음 단계)
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[["F1 점수", "0.90"], ["재현율", "0.93"], ["오탐률(FPR)", "0.10"], ["리드타임", "1일"]].map(([k, v]) => (
            <div key={k} className="card p-5 text-center">
              <div className="stat text-teal">{v}</div>
              <div className="mt-1 text-sm text-slate-500">{k}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 card p-4">
          <div className="px-2 pt-1 text-sm font-bold">재구성 오차 = 이상 점수 — 정상은 낮고, 이상은 임계 초과</div>
          <img src={`${BP}/anomaly/error_timeline.png`} alt="재구성 오차 타임라인" className="mt-2 w-full rounded-lg" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card p-4">
            <div className="px-2 pt-1 text-sm font-bold">오차 분포 — 정상 vs 이상 분리</div>
            <img src={`${BP}/anomaly/error_dist.png`} alt="오차 분포" className="mt-2 w-full rounded-lg" />
          </div>
          <div className="card p-5">
            <div className="font-bold">읽는 법</div>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-500">
              <li>· 활동정지(고독사형) 5일 에피소드를 <b>첫날 탐지</b> — 리드타임 1일</li>
              <li>· 정상일은 대부분 임계 아래 → 오탐률 10%</li>
              <li>· <b>라벨 없이</b>, &lsquo;정상&rsquo;만 학습해서 얻은 결과</li>
              <li className="text-slate-400">· 합성 데이터 기반 PoC — 실측 검증은 다음 단계</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
