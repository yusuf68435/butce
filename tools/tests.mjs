// Lightweight unit tests for pure utilities in app.js
// Usage: npm test
// Strategy: import app.js as text, eval the pure helper subset in a sandbox.
// Zero deps beyond Node built-ins.

import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const APP = await readFile(resolve(ROOT, "app.js"), "utf8");

// Minimal browser shims to allow app.js top-level to evaluate.
const sandbox = {
  console,
  Math,
  Date,
  Number,
  String,
  Array,
  Object,
  RegExp,
  JSON,
  Map,
  Set,
  WeakMap,
  WeakSet,
  Promise,
  setTimeout,
  clearTimeout,
  performance: { now: () => Date.now() },
  requestAnimationFrame: (fn) => setTimeout(fn, 0),
  cancelAnimationFrame: clearTimeout,
  navigator: { language: "tr-TR", vibrate: () => true },
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  localStorage: (() => {
    const store = new Map();
    return {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  })(),
  document: (() => {
    function stubElement() {
      const e = {
        style: {},
        dataset: {},
        children: [],
        innerHTML: "",
        textContent: "",
        hidden: false,
        value: "",
        nextSibling: null,
        parentNode: { insertBefore() {} },
        classList: {
          add() {},
          remove() {},
          toggle() {},
          contains: () => false,
        },
        setAttribute() {},
        removeAttribute() {},
        getAttribute: () => null,
        hasAttribute: () => false,
        toggleAttribute() {},
        addEventListener() {},
        removeEventListener() {},
        appendChild(c) {
          this.children.push(c);
          return c;
        },
        removeChild() {},
        insertBefore() {},
        querySelector: () => stubElement(),
        querySelectorAll: () => [],
        focus() {},
        blur() {},
        click() {},
        getBoundingClientRect: () => ({
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
        }),
      };
      return e;
    }
    const root = stubElement();
    root.documentElement = stubElement();
    root.documentElement.lang = "tr";
    root.body = stubElement();
    root.activeElement = null;
    root.querySelector = () => stubElement();
    root.querySelectorAll = () => [];
    root.createElement = () => stubElement();
    root.createTextNode = (s) => ({ textContent: String(s) });
    root.addEventListener = () => {};
    return root;
  })(),
  window: { addEventListener: () => {}, scrollY: 0 },
  location: { replace: () => {}, pathname: "/" },
  history: { pushState: () => {}, back: () => {} },
  fetch: () => Promise.reject(new Error("offline")),
  AbortController: class {
    constructor() {
      this.signal = {};
    }
    abort() {}
  },
  MutationObserver: class {
    observe() {}
    disconnect() {}
  },
  FileReader: class {
    constructor() {}
    readAsText() {
      this.onload?.({ target: { result: "" } });
    }
  },
  Blob: class {},
  URL: { createObjectURL: () => "blob:", revokeObjectURL: () => {} },
};
sandbox.window = Object.assign(sandbox.window, sandbox);
sandbox.global = sandbox;
sandbox.self = sandbox;

sandbox.__GGAI_TEST__ = true;
vm.createContext(sandbox);
// Append re-export of const-bound modules to globalThis for the test runner
const APP_PLUS_EXPORTS =
  APP +
  `
;Object.assign(globalThis, {
  fmt, parseAmount, inputAmount, uid, monthKeyOf, daysSince,
  silverUnitNow, silverStats, totalsOf, wealthBreakdown, budgetSpent,
  I18N, Lang, t, Theme, Privacy, Haptics, Store, Sheets, Toast,
  Confirm, Prompt, DatePicker, Budgets, ETA_OPTIONS, ETA_LABELS,
  CATEGORY_META, CHART_PALETTE, OUNCE_TO_GRAM,
});`;
vm.runInContext(APP_PLUS_EXPORTS, sandbox);

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test("fmt.try formats integers as ₺ with TR thousands", () => {
  assert.equal(sandbox.fmt.try(0), "₺0");
  assert.equal(sandbox.fmt.try(1234), "₺1.234");
  assert.equal(sandbox.fmt.try(1000000), "₺1.000.000");
  assert.equal(sandbox.fmt.try(-500), "-₺500");
});

test("fmt.signed prepends + or − sign", () => {
  assert.equal(sandbox.fmt.signed(0), "₺0");
  assert.equal(sandbox.fmt.signed(100), "+₺100");
  assert.equal(sandbox.fmt.signed(-100), "−₺100");
});

test("fmt.date converts ISO to TR (gg.aa.yyyy)", () => {
  assert.equal(sandbox.fmt.date("2026-04-28"), "28.04.2026");
});

test("fmt.monthLabel renders TR month name + year", () => {
  assert.equal(sandbox.fmt.monthLabel("2026-01"), "Ocak 2026");
  assert.equal(sandbox.fmt.monthLabel("2026-12"), "Aralık 2026");
});

test("fmt.pct adds + sign for non-negative", () => {
  assert.equal(sandbox.fmt.pct(15), "+15.0%");
  assert.equal(sandbox.fmt.pct(0), "+0.0%");
  assert.equal(sandbox.fmt.pct(-3.14159), "-3.1%");
});

test("parseAmount accepts TR + ISO formats", () => {
  assert.equal(sandbox.parseAmount("1.234"), 1234);
  assert.equal(sandbox.parseAmount("1.234,56"), 1234.56);
  assert.equal(sandbox.parseAmount("₺ 99,90"), 99.9);
  assert.equal(sandbox.parseAmount(""), 0);
  assert.equal(sandbox.parseAmount("garbage"), 0);
});

test("inputAmount converts JS number to TR string", () => {
  assert.equal(sandbox.inputAmount(1234.5), "1234,5");
  assert.equal(sandbox.inputAmount(0), "");
  assert.equal(sandbox.inputAmount(null), "");
});

test("monthKeyOf strips day", () => {
  assert.equal(sandbox.monthKeyOf("2026-04-28"), "2026-04");
});

test("daysSince returns positive integer for past dates", () => {
  const v = sandbox.daysSince(
    new Date(Date.now() - 5 * 86400000).toISOString(),
  );
  assert.ok(v >= 4 && v <= 6, `expected ~5, got ${v}`);
});

test("uid is reasonably unique across rapid calls", () => {
  const ids = new Set();
  for (let i = 0; i < 1000; i++) ids.add(sandbox.uid());
  assert.equal(ids.size, 1000);
});

test("silverUnitNow falls back to gram price for ounces (× 31.1035)", () => {
  const p = { kind: "ounce", currentPrice: null, amount: 1, buyPrice: 0 };
  const v = sandbox.silverUnitNow(p, 50);
  assert.ok(Math.abs(v - 1555.175) < 0.01, `got ${v}`);
});

test("silverStats computes p/l correctly", () => {
  const p = {
    kind: "gram",
    amount: 100,
    buyPrice: 30,
    currentPrice: null,
    targetPrice: 60,
  };
  const s = sandbox.silverStats(p, 50);
  assert.equal(s.cost, 3000);
  assert.equal(s.value, 5000);
  assert.equal(s.pl, 2000);
  assert.ok(Math.abs(s.plPct - 66.6666) < 0.01);
  assert.equal(s.targetHit, false);
});

test("silverStats marks targetHit when current >= target", () => {
  const p = {
    kind: "gram",
    amount: 1,
    buyPrice: 30,
    currentPrice: null,
    targetPrice: 50,
  };
  assert.equal(sandbox.silverStats(p, 50).targetHit, true);
  assert.equal(sandbox.silverStats(p, 49).targetHit, false);
});

test("I18N tr/en have the same keys", () => {
  const trKeys = Object.keys(sandbox.I18N.tr).sort();
  const enKeys = Object.keys(sandbox.I18N.en).sort();
  assert.deepEqual(trKeys, enKeys, "TR and EN dictionaries must match keys");
});

test("t() falls back to TR when key missing in EN", () => {
  sandbox.localStorage.setItem("ggai:lang", "en");
  // inject a TR-only key
  sandbox.I18N.tr["test.fallback"] = "düşer";
  const v = sandbox.t("test.fallback");
  assert.equal(v, "düşer");
});

// Run
let pass = 0;
let fail = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log("  ✓", name);
    pass++;
  } catch (err) {
    console.log("  ✗", name);
    console.log("    ", err.message);
    fail++;
  }
}
console.log(
  `\n  ${pass} passed, ${fail} failed (${tests.length} total)\n`,
);
process.exit(fail ? 1 : 0);
