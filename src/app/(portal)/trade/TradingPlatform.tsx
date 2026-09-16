"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { advanceMarket, available, cancelOrder, initialTradingState, placeOrder, quote, restoreTradingState, type Order, type Side, type TradingState } from "@/lib/trading";
import { won } from "@/lib/domain";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="eyebrow">WATTWISE ENERGY MARKET</div><h1 className="text-2xl font-extrabold">태양광 전력 거래</h1><p className="section-sub">필요한 전력을 구매하고, 남는 태양광 전력을 판매하세요.</p></div>
        <Link href="/solar" className="btn-ghost">태양광 발전량 계산 ↗</Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber/20 bg-amber-soft px-4 py-3 text-xs text-slate-600">
        <p><b className="text-amber">모의 거래</b> · 가상 시세·호가·잔고를 사용합니다. 실제 결제·전력 이전은 발생하지 않습니다.</p>
        <span>시작 잔고 100,000원 + 300kWh</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="구매 가능 금액" value={won(funds.cash)} sub={`주문 예약 ${won(funds.reservedCash)}`} />
        <Metric label="판매 가능 전력" value={`${number(funds.energy)} kWh`} sub={`주문 예약 ${number(funds.reservedEnergy)} kWh`} />
        <Metric label="보유 전력 평가액" value={won(state.energy * state.market.price)} sub={`총 보유 ${number(state.energy)} kWh · 현재 모의 기준가`} />
        <Metric label="대기 주문" value={`${pending.length}건`} sub={`구매 ${pending.filter((o) => o.side === "buy").length}건 · 판매 ${pending.filter((o) => o.side === "sell").length}건`} />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-bold">태양광 전력 <span className="ml-2 text-xs font-normal text-slate-400">KRW / kWh</span></h2><div className="mt-2 text-3xl font-extrabold tabular-nums">{state.market.price}<span className="ml-1 text-sm font-medium text-slate-400">원</span></div><div className={`mt-1 text-xs ${change >= 0 ? "text-red-500" : "text-blue-600"}`}>{change >= 0 ? "+" : ""}{change}원 ({change >= 0 ? "+" : ""}{(change / 130 * 100).toFixed(2)}%) <span className="text-slate-400">시작 기준가 대비</span></div></div>
              <button type="button" onClick={() => setPaused(!paused)} className="btn-ghost !text-xs" aria-pressed={paused}>{paused ? "시세 재개" : "시세 일시정지"}</button>
            </div>
            <div className="mt-5 h-52 overflow-hidden" aria-label="모의 태양광 전력 가격 추이">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={state.history} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="trade-price" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0A9AA8" stopOpacity={0.25} /><stop offset="100%" stopColor="#0A9AA8" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" /><XAxis dataKey="time" minTickGap={60} tick={{ fontSize: 10 }} /><YAxis domain={[120, 140]} tick={{ fontSize: 10 }} /><Tooltip formatter={(value) => [`${value}원/kWh`, "모의 기준가"]} /><Area type="stepAfter" dataKey="price" stroke="#0A9AA8" strokeWidth={2} fill="url(#trade-price)" dot={state.history.length === 1} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400">{paused ? "시세 일시정지 중" : "5초마다 가상 시세·호가 갱신"} · 페이지가 열려 있을 때 대기 주문을 자동 체결합니다.</p>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5"><h2 className="text-sm font-bold">주문 호가</h2><span className="text-xs text-slate-400">가격을 누르면 지정가에 반영</span></div>
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
          <div role="status" aria-live="polite" className={`border-t border-slate-100 px-5 py-3 text-xs leading-relaxed ${notice ? "bg-teal-soft text-teal" : "text-slate-400"}`}>{notice || "가격과 수량을 확인하고 주문해 주세요."}</div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex gap-5 border-b border-slate-100 px-5"><button type="button" onClick={() => setTab("pending")} className={`border-b-2 py-4 text-sm font-bold ${tab === "pending" ? "border-ink text-ink" : "border-transparent text-slate-400"}`}>대기 주문 ({pending.length})</button><button type="button" onClick={() => setTab("history")} className={`border-b-2 py-4 text-sm font-bold ${tab === "history" ? "border-ink text-ink" : "border-transparent text-slate-400"}`}>체결·취소 내역</button></div>
        {displayed.length === 0 ? <div className="py-12 text-center text-sm text-slate-400">{tab === "pending" ? "대기 중인 주문이 없습니다. 지정가 주문을 등록해 보세요." : "아직 체결되거나 취소된 주문이 없습니다."}</div> : <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-right text-xs"><thead className="bg-slate-50 text-slate-400"><tr>{["주문 시각", "구분", "주문가", "주문 / 체결 (kWh)", "체결 금액", "상태", ""].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{displayed.map((order) => <tr key={order.id}><td className="px-4 py-4 text-slate-500">{new Date(order.createdAt).toLocaleString("ko-KR")}</td><td className={`px-4 font-bold ${order.side === "buy" ? "text-red-500" : "text-blue-600"}`}>{sideName(order.side)}</td><td className="px-4">{order.type === "market" ? "시장가" : `${number(order.price)}원`}</td><td className="px-4 tabular-nums">{number(order.quantity)} / {number(order.quantity - order.remaining)}</td><td className="px-4">{won(order.total)}</td><td className="px-4"><span className={`badge ${order.status === "pending" ? "bg-amber-soft text-amber" : order.status === "filled" ? "bg-teal-soft text-teal" : "bg-slate-100 text-slate-400"}`}>{statusName(order)}</span></td><td className="px-4">{order.status === "pending" && <button type="button" className="btn-ghost !py-1 !text-xs" aria-label={`${sideName(order.side)} ${order.quantity}kWh 주문 취소`} onClick={() => { if (!current.current) return; commit(cancelOrder(current.current, order.id)); setNotice("남은 주문을 취소했습니다. 예약된 금액·전력량이 반환되었습니다."); }}>취소</button>}</td></tr>)}</tbody></table></div>}
      </section>
      <p className="text-xs text-slate-400">거래 기록은 현재 브라우저에 계정별로 저장됩니다. 시세를 일시정지하거나 페이지를 닫으면 자동 체결도 멈춥니다.</p>
      {storageNotice && <p role="alert" className="text-xs text-red-500">{storageNotice}</p>}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="card p-5"><div className="text-xs text-slate-500">{label}</div><div className="mt-2 text-2xl font-extrabold tabular-nums">{value}</div><div className="mt-2 text-xs text-slate-400">{sub}</div></div>;
}
