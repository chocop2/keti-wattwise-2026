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
            이상탐지 · <span className="text-teal">오토인코더</span>로 위험 신호 잡기
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
            정답이 붙어 있지 않은 문제이므로, <b>평소 전력 패턴만 학습해</b> 거기서 벗어나면 잡아내는 방식입니다.
            정상·응급·예외로 나누고, 출장·여행 같은 예외는 사후에 확인해 헛알림을 줄입니다.
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
              가전기기 전력 사용량 데이터로 &lsquo;정상 생활 패턴&rsquo;을 폭넓게 학습합니다.
              train / holdout으로 나누어 <b>처음 보는 가구</b>에서도 재현되는지 검증합니다.
            </p>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <span className="badge bg-amber-soft text-amber">자체 실측</span>
              <span className="font-bold">자취방 직접 계측</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              라즈베리파이와 CT센서로 <b>실제 1인가구</b> 전력을 직접 수집합니다(자세한 내용은 &lsquo;자취방 실증&rsquo; 페이지).
              한국 1인가구를 이만큼 촘촘히 잰 데이터는 흔치 않습니다.
            </p>
          </div>
        </div>
      </section>

      {/* 오토인코더 파이프라인 */}
      <section>
        <h2 className="section-title">2. 오토인코더는 이렇게 작동한다</h2>
        <p className="mt-1 text-sm text-slate-500">평소 패턴을 &lsquo;압축했다 복원&rsquo;하도록 학습합니다. 이상이 오면 복원이 어긋납니다.</p>
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
              모델은 평소 모습만 잘 복원하도록 학습했습니다. 그러다 TV·조명이 종일 켜져 있거나 요리·활동이 갑자기 끊기면,
              평소와 달라 <b>복원이 크게 어긋납니다</b>. 그 어긋난 정도가 곧 이상 신호가 됩니다.
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
            출장·여행 같은 예외는 곧바로 경보하지 않고 사후에 확인합니다. 예를 들어
            <i> &ldquo;3일째 사용량이 크게 줄었는데 외출 중이신가요?&rdquo;</i>라고 묻는 방식입니다. 잘못 울리면 그만큼 복지 인력이 헛걸음하므로,
            <b> 헛알림 비율(오탐률)</b>도 탐지 정확도·속도와 함께 관리합니다.
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
          실제 데이터를 아직 충분히 모으지 못해, <b>1인가구 전력을 비슷하게 만든 합성 데이터</b>로 오토인코더를 학습시키고
          이상 상황 4가지를 넣어 성능을 측정했습니다. 실측 검증은 다음 단계입니다.
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
