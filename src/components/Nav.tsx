"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/chat", label: "챗봇" },
  { href: "/", label: "소개" },
  { href: "/why", label: "필요성" },
  { href: "/anomaly", label: "이상탐지" },
  { href: "/households", label: "스마트홈 진단" },
  { href: "/analytics", label: "전력 분석" },
  { href: "/solar", label: "태양광·거래" },
];

// 개발 과정 — 드롭다운으로 묶는 하위 페이지
const DEV_LINKS = [
  { href: "/data", label: "데이터" },
  { href: "/forecast", label: "예측" },
  { href: "/deploy", label: "자취방 실증" },
];

export default function Nav({ user }: { user: { name: string; role: string } }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const devActive = DEV_LINKS.some((l) => path.startsWith(l.href));
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-forest-800/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
        <Link href="/" className="mr-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-leaf text-xs font-black text-white">
            W
          </div>
          <span className="text-sm font-extrabold tracking-tight text-white">WattWisePi</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-0.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`navlink ${active(l.href) ? "navlink-active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          {/* 개발 과정 드롭다운 */}
          <div className="group relative">
            <button className={`navlink ${devActive ? "navlink-active" : ""}`}>
              개발 과정 ▾
            </button>
            <div className="absolute left-0 top-full z-50 hidden min-w-[150px] pt-1 group-hover:block">
              <div className="rounded-xl border border-white/10 bg-forest-700 p-1 shadow-pop">
                {DEV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active(l.href)
                        ? "bg-white/10 font-semibold text-white"
                        : "text-sage/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-sage/60 sm:inline">
            {user.role} · {user.name}
          </span>
          <form action={logout}>
            <button className="btn-ghost !px-2.5 !py-1 text-xs">로그아웃</button>
          </form>
        </div>
      </div>
    </header>
  );
}
