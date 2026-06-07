// Otomatik 20 ekran görüntüsü — screenshots/ klasörüne PNG olarak yazar.
// Çalıştırma: node tools/capture.mjs
// Önkoşul: npm i playwright

import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "screenshots");
const PORT = 8766;
const URL = `http://localhost:${PORT}`;
// App source lives under uygulama/ (apple-tasarim.css stays at repo root, so we
// serve from ROOT and navigate into the subfolder).
const BASE = `${URL}/uygulama`;

const SEED = `(() => {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  const state = {
    transactions: [
      { id:'t1', type:'income',  category:'Maaş/Proje',   description:'Nisan maaşı',           amount:85000, date:daysAgo(2) },
      { id:'t2', type:'income',  category:'Kira (gelen)', description:'Daire 3',               amount:12500, date:daysAgo(5) },
      { id:'t3', type:'expense', category:'Kira/Ev',      description:'Apartman dahil',        amount:22000, date:daysAgo(1) },
      { id:'t4', type:'expense', category:'Market',       description:'Migros',                amount:4350,  date:daysAgo(3) },
      { id:'t5', type:'expense', category:'Yakıt/Ulaşım', description:'Shell',                 amount:1800,  date:daysAgo(4) },
      { id:'t6', type:'expense', category:'Fatura',       description:'Elektrik + İnternet',   amount:2280,  date:daysAgo(6) },
      { id:'t7', type:'expense', category:'Yemek',        description:'Akşam',                 amount:950,   date:daysAgo(2) },
      { id:'t8', type:'expense', category:'Sağlık',       description:'Eczane',                amount:460,   date:daysAgo(7) },
    ],
    pending: [
      { id:'p1', source:'UYART projesi',     amount:35000, eta:'thisMonth', exactDate:null, createdAt:daysAgo(12) },
      { id:'p2', source:'Freelance tasarım', amount:8500,  eta:'thisWeek',  exactDate:null, createdAt:daysAgo(4)  },
      { id:'p3', source:'Eski müşteri',      amount:15000, eta:'3mPlus',    exactDate:null, createdAt:daysAgo(75) },
    ],
    silver: [
      { id:'s1', kind:'gram',  amount:500, buyPrice:38,   buyDate:daysAgo(120), currentPrice:null, targetPrice:60   },
      { id:'s2', kind:'ounce', amount:5,   buyPrice:1180, buyDate:daysAgo(60),  currentPrice:null, targetPrice:1800 },
      { id:'s3', kind:'fund',  amount:250, buyPrice:22.5, buyDate:daysAgo(30),  currentPrice:31.2, targetPrice:40   },
    ],
    categories: {
      income:  ['Maaş/Proje','Kira (gelen)','Diğer gelir'],
      expense: ['Kira/Ev','Market','Yakıt/Ulaşım','Fatura','Yemek','Ofis/UYART','Sağlık','Diğer gider'],
    },
    settings: { silverGramPrice: 52 },
  };
  localStorage.setItem('ggai:state:v1', JSON.stringify(state));
})()`;

const EMPTY_STATE = `(() => {
  localStorage.setItem('ggai:state:v1', JSON.stringify({
    transactions:[], pending:[], silver:[],
    categories: {
      income:  ['Maaş/Proje','Kira (gelen)','Diğer gelir'],
      expense: ['Kira/Ev','Market','Yakıt/Ulaşım','Fatura','Yemek','Ofis/UYART','Sağlık','Diğer gider'],
    },
    settings: {}
  }));
})()`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function startServer() {
  const proc = spawn(
    process.platform === "win32" ? "python" : "python3",
    ["-m", "http.server", String(PORT)],
    { cwd: ROOT, stdio: "ignore" },
  );
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(BASE + "/index.html");
      if (r.ok) return proc;
    } catch {}
    await sleep(200);
  }
  proc.kill();
  throw new Error("Static server did not start");
}

async function newPage(browser, theme) {
  const ctx = await browser.newContext({
    ...devices["iPhone 13"],
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block", // SW interferes with networkidle + cache reuse
  });
  const page = await ctx.newPage();
  // Set theme via localStorage and a test sentinel before any page script runs.
  // The sentinel lets app.js know we're in a test context (skip SW registration,
  // skip `init()` redirects, etc. if needed).
  await page.addInitScript((th) => {
    try {
      localStorage.setItem("ggai:theme", th);
    } catch {}
  }, theme);
  return { ctx, page };
}

async function gotoFresh(page, seed) {
  // Use `load` (not `networkidle`) — the PWA's deferred script + font load can
  // keep the network busy long enough to time out networkidle on slow CI.
  await page.goto(BASE + "/?b=" + Date.now(), { waitUntil: "load" });
  await page.evaluate(seed);
  await page.goto(BASE + "/?b=" + Date.now(), { waitUntil: "load" });
  await page.waitForSelector(".tab.active");
  await sleep(700); // let sparkline + bars animate
}

async function shoot(page, name, opts = {}) {
  const path = resolve(OUT, name);
  await page.screenshot({ path, omitBackground: false, ...opts });
  console.log("✓", name);
}

async function clickTab(page, target) {
  await ensureNoSheets(page);
  await page.click(`.tab[data-target="${target}"]`);
  await sleep(700);
}

async function ensureNoSheets(page) {
  // Force-close any leftover sheet/scrim and clear history-driven body lock.
  await page.evaluate(() => {
    document.querySelectorAll(".sheet.open").forEach((s) => {
      s.classList.remove("open");
    });
    const scrim = document.getElementById("scrim");
    if (scrim) scrim.classList.remove("open");
    document.body.style.overflow = "";
  });
  await sleep(250);
}

