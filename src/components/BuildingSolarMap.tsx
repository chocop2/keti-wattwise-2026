"use client";

import { useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// CARTO Positron (라이트) 래스터 베이스맵 — 토큰 불필요
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© CARTO © OpenStreetMap contributors",
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

// 일조/발전 잠재량(p 0~1) → 노랑(낮음) → 빨강(높음)
function ramp(p: number): [number, number, number] {
  const stops: [number, number[]][] = [
    [0.0, [255, 245, 200]],
    [0.35, [254, 196, 79]],
    [0.65, [236, 112, 20]],
    [0.85, [204, 41, 32]],
    [1.0, [128, 12, 20]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i];
    const [b, cb] = stops[i + 1];
    if (p <= b) {
      const t = (p - a) / (b - a || 1);
      return [0, 1, 2].map((k) => Math.round(ca[k] + (cb[k] - ca[k]) * t)) as [number, number, number];
    }
  }
  return [128, 12, 20];
}

type FC = { meta?: { center?: [number, number]; count?: number; poa?: number; src?: string } };

export default function BuildingSolarMap() {
  const [data, setData] = useState<(GeoJSON.FeatureCollection & FC) | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; kwh: number; h: number; area: number } | null>(null);

  useEffect(() => {
    fetch("/seoul_buildings.geojson")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const center = data?.meta?.center ?? [127.028, 37.588];

  const layer = new GeoJsonLayer({
    id: "buildings",
    data: data ?? { type: "FeatureCollection", features: [] },
    extruded: true,
    wireframe: false,
    getElevation: (f: any) => f.properties.h,
    getFillColor: (f: any) => [...ramp(f.properties.p), 235] as [number, number, number, number],
    getLineColor: [255, 255, 255, 40],
    lineWidthMinPixels: 0.5,
    pickable: true,
    onHover: (info: any) =>
      setHover(
        info.object
          ? { x: info.x, y: info.y, kwh: info.object.properties.kwh, h: info.object.properties.h, area: info.object.properties.area }
          : null
      ),
    updateTriggers: {},
  });

  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-xl">
      <DeckGL
        initialViewState={{ longitude: center[0], latitude: center[1], zoom: 15.2, pitch: 52, bearing: -18 }}
        controller={true}
        layers={[layer]}
      >
        <Map reuseMaps mapStyle={MAP_STYLE as any} />
      </DeckGL>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-ink/90 px-3 py-2 text-xs text-white shadow-pop"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <div className="font-bold">건물 · 옥상 {hover.area.toLocaleString()}㎡ · {hover.h}m</div>
          <div>연 발전 잠재량 <b>{hover.kwh.toLocaleString()}kWh</b></div>
        </div>
      )}

      {/* 범례 */}
      <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-white/90 p-2.5 text-xs shadow-card">
        <div className="mb-1 font-semibold text-slate-600">발전 잠재량</div>
        <div className="h-2 w-40 rounded" style={{ background: "linear-gradient(90deg,#fff5c8,#fec44f,#ec7014,#cc2920,#800c14)" }} />
        <div className="mt-0.5 flex justify-between text-[10px] text-slate-400"><span>낮음</span><span>높음</span></div>
      </div>

      {data && (
        <div className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] text-slate-500 shadow-card">
          서울 안암·고려대 인근 · 실제 건물 {data.meta?.count?.toLocaleString()}동 (OSM)
        </div>
      )}
    </div>
  );
}
