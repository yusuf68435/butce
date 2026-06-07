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
  computeInsights, shiftMonthKey, detectAnomaly, expenseByCategory,
  normalizeTags, goalProgress, debtsNet, collectDueReminders, tagSpending,
  AppLock, monthDailyExpense, categoryMonthlyTrend,
  applyTxFilters, buildSampleData, cumulativeBalanceTrend,
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

test("shiftMonthKey rolls across year boundary", () => {
  assert.equal(sandbox.shiftMonthKey("2026-03", 1), "2026-02");
  assert.equal(sandbox.shiftMonthKey("2026-01", 1), "2025-12");
  assert.equal(sandbox.shiftMonthKey("2026-05", 3), "2026-02");
});

test("computeInsights: top category, share, vs-last-month delta", () => {
  sandbox.Store.update((s) => {
    s.transactions = [
      // Önceki ay (2026-02): 1000 gider
      { id: "p1", type: "expense", category: "Market", amount: 1000, date: "2026-02-10" },
      // Bu ay (2026-03): 1500 Market + 500 Yakıt = 2000 gider, 3000 gelir
      { id: "c1", type: "expense", category: "Market", amount: 1500, date: "2026-03-05" },
      { id: "c2", type: "expense", category: "Yakıt", amount: 500, date: "2026-03-06" },
      { id: "c3", type: "income", category: "Maaş", amount: 3000, date: "2026-03-01" },
    ];
  });
  const ins = sandbox.computeInsights("2026-03");
  assert.equal(ins.cur.expense, 2000);
  assert.equal(ins.cur.balance, 1000);
  assert.equal(ins.topCat, "Market");
  assert.equal(ins.topAmt, 1500);
  assert.equal(Math.round(ins.topShare), 75); // 1500/2000
  assert.equal(ins.expenseDelta, 1000); // 2000 − 1000
  assert.equal(Math.round(ins.expensePct), 100); // +100%
});

test("detectAnomaly flags a category that spiked vs recent average", () => {
  sandbox.Store.update((s) => {
    s.transactions = [
      { id: "a1", type: "expense", category: "Fatura", amount: 300, date: "2026-01-10" },
      { id: "a2", type: "expense", category: "Fatura", amount: 300, date: "2026-02-10" },
      // Mart: 1500 → ort. 300'ün çok üstünde
      { id: "a3", type: "expense", category: "Fatura", amount: 1500, date: "2026-03-10" },
    ];
  });
  const byCat = sandbox.expenseByCategory(
    sandbox.Store.state.transactions.filter((t) => t.date.startsWith("2026-03")),
  );
  const anomaly = sandbox.detectAnomaly("2026-03", byCat, 2);
  assert.equal(anomaly.category, "Fatura");
  assert.equal(anomaly.amount, 1500);
  assert.equal(anomaly.avg, 300);
});

// Arrays returned from the vm sandbox have a different Array prototype than the
// test realm, so deepEqual sees them as "not reference-equal". JSON round-trip
// re-creates them with the test realm's Array.
const plain = (v) => JSON.parse(JSON.stringify(v));

test("normalizeTags: trims, lowercases, dedupes, drops empties", () => {
  assert.deepEqual(plain(sandbox.normalizeTags("Tatil, Work ,tatil, ")), [
    "tatil",
    "work",
  ]);
  assert.deepEqual(plain(sandbox.normalizeTags("")), []);
  assert.deepEqual(plain(sandbox.normalizeTags("a\nb,c")), ["a", "b", "c"]);
  assert.deepEqual(plain(sandbox.normalizeTags(["X", "x", "Y"])), ["x", "y"]);
  // multi-word tag keeps its single inner space
  assert.deepEqual(plain(sandbox.normalizeTags("is  yemegi")), ["is yemegi"]);
});

test("normalizeTags: caps count at 8 and drops over-long tags", () => {
  const many = Array.from({ length: 12 }, (_, i) => "t" + i).join(",");
  assert.equal(sandbox.normalizeTags(many).length, 8);
  assert.deepEqual(plain(sandbox.normalizeTags("a".repeat(40))), []);
});

test("goalProgress clamps between 0 and 100", () => {
  assert.equal(sandbox.goalProgress(0, 1000), 0);
  assert.equal(sandbox.goalProgress(500, 1000), 50);
  assert.equal(sandbox.goalProgress(1500, 1000), 100); // over-funded → capped
  assert.equal(sandbox.goalProgress(-50, 1000), 0); // negative → floored
  assert.equal(sandbox.goalProgress(100, 0), 0); // no target → 0
});

test("debtsNet sums by direction and ignores settled", () => {
  const net = sandbox.debtsNet([
    { direction: "owedToMe", amount: 1000 },
    { direction: "owedToMe", amount: 500, settled: true }, // ignored
    { direction: "iOwe", amount: 300 },
  ]);
  assert.equal(net.owedToMe, 1000);
  assert.equal(net.iOwe, 300);
  assert.equal(net.net, 700);
  assert.deepEqual(plain(sandbox.debtsNet([])), {
    owedToMe: 0,
    iOwe: 0,
    net: 0,
  });
});

test("collectDueReminders: due/overdue debts + pending, ignores settled/future", () => {
  const debts = [
    { id: "d1", label: "Ali", amount: 300, direction: "owedToMe", dueDate: "2026-06-01" }, // overdue
    { id: "d2", label: "Veli", amount: 100, direction: "iOwe", dueDate: "2099-01-01" }, // future
    { id: "d3", label: "X", amount: 50, direction: "iOwe", dueDate: "2026-06-01", settled: true }, // settled
    { id: "d4", label: "NoDate", amount: 10, direction: "iOwe" }, // no due date
  ];
  const pending = [
    { id: "p1", source: "Fatura iadesi", amount: 200, exactDate: "2026-06-07" }, // due today
    { id: "p2", source: "Gelecek", amount: 999, exactDate: "2099-01-01" }, // future
    { id: "p3", source: "Belirsiz", amount: 5 }, // no exactDate
  ];
  const due = sandbox.collectDueReminders(debts, pending, "2026-06-07");
  const ids = due.map((x) => x.id).sort();
  assert.deepEqual(plain(ids), ["d1", "p1"]);
});

