// Local simulation only: prices, liquidity and balances are fictional.
export type Side = "buy" | "sell";
export type Order = {
  id: string; side: Side; type: "limit" | "market"; price: number; quantity: number;
  remaining: number; total: number; status: "pending" | "filled" | "cancelled"; createdAt: string;
};
export type Level = { price: number; quantity: number };
export type Market = { price: number; bids: Level[]; asks: Level[] };
export type TradingState = {
  version: 1; cash: number; energy: number; orders: Order[]; tick: number;
  market: Market; history: { time: string; price: number }[];
};
const MOVES = [0, 1, 3, 2, 0, -2, -4, -2, 0, 3, 5, 3];
const timeLabel = (date: Date) => date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
export function marketAt(tick: number): Market {
  const price = 130 + MOVES[tick % MOVES.length];
  return {
    price,
    bids: Array.from({ length: 5 }, (_, i) => ({ price: price - i - 1, quantity: 80 + ((tick + i * 3) % 7) * 20 })),
    asks: Array.from({ length: 5 }, (_, i) => ({ price: price + i + 1, quantity: 80 + ((tick + i * 2) % 7) * 20 })),
  };
}
export function initialTradingState(now = new Date()): TradingState {
  return { version: 1, cash: 100000, energy: 300, orders: [], tick: 0, market: marketAt(0), history: Array.from({ length: 25 }, (_, i) => ({ time: timeLabel(new Date(now.getTime() - (24 - i) * 5000)), price: marketAt((i + MOVES.length * 2 - 24) % MOVES.length).price })) };
}
export function available(state: TradingState) {
  const pending = state.orders.filter((order) => order.status === "pending");
  const reservedCash = pending.filter((o) => o.side === "buy").reduce((sum, o) => sum + o.remaining * o.price, 0);
  const reservedEnergy = pending.filter((o) => o.side === "sell").reduce((sum, o) => sum + o.remaining, 0);
  return { cash: state.cash - reservedCash, energy: state.energy - reservedEnergy, reservedCash, reservedEnergy };
}
export function quote(market: Market, side: Side, quantity: number, limit?: number) {
  let remaining = quantity;
  let total = 0;
  for (const level of side === "buy" ? market.asks : market.bids) {
    if (limit !== undefined && (side === "buy" ? level.price > limit : level.price < limit)) break;
    const filled = Math.min(remaining, level.quantity);
    total += filled * level.price;
    remaining -= filled;
  }
  return { total, remaining };
}
function match(state: TradingState): TradingState {
  const next: TradingState = { ...state, market: { ...state.market, asks: state.market.asks.map((l) => ({ ...l })), bids: state.market.bids.map((l) => ({ ...l })) }, orders: state.orders.map((o) => ({ ...o })) };
  // Orders are stored oldest first, preserving time priority for this account.
  for (const order of next.orders) {
    if (order.status !== "pending") continue;
    for (const level of order.side === "buy" ? next.market.asks : next.market.bids) {
      if (order.type === "limit" && (order.side === "buy" ? level.price > order.price : level.price < order.price)) break;
      const filled = Math.min(order.remaining, level.quantity);
      const total = filled * level.price;
      level.quantity -= filled;
      order.remaining -= filled;
      order.total += total;
      next.cash += order.side === "buy" ? -total : total;
      next.energy += order.side === "buy" ? filled : -filled;
      if (order.remaining === 0) { order.status = "filled"; break; }
    }
  }
  return next;
}
export function placeOrder(state: TradingState, input: { side: Side; type: "limit" | "market"; price: number; quantity: number; id: string; now: string }): TradingState {
  const { side, type, price, quantity } = input;
  if (!["buy", "sell"].includes(side) || !["limit", "market"].includes(type)) throw new Error("주문 유형을 확인해 주세요.");
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) throw new Error("수량은 1~100,000kWh의 정수로 입력해 주세요.");
  if (!Number.isSafeInteger(price) || price < 1 || price > 10000) throw new Error("가격은 1~10,000원 사이의 정수로 입력해 주세요.");
  if (state.orders.some((o) => o.id === input.id)) throw new Error("이미 접수된 주문입니다.");
  const funds = available(state);
  const execution = quote(state.market, side, quantity);
  if (type === "market" && execution.remaining > 0) throw new Error("현재 호가의 수량이 부족합니다. 수량을 줄이거나 지정가 주문을 이용해 주세요.");
  const cost = type === "limit" ? price * quantity : execution.total;
  if (side === "buy" && cost > funds.cash) throw new Error("구매 가능 금액이 부족합니다. 대기 주문에 예약된 금액도 확인해 주세요.");
  if (side === "sell" && quantity > funds.energy) throw new Error("판매 가능한 전력량이 부족합니다.");
  const order: Order = { id: input.id, side, type, price, quantity, remaining: quantity, total: 0, status: "pending", createdAt: input.now };
  return match({ ...state, orders: [...state.orders, order] });
}
export function cancelOrder(state: TradingState, id: string): TradingState {
  return { ...state, orders: state.orders.map((o) => o.id === id && o.status === "pending" ? { ...o, status: "cancelled" } : o) };
}
export function advanceMarket(state: TradingState, now = new Date()): TradingState {
  const tick = state.tick + 1;
  const market = marketAt(tick);
  return match({ ...state, tick, market, history: [...state.history.slice(-59), { time: timeLabel(now), price: market.price }] });
}
export function restoreTradingState(raw: string): TradingState {
  const value = JSON.parse(raw) as TradingState;
  const integer = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  if (value.version !== 1 || !integer(value.cash) || !integer(value.energy) || !integer(value.tick) || !Array.isArray(value.orders) || !Array.isArray(value.history) || !value.market) throw new Error("저장된 모의 거래 데이터가 올바르지 않습니다.");
  for (const order of value.orders) {
    if (!order || typeof order.id !== "string" || !["buy", "sell"].includes(order.side) || !["limit", "market"].includes(order.type) || !["pending", "filled", "cancelled"].includes(order.status) || !integer(order.quantity) || order.quantity < 1 || !integer(order.price) || order.price < 1 || !integer(order.remaining) || order.remaining > order.quantity || !integer(order.total) || !Number.isFinite(Date.parse(order.createdAt)) || (order.status === "filled" && order.remaining !== 0) || (order.status === "pending" && (order.remaining === 0 || order.type === "market"))) throw new Error("주문 데이터를 복원할 수 없습니다.");
  }
  if (!integer(value.market.price) || ![value.market.asks, value.market.bids].every((levels) => Array.isArray(levels) && levels.length === 5 && levels.every((level) => integer(level.price) && level.price > 0 && integer(level.quantity))) || !value.history.length || value.history.length > 60 || !value.history.every((p) => typeof p.time === "string" && integer(p.price))) throw new Error("시세 데이터를 복원할 수 없습니다.");
  const funds = available(value);
  if (funds.cash < 0 || funds.energy < 0 || new Set(value.orders.map((o) => o.id)).size !== value.orders.length) throw new Error("잔고 데이터를 복원할 수 없습니다.");
  return value;
}
