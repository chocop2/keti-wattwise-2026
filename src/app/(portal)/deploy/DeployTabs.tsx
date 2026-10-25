"use client";

import { type ReactNode, useEffect, useState } from "react";

export type DeployTab = { id: string; label: string; content: ReactNode };

// 탭 상태를 주소의 #해시에 담아 새로고침·공유 시에도 같은 탭이 열리게 한다.
export default function DeployTabs({ tabs }: { tabs: DeployTab[] }) {
  const [active, setActive] = useState(tabs[0].id);

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (tabs.some((tab) => tab.id === fromHash)) setActive(fromHash);
  }, [tabs]);

  function select(id: string) {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="space-y-10">
      <div role="tablist" aria-label="실증 구역" className="flex flex-wrap justify-center gap-2 md:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => select(tab.id)}
            className={`rounded-full border-2 px-5 py-2.5 text-base font-bold transition md:px-7 md:py-3 md:text-lg ${active === tab.id ? "border-[#3D2B1F] bg-[#3D2B1F] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#3D2B1F]/50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={active !== tab.id} className="space-y-20">
          {tab.content}
        </div>
      ))}
    </div>
  );
}
