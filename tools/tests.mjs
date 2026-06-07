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

const APP = await readFile(resolve(ROOT, "uygulama", "app.js"), "utf8");

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
  // Web Crypto shims (Node globals) for BackupCrypto round-trip tests
  TextEncoder,
  TextDecoder,
  crypto: globalThis.crypto,
  btoa: (s) => Buffer.from(s, "binary").toString("base64"),
  atob: (s) => Buffer.from(s, "base64").toString("binary"),
  Uint8Array,
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
  CURRENCY_META, FX, Currency, currentCurrency, currencyMeta, convertFromTry,
  SearchPalette, dailyExpenseHeatmap, BackupCrypto,
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

test("currencyMeta returns symbol/locale by code", () => {
  assert.equal(sandbox.currencyMeta("TRY").sym, "₺");
  assert.equal(sandbox.currencyMeta("USD").sym, "$");
  assert.equal(sandbox.currencyMeta("EUR").sym, "€");
  assert.equal(sandbox.currencyMeta("USD").locale, "en-US");
});

test("convertFromTry: TRY identity (default state)", () => {
  // default settings.currency is undefined → "TRY"
  assert.equal(sandbox.currentCurrency(), "TRY");
  assert.equal(sandbox.convertFromTry(1000), 1000);
  assert.equal(sandbox.convertFromTry(0), 0);
  assert.equal(sandbox.convertFromTry(-500), -500);
});

test("convertFromTry: applies FX rate when currency switched", () => {
  sandbox.FX.save({ TRY: 1, USD: 0.05, EUR: 0.04, ts: 1234 });
  sandbox.Store.update((s) => {
    s.settings = s.settings || {};
    s.settings.currency = "USD";
  });
  assert.equal(sandbox.convertFromTry(1000), 50);
  sandbox.Store.update((s) => {
    s.settings.currency = "EUR";
  });
  assert.equal(sandbox.convertFromTry(1000), 40);
  // Reset back to TRY for subsequent tests
  sandbox.Store.update((s) => {
    s.settings.currency = "TRY";
  });
});

test("fmt.try uses display currency symbol", () => {
  // currency=TRY (reset above)
  assert.equal(sandbox.fmt.try(1234), "₺1.234");
  sandbox.Store.update((s) => {
    s.settings.currency = "USD";
  });
  // 1000 TRY × 0.05 = 50 → "$50"
  assert.equal(sandbox.fmt.try(1000), "$50");
  sandbox.Store.update((s) => {
    s.settings.currency = "TRY";
  });
});

test("SearchPalette.searchTransactions: matches category, description, amount", () => {
  sandbox.Store.update((s) => {
    s.transactions = [
      {
        id: "a",
        type: "expense",
        category: "Market",
        amount: 1500,
        description: "Migros haftalık",
        date: "2026-04-25",
      },
      {
        id: "b",
        type: "expense",
        category: "Yakıt/Ulaşım",
        amount: 800,
        description: "Shell benzin",
        date: "2026-04-24",
      },
      {
        id: "c",
        type: "income",
        category: "Maaş/Proje",
        amount: 50000,
        description: "Nisan maaşı",
        date: "2026-04-01",
      },
    ];
  });
  const byCategory = sandbox.SearchPalette.searchTransactions("market");
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, "a");

  const byDescription = sandbox.SearchPalette.searchTransactions("benzin");
  assert.equal(byDescription.length, 1);
  assert.equal(byDescription[0].id, "b");

  const byAmount = sandbox.SearchPalette.searchTransactions("50000");
  assert.equal(byAmount.length, 1);
  assert.equal(byAmount[0].id, "c");

  const empty = sandbox.SearchPalette.searchTransactions("xyz123");
  assert.equal(empty.length, 0);

  const blank = sandbox.SearchPalette.searchTransactions("");
  assert.equal(blank.length, 0);
});

test("SearchPalette: sorted by date desc", () => {
  // (uses transactions seeded above)
  const all = sandbox.SearchPalette.searchTransactions("a"); // matches everything
  // Ensure date order: 2026-04-25 > 2026-04-24 > 2026-04-01
  assert.equal(all[0].date >= all[1].date, true);
  assert.equal(all[1].date >= all[2].date, true);
});

test("dailyExpenseHeatmap: aggregates expenses, ignores income, computes max", () => {
  const today = new Date().toISOString().slice(0, 10);
  const ya = new Date();
  ya.setDate(ya.getDate() - 400);
  const tooOld = ya.toISOString().slice(0, 10);
  sandbox.Store.update((s) => {
    s.transactions = [
      { id: "1", type: "expense", category: "X", amount: 100, date: today },
      { id: "2", type: "expense", category: "Y", amount: 250, date: today }, // same day
      { id: "3", type: "income", category: "Z", amount: 9999, date: today }, // ignored
      { id: "4", type: "expense", category: "X", amount: 50, date: tooOld }, // ignored: > 365 days ago
    ];
  });
  const h = sandbox.dailyExpenseHeatmap();
  assert.equal(h.byDate[today], 350);
  assert.equal(h.total, 350);
  assert.equal(h.days, 1);
  assert.equal(h.max, 350);
});

test("BackupCrypto: encrypt → decrypt round-trip recovers JSON", async () => {
  const original = JSON.stringify({ transactions: [{ id: "a", amount: 42 }] });
  const box = await sandbox.BackupCrypto.encrypt(original, "gizli-parola");
  assert.equal(sandbox.BackupCrypto.isEncrypted(box), true);
  assert.equal(box.enc, "AES-GCM");
  assert.notEqual(box.data, original); // ciphertext must differ from plaintext
  const back = await sandbox.BackupCrypto.decrypt(box, "gizli-parola");
  assert.equal(back, original);
});

test("BackupCrypto: wrong password fails to decrypt", async () => {
  const box = await sandbox.BackupCrypto.encrypt("secret", "dogru");
  await assert.rejects(() => sandbox.BackupCrypto.decrypt(box, "yanlis"));
});

test("BackupCrypto: each encryption uses a fresh salt + iv", async () => {
  const a = await sandbox.BackupCrypto.encrypt("x", "p");
  const b = await sandbox.BackupCrypto.encrypt("x", "p");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
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
