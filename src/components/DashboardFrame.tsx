"use client";

import { useEffect, useRef, useState } from "react";

type DashboardFrameProps = {
  src: string;
  title: string;
};

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// 사이트 안에 넣었을 때만 덧입히는 스타일. 원본 HTML(단독 창)과 차트 색·데이터는 그대로 둔다.
const EMBED_CSS = `
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");
:root{color-scheme:light}
.viz,.viz *{font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif}
.viz{--page:#ffffff!important;--surface:#ffffff!important;--ink:#1F2328!important;--ink2:#52514e!important;--border:rgba(11,11,11,.09)!important;--grid:#e1e0d9!important}
body{padding:0!important;background:#fff!important}
h1{font-size:34px!important;font-weight:900;letter-spacing:-.03em;color:#3D2B1F;margin-bottom:10px!important}
.sub{font-size:15px!important;color:#52514e;margin-bottom:22px!important;line-height:1.6}
.row{gap:10px!important;margin-bottom:18px!important}
select,button{font-size:14px!important;padding:9px 16px!important;border-radius:999px!important;border:1.5px solid rgba(11,11,11,.12)!important;background:#fff!important;transition:border-color .15s}
select:hover,button:hover{border-color:#3D2B1F!important}
button.on{outline:none!important;border-color:#3D2B1F!important;background:#FAF6EC!important;font-weight:700}
.tiles{gap:12px!important;margin-bottom:18px!important}
.tile{border-radius:20px!important;padding:14px 20px!important;min-width:140px!important}
.tile .k{font-size:12px!important;color:#898781}
.tile .v{font-size:22px!important;font-weight:800!important;color:#3D2B1F}
.card{border-radius:24px!important;padding:22px!important;margin-bottom:18px!important}
.card > b{display:block;font-size:17px!important;font-weight:800;color:#3D2B1F;letter-spacing:-.02em;margin-bottom:6px}
.leg{font-size:13px!important}
.note{font-size:12px!important}
table{font-size:13px!important}
`;

function decorate(doc: Document) {
  doc.getElementById("wwBackBtn")?.remove();
  if (!doc.getElementById("ww-embed-style")) {
    const style = doc.createElement("style");
    style.id = "ww-embed-style";
    style.textContent = EMBED_CSS;
    doc.head.appendChild(style);
  }
  const h1 = doc.querySelector("h1");
  if (h1 && !h1.dataset.decorated) {
    const text = h1.textContent ?? "";
    const first = text.search(/[A-Za-z0-9가-힣]/);
    h1.textContent = text.slice(Math.max(0, first)).trim();
    h1.dataset.decorated = "1";
  }
}

// 같은 출처의 정적 대시보드라 내부 높이를 읽어 iframe을 그만큼 늘리고, 안쪽 스크롤을 없앤다.
export default function DashboardFrame({ src, title }: DashboardFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    let observer: ResizeObserver | undefined;
    const fit = () => {
      const doc = frame.contentDocument;
      if (!doc?.body) return;
      decorate(doc);
      setHeight(doc.body.scrollHeight + 4);
      observer?.disconnect();
      observer = new ResizeObserver(() => setHeight(doc.body.scrollHeight + 4));
      observer.observe(doc.body);
    };
    frame.addEventListener("load", fit);
    if (frame.contentDocument?.readyState === "complete") fit();
    return () => {
      frame.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, []);

  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
    <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
    <iframe
      ref={ref}
      src={`${BP}${src}`}
      title={title}
      scrolling="no"
      className="block w-full overflow-hidden bg-white"
      style={{ height }}
    />
    </div>
    </div>
  );
}
