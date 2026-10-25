const SOCIALS: { label: string; icon: React.ReactNode }[] = [
  {
    label: "TikTok",
    icon: <path d="M14 3c.4 2.6 2 4.2 4.6 4.5v3a8 8 0 0 1-4.5-1.4v6.4A5.6 5.6 0 1 1 8.5 9.9v3.1a2.6 2.6 0 1 0 2.5 2.6V3H14z" fill="currentColor" />,
  },
  {
    label: "Instagram",
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
      </g>
    ),
  },
  {
    label: "X",
    icon: (
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M4.5 4h4.2l10.8 16h-4.2z" strokeLinejoin="round" />
        <path d="M19.5 4l-6.2 7M10.7 13l-6.2 7" />
      </g>
    ),
  },
  {
    label: "LinkedIn",
    icon: (
      <g>
        <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" />
        <path d="M7.2 10v7M7.2 7.2v.1M11 17v-7M11 13.2c0-1.9 1.2-3.2 2.8-3.2 1.6 0 2.6 1 2.6 3.1V17" stroke="#1F2328" strokeWidth="2.1" strokeLinecap="round" fill="none" />
      </g>
    ),
  },
  {
    label: "Facebook",
    icon: (
      <g>
        <circle cx="12" cy="12" r="9.5" fill="currentColor" />
        <path d="M13.2 21.4v-7.6h2.5l.4-2.9h-2.9V9.1c0-.8.3-1.4 1.4-1.4h1.6V5.2a20 20 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 3.9v1.9H7.6v2.9h2.5v7.6z" fill="#1F2328" />
      </g>
    ),
  },
  {
    label: "YouTube",
    icon: (
      <g>
        <rect x="2" y="5" width="20" height="14" rx="4.5" fill="currentColor" />
        <path d="M10 9v6l5.2-3z" fill="#1F2328" />
      </g>
    ),
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-center gap-6">
          {SOCIALS.map((s) => (
            <span key={s.label} title={`${s.label} (준비 중)`} className="text-white/90">
              <svg viewBox="0 0 24 24" className="h-8 w-8" role="img" aria-label={s.label}>{s.icon}</svg>
            </span>
          ))}
        </div>

        <p className="mt-8 text-xs font-semibold text-white/50">앱 출시 예정</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <StoreBadge
            top="Download on the"
            bottom="App Store"
            icon={<path d="M16.4 12.7c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.9-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.5-3.6zM14.2 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.8-1.3z" fill="currentColor" />}
          />
          <StoreBadge
            top="GET IT ON"
            bottom="Google Play"
            icon={
              <g>
                <path d="M4 2.8l9.6 9.2L4 21.2c-.3-.2-.5-.6-.5-1V3.8c0-.4.2-.8.5-1z" fill="#2196F3" />
                <path d="M13.6 12l2.9 2.8-11 6.3c-.5.3-1.1.3-1.5.1z" fill="#E53935" />
                <path d="M13.6 12L4 2.8c.4-.2 1-.2 1.5.1l11 6.3z" fill="#43A047" />
                <path d="M16.5 9.2l3.3 1.9c.8.5.8 1.3 0 1.8l-3.3 1.9-2.9-2.8z" fill="#FBC02D" />
              </g>
            }
          />
        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/40">
          WattWise Pi 프로젝트 포털 · 에너지AI연구센터 · On-device · No Cloud · Privacy-first
        </p>
      </div>
    </footer>
  );
}

function StoreBadge({ top, bottom, icon }: { top: string; bottom: string; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-xl border border-white/40 bg-black px-4 py-2.5">
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" aria-hidden>{icon}</svg>
      <span className="leading-tight">
        <span className="block text-[11px] font-medium text-white/90">{top}</span>
        <span className="block text-xl font-semibold tracking-tight">{bottom}</span>
      </span>
    </span>
  );
}
