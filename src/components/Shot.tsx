"use client";

import { useEffect, useRef, useState } from "react";

export default function Shot({
  src,
  caption,
  h = "h-56",
}: {
  src: string;
  caption: string;
  h?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"load" | "ok" | "err">("load");

  // 하이드레이션 전에 이미 로드/실패한 이미지도 반영
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete) setState(el.naturalWidth > 0 ? "ok" : "err");
  }, []);

  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <div className={`relative ${h} w-full bg-slate-50`}>
        {state !== "ok" && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-slate-400">
            <div className="px-3">
              <div className="text-2xl">📷</div>
              <div className="mt-1">{caption}</div>
              {state === "err" && <div className="mt-1 text-[10px] text-slate-300">사진 파일 대기 중</div>}
            </div>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ref}
          src={src}
          alt={caption}
          onLoad={() => setState("ok")}
          onError={() => setState("err")}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${state === "ok" ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}
