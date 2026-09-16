const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const compiled = ts.transpileModule(fs.readFileSync('src/lib/householdAnomaly.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = new Module('householdAnomaly');
loaded._compile(compiled, 'householdAnomaly.cjs');
const { householdAnomaly } = loaded.exports;
const fixture = { id: 'A', name: '가정 A', appliances: [{ name: 'TV', watt: 120, hours: 5 }, { name: '냉장고', watt: 40, hours: 24 }] };

test('normal scenario really restores normal behavior and zero score', () => {
  const inactive = householdAnomaly(fixture, 'inactive', 13, 20);
  assert.equal(inactive.tier, '경보');
  const normal = householdAnomaly(fixture, 'normal', 13, 20);
  assert.equal(normal.tier, '정상');
  assert.equal(normal.risk, 0);
  assert.ok(normal.activity.every(p => Math.abs(p.today - p.base) <= p.band));
});
test('different appliance consumption and household patterns produce different profiles', () => {
  const a = householdAnomaly(fixture, 'normal');
  const e = householdAnomaly({ ...fixture, id: 'E', appliances: [{ name: 'PC', watt: 260, hours: 10 }] }, 'normal');
  assert.notDeepEqual(a.activity, e.activity);
  assert.ok(Math.abs(a.activity.reduce((sum, p) => sum + p.base, 0) - 600) < 1e-8);
  assert.ok(Math.abs(e.activity.reduce((sum, p) => sum + p.base, 0) - 2600) < 1e-8);
  assert.equal(a.baselineWatts, 40);
});
test('away is an explicit exception and age alone does not raise a score', () => {
  assert.equal(householdAnomaly(fixture, 'away', 6, 23).tier, '예외');
  assert.equal(householdAnomaly(fixture, 'away', 6, 23).risk, 0);
  assert.equal(householdAnomaly({ ...fixture, elderly: true }, 'normal').risk, 0);
});
test('inactive score follows elapsed hours, is bounded, and reduction stays in the selected interval', () => {
  const result = householdAnomaly(fixture, 'inactive', 14, 17);
  assert.equal(result.risk, 78);
  assert.ok(result.activity.filter(p => p.hour >= 14 && p.hour <= 17).every(p => p.today === p.base * 0.03));
  assert.ok(result.activity.filter(p => p.hour < 14 || p.hour > 17).every(p => p.today > p.base * 0.8));
  assert.equal(householdAnomaly(fixture, 'inactive', 0, 23).risk, 100);
  assert.equal(householdAnomaly(fixture, 'inactive', 20, 10).duration, 0);
});
