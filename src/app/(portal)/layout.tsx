import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import ChatWidget from "@/components/ChatWidget";
import { currentUser } from "@/lib/auth";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = currentUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen">
      <Nav user={{ name: user.name, role: user.role }} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        WattWise Pi 프로젝트 포털 · 에너지AI연구센터 · On-device · No Cloud · Privacy-first
      </footer>
      <ChatWidget />
    </div>
  );
}
