"use client";

import { useState } from "react";

export default function Shot({
  src,
  caption,
  h = "h-56",
}: {
  src: string;
  caption: string;
  h?: string;
}) {
  const [err, setErr] = useState(false);
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      {!err ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={caption}
          className={`${h} w-full object-cover`}
          onError={() => setErr(true)}
        />
      ) : (
        <div className={`flex ${h} w-full items-center justify-center bg-slate-50 text-center text-xs text-slate-400`}>
          <div className="px-3">
            <div className="text-2xl">📷</div>
            <div className="mt-1">{caption}</div>
            <div className="mt-1 text-[10px] text-slate-300">사진 파일 대기 중</div>
          </div>
        </div>
      )}
      <figcaption className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}
