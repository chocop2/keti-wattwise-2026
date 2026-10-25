"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { advanceMarket, available, cancelOrder, initialTradingState, placeOrder, quote, restoreTradingState, type Order, type Side, type TradingState } from "@/lib/trading";
import { won } from "@/lib/domain";

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const BLUE = "#2a78d6";
const number = (n: number) => n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const sideName = (side: Side) => side === "buy" ? "구매" : "판매";
const statusName = (order: Order) => order.status === "filled" ? "체결 완료" : order.status === "cancelled" ? "취소" : `${order.remaining < order.quantity ? "부분 체결 · " : ""}${sideName(order.side)}대기`;

export default function TradingPlatform({ accountId }: { accountId: string }) {
  const [state, setState] = useState<TradingState | null>(null);
  const current = useRef<TradingState | null>(null);
  const [side, setSide] = useState<Side>("buy");
  const [type, setType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState("130");
  const [quantity, setQuantity] = useState("10");
  const [budget, setBudget] = useState("");
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [notice, setNotice] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [paused, setPaused] = useState(false);
  const [solarProfile, setSolarProfile] = useState<{ panelCount: number; systemKw: number; annualGen: number; annualConsumption: number; surplus: number; location: string; updatedAt: string } | null>(null);
  const storageKey = `wattwise:solar-trading:v1:${accountId}`;

  function commit(next: TradingState) {
    current.current = next;
    setState(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setStorageNotice("브라우저 저장 공간을 사용할 수 없어 이번 변경은 새로고침 시 유지되지 않을 수 있습니다."); }
  }

  useEffect(() => {
    let initial = initialTradingState();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) initial = restoreTradingState(saved);
    } catch {
      setStorageNotice("저장된 거래 기록을 불러오지 못해 새 모의 계좌로 시작합니다.");
    }
    current.current = initial;
    setState(initial);
    try {
      const savedProfile = localStorage.getItem("wattwise:solar-profile:v1");
      if (savedProfile) setSolarProfile(JSON.parse(savedProfile));
    } catch { /* 저장된 태양광 진단이 없으면 기본 거래 화면 유지 */ }
  }, [storageKey]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      const previous = current.current;
      if (!previous) return;
      const next = advanceMarket(previous);
      const filled = next.orders.filter((order, i) => order.remaining < previous.orders[i].remaining);
      if (filled.length) setNotice(`대기 주문 ${filled.length}건이 전부 또는 일부 체결되었습니다. 주문 내역을 확인해 주세요.`);
      current.current = next;
      setState(next);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); }
      catch { setStorageNotice("브라우저 저장 공간을 사용할 수 없어 거래 기록이 유지되지 않을 수 있습니다."); }
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, storageKey]);

  if (!state) return <div className="card p-8 text-sm text-slate-500">모의 거래 계좌를 불러오는 중입니다…</div>;

  const funds = available(state);
  const q = Number(quantity);
  const p = Number(price);
  const validQuantity = Number.isSafeInteger(q) && q > 0 && q <= 100000;
  const validPrice = Number.isSafeInteger(p) && p > 0 && p <= 10000;
  const marketQuote = quote(state.market, side, validQuantity ? q : 0);
  const estimate = type === "market" ? marketQuote.total : validPrice && validQuantity ? p * q : 0;
  const problem = !validQuantity ? "수량은 1~100,000kWh의 정수로 입력해 주세요." : type === "limit" && !validPrice ? "가격은 1~10,000원으로 입력해 주세요." : type === "market" && marketQuote.remaining > 0 ? "현재 호가 수량이 부족합니다." : side === "buy" && estimate > funds.cash ? "구매 가능 금액이 부족합니다." : side === "sell" && q > funds.energy ? "판매 가능 전력량이 부족합니다." : "";
  const pending = state.orders.filter((o) => o.status === "pending");
  const displayed = [...state.orders].reverse().filter((o) => tab === "pending" ? o.status === "pending" : o.status !== "pending");
  const change = state.market.price - 130;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const latest = current.current;
    if (!latest) return;
    try {
      const next = placeOrder(latest, { side, type, price: type === "market" ? latest.market.price : p, quantity: q, id: crypto.randomUUID(), now: new Date().toISOString() });
      commit(next);
      const order = next.orders[next.orders.length - 1];
      setNotice(order.status === "filled" ? `${sideName(side)} ${number(q)}kWh 체결 완료 · ${won(order.total)}` : `${sideName(side)} 주문 접수 · ${number(order.remaining)}kWh 대기${order.remaining < q ? ` / ${number(q - order.remaining)}kWh 체결` : ""}`);
      setTab(order.status === "filled" ? "history" : "pending");
    } catch (error) { setNotice(error instanceof Error ? error.message : "주문을 처리하지 못했습니다."); }
  }

  function applyBudget() {
    const amount = Number(budget);
    if (!Number.isFinite(amount) || amount <= 0 || !validPrice) { setNotice("금액과 지정가를 먼저 입력해 주세요."); return; }
    const nextQuantity = Math.min(100000, Math.floor(amount / p));
    if (nextQuantity < 1) { setNotice("입력한 금액으로 1kWh 이상 주문할 수 있어야 합니다."); return; }
    setQuantity(String(nextQuantity));
    setNotice(`${won(amount)} 이내로 ${number(nextQuantity)}kWh를 설정했습니다.`);
  }

  return (
    <div className="bleed -mt-8 -mb-8 bg-white">
      <section className="relative flex min-h-[660px] items-center overflow-hidden bg-ink md:min-h-[500px]">
        <Image src={`${BP}/img/photos/freiburg-solar.jpg`} alt="" fill priority unoptimized className="object-cover saturate-[0.7] blur-[2px]" />
        <div className="absolute inset-0 bg-[#1a120c]/60" />
        <p className="absolute bottom-3 right-4 z-10 rounded-full bg-black/45 px-2.5 py-1 text-[10px] leading-4 text-white/90 backdrop-blur">사진 <a href="https://commons.wikimedia.org/wiki/File:Freiburg_071ss.jpg" target="_blank" rel="noreferrer" className="underline">Arnold Plesse</a>, <a href="https://creativecommons.org/licenses/by/3.0" target="_blank" rel="noreferrer" className="underline">CC BY 3.0</a></p>
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 text-center md:py-20">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-6 py-2.5 text-base font-bold tracking-wide text-white backdrop-blur md:text-xl">
            <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-6 md:w-6" fill="#F2C9A0" aria-hidden><path d="M13.5 2 4.5 13.5h6L9.5 22l9-11.5h-6z" /></svg>
            전력 거래
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl break-keep text-2xl font-black leading-[1.5] tracking-[-0.03em] text-white md:text-[2rem]">
            남는 태양광 전력은 판매하고, 부족한 전력은 구매해<br className="hidden md:block" /> 우리 집 에너지를 <span className="glow-apricot">효율적으로 관리</span>하세요.
          </h1>
          <dl className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-y-6 rounded-3xl border border-white/20 bg-white/10 py-6 backdrop-blur-md md:grid-cols-4 md:divide-x md:divide-white/15 md:py-7">
            <HeroFact value={won(funds.cash)} label="구매 가능 금액" />
            <HeroFact value={`${number(funds.energy)}kWh`} label="판매 가능 전력" />
            <HeroFact value={won(state.energy * state.market.price)} label="보유 전력 평가액" />
            <HeroFact value={`${pending.length}건`} label={`대기 주문 · 구매 ${pending.filter((o) => o.side === "buy").length} · 판매 ${pending.filter((o) => o.side === "sell").length}`} />
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-14 md:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#FAF6EC] px-5 py-4 text-sm text-slate-600">
        <p><b className="text-[#3D2B1F]">모의 거래</b> · 가상 시세·호가·잔고를 사용합니다. 실제 결제·전력 이전은 발생하지 않습니다.</p>
        <span className="font-semibold text-[#3D2B1F]">시작 잔고 100,000원 + 300kWh</span>
      </div>
      {solarProfile ? (
        <section className="card overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_auto]">
            <div className="p-5"><div className="flex items-center gap-2"><span className="badge bg-[#FAF6EC] text-[#3D2B1F]">태양광 진단 연동</span><span className="text-xs text-slate-400">{solarProfile.location}</span></div><div className="mt-3 text-lg font-black text-[#3D2B1F]">판매 가능한 잉여 전력을 주문에 바로 반영하세요</div><div className="mt-1 text-xs text-slate-500">{solarProfile.panelCount}장 · {solarProfile.systemKw}kW 설비 기준 연 {number(solarProfile.annualGen)}kWh 발전 예상</div></div>
            <div className="grid grid-cols-2 gap-px bg-slate-100 lg:min-w-[390px]"><div className="bg-white p-5"><div className="text-xs text-slate-400">월 평균 잉여 전력</div><div className="mt-1 text-2xl font-black text-[#3D2B1F]">{number(solarProfile.surplus / 12)}kWh</div></div><div className="bg-white p-5"><button type="button" onClick={() => { const sellable = Math.max(1, Math.min(Math.floor(funds.energy), Math.floor(solarProfile.surplus / 12))); setSide("sell"); setQuantity(String(sellable)); setNotice(`태양광 진단과 현재 보유량을 기준으로 ${number(sellable)}kWh를 판매 수량에 반영했습니다.`); }} className="btn-primary h-full w-full">판매 주문에 적용</button></div></div>
          </div>
        </section>
      ) : (
        <section className="card flex flex-wrap items-center justify-between gap-3 p-5"><div><div className="text-lg font-black text-[#3D2B1F]">내 태양광 발전량을 먼저 계산해 보세요</div><div className="mt-1 text-xs text-slate-400">진단 결과의 잉여 전력을 거래 주문 수량으로 자동 연결할 수 있습니다.</div></div><Link href="/solar" className="btn-amber">태양광 진단 시작</Link></section>
      )}
      <div>
        <h2 className="break-keep text-3xl font-black tracking-[-0.03em] text-[#3D2B1F] md:text-4xl">실시간 <span className="hl">모의 거래</span></h2>
        <p className="mt-3 break-keep text-base text-slate-600">시세와 호가를 보고 지정가·시장가로 주문해 보세요.</p>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-lg font-black tracking-[-0.02em] text-[#3D2B1F]">태양광 전력 시세 <span className="ml-1 text-xs font-normal text-slate-400">원 / kWh</span></h3><p className="mt-2 break-keep text-lg font-black text-ink md:text-xl">&ldquo;{change === 0 ? "시작 기준가와 같아요" : `시작 기준가보다 ${Math.abs(change)}원 ${change > 0 ? "올랐어요" : "내렸어요"}`}&rdquo;</p><div className="mt-2 text-3xl font-extrabold tabular-nums">{state.market.price}<span className="ml-1 text-sm font-medium text-slate-400">원</span></div><div className={`mt-1 text-xs ${change >= 0 ? "text-red-500" : "text-blue-600"}`}>{change >= 0 ? "+" : ""}{change}원 ({change >= 0 ? "+" : ""}{(change / 130 * 100).toFixed(2)}%) <span className="text-slate-400">시작 기준가 대비</span></div></div>
              <button type="button" onClick={() => setPaused(!paused)} className="btn-ghost !text-xs" aria-pressed={paused}>{paused ? "시세 재개" : "시세 일시정지"}</button>
            </div>
            <div className="mt-5 h-52 overflow-hidden" aria-label="모의 태양광 전력 가격 추이">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={state.history} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="trade-price" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BLUE} stopOpacity={0.2} /><stop offset="100%" stopColor={BLUE} stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e0d9" /><XAxis dataKey="time" minTickGap={60} tick={{ fontSize: 10, fill: "#898781" }} /><YAxis domain={[120, 140]} tick={{ fontSize: 10, fill: "#898781" }} /><Tooltip formatter={(value) => [`${value}원/kWh`, "모의 기준가"]} /><Area type="stepAfter" dataKey="price" stroke={BLUE} strokeWidth={2} fill="url(#trade-price)" dot={state.history.length === 1} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400">{paused ? "시세 일시정지 중" : "5초마다 가상 시세·호가 갱신"} · 페이지가 열려 있을 때 대기 주문을 자동 체결합니다.</p>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5"><h3 className="text-lg font-black tracking-[-0.02em] text-[#3D2B1F]">주문 호가</h3><span className="text-xs text-slate-400">가격을 누르면 지정가에 반영</span></div>
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              {(["sell", "buy"] as Side[]).map((bookSide) => (
                <div key={bookSide} className="p-3">
                  <div className={`mb-3 flex justify-between text-xs font-bold ${bookSide === "sell" ? "text-blue-600" : "text-red-500"}`}><span>{sideName(bookSide)} 호가</span><span>수량 (kWh)</span></div>
                  {(bookSide === "sell" ? state.market.asks : state.market.bids).map((level) => (
                    <button key={level.price} type="button" onClick={() => { setPrice(String(level.price)); setType("limit"); }} className="relative mb-1 flex w-full justify-between overflow-hidden rounded-md px-2 py-2 text-sm tabular-nums hover:ring-1 hover:ring-slate-300" aria-label={`${sideName(bookSide)} 호가 ${level.price}원 선택`}>
                      <span className={`absolute inset-y-0 right-0 ${bookSide === "sell" ? "bg-blue-50" : "bg-red-50"}`} style={{ width: `${level.quantity / 200 * 100}%` }} /><b className={`relative ${bookSide === "sell" ? "text-blue-600" : "text-red-500"}`}>{level.price}원</b><span className="relative text-slate-500">{number(level.quantity)}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="card overflow-hidden lg:sticky lg:top-20">
          <div className="grid grid-cols-2 border-b border-slate-100">
            {(["buy", "sell"] as Side[]).map((value) => <button key={value} type="button" aria-pressed={side === value} onClick={() => { setSide(value); setNotice(""); }} className={`border-b-2 py-4 text-sm font-bold ${side === value ? value === "buy" ? "border-red-500 bg-red-50 text-red-500" : "border-blue-600 bg-blue-50 text-blue-600" : "border-transparent text-slate-400"}`}>{sideName(value)}</button>)}
          </div>
          <form onSubmit={submit} className="space-y-5 p-5">
            <div className="flex rounded-lg bg-slate-100 p-1">{(["limit", "market"] as const).map((value) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={`flex-1 rounded-md py-2 text-xs font-semibold ${type === value ? "bg-white shadow-sm" : "text-slate-400"}`}>{value === "limit" ? "지정가" : "시장가"}</button>)}</div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">{sideName(side)} 가능</span><b>{side === "buy" ? won(funds.cash) : `${number(funds.energy)} kWh`}</b></div>
            {type === "limit" ? <label className="block"><span className="label">주문 가격 (원 / kWh)</span><input className="input !py-3 text-right tabular-nums" type="number" min="1" max="10000" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required /></label> : <div className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">현재 상대 호가부터 즉시 체결합니다. 수량에 따라 여러 가격으로 체결될 수 있습니다.</div>}
            <label className="block"><span className="label">주문 수량 (kWh)</span><input className="input !py-3 text-right tabular-nums" type="number" min="1" max="100000" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></label>
            {type === "limit" && <div><label htmlFor="trade-budget" className="label">금액으로 수량 계산 (원)</label><div className="flex gap-2"><input id="trade-budget" type="number" min="1" className="input min-w-0 text-right" placeholder="예: 10,000" value={budget} onChange={(e) => setBudget(e.target.value)} /><button type="button" className="btn-ghost shrink-0" onClick={applyBudget}>적용</button></div><p className="mt-1 text-[11px] text-slate-400">지정가 기준, 입력 금액 이내의 정수 kWh로 계산합니다.</p></div>}
            <div className="space-y-2 border-t border-slate-100 pt-4"><div className="flex justify-between text-sm"><span className="text-slate-500">{type === "market" ? "예상 체결 금액" : "주문 금액"}</span><b className="text-lg">{won(estimate)}</b></div><div className="text-xs text-slate-400">모의 거래 수수료 0원 · 1kWh 단위</div></div>
            {problem && <p className="text-xs text-red-500" role="status">{problem}</p>}
            <button type="submit" disabled={Boolean(problem)} className={`w-full rounded-xl py-3.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${side === "buy" ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}>{sideName(side)} 주문</button>
            <p className="text-xs leading-relaxed text-slate-400">지정가 주문은 조건이 맞는 수량부터 체결됩니다. 남은 주문은 {sideName(side)}대기로 유지되며 언제든 취소할 수 있습니다.</p>
          </form>
          <div role="status" aria-live="polite" className={`border-t border-slate-100 px-5 py-3 text-xs leading-relaxed ${notice ? "bg-[#FAF6EC] font-semibold text-[#3D2B1F]" : "text-slate-400"}`}>{notice || "가격과 수량을 확인하고 주문해 주세요."}</div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex gap-5 border-b border-slate-100 px-5"><button type="button" onClick={() => setTab("pending")} className={`border-b-2 py-4 text-sm font-bold ${tab === "pending" ? "border-[#3D2B1F] text-[#3D2B1F]" : "border-transparent text-slate-400"}`}>대기 주문 ({pending.length})</button><button type="button" onClick={() => setTab("history")} className={`border-b-2 py-4 text-sm font-bold ${tab === "history" ? "border-[#3D2B1F] text-[#3D2B1F]" : "border-transparent text-slate-400"}`}>체결·취소 내역</button></div>
        {displayed.length === 0 ? <div className="py-12 text-center text-sm text-slate-400">{tab === "pending" ? "대기 중인 주문이 없습니다. 지정가 주문을 등록해 보세요." : "아직 체결되거나 취소된 주문이 없습니다."}</div> : <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-right text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["주문 시각", "구분", "주문가", "주문 / 체결 (kWh)", "체결 금액", "상태", ""].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{displayed.map((order) => <tr key={order.id}><td className="px-4 py-4 text-slate-500">{new Date(order.createdAt).toLocaleString("ko-KR")}</td><td className={`px-4 font-bold ${order.side === "buy" ? "text-red-500" : "text-blue-600"}`}>{sideName(order.side)}</td><td className="px-4">{order.type === "market" ? "시장가" : `${number(order.price)}원`}</td><td className="px-4 tabular-nums">{number(order.quantity)} / {number(order.quantity - order.remaining)}</td><td className="px-4">{won(order.total)}</td><td className="px-4"><span className={`badge ${order.status === "pending" ? "bg-amber-soft text-amber" : order.status === "filled" ? "bg-ok-soft text-ok" : "bg-slate-100 text-slate-400"}`}>{statusName(order)}</span></td><td className="px-4">{order.status === "pending" && <button type="button" className="btn-ghost !py-1 !text-xs" aria-label={`${sideName(order.side)} ${order.quantity}kWh 주문 취소`} onClick={() => { if (!current.current) return; commit(cancelOrder(current.current, order.id)); setNotice("남은 주문을 취소했습니다. 예약된 금액·전력량이 반환되었습니다."); }}>취소</button>}</td></tr>)}</tbody></table></div>}
      </section>
      <p className="text-xs text-slate-400">거래 기록은 현재 브라우저에 계정별로 저장됩니다. 시세를 일시정지하거나 페이지를 닫으면 자동 체결도 멈춥니다.</p>
      {storageNotice && <p role="alert" className="text-xs text-red-500">{storageNotice}</p>}
      </div>
    </div>
  );
}

function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-2">
      <dt className="sr-only">{label}</dt>
      <dd className="break-keep text-xl font-black tracking-tight text-[#F2C9A0] drop-shadow-[0_2px_6px_rgba(26,18,12,0.45)] md:text-[1.75rem]">{value}</dd>
      <dd className="mt-2 break-keep text-xs font-medium text-white/80 md:text-sm">{label}</dd>
    </div>
  );
}
