const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const compiled = ts.transpileModule(fs.readFileSync('src/lib/trading.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const tradingModule = new Module('trading');
tradingModule._compile(compiled, 'trading.cjs');
const { initialTradingState, available, placeOrder, cancelOrder, advanceMarket, restoreTradingState } = tradingModule.exports;
let sequence = 0;
const order = (state, overrides = {}) => placeOrder(state, { side: 'buy', type: 'limit', price: 130, quantity: 10, id: String(++sequence), now: new Date().toISOString(), ...overrides });

test('non-crossing buy reserves funds, prevents double spending, and cancellation releases funds', () => {
  const s = order(initialTradingState(), { quantity: 700 });
  assert.equal(s.orders[0].status, 'pending');
  assert.equal(available(s).cash, 9000);
  assert.throws(() => order(s, { quantity: 100 }), /금액이 부족/);
  const cancelled = cancelOrder(s, s.orders[0].id);
  assert.equal(available(cancelled).cash, 100000);
  assert.equal(cancelled.energy, 300);
  assert.deepEqual(cancelOrder(cancelled, s.orders[0].id), cancelled);
});

test('crossing limit fills at the best opposing price and updates cash and energy', () => {
  const s = order(initialTradingState(), { price: 135 });
  assert.equal(s.orders[0].status, 'filled');
  assert.equal(s.orders[0].total, 1310);
  assert.equal(s.cash, 98690);
  assert.equal(s.energy, 310);
  assert.equal(available(s).reservedCash, 0);
  assert.equal(s.market.asks[0].quantity, 70);
});

test('partial fill reserves only the remainder and cancellation keeps completed trades', () => {
  const s = order(initialTradingState(), { price: 131, quantity: 100 });
  assert.equal(s.orders[0].remaining, 20);
  assert.equal(s.orders[0].total, 80 * 131);
  assert.equal(available(s).reservedCash, 20 * 131);
  const next = cancelOrder(s, s.orders[0].id);
  assert.equal(next.energy, 380);
  assert.equal(next.cash, 100000 - 80 * 131);
  assert.equal(available(next).reservedCash, 0);
});

test('pending sell reserves energy, prevents overselling, and executes when market reaches limit', () => {
  let s = order(initialTradingState(), { side: 'sell', price: 132, quantity: 40 });
  assert.equal(available(s).energy, 260);
  assert.throws(() => order(s, { side: 'sell', quantity: 261 }), /전력량이 부족/);
  s = advanceMarket(advanceMarket(s));
  assert.equal(s.orders[0].status, 'filled');
  assert.equal(s.cash, 100000 + 132 * 40);
  assert.equal(s.energy, 260);
});

test('market order sweeps levels; insufficient liquidity rejects without mutation', () => {
  const original = initialTradingState();
  const s = order(original, { type: 'market', quantity: 100 });
  assert.equal(s.orders[0].total, 80 * 131 + 20 * 132);
  assert.equal(s.orders[0].remaining, 0);
  assert.throws(() => order(original, { type: 'market', quantity: 1000 }), /호가의 수량이 부족/);
  assert.equal(original.cash, 100000);
  assert.equal(original.market.asks[0].quantity, 80);
});

test('pending buy fills automatically as the simulated price falls', () => {
  let s = order(initialTradingState(), { price: 129 });
  for (let i = 0; i < 5; i++) s = advanceMarket(s);
  assert.equal(s.orders[0].status, 'filled');
  assert.equal(s.cash, 98710);
});

test('invalid inputs reject and saved orders restore reservations', () => {
  for (const quantity of [0, -1, NaN, Infinity, 1.5, 100001]) assert.throws(() => order(initialTradingState(), { quantity }));
  for (const price of [0, -1, NaN, Infinity, 1.5, 10001]) assert.throws(() => order(initialTradingState(), { price }));
  const s = order(initialTradingState());
  assert.deepEqual(restoreTradingState(JSON.stringify(s)), s);
  assert.equal(available(restoreTradingState(JSON.stringify(s))).cash, 98700);
  assert.throws(() => restoreTradingState('{"version":1}'));
  assert.throws(() => restoreTradingState(JSON.stringify({ ...s, cash: 0 })));
});

test('multiple pending orders keep time priority and cannot consume the same liquidity', () => {
  let s = order(initialTradingState(), { price: 130, quantity: 100 });
  s = order(s, { price: 130, quantity: 100 });
  for (let i = 0; i < 5; i++) s = advanceMarket(s);
  assert.equal(s.orders[0].status, 'filled');
  assert.equal(s.orders[1].status, 'filled');
  assert.equal(s.orders[0].total, 12900);
  assert.equal(s.orders[1].total, 80 * 129 + 20 * 130);
  assert.ok(available(s).cash >= 0);
  assert.ok(s.market.asks.every((level) => level.quantity >= 0));
});