test("tagSpending sums expense amounts per tag, ignores income/untagged", () => {
  const by = sandbox.tagSpending([
    { type: "expense", amount: 100, tags: ["mutfak", "haftalık"] },
    { type: "expense", amount: 50, tags: ["mutfak"] },
    { type: "income", amount: 999, tags: ["mutfak"] }, // income ignored
    { type: "expense", amount: 30 }, // untagged ignored
  ]);
  assert.equal(by.mutfak, 150);
  assert.equal(by["haftalık"], 100);
  assert.equal(Object.keys(by).length, 2);
});

test("AppLock.hash: deterministic for same pin+salt, differs for wrong pin", async () => {
  const a = await sandbox.AppLock.hash("1234");
  const b = await sandbox.AppLock.hash("1234", a.salt);
  assert.equal(b.hash, a.hash);
  const c = await sandbox.AppLock.hash("9999", a.salt);
  assert.notEqual(c.hash, a.hash);
});

test("AppLock.verify: accepts correct PIN, rejects wrong, open when no lock", async () => {
  const { salt, hash } = await sandbox.AppLock.hash("4321");
  sandbox.Store.update((s) => {
    s.settings.lock = { enabled: true, salt, hash, len: 4 };
  });
  assert.equal(await sandbox.AppLock.verify("4321"), true);
  assert.equal(await sandbox.AppLock.verify("0000"), false);
  sandbox.Store.update((s) => {
    delete s.settings.lock;
  });
  assert.equal(await sandbox.AppLock.verify("whatever"), true);
});

test("monthDailyExpense: sums expenses by day, ignores income/other months", () => {
  const by = sandbox.monthDailyExpense("2026-06", [
    { type: "expense", amount: 100, date: "2026-06-05" },
    { type: "expense", amount: 50, date: "2026-06-05" },
    { type: "income", amount: 999, date: "2026-06-05" }, // ignored
    { type: "expense", amount: 30, date: "2026-05-31" }, // other month
  ]);
  assert.equal(by[5], 150);
  assert.equal(Object.keys(by).length, 1);
});

test("categoryMonthlyTrend: per-category monthly series of correct length", () => {
  const tx = [
    { type: "expense", category: "Market", amount: 200, date: "2026-04-10" },
    { type: "expense", category: "Market", amount: 300, date: "2026-06-10" },
    { type: "expense", category: "Kahve", amount: 50, date: "2026-06-10" }, // other cat
    { type: "income", category: "Market", amount: 999, date: "2026-06-10" }, // income
  ];
  const series = sandbox.categoryMonthlyTrend("Market", "2026-06", tx, 3);
  assert.equal(series.length, 3); // 2026-04, 05, 06
  assert.equal(series[0].key, "2026-04");
  assert.equal(series[0].v, 200);
  assert.equal(series[1].v, 0); // May: nothing
  assert.equal(series[2].v, 300); // June: only the expense
});

test("applyTxFilters: type + date range filtering", () => {
  const list = [
    { type: "income", amount: 5000, date: "2026-06-01" },
    { type: "expense", amount: 100, date: "2026-06-10" },
    { type: "expense", amount: 200, date: "2026-04-10" },
    { type: "expense", amount: 300, date: "2025-12-10" },
  ];
  const today = "2026-06-15";
  // type filter
  assert.equal(
    sandbox.applyTxFilters(list, "expense", "all", today).length,
    3,
  );
  assert.equal(sandbox.applyTxFilters(list, "income", "all", today).length, 1);
  // this month
  assert.equal(sandbox.applyTxFilters(list, "all", "month", today).length, 2);
  // last 3 months (Apr, May, Jun) → excludes Dec 2025
  assert.equal(sandbox.applyTxFilters(list, "all", "3m", today).length, 3);
  // this year → excludes Dec 2025
  assert.equal(sandbox.applyTxFilters(list, "all", "year", today).length, 3);
  // combined: expense this month
  assert.equal(
    sandbox.applyTxFilters(list, "expense", "month", today).length,
    1,
  );
});

test("buildSampleData: valid populated state with onboarded flag", () => {
  const s = sandbox.buildSampleData();
  assert.ok(s.transactions.length >= 10);
  assert.ok(Array.isArray(s.goals) && s.goals.length >= 1);
  assert.ok(Array.isArray(s.debts) && s.debts.length >= 1);
  assert.ok(Array.isArray(s.templates) && s.templates.length >= 1);
  assert.equal(s.settings.onboarded, true);
  // every transaction has the required shape
  for (const tx of s.transactions) {
    assert.ok(tx.id && tx.type && tx.category && tx.amount > 0 && tx.date);
  }
});

test("cumulativeBalanceTrend: running net balance at each month-end", () => {
  const tx = [
    { type: "income", amount: 1000, date: "2026-04-15" },
    { type: "expense", amount: 300, date: "2026-05-10" },
    { type: "income", amount: 500, date: "2026-06-02" },
  ];
  const series = sandbox.cumulativeBalanceTrend("2026-06", tx, 3);
  assert.equal(series.length, 3);
  assert.equal(series[0].key, "2026-04");
  assert.equal(series[0].v, 1000); // end of April: +1000
  assert.equal(series[1].v, 700); // end of May: 1000 − 300
  assert.equal(series[2].v, 1200); // end of June: +500
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
