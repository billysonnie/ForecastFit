const assert = require("assert");
const data = require("./data.js");
const { wape, bias, intervalErrors, analyze } = require("./app.js");

// wape / bias math
assert.strictEqual(wape([100, 100], [100, 100]), 0, "perfect forecast = 0");
assert(Math.abs(wape([110, 90], [100, 100]) - 0.10) < 1e-9, "wape 10%");
assert(Math.abs(bias([110, 110], [100, 100]) - 0.1) < 1e-9, "bias +10%");
assert(Math.abs(bias([90, 90], [100, 100]) + 0.1) < 1e-9, "bias -10%");
assert.strictEqual(wape([0, 0], [0, 0]), null, "zero volume => null");
assert.strictEqual(bias([5], [0]), null, "zero actual bias => null");
assert.deepStrictEqual(intervalErrors([90], [100]), [0.1]);

// demo data integrity
assert.strictEqual(data.days.length, 5);
data.days.forEach((d) => {
  assert.strictEqual(d.forecast.length, 24, d.id + " forecast length");
  assert.strictEqual(d.actual.length, 24, d.id + " actual length");
  d.actual.forEach((v) => assert(v >= 5 && Number.isInteger(v), "positive int"));
  d.forecast.forEach((v) => assert(v >= 5 && Number.isInteger(v), "positive int"));
});

// analysis shape + sane ranges for a demo (misses should be visible but realistic)
const r = analyze(data);
assert.strictEqual(r.dayStats.length, 5);
assert(r.weekWape > 0.03 && r.weekWape < 0.30, "week WAPE in demo range, got " + r.weekWape);
r.dayStats.forEach((s) => assert(s.wape !== null && s.wape < 0.5));
assert.strictEqual(r.worst.length, 8);
assert(r.worst[0].error >= r.worst[7].error, "worst sorted desc");
assert(r.worst.every((w) => w.forecast !== w.actual), "worst rows are real misses");

console.log("ALL TESTS PASS");
console.log("week WAPE:", (r.weekWape * 100).toFixed(1) + "%", "| week bias:", (r.weekBias * 100).toFixed(1) + "%");
console.log("worst interval:", r.worst[0].day, r.worst[0].interval, (r.worst[0].error * 100).toFixed(1) + "%");
