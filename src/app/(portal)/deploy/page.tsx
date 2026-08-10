export default function DeployPage() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">실증 · 라즈베리파이 구성도</h1>
          <p className="text-sm text-slate-500">Pi 5 + CT 센서 기반 온디바이스 실증 아키텍처</p>
        </div>
        <a href="/dash/pi-setup.html" target="_blank" rel="noreferrer" className="btn-ghost text-xs">새 창에서 열기 ↗</a>
      </div>
      <iframe
        src="/dash/pi-setup.html"
        title="실증 구성도"
        className="w-full rounded-xl border border-slate-200 bg-white"
        style={{ height: "calc(100vh - 200px)", minHeight: 560 }}
      />
    </section>
  );
}