async function closeSheet(page, sheetId) {
  await page
    .click(`#${sheetId} [data-sheet-close]`, { timeout: 1500 })
    .catch(() => {});
  await sleep(700);
  await ensureNoSheets(page);
}

async function run() {
  await mkdir(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch();

  try {
    // ───────── LIGHT MODE ─────────
    {
      const { ctx, page } = await newPage(browser, "light");
      await gotoFresh(page, SEED);

      // 01 Cash hero+wealth
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(200);
      await shoot(page, "01-light-cash-hero.png");

      // 02 Cash full
      await shoot(page, "02-light-cash-full.png", { fullPage: true });

      // 03 Cash chart+list (mid scroll)
      await page.evaluate(() => window.scrollTo(0, 700));
      await sleep(300);
      await shoot(page, "03-light-cash-chart.png");

      // 04 Pending
      await clickTab(page, "pending");
      await page.evaluate(() => window.scrollTo(0, 0));
      await shoot(page, "04-light-pending.png");

      // 05 Silver
      await clickTab(page, "silver");
      await page.evaluate(() => window.scrollTo(0, 0));
      await shoot(page, "05-light-silver.png");

      // 06 Tx sheet — Gider
      await clickTab(page, "cash");
      await page.click("#header-add");
      await sleep(600);
      await page.fill("#tx-amount", "1250");
      await page.click("#tx-cat-grid .chip:nth-child(2)");
      await page.fill("#tx-desc", "Hafta sonu");
      await page.evaluate(() => document.activeElement.blur());
      await sleep(400);
      await shoot(page, "06-sheet-tx-expense.png");

      // 07 Tx sheet — Gelir
      await page.click('[data-tx-type="income"]');
      await sleep(300);
      await page.fill("#tx-amount", "65000");
      await page.click("#tx-cat-grid .chip:nth-child(1)");
      await page.fill("#tx-desc", "Yeni proje ödemesi");
      await page.evaluate(() => document.activeElement.blur());
      await sleep(400);
      await shoot(page, "07-sheet-tx-income.png");
      await closeSheet(page, "sheet-tx");

      // 08 Pending sheet
      await clickTab(page, "pending");
      await page.click("#header-add");
      await sleep(600);
      await page.fill("#pending-source", "Acente komisyonu");
      await page.fill("#pending-amount-in", "12500");
      await page.click("#eta-grid .chip:nth-child(3)");
      await page.evaluate(() => document.activeElement.blur());
      await sleep(400);
      await shoot(page, "08-sheet-pending.png");
      await closeSheet(page, "sheet-pending");

      // 09 Collect sheet
      await page.click("[data-collect]");
      await sleep(700);
      await page.evaluate(() => document.activeElement.blur());
      await sleep(300);
      await shoot(page, "09-sheet-collect.png");
      await closeSheet(page, "sheet-collect");

      // 10 Silver sheet — Gram
      await clickTab(page, "silver");
      await page.click("#header-add");
      await sleep(600);
      await page.fill("#silver-amount-in", "250");
      await page.fill("#silver-buy-price", "42,5");
      await page.fill("#silver-target", "65");
      await page.evaluate(() => document.activeElement.blur());
      await sleep(400);
      await shoot(page, "10-sheet-silver-gram.png");

      // 11 Silver sheet — Fon
      await page.click('[data-silver-kind="fund"]');
      await sleep(300);
      await page.fill("#silver-current-price", "38,9");
      await page.evaluate(() => document.activeElement.blur());
      await sleep(400);
      await shoot(page, "11-sheet-silver-fund.png");
      await closeSheet(page, "sheet-silver");

      // 12 Month picker
      await clickTab(page, "cash");
      await page.click("#month-pill");
      await sleep(600);
      await shoot(page, "12-sheet-month.png");
      await closeSheet(page, "sheet-month");

      // 13 Settings
      await page.click("#open-settings");
      await sleep(600);
      await shoot(page, "13-sheet-settings.png");
      await closeSheet(page, "sheet-settings");

      // ── Empty states ──
      await page.evaluate(EMPTY_STATE);
      await page.goto(BASE + "/?empty=" + Date.now(), {
        waitUntil: "load",
      });
      await page.waitForSelector(".tab.active");
      await sleep(600);

      // 14 Empty cash
      await shoot(page, "14-light-empty-cash.png", { fullPage: true });

      // 15 Empty pending
      await clickTab(page, "pending");
      await shoot(page, "15-light-empty-pending.png");

      // 16 Empty silver
      await clickTab(page, "silver");
      await shoot(page, "16-light-empty-silver.png");

      await ctx.close();
    }

    // ───────── DARK MODE ─────────
    {
      const { ctx, page } = await newPage(browser, "dark");
      await gotoFresh(page, SEED);

      // 17 Dark Cash
      await shoot(page, "17-dark-cash.png");

      // 18 Dark Pending
      await clickTab(page, "pending");
      await shoot(page, "18-dark-pending.png");

      // 19 Dark Silver
      await clickTab(page, "silver");
      await shoot(page, "19-dark-silver.png");

      // 20 Dark sheet
      await clickTab(page, "cash");
      await page.click("#header-add");
      await sleep(600);
      await page.fill("#tx-amount", "3200");
      await page.click("#tx-cat-grid .chip:nth-child(4)");
      await page.fill("#tx-desc", "Aylık fatura");
      await page.evaluate(() => document.activeElement.blur());
      await sleep(400);
      await shoot(page, "20-dark-sheet-tx.png");

      await ctx.close();
    }

    console.log("\n→ 20 ekran görüntüsü", OUT, "klasörüne yazıldı.");
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
