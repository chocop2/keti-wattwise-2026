import Nav from "@/components/Nav";

// 정적(HTML) 빌드용 — 로그인/서버 인증 없이 바로 렌더
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = { name: "게스트", role: "데모" };
  return (
    <div className="min-h-screen">
      <Nav user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        WattWise Pi 프로젝트 포털 · 에너지AI연구센터 · On-device · No Cloud · Privacy-first
      </footer>
    </div>
  );
}
