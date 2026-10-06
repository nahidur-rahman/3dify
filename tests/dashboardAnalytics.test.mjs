import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTypeScript(relativePath, dependencies = {}, extraGlobals = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    console,
    ...extraGlobals,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: filename.pathname });
  return exports;
}

const analytics = loadTypeScript("../src/lib/dashboardAnalytics.ts");

test("daily reporting switches dates at Bangladesh midnight", () => {
  assert.equal(analytics.getDhakaDate(new Date("2026-10-05T17:59:59Z")), "2026-10-05");
  assert.equal(analytics.getDhakaDate(new Date("2026-10-05T18:00:00Z")), "2026-10-06");
  assert.equal(analytics.getDhakaDayStart("2026-10-06").toISOString(), "2026-10-05T18:00:00.000Z");
});

test("7D and 14D include today and exactly the requested number of dates", () => {
  for (const [period, count] of [["7D", 7], ["14D", 14]]) {
    const start = analytics.getPeriodStart(period, "2026-01-03");
    const days = analytics.fillAnalyticsDays([], start, "2026-01-03");
    assert.equal(days.length, count);
    assert.equal(days.at(-1).date, "2026-01-03");
  }
});

test("month ranges follow calendar months across short months and year boundaries", () => {
  assert.equal(analytics.getPeriodStart("1M", "2026-10-06"), "2026-09-07");
  assert.equal(analytics.getPeriodStart("3M", "2026-10-06"), "2026-07-07");
  assert.equal(analytics.getPeriodStart("6M", "2026-10-06"), "2026-04-07");
  assert.equal(analytics.getPeriodStart("1M", "2026-03-31"), "2026-03-01");
  assert.equal(analytics.getPeriodStart("1M", "2024-03-31"), "2024-03-01");
  assert.equal(analytics.getPeriodStart("3M", "2026-01-31"), "2025-11-01");
});

test("days without orders are zero-filled and source totals are preserved", () => {
  const record = { date: "2026-10-05", orders: 2, products: 7, amount: 1234.56 };
  const days = analytics.fillAnalyticsDays([record], "2026-10-04", "2026-10-06");
  assert.equal(days.length, 3);
  assert.deepEqual({ ...days[0] }, { date: "2026-10-04", orders: 0, products: 0, amount: 0 });
  assert.deepEqual({ ...days[1] }, record);
  assert.deepEqual({ ...days[2] }, { date: "2026-10-06", orders: 0, products: 0, amount: 0 });
});

test("each selected period filters out older and future records", () => {
  const days = analytics.fillAnalyticsDays([], "2026-04-06", "2026-10-07");
  for (const [period, count] of [["7D", 7], ["14D", 14], ["1M", 30], ["3M", 92], ["6M", 183]]) {
    const selected = analytics.selectAnalyticsPeriod(days, period, "2026-10-06");
    assert.equal(selected.length, count);
    assert.equal(selected.at(-1).date, "2026-10-06");
  }
});

test("database aggregates serialize safely and amounts round to paisa", async () => {
  const adminAnalytics = loadTypeScript("../src/lib/adminAnalytics.ts", {
    "@/lib/db": {
      prisma: { $queryRaw: async () => [
        { date: "2026-10-06", orders: 2n, products: 7n, amount: 1234.5600000000002 },
      ] },
    },
    "@/lib/dashboardAnalytics": analytics,
  });
  const result = await adminAnalytics.getDashboardAnalytics(new Date("2026-10-06T12:00:00Z"));
  assert.equal(result.available, true);
  assert.equal(result.days.length, 183);
  assert.deepEqual({ ...result.days.at(-1) }, { date: "2026-10-06", orders: 2, products: 7, amount: 1234.56 });
  assert.doesNotThrow(() => JSON.stringify(result));
});

test("a database failure is reported as unavailable rather than zero sales", async () => {
  const adminAnalytics = loadTypeScript("../src/lib/adminAnalytics.ts", {
    "@/lib/db": { prisma: { $queryRaw: async () => { throw new Error("Offline"); } } },
    "@/lib/dashboardAnalytics": analytics,
  }, { console: { error() {} } });
  const result = await adminAnalytics.getDashboardAnalytics(new Date("2026-10-06T12:00:00Z"));
  assert.equal(result.available, false);
  assert.equal(result.days.length, 0);
});
