export default function ForecastPage() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">예측 시각화</h1>
          <p className="text-sm text-slate-500">모델 4종(WattCast·GBM·NGBoost 등) + 분위수 밴드 확률 예측</p>
        </div>
        <a href="/dash/forecast.html" target="_blank" rel="noreferrer" className="btn-ghost text-xs">새 창에서 열기 ↗</a>
      </div>
      <iframe
        src="/dash/forecast.html"
        title="예측 시각화"
        className="w-full rounded-xl border border-slate-200 bg-white"
        style={{ height: "calc(100vh - 200px)", minHeight: 560 }}
      />
    </section>
  );
}
