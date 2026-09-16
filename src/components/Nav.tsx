"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/chat", label: "챗봇" },
  { href: "/why", label: "소개" },
  { href: "/analytics", label: "전력 대시보드" },
  { href: "/solar", label: "태양광·거래" },
  { href: "/households", label: "스마트홈 진단" },
];

// 개발 과정 — 드롭다운으로 묶는 하위 페이지
const DEV_LINKS = [
  { href: "/data", label: "데이터" },
  { href: "/forecast", label: "예측" },
  { href: "/deploy", label: "실증" },
];

export default function Nav({ user }: { user: { name: string; role: string } }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-1 px-4 py-2 lg:flex-nowrap lg:py-0">
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs font-black text-white">
            W
          </div>
          <span className="text-sm font-extrabold tracking-tight">WattWisePi</span>
        </Link>
        <nav className="order-3 flex w-full flex-wrap items-center gap-0.5 lg:order-none lg:w-auto lg:flex-1">
          {LINKS.map((l) => l.href === "/solar" ? (
            <NavDropdown key={l.href} label="태양광·거래" links={[{ href: "/solar", label: "태양광" }, { href: "/trade", label: "거래" }]} path={path} />
          ) : (
            <Link
              key={l.href}
              href={l.href}
              className={`navlink ${active(l.href) ? "navlink-active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <NavDropdown label="개발 과정" links={DEV_LINKS} path={path} />
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-slate-500 sm:inline">
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

function NavDropdown({ label, links, path }: { label: string; links: { href: string; label: string }[]; path: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <div ref={ref} className="group relative" onKeyDown={(event) => {
      if (event.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    }} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className={`navlink ${links.some((link) => path.startsWith(link.href)) ? "navlink-active" : ""}`}>
        {label} ▾
      </button>
      <div className={`absolute right-0 top-full z-50 min-w-[150px] pt-1 ${open ? "block" : "hidden group-hover:block"}`}>
        <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={path === link.href ? "page" : undefined} className={`block rounded-lg px-3 py-2 text-sm ${path.startsWith(link.href) ? "bg-slate-100 font-semibold text-ink" : "text-slate-600 hover:bg-slate-50"}`}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
