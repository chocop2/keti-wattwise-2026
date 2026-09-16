"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, Area, ComposedChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from "recharts";

type House = { id: string; type: string; area: string; city: string; start: string; end: string; rows: number };
type Point = { timestamp: string; prediction_kwh: number; "0.1": number; "0.5": number; "0.9": number };

export default function HouseholdForecast() {
  const [houses, setHouses] = useState<House[]>([]);
  const [houseId, setHouseId] = useState("");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("가정을 선택하면 Chronos-2 예측을 실행합니다.");

  useEffect(() => {
    fetch("/api/household-forecast").then((res) => res.json()).then((data: { houses?: House[]; error?: string }) => {
      if (data.error) throw new Error(data.error);
      setHouses(data.houses ?? []);
      setHouseId(data.houses?.[0]?.id ?? "");
    }).catch((error: Error) => setMessage(error.message));
  }, []);

  async function runForecast() {
    if (!houseId) return;
    setLoading(true); setMessage("최근 168시간을 읽고 향후 24시간을 예측하는 중입니다…"); setPoints([]);
    try {
      const res = await fetch("/api/household-forecast", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ houseId }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "예측에 실패했습니다.");
      setPoints(data.forecast ?? []);
      setMessage("예측 완료 · 10~90% 분위수 밴드");
    } catch (error) { setMessage(error instanceof Error ? error.message : "예측에 실패했습니다."); }
    finally { setLoading(false); }
  }

  const selected = houses.find((house) => house.id === houseId);
  const total = points.reduce((sum, point) => sum + point["0.5"], 0);
  return <section className="card p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-bold">가정별 예상 사용량 예측 · Chronos-2</div><div className="mt-1 text-xs text-slate-400">가정 전체 전력 · 최근 168시간 실측 → 향후 24시간 확률 예측</div></div><span className="badge bg-teal-soft text-teal">household_chronos2</span></div>
    <div className="mt-4 grid gap-3 md:grid-cols-[1.4fr_1fr_auto]"><label><span className="label">가정 선택</span><select className="input" value={houseId} onChange={(event) => setHouseId(event.target.value)} disabled={!houses.length}>{houses.map((house) => <option key={house.id} value={house.id}>{house.id} · {house.type} · {house.city}</option>)}</select></label><div className="self-end text-xs text-slate-500">{selected ? `${selected.area} · ${selected.start.slice(0, 10)} ~ ${selected.end.slice(0, 10)} · ${selected.rows}시간` : "가정 목록 로딩 중"}</div><button type="button" className="btn-primary self-end" onClick={runForecast} disabled={loading || !houseId}>{loading ? "예측 중…" : "예측 실행"}</button></div>
    <div className="mt-4 h-64">{points.length ? <ResponsiveContainer><ComposedChart data={points} margin={{ left: -8, right: 8, top: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" /><XAxis dataKey="timestamp" hide /><YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={50} tickFormatter={(value) => value.toFixed(2)} /><Tooltip formatter={(value) => typeof value === "number" ? `${value.toFixed(3)}kWh` : "-"} /><Area dataKey="0.1" stroke="none" fill="transparent" /><Area dataKey="0.9" stroke="none" fill="#0A9AA8" fillOpacity={0.14} name="10~90%" /><Line dataKey="0.5" stroke="#0A9AA8" strokeWidth={2.5} dot={false} name="중앙 예측" isAnimationActive={false} /></ComposedChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400">{loading ? "모델 예측 중…" : "예측 실행 버튼을 눌러주세요."}</div>}</div>
    <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-400"><span>{message}</span>{points.length > 0 && <b className="text-teal">24시간 중앙 예상량 {total.toFixed(2)}kWh</b>}</div>
  </section>;
}
