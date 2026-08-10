export default function DataPage() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">데이터 벤치마크</h1>
          <p className="text-sm text-slate-500">89가구 실측 전력 데이터 탐색 — 패턴·분포·계절성</p>
        </div>
        <a href="/dash/benchmark.html" target="_blank" rel="noreferrer" className="btn-ghost text-xs">새 창에서 열기 ↗</a>
      </div>
      <iframe
        src="/dash/benchmark.html"
        title="데이터 벤치마크"
        className="w-full rounded-xl border border-slate-200 bg-white"
        style={{ height: "calc(100vh - 200px)", minHeight: 560 }}
      />
    </section>
  );
}
