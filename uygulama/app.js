"use strict";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const STORAGE_KEY = "ggai:state:v1";
const STATE_VERSION = 1;
const OUNCE_TO_GRAM = 31.1035;
const AGED_DAYS = 60;
const BACKUP_REMINDER_DAYS = 7;
const PBKDF2_ITERS = 150000;

const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];
const TR_MONTHS_SHORT = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

const DEFAULT_CATEGORIES = {
  income: ["Maaş/Proje", "Kira (gelen)", "Diğer gelir"],
  expense: [
    "Kira/Ev",
    "Market",
    "Yakıt/Ulaşım",
    "Fatura",
    "Yemek",
    "Ofis/UYART",
    "Sağlık",
    "Diğer gider",
  ],
};

// rowKind drives gradient ikonu (.row-icon.<kind>)
const CATEGORY_META = {
  "Maaş/Proje": { icon: "briefcase", kind: "salary" },
  "Kira (gelen)": { icon: "key", kind: "rent-in" },
  "Diğer gelir": { icon: "sparkles", kind: "salary" },
  "Kira/Ev": { icon: "house", kind: "home" },
  Market: { icon: "cart", kind: "market" },
  "Yakıt/Ulaşım": { icon: "fuel", kind: "fuel" },
  Fatura: { icon: "doc", kind: "bills" },
  Yemek: { icon: "fork", kind: "food" },
  "Ofis/UYART": { icon: "building", kind: "home" },
  Sağlık: { icon: "heart", kind: "health" },
  "Diğer gider": { icon: "dot", kind: "home" },
};

const ETA_OPTIONS = [
  { key: "unknown", label: "Belirsiz" },
  { key: "thisWeek", label: "Bu hafta" },
  { key: "thisMonth", label: "Bu ay" },
  { key: "1to3m", label: "1-3 ay" },
  { key: "3mPlus", label: "3 ay+" },
];
const ETA_LABELS = Object.fromEntries(ETA_OPTIONS.map((o) => [o.key, o.label]));
function etaLabel(key) {
  return typeof t === "function" ? t("eta." + key) : ETA_LABELS[key] || key;
}

const SILVER_KIND_LABEL = { gram: "Gram", ounce: "Ons", fund: "Fon" };
const SILVER_KIND_UNIT = { gram: "gr", ounce: "ons", fund: "adet" };

// donut/bar palette
const CHART_PALETTE = [
  "#00E08F",
  "#FF7A45",
  "#7E4DFF",
  "#1E7CE0",
  "#E5476A",
  "#F0A030",
  "#00B574",
  "#5C7BFF",
  "#FFB020",
];

const PRICE_ENDPOINT = "https://finans.truncgil.com/today.json";

/* ==========================================================================
   CURRENCY (display-only switch — internal storage stays TRY)
   ========================================================================== */

const CURRENCY_META = {
  TRY: { sym: "₺", code: "TRY", locale: "tr-TR", name: "Türk Lirası" },
  USD: { sym: "$", code: "USD", locale: "en-US", name: "US Dollar" },
  EUR: { sym: "€", code: "EUR", locale: "de-DE", name: "Euro" },
};

const FX_ENDPOINT = "https://api.frankfurter.app/latest?from=TRY&to=USD,EUR";
// rates[X] = how many X you get for 1 TRY (e.g. USD ~ 0.029 means 1 TRY ≈ 0.029 USD)
const FX_DEFAULT = { TRY: 1, USD: 0.029, EUR: 0.027, ts: 0 };

/* ==========================================================================
   i18n — TR/EN (compact dictionary, key-driven)
   ========================================================================== */

const I18N = {
  tr: {
    "tab.cash": "Nakit",
    "tab.pending": "Bekleyen",
    "tab.silver": "Gümüş",
    "hero.cash.eyebrow": "Bu Ay Bakiye",
    "hero.pending.eyebrow": "Toplam Beklenen",
    "hero.silver.eyebrow": "Güncel Değer",
    "section.wealth": "Toplam Servet",
    "section.trend": "Son 6 Ay Trendi",
    "section.expenses": "Gider Dağılımı",
    "section.transactions": "Hareketler",
    "section.collections": "Tahsilatlar",
    "section.gramPrice": "Gram Fiyatı",
    "section.positions": "Pozisyonlar",
    "trend.delta": "Net Bakiye Değişimi",
    "wealth.total": "Toplam",
    "wealth.cash": "Nakit",
    "wealth.pending": "Bekleyen",
    "wealth.silver": "Gümüş",
    "donut.total": "Toplam",
    "empty.cash.title": "Bu ay hareket yok",
    "empty.cash.sub": "Sağ üstteki + ile ekleyin",
    "empty.pending.title": "Bekleyen tahsilat yok",
    "empty.pending.sub": "Bekleyen ödemeleri sağ üstten ekleyin",
    "empty.silver.title": "Pozisyon yok",
    "empty.silver.sub": "Gram, ons veya fon pozisyonu ekleyin",
    "btn.cancel": "İptal",
    "btn.save": "Kaydet",
    "btn.close": "Kapat",
    "btn.thisMonth": "Bu Ay",
    "btn.fetch": "Çek",
    "btn.transfer": "Aktar",
    "btn.delete": "Sil",
    "btn.confirm": "Tamam",
    "btn.add": "Ekle",
    "btn.giveUp": "Vazgeç",
    "title.newTx": "Yeni Hareket",
    "title.tx": "Hareket",
    "title.newPending": "Yeni Bekleyen",
    "title.pending": "Bekleyen",
    "title.collect": "Tahsilat Geldi",
    "title.newPosition": "Yeni Pozisyon",
    "title.position": "Pozisyon",
    "title.month": "Ay Seç",
    "title.settings": "Ayarlar",
    "title.budgets": "Bütçe Limitleri",
    "title.date": "Tarih Seç",
    "field.amount": "Tutar",
    "field.category": "Kategori",
    "field.description": "Açıklama",
    "field.date": "Tarih",
    "field.source": "Kimden / Ne için",
    "field.eta": "Zaman Tahmini",
    "field.exactDate": "Kesin Tarih (opsiyonel)",
    "field.incomeCategory": "Gelir Kategorisi",
    "field.amountUnit": "Miktar",
    "field.buyPrice": "Alış Birim Fiyatı",
    "field.buyDate": "Alış Tarihi (opsiyonel)",
    "field.currentPrice": "Güncel Birim Fiyatı",
    "field.targetPrice": "Hedef Satış Fiyatı",
    "settings.appearance": "Görünüm",
    "settings.theme": "Tema",
    "settings.themeAuto": "Sistem ile uyumlu",
    "settings.themeLight": "Açık tema",
    "settings.themeDark": "Koyu tema",
    "settings.privacy": "Bakiyeyi Gizle",
    "settings.privacyOff": "Tutarları yıldız (•••) olarak göster",
    "settings.privacyOn": "Tutarlar gizli — dokunmak için tekrar aç",
    "settings.budget": "Bütçe",
    "settings.budgetLimits": "Kategori Limitleri",
    "settings.budgetSub": "Aylık harcama limitleri belirle",
    "settings.backup": "Yedekleme",
    "settings.export": "Yedek İndir",
    "settings.exportSub": "Tüm verilerin tek dosyada",
    "settings.import": "Yedekten Yükle",
    "settings.importSub": "Mevcut verinin üzerine yazılır",
    "settings.csvImport": "CSV İçe Aktar",
    "settings.danger": "Tehlikeli Bölge",
    "settings.reset": "Tüm Veriyi Sil",
    "settings.resetSub": "Bu işlem geri alınamaz",
    "settings.lang": "Dil",
    "settings.notif": "Bütçe Bildirimleri",
    "settings.notifOff": "Limit aşıldığında sistem bildirimi gönder",
    "settings.notifOn": "Bildirimler aktif",
    "settings.notifDenied": "İzin reddedildi — tarayıcı ayarından açabilirsin",
    "settings.recurring": "Tekrarlayan İşlemler",
    "settings.recurringSub": "Her ay otomatik kira/maaş/fatura",
    "settings.currency": "Para Birimi",
    "settings.currencySub": "Görüntüleme dövizi (veriler ₺ olarak saklanır)",
    "settings.fxRates": "Kur Bilgisi",
    "settings.fxFetch": "Güncel Kuru Çek",
    "settings.fxFetchSub": "Frankfurter.app — internet gerekir",
    "settings.fxNever": "Henüz çekilmedi",
    "settings.fxLast": "Son güncelleme",
    "toast.fxUpdated": "Kur güncellendi",
    "toast.fxFailed": "Kur alınamadı — eski veriler kullanılıyor",
    "field.receipt": "Fiş Fotoğrafı",
    "btn.attachPhoto": "+ Fotoğraf Ekle",
    "btn.changePhoto": "Değiştir",
    "btn.removePhoto": "Kaldır",
    "title.receipt": "Fiş",
    "toast.photoSaved": "Fiş eklendi",
    "toast.photoRemoved": "Fiş kaldırıldı",
    "toast.photoTooLarge": "Fotoğraf çok büyük — sıkıştırılamadı",
    "toast.photoFailed": "Fotoğraf yüklenemedi",
    "section.heatmap": "Yıllık Yoğunluk",
    "heatmap.empty": "Bu yıl gider yok",
    "heatmap.legend.less": "az",
    "heatmap.legend.more": "çok",
    "title.search": "Ara",
    "search.hint": "Açıklama, kategori veya tutara göre ara",
    "search.placeholder": "Hareket ara...",
    "search.empty": "Eşleşen hareket yok",
    "search.tooMany": "{n} sonuç bulundu — ilk 50 gösteriliyor",
    "search.count": "{n} sonuç",
    "notif.budgetTitle": "Bütçe Limiti Aşıldı",
    "notif.budgetOver": "limiti aştı",
    "title.newRecurring": "Yeni Tekrarlayan",
    "title.recurring": "Tekrarlayan İşlemler",
    "field.dayOfMonth": "Ayın Günü",
    "label.everyMonth": "her ayın",
    "label.dayOfMonth": ".günü",
    "empty.recurring.title": "Tekrarlayan kural yok",
    "empty.recurring.sub": 'Sağ üstteki "Yeni" ile ekle',
    "toast.recurringApplied": "tekrarlayan işlem uygulandı",
    "toast.recurringDeleted": "Kural silindi",
    "toast.deleted": "Silindi",
    "toast.txDeleted": "Hareket silindi",
    "toast.pendingDeleted": "Bekleyen silindi",
    "toast.positionDeleted": "Pozisyon silindi",
    "toast.amountRequired": "Tutar gerekli",
    "toast.categoryRequired": "Lütfen bir kategori seçin",
    "toast.fundCurrentRequired":
      "Fon pozisyonu için güncel birim fiyatı gerekli",
    "toast.backupLoaded": "Yedek yüldendi",
    "toast.invalidBackup": "Geçersiz yedek dosyası",
    "toast.allDataDeleted": "Tüm veri silindi",
    "toast.online": "Çevrimiçi",
    "toast.offline": "Çevrimdışı — değişiklikler yerel kaydedilir",
    "toast.silverPriceUpdated": "Gümüş fiyatı güncellendi",
    "toast.newVersion": "Yeni sürüm hazır",
    "toast.refresh": "Yenile",
    "eta.unknown": "Belirsiz",
    "eta.thisWeek": "Bu hafta",
    "eta.thisMonth": "Bu ay",
    "eta.1to3m": "1-3 ay",
    "eta.3mPlus": "3 ay+",
    "kind.gram": "Gram",
    "kind.ounce": "Ons",
    "kind.fund": "Fon",
    "label.aged": "eskidi",
    "label.collect": "Geldi · Aktar",
    "label.targetReached": "✓ Hedefe ulaşıldı",
    "numline.buy": "Alış",
    "numline.now": "Şimdi",
    "numline.target": "Hedef",
  },
  en: {
    "tab.cash": "Cash",
    "tab.pending": "Pending",
    "tab.silver": "Silver",
    "hero.cash.eyebrow": "This Month Balance",
    "hero.pending.eyebrow": "Total Expected",
    "hero.silver.eyebrow": "Current Value",
    "section.wealth": "Total Wealth",
    "section.trend": "Last 6 Months Trend",
    "section.expenses": "Expense Breakdown",
    "section.transactions": "Transactions",
    "section.collections": "Collections",
    "section.gramPrice": "Gram Price",
    "section.positions": "Positions",
    "trend.delta": "Net Balance Change",
    "wealth.total": "Total",
    "wealth.cash": "Cash",
    "wealth.pending": "Pending",
    "wealth.silver": "Silver",
    "donut.total": "Total",
    "empty.cash.title": "No transactions this month",
    "empty.cash.sub": "Tap + at the top to add",
    "empty.pending.title": "No pending collections",
    "empty.pending.sub": "Add expected payments from the top",
    "empty.silver.title": "No positions",
    "empty.silver.sub": "Add gram, ounce or fund position",
    "btn.cancel": "Cancel",
    "btn.save": "Save",
    "btn.close": "Close",
    "btn.thisMonth": "This Month",
    "btn.fetch": "Fetch",
    "btn.transfer": "Transfer",
    "btn.delete": "Delete",
    "btn.confirm": "OK",
    "btn.add": "Add",
    "btn.giveUp": "Discard",
    "title.newTx": "New Transaction",
    "title.tx": "Transaction",
    "title.newPending": "New Pending",
    "title.pending": "Pending",
    "title.collect": "Collection Received",
    "title.newPosition": "New Position",
    "title.position": "Position",
    "title.month": "Pick Month",
    "title.settings": "Settings",
    "title.budgets": "Budget Limits",
    "title.date": "Pick Date",
    "field.amount": "Amount",
    "field.category": "Category",
    "field.description": "Description",
    "field.date": "Date",
    "field.source": "From / What for",
    "field.eta": "Time Estimate",
    "field.exactDate": "Exact Date (optional)",
    "field.incomeCategory": "Income Category",
    "field.amountUnit": "Quantity",
    "field.buyPrice": "Buy Unit Price",
    "field.buyDate": "Buy Date (optional)",
    "field.currentPrice": "Current Unit Price",
    "field.targetPrice": "Target Sell Price",
    "settings.appearance": "Appearance",
    "settings.theme": "Theme",
    "settings.themeAuto": "Match system",
    "settings.themeLight": "Light",
    "settings.themeDark": "Dark",
    "settings.privacy": "Hide Balance",
    "settings.privacyOff": "Show amounts as dots (•••)",
    "settings.privacyOn": "Amounts hidden — tap to reveal",
    "settings.budget": "Budget",
    "settings.budgetLimits": "Category Limits",
    "settings.budgetSub": "Set monthly spending limits",
    "settings.backup": "Backup",
    "settings.export": "Download Backup",
    "settings.exportSub": "All data in one file",
    "settings.import": "Restore Backup",
    "settings.importSub": "Overwrites current data",
    "settings.csvImport": "Import CSV",
    "settings.danger": "Danger Zone",
    "settings.reset": "Delete All Data",
    "settings.resetSub": "This cannot be undone",
    "settings.lang": "Language",
    "settings.notif": "Budget Notifications",
    "settings.notifOff": "Send a system notification when limit exceeded",
    "settings.notifOn": "Notifications enabled",
    "settings.notifDenied": "Permission denied — enable from browser settings",
    "settings.recurring": "Recurring Transactions",
    "settings.recurringSub": "Auto-add rent/salary/bills every month",
    "settings.currency": "Currency",
    "settings.currencySub": "Display currency (data stored in ₺)",
    "settings.fxRates": "FX Rates",
    "settings.fxFetch": "Fetch Live Rates",
    "settings.fxFetchSub": "Frankfurter.app — internet required",
    "settings.fxNever": "Not fetched yet",
    "settings.fxLast": "Last updated",
    "toast.fxUpdated": "Rates updated",
    "toast.fxFailed": "Could not fetch rates — using cached values",
    "field.receipt": "Receipt Photo",
    "btn.attachPhoto": "+ Attach Photo",
    "btn.changePhoto": "Replace",
    "btn.removePhoto": "Remove",
    "title.receipt": "Receipt",
    "toast.photoSaved": "Receipt attached",
    "toast.photoRemoved": "Receipt removed",
    "toast.photoTooLarge": "Photo too large — could not compress",
    "toast.photoFailed": "Could not load photo",
    "section.heatmap": "Annual Heatmap",
    "heatmap.empty": "No expenses this year",
    "heatmap.legend.less": "less",
    "heatmap.legend.more": "more",
    "title.search": "Search",
    "search.hint": "Search by description, category or amount",
    "search.placeholder": "Search transactions...",
    "search.empty": "No matching transactions",
    "search.tooMany": "{n} matches — showing first 50",
    "search.count": "{n} matches",
    "notif.budgetTitle": "Budget Limit Exceeded",
    "notif.budgetOver": "over limit",
    "title.newRecurring": "New Recurring",
    "title.recurring": "Recurring Transactions",
    "field.dayOfMonth": "Day of month",
    "label.everyMonth": "every",
    "label.dayOfMonth": "th",
    "empty.recurring.title": "No recurring rules",
    "empty.recurring.sub": 'Tap "New" at the top right',
    "toast.recurringApplied": "recurring transactions applied",
    "toast.recurringDeleted": "Rule deleted",
    "toast.deleted": "Deleted",
    "toast.txDeleted": "Transaction deleted",
    "toast.pendingDeleted": "Pending deleted",
    "toast.positionDeleted": "Position deleted",
    "toast.amountRequired": "Amount required",
    "toast.categoryRequired": "Please select a category",
    "toast.fundCurrentRequired": "Current unit price required for fund",
    "toast.backupLoaded": "Backup loaded",
    "toast.invalidBackup": "Invalid backup file",
    "toast.allDataDeleted": "All data deleted",
    "toast.online": "Online",
    "toast.offline": "Offline — changes saved locally",
    "toast.silverPriceUpdated": "Silver price updated",
    "toast.newVersion": "New version available",
    "toast.refresh": "Refresh",
    "eta.unknown": "Unknown",
    "eta.thisWeek": "This week",
    "eta.thisMonth": "This month",
    "eta.1to3m": "1-3 months",
    "eta.3mPlus": "3 months+",
    "kind.gram": "Gram",
    "kind.ounce": "Ounce",
    "kind.fund": "Fund",
    "label.aged": "stale",
    "label.collect": "Received · Transfer",
    "label.targetReached": "✓ Target reached",
    "numline.buy": "Buy",
    "numline.now": "Now",
    "numline.target": "Target",
  },
};

const Lang = (() => {
  const KEY = "ggai:lang";
  function get() {
    return (
      localStorage.getItem(KEY) ||
      (navigator.language?.startsWith("en") ? "en" : "tr")
    );
  }
  function set(l) {
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l;
    apply();
    if (typeof renderAll === "function") renderAll();
  }
  function apply() {
    const l = get();
    document.documentElement.lang = l;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const v = I18N[l]?.[key];
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      const v = I18N[l]?.[key];
      if (v) el.placeholder = v;
    });
  }
  function init() {
    apply();
  }
  return { init, get, set, apply };
})();

function t(key) {
  const l = Lang.get();
  return I18N[l]?.[key] ?? I18N.tr[key] ?? key;
}

/* ==========================================================================
   ICONS
   ========================================================================== */

const ICONS = {
  settings:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  "chevron-down":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  "chevron-left":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  "chevron-right":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M5 9v6M19 9v6"/></svg>',
  hourglass:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12M6 21h12M7 3v4a5 5 0 0 0 10 0V3M7 21v-4a5 5 0 0 1 10 0v4"/></svg>',
  diamond:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/><path d="M12 3 8 9l4 12 4-12-4-6Z"/></svg>',
  "arrow-down":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>',
  "arrow-up":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  briefcase:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  house:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-8 9 8v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15 19 4M18 5l3 3M15 8l3 3"/></svg>',
  sparkles:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.3a2 2 0 0 0 2 1.7h7.6a2 2 0 0 0 2-1.6L21 8H6"/></svg>',
  fuel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h12V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2zM7 8h6"/><path d="M15 9h2a2 2 0 0 1 2 2v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9l-3-3"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
  fork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2v8a2 2 0 0 0 2 2v10M11 2v8a2 2 0 0 1-2 2M16 2c-1.5 1.5-2 4-2 6s.5 4 2 5v9"/></svg>',
  building:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-5h6v5M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3 5.5 5.5 0 0 0 12 5.5 5.5 5.5 0 0 0 7.5 3 5.5 5.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7z"/></svg>',
  dot: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>',
  wallet:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 9h18M16 14h2"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  trend:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 6-6 4 4 8-8M14 7h7v7"/></svg>',
  inbox:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  "eye-off":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 18 18M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 7 10 7-.6 1.2-1.4 2.3-2.4 3.3M6.5 6.5C3.4 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.9M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  globe:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  repeat:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m17 1 4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  paperclip:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.49-8.48"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h3l2-3h8l2 3h3v12H3z"/><circle cx="12" cy="13" r="4"/></svg>',
};

function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const name = el.dataset.icon;
    const svg = ICONS[name];
    if (svg && el.innerHTML !== svg) el.innerHTML = svg;
    if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-hidden")) {
      el.setAttribute("aria-hidden", "true");
    }
    const inner = el.querySelector("svg");
    if (inner && !inner.hasAttribute("aria-hidden")) {
      inner.setAttribute("aria-hidden", "true");
      inner.setAttribute("focusable", "false");
    }
  });
}

/* ==========================================================================
   STORE
   ========================================================================== */

const Store = (() => {
  const subs = new Set();
  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh();
      const p = JSON.parse(raw);
      return {
        transactions: p.transactions || [],
        pending: p.pending || [],
        silver: p.silver || [],
        categories: {
          income: p.categories?.income || [...DEFAULT_CATEGORIES.income],
          expense: p.categories?.expense || [...DEFAULT_CATEGORIES.expense],
        },
        recurring: p.recurring || [],
        budgets: p.budgets || {},
        goals: p.goals || [],
        debts: p.debts || [],
        templates: p.templates || [],
        settings: p.settings || {},
      };
    } catch {
      return fresh();
    }
  }
  function fresh() {
    return {
      transactions: [],
      pending: [],
      silver: [],
      categories: {
        income: [...DEFAULT_CATEGORIES.income],
        expense: [...DEFAULT_CATEGORIES.expense],
      },
      recurring: [],
      budgets: {},
      goals: [],
      debts: [],
      templates: [],
      settings: {},
    };
  }
  let writeTimer = 0;
  function writeNow() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      if (typeof Toast !== "undefined" && Toast.show) {
        Toast.show("Depolama dolu — yedek alıp temizle", "error", {
          duration: 4500,
        });
      }
      console.error("[Store] persist failed:", err);
    }
  }
  function persist() {
    // Debounced write (rapid edits coalesce); subscribers fire immediately so UI stays in sync.
    clearTimeout(writeTimer);
    writeTimer = setTimeout(writeNow, 200);
    subs.forEach((fn) => fn(data));
  }
  // Make sure pending writes flush before unload
  window.addEventListener("pagehide", () => {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = 0;
      writeNow();
    }
  });
  return {
    get state() {
      return data;
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    update(mutator) {
      mutator(data);
      persist();
    },
    replace(next) {
      data = next;
      persist();
    },
    reset() {
      data = fresh();
      persist();
    },
  };
})();

/* ==========================================================================
   FX — multi-currency rate cache (localStorage, offline-first)
   ========================================================================== */

const FX = (() => {
  const KEY = "ggai:fx";
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v && typeof v.TRY === "number") return { ...FX_DEFAULT, ...v };
      }
    } catch {}
    return { ...FX_DEFAULT };
  }
  let cache = load();
  function get() {
    return cache;
  }
  function rate(code) {
    return cache[code] ?? 1;
  }
  function save(rates) {
    cache = rates;
    try {
      localStorage.setItem(KEY, JSON.stringify(rates));
    } catch {}
  }
  async function refresh() {
    try {
      const res = await fetch(FX_ENDPOINT, { mode: "cors" });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json?.rates || typeof json.rates.USD !== "number") return null;
      const next = {
        TRY: 1,
        USD: json.rates.USD,
        EUR: json.rates.EUR,
        ts: Date.now(),
      };
      save(next);
      return next;
    } catch {
      return null;
    }
  }
  return { get, rate, refresh, save };
})();

function currentCurrency() {
  return Store.state.settings?.currency || "TRY";
}
function currencyMeta(code) {
  return CURRENCY_META[code || currentCurrency()] || CURRENCY_META.TRY;
}
function convertFromTry(amountTry) {
  const c = currentCurrency();
  if (c === "TRY") return Number(amountTry) || 0;
  return (Number(amountTry) || 0) * FX.rate(c);
}

/* ==========================================================================
   FORMATTERS — display-currency aware (internal storage stays TRY)
   ========================================================================== */

const fmt = {
  try(n) {
    const cur = currencyMeta();
    const v = Math.round(convertFromTry(n));
    const sign = v < 0 ? "-" : "";
    return `${sign}${cur.sym}${Math.abs(v).toLocaleString(cur.locale)}`;
  },
  int(n) {
    const cur = currencyMeta();
    const v = Math.round(convertFromTry(n));
    return Math.abs(v).toLocaleString(cur.locale);
  },
  num(n, opts = {}) {
    return Number(n || 0).toLocaleString(currencyMeta().locale, opts);
  },
  signed(n) {
    const cur = currencyMeta();
    const v = Math.round(convertFromTry(n));
    if (v === 0) return fmt.try(0);
    return (
      (v > 0 ? "+" : "−") + cur.sym + Math.abs(v).toLocaleString(cur.locale)
    );
  },
  date(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  },
  monthLabel(key) {
    const [y, m] = key.split("-").map(Number);
    return `${TR_MONTHS[m - 1]} ${y}`;
  },
  pct(v, digits = 1) {
    return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
  },
  time(iso) {
    return new Date(iso).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
// Local YYYY-MM-DD (matches what <input type="date"> emits in the user's TZ).
// toISOString() is UTC-based and produces off-by-one near midnight east of UTC.
function localISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayISO() {
  return localISO(new Date());
}
function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthKeyOf(iso) {
  return iso.slice(0, 7);
}
function daysSince(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}
const MAX_TAG_LEN = 24;
const MAX_TAGS = 8;
/** Parse a comma/newline separated tag string (or array) into a clean tag list. */
function normalizeTags(input) {
  const raw = Array.isArray(input) ? input : String(input || "").split(/[,\n]/);
  const out = [];
  const seen = new Set();
  for (let tag of raw) {
    tag = String(tag).trim().toLowerCase().replace(/\s+/g, " ");
    if (!tag || tag.length > MAX_TAG_LEN || seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}
/** Goal completion as a clamped 0–100 percentage. */
function goalProgress(saved, target) {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, ((Number(saved) || 0) / target) * 100));
}
/** Collect debts/pending that are due on or before `todayIso` (for reminders). */
function collectDueReminders(debts, pending, todayIso) {
  const out = [];
  for (const d of debts || []) {
    if (d.settled || !d.dueDate) continue;
    if (d.dueDate <= todayIso) {
      out.push({
        kind: "debt",
        id: d.id,
        label: d.label,
        amount: Number(d.amount) || 0,
        direction: d.direction,
        dueDate: d.dueDate,
      });
    }
  }
  for (const p of pending || []) {
    if (!p.exactDate) continue;
    if (p.exactDate <= todayIso) {
      out.push({
        kind: "pending",
        id: p.id,
        label: p.source || "Bekleyen tahsilat",
        amount: Number(p.amount) || 0,
        dueDate: p.exactDate,
      });
    }
  }
  return out;
}

/** Net debt position from a debts list (ignores settled rows). */
function debtsNet(debts) {
  let owedToMe = 0;
  let iOwe = 0;
  for (const d of debts || []) {
    if (d.settled) continue;
    const amt = Number(d.amount) || 0;
    if (d.direction === "owedToMe") owedToMe += amt;
    else iOwe += amt;
  }
  return { owedToMe, iOwe, net: owedToMe - iOwe };
}
function parseAmount(input) {
  if (typeof input !== "string") input = String(input ?? "");
  const cleaned = input
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}
function inputAmount(n) {
  return n ? String(n).replace(".", ",") : "";
}

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "dataset") Object.assign(e.dataset, v);
    else e.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}
function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
function categoryMeta(name) {
  return CATEGORY_META[name] || { icon: "dot", kind: "home" };
}

/* ==========================================================================
   HAPTICS (Vibration API — best-effort, silent if unsupported)
   ========================================================================== */

const Notifier = {
  supported() {
    return typeof Notification !== "undefined";
  },
  permission() {
    return this.supported() ? Notification.permission : "denied";
  },
  async requestPermission() {
    if (!this.supported()) return "denied";
    if (Notification.permission === "default") {
      try {
        return await Notification.requestPermission();
      } catch {
        return "denied";
      }
    }
    return Notification.permission;
  },
  send(title, body, opts = {}) {
    if (this.permission() !== "granted") return null;
    try {
      return new Notification(title, {
        body,
        icon:
          opts.icon ||
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' rx='42' fill='%23E5364E'/><text x='96' y='128' font-family='-apple-system,system-ui' font-size='110' font-weight='700' fill='white' text-anchor='middle'>!</text></svg>",
        tag: opts.tag || "ggai",
        renotify: false,
        silent: false,
      });
    } catch {
      return null;
    }
  },
};

const Haptics = {
  light() {
    if (navigator.vibrate) navigator.vibrate(8);
  },
  medium() {
    if (navigator.vibrate) navigator.vibrate(14);
  },
  success() {
    if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
  },
  warning() {
    if (navigator.vibrate) navigator.vibrate([20, 60, 20]);
  },
};

/* ==========================================================================
   RECURRING transactions — monthly auto-apply rules
   ========================================================================== */

const Recurring = (() => {
  let editingId = null;
  let editType = "expense";
  let editCategory = null;

  function open() {
    renderList();
    Sheets.open("sheet-recurring");
  }

  function renderList() {
    const root = $("#recurring-list");
    if (!root) return;
    clear(root);
    const rules = Store.state.recurring || [];
    if (!rules.length) {
      root.appendChild(
        emptyEl("repeat", t("empty.recurring.title"), t("empty.recurring.sub")),
      );
      hydrateIcons(root);
      return;
    }
    rules
      .slice()
      .sort((a, b) => a.dayOfMonth - b.dayOfMonth)
      .forEach((r) => {
        const meta = categoryMeta(r.category);
        const sign = r.type === "income" ? "+" : "−";
        const sub =
          (r.description ? r.description + " · " : "") +
          `${t("label.everyMonth")} ${r.dayOfMonth}${t("label.dayOfMonth")}`;
        const row = el("button", {
          class: "row tappable",
          type: "button",
          onclick: () => openEdit(r.id),
        });
        row.appendChild(
          el("span", {
            class: `row-icon ${meta.kind}`,
            "data-icon": meta.icon,
          }),
        );
        const text = el("div", { class: "row-text" });
        text.appendChild(el("div", { class: "row-title" }, r.category));
        text.appendChild(el("div", { class: "row-sub" }, sub));
        row.appendChild(text);
        row.appendChild(
          el(
            "div",
            { class: `row-amount ${r.type === "income" ? "pos" : "neg"}` },
            `${sign}${fmt.int(r.amount)} ${currencyMeta().sym}`,
          ),
        );
        root.appendChild(row);
      });
    hydrateIcons(root);
  }

  function openEdit(id) {
    editingId = id;
    if (id) {
      const r = Store.state.recurring.find((x) => x.id === id);
      if (!r) return;
      editType = r.type;
      editCategory = r.category;
      $("#rec-edit-title").textContent = t("settings.recurring");
      $("#rec-amount").value = inputAmount(r.amount);
      $("#rec-desc").value = r.description || "";
      $("#rec-day").value = r.dayOfMonth || 1;
      $("#rec-delete").hidden = false;
    } else {
      editType = "expense";
      editCategory = null;
      $("#rec-edit-title").textContent = t("title.newRecurring");
      $("#rec-amount").value = "";
      $("#rec-desc").value = "";
      $("#rec-day").value = 1;
      $("#rec-delete").hidden = true;
    }
    renderSeg();
    renderCats();
    Sheets.open("sheet-recurring-edit", () =>
      setTimeout(() => $("#rec-amount").focus(), 250),
    );
  }

  function renderSeg() {
    $$("[data-rec-type]", $("#sheet-recurring-edit")).forEach((b) => {
      const on = b.dataset.recType === editType;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    setSegThumb("#sheet-recurring-edit .seg", editType === "expense" ? 0 : 1);
  }

  function renderCats() {
    const grid = $("#rec-cat-grid");
    clear(grid);
    for (const c of Store.state.categories[editType]) {
      const isActive = c === editCategory;
      const chip = el(
        "button",
        {
          type: "button",
          class: `chip${isActive ? " active" : ""}`,
          "aria-pressed": String(isActive),
          onclick: () => {
            editCategory = c;
            renderCats();
          },
        },
        c,
      );
      grid.appendChild(chip);
    }
  }

  function save() {
    const amount = parseAmount($("#rec-amount").value);
    if (!amount || amount <= 0) {
      $("#rec-amount").focus();
      Toast.show(t("toast.amountRequired"), "error");
      return;
    }
    if (!editCategory) {
      Toast.show(t("toast.categoryRequired"), "error");
      return;
    }
    const dayOfMonth = Math.max(
      1,
      Math.min(28, Number($("#rec-day").value) || 1),
    );
    const description = $("#rec-desc").value.trim();
    Store.update((s) => {
      s.recurring = s.recurring || [];
      if (editingId) {
        const r = s.recurring.find((x) => x.id === editingId);
        if (r) {
          Object.assign(r, {
            type: editType,
            category: editCategory,
            amount,
            description,
            dayOfMonth,
          });
        }
      } else {
        s.recurring.push({
          id: uid(),
          type: editType,
          category: editCategory,
          amount,
          description,
          dayOfMonth,
          lastApplied: null,
        });
      }
    });
    Sheets.close("sheet-recurring-edit");
    renderList();
  }

  async function remove() {
    if (!editingId) return;
    const ok = await Confirm.show({
      title: "Bu kuralı silmek istiyor musun?",
      message: "Eklenmiş geçmiş hareketler silinmez.",
      confirmLabel: t("btn.delete"),
      danger: true,
    });
    if (!ok) return;
    Store.update((s) => {
      s.recurring = s.recurring.filter((r) => r.id !== editingId);
    });
    Sheets.close("sheet-recurring-edit");
    Toast.show(t("toast.recurringDeleted"), "success");
    renderList();
  }

  function bind() {
    const openBtn = $("#open-recurring");
    if (openBtn) openBtn.addEventListener("click", open);
    const addBtn = $("#recurring-add");
    if (addBtn) addBtn.addEventListener("click", () => openEdit(null));
    $("#rec-edit-save").addEventListener("click", save);
    $("#rec-delete").addEventListener("click", remove);
    $$("[data-rec-type]").forEach((b) => {
      b.addEventListener("click", () => {
        editType = b.dataset.recType;
        editCategory = null;
        renderSeg();
        renderCats();
      });
    });
  }

  return { open, bind };
})();

/* ==========================================================================
   GOALS — savings goals with progress
   ========================================================================== */

const Goals = (() => {
  function open() {
    renderList();
    Sheets.open("sheet-goals");
  }

  function renderList() {
    const root = $("#goals-list");
    if (!root) return;
    clear(root);
    const goals = Store.state.goals || [];
    if (!goals.length) {
      root.appendChild(
        emptyEl("trend", "Henüz hedef yok", "Aşağıdan bir birikim hedefi ekle"),
      );
      hydrateIcons(root);
      return;
    }
    for (const g of goals) {
      const pct = goalProgress(g.saved, g.target);
      const card = el("div", { class: "goal-card" });
      const head = el("div", { class: "goal-head" });
      head.appendChild(el("div", { class: "goal-label" }, g.label));
      head.appendChild(el("div", { class: "goal-pct" }, `%${pct.toFixed(0)}`));
      card.appendChild(head);
      const bar = el("div", { class: "goal-bar" });
      const fill = el("div", {
        class: `goal-fill${pct >= 100 ? " done" : ""}`,
      });
      bar.appendChild(fill);
      card.appendChild(bar);
      requestAnimationFrame(() => {
        fill.style.width = pct + "%";
      });
      card.appendChild(
        el(
          "div",
          { class: "goal-meta" },
          `${fmt.try(g.saved)} / ${fmt.try(g.target)}`,
        ),
      );
      const actions = el("div", { class: "goal-actions" });
      actions.appendChild(
        el(
          "button",
          {
            type: "button",
            class: "mini-btn",
            onclick: () => contribute(g.id),
          },
          "+ Katkı",
        ),
      );
      actions.appendChild(
        el(
          "button",
          {
            type: "button",
            class: "mini-btn danger",
            onclick: () => remove(g.id),
          },
          "Sil",
        ),
      );
      card.appendChild(actions);
      root.appendChild(card);
    }
    hydrateIcons(root);
  }

  function add() {
    const label = $("#goal-label").value.trim();
    const target = parseAmount($("#goal-target").value);
    if (!label) {
      Toast.show("Hedef adı gerekli", "error");
      return;
    }
    if (!target || target <= 0) {
      Toast.show("Geçerli bir hedef tutarı gir", "error");
      return;
    }
    Store.update((s) => {
      s.goals = s.goals || [];
      s.goals.push({
        id: uid(),
        label,
        target,
        saved: 0,
        createdAt: todayISO(),
      });
    });
    $("#goal-label").value = "";
    $("#goal-target").value = "";
    Haptics.light();
    renderList();
  }

  async function contribute(id) {
    const v = await Prompt.show({
      title: "Katkı Ekle",
      label: "Eklenecek tutar (eksi de olabilir)",
      placeholder: "0",
    });
    if (v === null) return;
    const amount = parseAmount(v);
    if (!amount) return;
    Store.update((s) => {
      const g = (s.goals || []).find((x) => x.id === id);
      if (g) g.saved = Math.max(0, (Number(g.saved) || 0) + amount);
    });
    renderList();
  }

  async function remove(id) {
    const g = (Store.state.goals || []).find((x) => x.id === id);
    const ok = await Confirm.show({
      title: "Hedef silinsin mi?",
      message: g?.label || "",
      confirmLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    Store.update((s) => {
      s.goals = (s.goals || []).filter((x) => x.id !== id);
    });
    renderList();
  }

  function bind() {
    const ob = $("#open-goals");
    if (ob) ob.addEventListener("click", open);
    const ab = $("#goal-add");
    if (ab) ab.addEventListener("click", add);
  }

  return { open, bind };
})();

/* ==========================================================================
   DEBTS — who owes whom (net position)
   ========================================================================== */

const Debts = (() => {
  let addDir = "owedToMe";

  function open() {
    renderDirSeg();
    renderList();
    Sheets.open("sheet-debts");
  }

  function renderDirSeg() {
    $$("[data-debt-dir]", $("#sheet-debts")).forEach((b) => {
      const on = b.dataset.debtDir === addDir;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    setSegThumb("#sheet-debts .seg", addDir === "owedToMe" ? 0 : 1);
  }

  function renderList() {
    const root = $("#debts-list");
    if (!root) return;
    const debts = Store.state.debts || [];
    const net = debtsNet(debts);
    const sumEl = $("#debts-summary");
    if (sumEl) {
      clear(sumEl);
      sumEl.appendChild(el("span", { class: "label" }, "Net durum"));
      sumEl.appendChild(
        el(
          "span",
          { class: `delta ${net.net >= 0 ? "pos" : "neg"}` },
          fmt.signed(net.net),
        ),
      );
    }
    clear(root);
    if (!debts.length) {
      root.appendChild(
        emptyEl("wallet", "Borç kaydı yok", "Kim kime borçlu, aşağıdan ekle"),
      );
      hydrateIcons(root);
      return;
    }
    for (const d of debts) {
      const dirLabel = d.direction === "owedToMe" ? "Bana borçlu" : "Borçluyum";
      const overdue = d.dueDate && !d.settled && d.dueDate <= todayISO();
      let sub = dirLabel;
      if (d.dueDate) sub += ` · vade ${fmt.date(d.dueDate)}`;
      if (d.settled) sub += " · kapandı";
      else if (overdue) sub += " · vadesi geçti";
      const row = el("div", { class: "row" });
      row.appendChild(
        el("span", {
          class: `row-icon ${d.direction === "owedToMe" ? "income" : "expense"}`,
          "data-icon": "wallet",
        }),
      );
      const text = el("div", { class: "row-text" });
      text.appendChild(el("div", { class: "row-title" }, d.label));
      text.appendChild(
        el("div", { class: `row-sub${overdue ? " overdue" : ""}` }, sub),
      );
      row.appendChild(text);
      row.appendChild(
        el(
          "div",
          {
            class: `row-amount ${d.direction === "owedToMe" ? "pos" : "neg"}`,
          },
          fmt.try(d.amount),
        ),
      );
      const actions = el(
        "div",
        { class: "debt-actions" },
        el(
          "button",
          {
            type: "button",
            class: "mini-btn",
            onclick: () => toggleSettled(d.id),
          },
          d.settled ? "Yeniden aç" : "Kapat",
        ),
        el(
          "button",
          {
            type: "button",
            class: "mini-btn danger",
            onclick: () => remove(d.id),
          },
          "Sil",
        ),
      );
      root.appendChild(
        el(
          "div",
          { class: `debt-item${d.settled ? " settled" : ""}` },
          row,
          actions,
        ),
      );
    }
    hydrateIcons(root);
  }

  function add() {
    const label = $("#debt-label").value.trim();
    const amount = parseAmount($("#debt-amount").value);
    if (!label) {
      Toast.show("İsim/açıklama gerekli", "error");
      return;
    }
    if (!amount || amount <= 0) {
      Toast.show("Geçerli bir tutar gir", "error");
      return;
    }
    const dueDate = $("#debt-due").value || undefined;
    Store.update((s) => {
      s.debts = s.debts || [];
      s.debts.push({
        id: uid(),
        label,
        amount,
        direction: addDir,
        settled: false,
        dueDate,
        createdAt: todayISO(),
      });
    });
    $("#debt-label").value = "";
    $("#debt-amount").value = "";
    $("#debt-due").value = "";
    Haptics.light();
    renderList();
  }

  function toggleSettled(id) {
    Store.update((s) => {
      const d = (s.debts || []).find((x) => x.id === id);
      if (d) d.settled = !d.settled;
    });
    renderList();
  }

  async function remove(id) {
    const ok = await Confirm.show({
      title: "Kayıt silinsin mi?",
      confirmLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    Store.update((s) => {
      s.debts = (s.debts || []).filter((x) => x.id !== id);
    });
    renderList();
  }

  function bind() {
    const ob = $("#open-debts");
    if (ob) ob.addEventListener("click", open);
    const ab = $("#debt-add");
    if (ab) ab.addEventListener("click", add);
    $$("[data-debt-dir]").forEach((b) =>
      b.addEventListener("click", () => {
        addDir = b.dataset.debtDir;
        renderDirSeg();
      }),
    );
  }

  return { open, bind };
})();

/* ==========================================================================
   BUDGETS — per-category monthly limits
   ========================================================================== */

const Budgets = (() => {
  function open() {
    render();
    Sheets.open("sheet-budgets");
  }
  function render() {
    const root = $("#budget-list");
    if (!root) return;
    clear(root);
    const cats = Store.state.categories.expense;
    cats.forEach((cat, i) => {
      const meta = categoryMeta(cat);
      const color = CHART_PALETTE[i % CHART_PALETTE.length];
      const current = Store.state.budgets?.[cat] || 0;
      const row = el("div", { class: "budget-row" });
      row.appendChild(
        el("span", { class: "dot", style: `background:${color}` }),
      );
      row.appendChild(el("div", { class: "label" }, cat));
      const input = el("input", {
        type: "text",
        inputmode: "decimal",
        class: "input",
        placeholder: "Limit yok",
        value: current ? inputAmount(current) : "",
        "aria-label": `${cat} aylık limit`,
      });
      input.addEventListener("change", () => {
        const v = parseAmount(input.value);
        Store.update((s) => {
          s.budgets = s.budgets || {};
          if (v > 0) s.budgets[cat] = v;
          else delete s.budgets[cat];
        });
      });
      row.appendChild(input);
      root.appendChild(row);
    });
  }
  function bind() {
    const btn = $("#open-budgets");
    if (btn) btn.addEventListener("click", open);
  }
  return { open, bind, render };
})();

/* ==========================================================================
   PRIVACY MODE (hide balance with dots)
   ========================================================================== */

const Privacy = (() => {
  const KEY = "ggai:privacy";
  function get() {
    return localStorage.getItem(KEY) === "1";
  }
  function set(on) {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
    apply();
  }
  function toggle() {
    set(!get());
  }
  function apply() {
    const on = get();
    document.documentElement.toggleAttribute("data-privacy", on);
    const btn = $("#privacy-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(on));
      const sub = $("#privacy-sub");
      if (sub)
        sub.textContent = on
          ? "Tutarlar gizli — dokunmak için tekrar aç"
          : "Tutarları yıldız (•••) olarak göster";
      const ic = btn.querySelector(".ic");
      if (ic) ic.dataset.icon = on ? "eye-off" : "eye";
      hydrateIcons(btn);
    }
  }
  function init() {
    apply();
  }
  return { init, toggle, get, set, apply };
})();

/* ==========================================================================
   PHOTOS (IndexedDB — receipt attachments, blob storage)
   ========================================================================== */

const Photos = (() => {
  const DB_NAME = "ggai-photos";
  const DB_VERSION = 1;
  const STORE = "photos";
  let _db = null;
  let _opening = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    if (_opening) return _opening;
    if (typeof indexedDB === "undefined")
      return Promise.reject(new Error("no-idb"));
    _opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => {
        _db = req.result;
        resolve(_db);
      };
      req.onerror = () => reject(req.error);
    });
    return _opening;
  }

  async function add(blob) {
    const db = await open();
    const id = uid();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ id, blob, ts: Date.now() });
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async function get(id) {
    if (!id) return null;
    try {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async function remove(id) {
    if (!id) return;
    try {
      const db = await open();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {}
  }

  async function clear() {
    try {
      const db = await open();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {}
  }

  return { add, get, remove, clear };
})();

// Resize + compress an image File to JPEG blob (max ~1280px, quality 0.85)
async function compressImage(file, maxW = 1280, quality = 0.85) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const ratio = Math.min(1, maxW / Math.max(img.naturalWidth, 1));
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    return await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Lazy-load a thumbnail. Uses IntersectionObserver when available so off-screen
// rows don't decode immediately; falls back to direct load otherwise.
//
// Memory safety: every blob URL we create is revoked on either `load` OR
// `error`, so we never leak when an <img> is detached before it decodes
// (rapid re-renders, search, swipe-delete). We also tag the element with
// `_thumbUrl` so a second lazy-load on the same element revokes its predecessor.
function lazyLoadThumb(imgEl, photoId) {
  if (!imgEl || !photoId) return;
  function load() {
    Photos.get(photoId).then((blob) => {
      if (!blob) return;
      // Revoke any stale URL still attached to this <img>
      if (imgEl._thumbUrl) {
        URL.revokeObjectURL(imgEl._thumbUrl);
        imgEl._thumbUrl = null;
      }
      const u = URL.createObjectURL(blob);
      imgEl._thumbUrl = u;
      const cleanup = () => {
        if (imgEl._thumbUrl === u) {
          URL.revokeObjectURL(u);
          imgEl._thumbUrl = null;
        }
      };
      imgEl.addEventListener("load", cleanup, { once: true });
      imgEl.addEventListener("error", cleanup, { once: true });
      imgEl.src = u;
    });
  }
  if (typeof IntersectionObserver === "undefined") {
    load();
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          load();
          obs.disconnect();
          return;
        }
      }
    },
    { rootMargin: "300px" },
  );
  obs.observe(imgEl);
  // Safety net: if the observer never fires (rare browser quirks, embedded
  // scroll containers), load anyway after a short idle delay.
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
  idle(() => {
    if (!imgEl.src) {
      obs.disconnect();
      load();
    }
  });
}

/* ==========================================================================
   CURRENCY (display-only switch — TRY/USD/EUR; FX fetch on demand)
   ========================================================================== */

const Currency = (() => {
  const ORDER = ["TRY", "USD", "EUR"];
  function get() {
    return Store.state.settings?.currency || "TRY";
  }
  function set(code) {
    if (!CURRENCY_META[code]) return;
    Store.update((s) => {
      s.settings = s.settings || {};
      s.settings.currency = code;
    });
    syncThumb();
  }
  function syncThumb() {
    const cur = get();
    const idx = Math.max(0, ORDER.indexOf(cur));
    const thumb = $("#currency-thumb");
    if (thumb) thumb.style.transform = `translateX(${idx * 100}%)`;
    $$("[data-currency-opt]").forEach((b) =>
      b.classList.toggle("active", b.dataset.currencyOpt === cur),
    );
  }
  function renderFxMeta() {
    const meta = $("#fx-meta");
    if (!meta) return;
    const fx = FX.get();
    if (!fx.ts) {
      meta.textContent = t("settings.fxNever");
      return;
    }
    const d = new Date(fx.ts);
    const usd = (1 / FX.rate("USD")).toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    });
    const eur = (1 / FX.rate("EUR")).toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    });
    meta.textContent = `${t("settings.fxLast")}: ${fmt.date(d.toISOString().slice(0, 10))} · 1$≈${usd}₺ · 1€≈${eur}₺`;
  }
  async function fetchRates() {
    const meta = $("#fx-meta");
    const before = meta?.textContent;
    if (meta) meta.textContent = "...";
    const res = await FX.refresh();
    if (res) {
      Toast.show(t("toast.fxUpdated"), "success");
      Haptics.success();
      renderFxMeta();
      // Re-render so amounts pick up fresh rates
      if (typeof renderAll === "function") renderAll();
    } else {
      Toast.show(t("toast.fxFailed"), "error");
      if (meta && before) meta.textContent = before;
    }
  }
  function init() {
    syncThumb();
    renderFxMeta();
  }
  return { init, get, set, syncThumb, fetchRates, renderFxMeta };
})();

/* ==========================================================================
   THEME (auto / light / dark)
   ========================================================================== */

const Theme = (() => {
  const KEY = "ggai:theme";
  function get() {
    return localStorage.getItem(KEY) || "auto";
  }
  function apply(mode) {
    const root = document.documentElement;
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    localStorage.setItem(KEY, mode);
    syncThumb();
  }
  function syncThumb() {
    const mode = get();
    const map = { auto: 0, light: 1, dark: 2 };
    const thumb = $("#theme-thumb");
    if (thumb) thumb.style.transform = `translateX(${map[mode] * 100}%)`;
    $$("[data-theme-opt]").forEach((b) =>
      b.classList.toggle("active", b.dataset.themeOpt === mode),
    );
    const sub = $("#theme-sub");
    if (sub) {
      sub.textContent =
        mode === "auto"
          ? "Sistem ile uyumlu"
          : mode === "light"
            ? "Açık tema"
            : "Koyu tema";
    }
  }
  function init() {
    apply(get());
  }
  return { init, apply, get, syncThumb };
})();

/* ==========================================================================
   SHEETS (scrim + sheet pattern, manual transform)
   ========================================================================== */

const Sheets = (() => {
  const stack = [];
  const focusBefore = new Map();

  function focusables(root) {
    return Array.from(
      root.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.closest("[hidden]"));
  }

  function trapKeydown(e) {
    if (e.key !== "Tab" || !stack.length) return;
    const sheet = stack[stack.length - 1];
    const list = focusables(sheet);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // History-driven so browser back/swipe-back closes the top sheet.
  let suppressPop = false;

  function open(id, onOpen) {
    const node = $("#" + id);
    if (!node) return;
    focusBefore.set(node, document.activeElement);
    stack.push(node);
    $("#scrim").classList.add("open");
    requestAnimationFrame(() => node.classList.add("open"));
    document.body.style.overflow = "hidden";
    history.pushState({ sheet: id, depth: stack.length }, "");
    if (onOpen) onOpen(node);
    hydrateIcons(node);
    bindDrag(node);
    setTimeout(() => {
      const list = focusables(node);
      if (list.length) list[0].focus();
    }, 60);
  }

  // Drag-to-dismiss — only initiated from grabber or sheet-head; body keeps native scroll.
  function bindDrag(sheet) {
    if (sheet._dragBound) return;
    sheet._dragBound = true;
    let startY = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;
    let dragging = false;
    let pointerId = null;

    const grabber = sheet.querySelector(".sheet-grabber");
    const head = sheet.querySelector(".sheet-head, .confirm-body");
    const handles = [grabber, head].filter(Boolean);

    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      pointerId = e.pointerId;
      startY = e.clientY;
      lastY = e.clientY;
      lastT = e.timeStamp || performance.now();
      velocity = 0;
      dragging = true;
      sheet.classList.add("dragging");
      sheet.setPointerCapture(pointerId);
    }
    function onMove(e) {
      if (!dragging || e.pointerId !== pointerId) return;
      const dy = Math.max(0, e.clientY - startY);
      sheet.style.setProperty("--sheet-y", dy + "px");
      const t = e.timeStamp || performance.now();
      const dt = Math.max(1, t - lastT);
      velocity = (e.clientY - lastY) / dt; // px/ms
      lastY = e.clientY;
      lastT = t;
      // Fade scrim proportional to drag
      const scrim = $("#scrim");
      if (scrim) scrim.style.opacity = Math.max(0, 1 - dy / 320);
    }
    function onUp(e) {
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      sheet.classList.remove("dragging");
      try {
        sheet.releasePointerCapture(pointerId);
      } catch {}
      const dy = Math.max(0, e.clientY - startY);
      const scrim = $("#scrim");
      if (scrim) scrim.style.opacity = "";
      // Dismiss if dragged > 110px OR fast downward flick
      if (dy > 110 || velocity > 0.55) {
        sheet.style.removeProperty("--sheet-y");
        close(sheet.id);
      } else {
        sheet.style.removeProperty("--sheet-y");
      }
    }

    handles.forEach((h) => {
      h.addEventListener("pointerdown", onDown);
      h.addEventListener("pointermove", onMove);
      h.addEventListener("pointerup", onUp);
      h.addEventListener("pointercancel", onUp);
    });
  }

  function close(id, fromPop = false) {
    const node = id ? $("#" + id) : stack[stack.length - 1];
    if (!node) return;
    node.classList.remove("open");
    const idx = stack.indexOf(node);
    if (idx >= 0) stack.splice(idx, 1);
    if (!stack.length) {
      $("#scrim").classList.remove("open");
      document.body.style.overflow = "";
    }
    if (!fromPop) {
      // Pop the synthetic history entry we pushed when this sheet opened
      suppressPop = true;
      history.back();
    }
    const prev = focusBefore.get(node);
    focusBefore.delete(node);
    if (prev && typeof prev.focus === "function") {
      try {
        prev.focus();
      } catch {}
    }
  }

  window.addEventListener("popstate", () => {
    if (suppressPop) {
      suppressPop = false;
      return;
    }
    if (stack.length) {
      // Back/swipe-back ⇒ close top sheet without re-pushing.
      const top = stack[stack.length - 1];
      close(top.id, true);
    }
  });

  function topId() {
    return stack.length ? stack[stack.length - 1].id : null;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && stack.length) close();
    trapKeydown(e);
  });
  document.addEventListener("click", (e) => {
    if (e.target.id === "scrim") close();
    if (e.target.closest("[data-sheet-close]")) {
      const sheet = e.target.closest(".sheet");
      if (sheet) close(sheet.id);
    }
  });

  return { open, close, topId };
})();

/* ==========================================================================
   TOAST / CONFIRM / PROMPT (custom dialogs)
   ========================================================================== */

const Toast = (() => {
  const ICONS_INLINE = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 12v4"/></svg>',
  };

  function show(message, kind = "info", { duration = 2400 } = {}) {
    const host = $("#toast-host");
    if (!host) return;
    const node = el("div", { class: `toast ${kind}` });
    node.innerHTML = `<span class="toast-icon">${ICONS_INLINE[kind] || ""}</span><span>${escapeText(message)}</span>`;
    host.appendChild(node);
    requestAnimationFrame(() => node.classList.add("show"));
    setTimeout(() => {
      node.classList.remove("show");
      setTimeout(() => node.remove(), 360);
    }, duration);
  }

  function escapeText(s) {
    return String(s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  }

  return { show };
})();

const Confirm = (() => {
  let resolver = null;

  function show({
    title = "Emin misiniz?",
    message = "",
    confirmLabel = "Tamam",
    cancelLabel = "Vazgeç",
    danger = false,
  } = {}) {
    return new Promise((resolve) => {
      resolver = resolve;
      $("#confirm-title").textContent = title;
      $("#confirm-body").textContent = message;
      $("#confirm-cancel").textContent = cancelLabel;
      const accept = $("#confirm-accept");
      accept.textContent = confirmLabel;
      accept.classList.toggle("danger", !!danger);
      Sheets.open("sheet-confirm");
    });
  }

  function bind() {
    $("#confirm-accept").addEventListener("click", () => {
      const r = resolver;
      resolver = null;
      Sheets.close("sheet-confirm");
      if (r) r(true);
    });
    $("#confirm-cancel").addEventListener("click", () => {
      const r = resolver;
      resolver = null;
      Sheets.close("sheet-confirm");
      if (r) r(false);
    });
    // scrim/escape close → resolve(false)
    const sheet = $("#sheet-confirm");
    new MutationObserver(() => {
      if (resolver && !sheet.classList.contains("open")) {
        const r = resolver;
        resolver = null;
        r(false);
      }
    }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  }

  return { show, bind };
})();

const Prompt = (() => {
  let resolver = null;

  function show({ title = "Yeni Kayıt", label = "Ad", placeholder = "" } = {}) {
    return new Promise((resolve) => {
      resolver = resolve;
      $("#prompt-title").textContent = title;
      $("#prompt-label").textContent = label;
      const input = $("#prompt-input");
      input.value = "";
      input.placeholder = placeholder;
      Sheets.open("sheet-prompt", () => setTimeout(() => input.focus(), 80));
    });
  }

  function accept() {
    const r = resolver;
    resolver = null;
    const v = $("#prompt-input").value.trim();
    Sheets.close("sheet-prompt");
    if (r) r(v || null);
  }

  function bind() {
    $("#prompt-accept").addEventListener("click", accept);
    $("#prompt-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        accept();
      }
    });
    const sheet = $("#sheet-prompt");
    new MutationObserver(() => {
      if (resolver && !sheet.classList.contains("open")) {
        const r = resolver;
        resolver = null;
        r(null);
      }
    }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  }

  return { show, bind };
})();

/* ==========================================================================
   DATE PICKER (Apple-style 3-wheel)
   ========================================================================== */

const DatePicker = (() => {
  let resolver = null;
  let currentISO = null;
  let yearStart = 2000;
  let yearCount = 60;

  const TR_FULL_MONTHS = TR_MONTHS;

  function show({ value = null, title = "Tarih Seç" } = {}) {
    return new Promise((resolve) => {
      resolver = resolve;
      $("#date-title").textContent = title;
      const today = new Date();
      const cy = today.getFullYear();
      yearStart = cy - 30;
      yearCount = 60;

      const init = value
        ? (() => {
            const [y, m, d] = value.split("-").map(Number);
            return { y, m, d };
          })()
        : { y: cy, m: today.getMonth() + 1, d: today.getDate() };

      currentISO = isoOf(init.y, init.m, init.d);
      buildWheel("day", daysInMonth(init.y, init.m), init.d - 1, (i) =>
        String(i + 1),
      );
      buildWheel("month", 12, init.m - 1, (i) => TR_FULL_MONTHS[i]);
      buildWheel("year", yearCount, init.y - yearStart, (i) =>
        String(yearStart + i),
      );
      Sheets.open("sheet-date", () => {
        // wheel scroll uses smooth — but on first open we want instant snap
        $$("#sheet-date .wheel").forEach((w) => {
          const sel = w.querySelector(".item.selected");
          if (sel)
            w.scrollTo({
              top: sel.offsetTop - w.clientHeight / 2 + 20,
              behavior: "auto",
            });
        });
      });
    });
  }

  function isoOf(y, m, d) {
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function buildWheel(kind, count, selectedIdx, label) {
    const wheel = $(`#sheet-date .wheel[data-wheel="${kind}"]`);
    if (!wheel) return;
    clear(wheel);
    for (let i = 0; i < count; i++) {
      wheel.appendChild(
        el(
          "div",
          {
            class: `item${i === selectedIdx ? " selected" : ""}`,
            dataset: { idx: i },
          },
          label(i),
        ),
      );
    }
    // bind scroll → update selected mid item
    if (!wheel._bound) {
      wheel._bound = true;
      let raf = 0;
      wheel.addEventListener(
        "scroll",
        () => {
          if (raf) return;
          raf = requestAnimationFrame(() => {
            raf = 0;
            const idx = Math.round(wheel.scrollTop / 40);
            $$(".item", wheel).forEach((it, i) =>
              it.classList.toggle("selected", i === idx),
            );
            updateFromWheels();
          });
        },
        { passive: true },
      );
    }
  }

  function updateFromWheels() {
    const dWheel = $('#sheet-date .wheel[data-wheel="day"]');
    const mWheel = $('#sheet-date .wheel[data-wheel="month"]');
    const yWheel = $('#sheet-date .wheel[data-wheel="year"]');
    if (!dWheel || !mWheel || !yWheel) return;

    const m = Math.round(mWheel.scrollTop / 40) + 1;
    const y = Math.round(yWheel.scrollTop / 40) + yearStart;
    const maxDay = daysInMonth(y, m);
    let d = Math.round(dWheel.scrollTop / 40) + 1;
    if (d > maxDay) {
      d = maxDay;
      // rebuild day wheel only if count needs to change
      if ($$(".item", dWheel).length !== maxDay) {
        const wasIdx = d - 1;
        clear(dWheel);
        for (let i = 0; i < maxDay; i++) {
          dWheel.appendChild(
            el(
              "div",
              {
                class: `item${i === wasIdx ? " selected" : ""}`,
                dataset: { idx: i },
              },
              String(i + 1),
            ),
          );
        }
        dWheel.scrollTo({ top: wasIdx * 40, behavior: "auto" });
      }
    } else if ($$(".item", dWheel).length !== maxDay) {
      const wasIdx = d - 1;
      clear(dWheel);
      for (let i = 0; i < maxDay; i++) {
        dWheel.appendChild(
          el(
            "div",
            {
              class: `item${i === wasIdx ? " selected" : ""}`,
              dataset: { idx: i },
            },
            String(i + 1),
          ),
        );
      }
    }
    currentISO = isoOf(y, m, d);
  }

  function accept() {
    const r = resolver;
    resolver = null;
    Sheets.close("sheet-date");
    if (r) r(currentISO);
  }

  function bind() {
    $("#date-accept").addEventListener("click", accept);
    const sheet = $("#sheet-date");
    new MutationObserver(() => {
      if (resolver && !sheet.classList.contains("open")) {
        const r = resolver;
        resolver = null;
        r(null);
      }
    }).observe(sheet, { attributes: true, attributeFilter: ["class"] });
  }

  return { show, bind };
})();

/* Wraps a native date input as a tap-to-open date-pill */
function attachDatePill(inputEl, { title = "Tarih Seç", onSelect } = {}) {
  if (!inputEl || inputEl._datePillWrapped) return;
  inputEl._datePillWrapped = true;
  const pill = el("button", {
    type: "button",
    class: "date-pill",
    "aria-haspopup": "dialog",
  });
  const text = el("span", { class: "date-pill-text" });
  const icon = el("span", {
    class: "calendar-icon",
    html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>',
  });
  pill.appendChild(text);
  pill.appendChild(icon);
  inputEl.style.display = "none";
  inputEl.parentNode.insertBefore(pill, inputEl.nextSibling);

  function syncDisplay() {
    const v = inputEl.value;
    if (v) {
      text.textContent = fmt.date(v);
      text.classList.remove("placeholder");
    } else {
      const ph = inputEl.placeholder || "gg.aa.yyyy";
      text.textContent = ph;
      text.classList.add("placeholder");
    }
  }
  syncDisplay();

  pill.addEventListener("click", async () => {
    const picked = await DatePicker.show({
      value: inputEl.value || null,
      title,
    });
    if (picked) {
      inputEl.value = picked;
      syncDisplay();
      if (onSelect) onSelect(picked);
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Re-sync if .value changed externally
  const obs = new MutationObserver(syncDisplay);
  obs.observe(inputEl, { attributes: true, attributeFilter: ["value"] });
  inputEl.addEventListener("input", syncDisplay);
}

/* ==========================================================================
   PAGE / TAB ROUTER
   ========================================================================== */

let viewMonth = currentMonthKey();
let pickerYear = new Date().getFullYear();
let activeTab = "cash";

const THEME_COLORS = {
  cash: { light: "#1b2547", dark: "#0e1428" },
  pending: { light: "#ff7a45", dark: "#c24a38" },
  silver: { light: "#2a2d38", dark: "#14161e" },
};

function updateStatusBarColor(target) {
  const lightMeta = document.querySelector(
    'meta[name="theme-color"][media*="light"]',
  );
  const darkMeta = document.querySelector(
    'meta[name="theme-color"][media*="dark"]',
  );
  const colors = THEME_COLORS[target];
  if (!colors) return;
  if (lightMeta) lightMeta.setAttribute("content", colors.light);
  if (darkMeta) darkMeta.setAttribute("content", colors.dark);
}

function switchTab(target) {
  activeTab = target;
  $$(".page").forEach((p) =>
    p.classList.toggle("active", p.dataset.page === target),
  );
  $$(".tab").forEach((t) => {
    const isActive = t.dataset.target === target;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", String(isActive));
  });
  // tabbar indicator slide + per-tab tint
  const idx = ["cash", "pending", "silver"].indexOf(target);
  const indicator = $("#tabbar-indicator");
  if (indicator) {
    indicator.style.transform = `translateX(${idx * 100}%)`;
  }
  const tabbar = $(".tabbar");
  if (tabbar) tabbar.dataset.active = target;
  // top-right add button + topbar title context
  $("#topbar-title").textContent = t("tab." + target) || "";
  updateStatusBarColor(target);
  renderAll();
}

/* ==========================================================================
   STATE-DERIVED
   ========================================================================== */

function txOfMonth(key) {
  return Store.state.transactions.filter((t) => monthKeyOf(t.date) === key);
}
function silverUnitNow(p, gramPrice) {
  if (p.currentPrice && p.currentPrice > 0) return p.currentPrice;
  if (p.kind === "gram") return gramPrice;
  if (p.kind === "ounce") return gramPrice * OUNCE_TO_GRAM;
  return 0;
}
function silverStats(p, gramPrice) {
  const unitNow = silverUnitNow(p, gramPrice);
  const cost = p.amount * p.buyPrice;
  const value = p.amount * unitNow;
  const pl = value - cost;
  const plPct = cost > 0 ? (pl / cost) * 100 : 0;
  const targetHit = p.targetPrice > 0 && unitNow >= p.targetPrice;
  return { unitNow, cost, value, pl, plPct, targetHit };
}
/* Apply due recurring rules — fired at startup and on tab switch.
   A rule has shape:
   { id, type, category, amount, description, dayOfMonth, lastApplied (YYYY-MM) }
   For each rule, if current month not yet applied AND today's day ≥ dayOfMonth,
   we synthesize a transaction dated today and stamp lastApplied. */
function applyRecurringDue() {
  const rules = Store.state.recurring || [];
  if (!rules.length) return 0;
  const today = new Date();
  const day = today.getDate();
  const monthKey = currentMonthKey();
  let added = 0;
  Store.update((s) => {
    for (const r of s.recurring || []) {
      if (r.lastApplied === monthKey) continue;
      if (day < (r.dayOfMonth || 1)) continue;
      s.transactions.push({
        id: uid(),
        type: r.type,
        category: r.category,
        amount: Number(r.amount) || 0,
        description: r.description || "",
        date: todayISO(),
        recurringId: r.id,
      });
      r.lastApplied = monthKey;
      added++;
    }
  });
  return added;
}

function budgetSpent(category, monthKey) {
  return Store.state.transactions
    .filter(
      (t) =>
        t.type === "expense" &&
        t.category === category &&
        monthKeyOf(t.date) === monthKey,
    )
    .reduce((s, t) => s + t.amount, 0);
}

function totalsOf(monthKey) {
  const list = txOfMonth(monthKey);
  const income = list
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expense = list
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense, list };
}
function wealthBreakdown() {
  const cash = Store.state.transactions.reduce(
    (s, t) => s + (t.type === "income" ? t.amount : -t.amount),
    0,
  );
  const pending = Store.state.pending.reduce((s, p) => s + p.amount, 0);
  const gramPrice = Number(Store.state.settings.silverGramPrice) || 0;
  const silver = Store.state.silver.reduce(
    (s, p) => s + p.amount * silverUnitNow(p, gramPrice),
    0,
  );
  return { cash, pending, silver, total: cash + pending + silver };
}

/* monthly net balance trend for sparkline (last 6 months including current view) */
function monthlyTrend(months = 6, mode = "balance") {
  const out = [];
  const [yy, mm] = viewMonth.split("-").map(Number);
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(yy, mm - 1 - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    const t = totalsOf(key);
    let v = 0;
    if (mode === "balance") v = t.balance;
    else if (mode === "income") v = t.income;
    else if (mode === "expense") v = t.expense;
    out.push({ key, v });
  }
  return out;
}

/* ==========================================================================
   AMOUNT SPLIT (currency + integer)
   ========================================================================== */

const _amountState = new WeakMap();
function setAmount(node, value) {
  const cur = currencyMeta();
  const target = Math.round(convertFromTry(Number(value) || 0));
  const isNeg = target < 0;
  node.classList.toggle("is-negative", isNeg);

  // Ensure all 3 spans exist (sign may be missing in initial HTML).
  let signSpan = node.querySelector(".sign");
  let curSpan = node.querySelector(".currency");
  let intSpan = node.querySelector(".int");
  if (!intSpan || !curSpan) {
    clear(node);
    signSpan = el("span", { class: "sign" }, "−");
    curSpan = el("span", { class: "currency" }, cur.sym);
    intSpan = el("span", { class: "int" }, "0");
    node.appendChild(signSpan);
    node.appendChild(curSpan);
    node.appendChild(intSpan);
  } else if (!signSpan) {
    signSpan = el("span", { class: "sign" }, "−");
    node.insertBefore(signSpan, curSpan);
  }
  // Always sync the symbol — currency may have changed since last render
  if (curSpan.textContent !== cur.sym) curSpan.textContent = cur.sym;
  signSpan.style.display = isNeg ? "" : "none";

  const prev = _amountState.get(node);
  const from = prev ? prev.value : 0;
  if (from === target) {
    intSpan.textContent = Math.abs(target).toLocaleString(cur.locale);
    _amountState.set(node, { value: target });
    return;
  }

  // Skip animation if huge or reduced-motion
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const range = Math.abs(target - from);
  if (reduced || range > 5_000_000) {
    intSpan.textContent = Math.abs(target).toLocaleString(cur.locale);
    _amountState.set(node, { value: target });
    return;
  }

  // Cancel previous animation if any
  if (prev?.raf) cancelAnimationFrame(prev.raf);

  const dur = Math.min(800, 350 + range * 0.0006);
  const start = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function tick(now) {
    const t = Math.min(1, (now - start) / dur);
    const v = Math.round(from + (target - from) * easeOut(t));
    intSpan.textContent = Math.abs(v).toLocaleString(cur.locale);
    if (t < 1) {
      const id = requestAnimationFrame(tick);
      _amountState.set(node, { value: target, raf: id });
    } else {
      _amountState.set(node, { value: target });
    }
  }
  const id = requestAnimationFrame(tick);
  _amountState.set(node, { value: target, raf: id });
}

/* ==========================================================================
   SPARKLINE
   ========================================================================== */

const _sparkCache = new WeakMap();
function drawSparkline(rootEl, data) {
  if (!rootEl) return;
  const key = data ? data.map((d) => d.v).join(",") : "";
  if (_sparkCache.get(rootEl) === key) return;
  _sparkCache.set(rootEl, key);
  const W = 440;
  const H = 80;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 8;

  if (!data || !data.length) {
    clear(rootEl);
    return;
  }

  if (data.length === 1) {
    // Single data point — render a soft pulsing dot
    rootEl.innerHTML = `
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <circle class="line" cx="${W - 24}" cy="${H / 2}" r="3.5" fill="currentColor"/>
      </svg>`;
    return;
  }

  const values = data.map((d) => d.v);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const norm = (d.v - min) / range;
    const y = H - PAD_BOTTOM - norm * (H - PAD_TOP - PAD_BOTTOM);
    return [x, y];
  });
  const linePath = points
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");

  rootEl.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path class="line" d="${linePath}"/>
    </svg>`;
}

/* ==========================================================================
   DONUT CHART
   ========================================================================== */

function drawDonut(rootEl, segments, totalLabel) {
  if (!rootEl) return;
  const SIZE = 140;
  const C = SIZE / 2;
  const R = 56;
  const STROKE = 14;
  const CIRC = 2 * Math.PI * R;

  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const segHTML = segments
    .map((s, i) => {
      const len = (s.value / total) * CIRC;
      const offset = -acc;
      acc += len;
      return `<circle class="seg" cx="${C}" cy="${C}" r="${R}"
        stroke="${s.color}"
        stroke-dasharray="${len} ${CIRC - len}"
        stroke-dashoffset="${offset}"/>`;
    })
    .join("");

  rootEl.innerHTML = `
    <svg viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">
      <circle class="track" cx="${C}" cy="${C}" r="${R}"/>
      ${segHTML}
    </svg>
    <div class="donut-center">
      <div class="label">${t("donut.total")}</div>
      <div class="value">${totalLabel}</div>
    </div>`;
}

/* ==========================================================================
   RENDER — CASH PAGE
   ========================================================================== */

function renderCash() {
  const t = totalsOf(viewMonth);
  setAmount($("#cash-amount"), t.balance);

  // pills
  const pills = $("#cash-pills");
  clear(pills);
  pills.appendChild(
    el("span", { class: "hero-pill gain" }, "+ " + fmt.try(t.income)),
  );
  pills.appendChild(
    el("span", { class: "hero-pill neg" }, "− " + fmt.try(t.expense)),
  );

  $("#month-label").textContent = fmt.monthLabel(viewMonth);

  // sparkline = last 6 months balance
  drawSparkline($("#cash-spark"), monthlyTrend(6, "balance"));

  renderTemplates();
  renderWealth();
  renderInsights();
  renderTrend();
  renderHeatmap();
  renderExpenseChart(t.list);
  renderTxList(t.list);
}

function renderTrend() {
  const data = monthlyTrend(6, "balance");
  if (!data || data.length < 2) {
    $("#trend-section").hidden = true;
    return;
  }
  $("#trend-section").hidden = false;

  const last = data[data.length - 1].v;
  const prev = data[data.length - 2].v;
  const delta = last - prev;
  const meta = $("#trend-meta");
  clear(meta);
  meta.appendChild(el("span", { class: "label" }, "Net Bakiye Değişimi"));
  meta.appendChild(
    el(
      "span",
      { class: `delta ${delta >= 0 ? "pos" : "neg"}` },
      fmt.signed(delta),
    ),
  );

  const chart = $("#trend-chart");
  clear(chart);
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.v)), 1);
  data.forEach((d, i) => {
    const isCurrent = i === data.length - 1;
    const bar = el("div", {
      class: `trend-bar${isCurrent ? " current" : ""}`,
    });
    const col = el("div", { class: `col${d.v < 0 ? " neg" : ""}` });
    const [y, m] = d.key.split("-").map(Number);
    bar.appendChild(col);
    bar.appendChild(el("div", { class: "lab" }, TR_MONTHS_SHORT[m - 1]));
    chart.appendChild(bar);
    requestAnimationFrame(() => {
      const h = Math.max(4, (Math.abs(d.v) / maxAbs) * 80);
      col.style.height = h + "px";
    });
  });
}

/* ==========================================================================
   INSIGHTS — month summary, forecast, anomaly (pure compute + render)
   ========================================================================== */

const INSIGHT_ANOMALY_FACTOR = 1.5; // current vs avg ratio to flag
const INSIGHT_ANOMALY_MIN = 200; // ignore tiny absolute jumps (TRY)
const INSIGHT_FORECAST_MIN_DAY = 3; // too early in the month → no forecast

/** monthKey shifted `back` months earlier (e.g. "2026-03" → "2026-02"). */
function shiftMonthKey(key, back) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 - back, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function expenseByCategory(list) {
  const by = Object.create(null);
  for (const tx of list) {
    if (tx.type === "expense")
      by[tx.category] = (by[tx.category] || 0) + tx.amount;
  }
  return by;
}

/** Project end-of-month expense/balance from the burn rate so far.
    Only meaningful for the current real month; null otherwise. */
function forecastMonthEnd(monthKey, cur) {
  if (monthKey !== currentMonthKey()) return null;
  const now = new Date();
  const day = now.getDate();
  if (day < INSIGHT_FORECAST_MIN_DAY) return null;
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const projectedExpense = (cur.expense / day) * daysInMonth;
  return {
    projectedExpense,
    projectedBalance: cur.income - projectedExpense,
    daysLeft: daysInMonth - day,
  };
}

/** Biggest category whose spend this month far exceeds its recent average. */
function detectAnomaly(monthKey, byCat, lookback = 3) {
  let worst = null;
  for (const [cat, amount] of Object.entries(byCat)) {
    let sum = 0;
    for (let i = 1; i <= lookback; i++) {
      const list = txOfMonth(shiftMonthKey(monthKey, i));
      sum += list
        .filter((t) => t.type === "expense" && t.category === cat)
        .reduce((s, t) => s + t.amount, 0);
    }
    const avg = sum / lookback;
    if (
      avg > 0 &&
      amount > avg * INSIGHT_ANOMALY_FACTOR &&
      amount - avg >= INSIGHT_ANOMALY_MIN
    ) {
      if (!worst || amount - avg > worst.delta) {
        worst = { category: cat, amount, avg, delta: amount - avg };
      }
    }
  }
  return worst;
}

/** Aggregate every insight fact for a month. Pure-ish: reads Store via totals. */
function computeInsights(monthKey) {
  const cur = totalsOf(monthKey);
  const prev = totalsOf(shiftMonthKey(monthKey, 1));
  const expenseDelta = cur.expense - prev.expense;
  const expensePct =
    prev.expense > 0 ? (expenseDelta / prev.expense) * 100 : null;

  const byCat = expenseByCategory(cur.list);
  let topCat = null;
  let topAmt = 0;
  for (const [c, a] of Object.entries(byCat)) {
    if (a > topAmt) {
      topAmt = a;
      topCat = c;
    }
  }
  const topShare = cur.expense > 0 ? (topAmt / cur.expense) * 100 : 0;

  return {
    cur,
    prev,
    expenseDelta,
    expensePct,
    topCat,
    topAmt,
    topShare,
    hasData: cur.list.length > 0 || prev.list.length > 0,
    forecast: forecastMonthEnd(monthKey, cur),
    anomaly: detectAnomaly(monthKey, byCat),
  };
}

function insightRow(icon, kind, title, value, valueKind) {
  const row = el("div", { class: "insight-row" });
  row.appendChild(
    el("span", { class: `insight-ic ${kind}`, "data-icon": icon }),
  );
  const text = el("div", { class: "insight-text" });
  text.appendChild(el("div", { class: "insight-title" }, title));
  text.appendChild(el("div", { class: "insight-value" }, value));
  row.appendChild(text);
  if (valueKind) row.classList.add(valueKind);
  return row;
}

function renderInsights() {
  const section = $("#insights-section");
  const card = $("#insights-card");
  if (!section || !card) return;
  const ins = computeInsights(viewMonth);
  if (!ins.hasData) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  clear(card);

  // Month balance headline
  card.appendChild(
    insightRow(
      ins.cur.balance >= 0 ? "trend" : "trend",
      ins.cur.balance >= 0 ? "pos" : "neg",
      "Bu ay net bakiye",
      fmt.signed(ins.cur.balance),
    ),
  );

  // Expense vs last month
  if (ins.expensePct != null) {
    const up = ins.expenseDelta > 0;
    card.appendChild(
      insightRow(
        up ? "arrow-up" : "arrow-down",
        up ? "neg" : "pos",
        "Geçen aya göre gider",
        `${up ? "+" : ""}${ins.expensePct.toFixed(0)}% (${fmt.signed(ins.expenseDelta)})`,
      ),
    );
  }

  // Biggest category
  if (ins.topCat) {
    card.appendChild(
      insightRow(
        "cart",
        "neutral",
        `En çok: ${ins.topCat}`,
        `${fmt.try(ins.topAmt)} · %${ins.topShare.toFixed(0)}`,
      ),
    );
  }

  // End-of-month forecast
  if (ins.forecast) {
    const f = ins.forecast;
    card.appendChild(
      insightRow(
        "sparkles",
        f.projectedBalance >= 0 ? "pos" : "neg",
        `Ay sonu tahmini (${f.daysLeft} gün kaldı)`,
        `Gider ~${fmt.try(f.projectedExpense)} · Bakiye ~${fmt.signed(f.projectedBalance)}`,
      ),
    );
  }

  // Anomaly
  if (ins.anomaly) {
    const a = ins.anomaly;
    card.appendChild(
      insightRow(
        "bell",
        "warn",
        `Dikkat: ${a.category} arttı`,
        `${fmt.try(a.amount)} (ort. ${fmt.try(a.avg)})`,
      ),
    );
  }

  hydrateIcons(card);
}

/* ==========================================================================
   HEATMAP — GitHub-style annual expense intensity grid
   ========================================================================== */

// Returns { byDate: { ISO: amount }, total, days, max }
function dailyExpenseHeatmap() {
  const byDate = Object.create(null);
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 365);
  const cutoffIso = localISO(cutoff);
  let total = 0;
  let days = 0;
  let max = 0;
  for (const t of Store.state.transactions) {
    if (t.type !== "expense" || !t.date) continue;
    if (t.date < cutoffIso) continue;
    const prev = byDate[t.date] || 0;
    if (prev === 0) days++;
    const next = prev + (Number(t.amount) || 0);
    byDate[t.date] = next;
    total += Number(t.amount) || 0;
    if (next > max) max = next;
  }
  return { byDate, total, days, max };
}

function renderHeatmap() {
  const grid = $("#heatmap-grid");
  const months = $("#heatmap-months");
  const meta = $("#heatmap-meta");
  if (!grid) return;
  clear(grid);
  clear(months);

  const { byDate, total, days, max } = dailyExpenseHeatmap();

  // Quartile thresholds for non-zero amounts
  const sorted = Object.values(byDate)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const q = (p) => sorted[Math.max(0, Math.floor(sorted.length * p) - 1)] || 0;
  const q1 = q(0.25);
  const q2 = q(0.5);
  const q3 = q(0.75);
  function levelOf(v) {
    if (!v) return 0;
    if (v <= q1) return 1;
    if (v <= q2) return 2;
    if (v <= q3) return 3;
    return 4;
  }

  // Build the day grid: column-by-column, week-aligned to Monday start.
  const today = new Date();
  // Start: 52 weeks ago, snapped back to Monday
  const start = new Date(today);
  start.setDate(today.getDate() - 7 * 52);
  // JS getDay(): 0=Sun..6=Sat; we want Monday=0
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);

  const monthLabels = []; // { col, label }
  let lastMonth = -1;
  let totalCols = 0;

  const weeks = 53;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      if (dt > today) {
        // Empty placeholder cell to keep the grid rectangular
        const cell = el("div", { class: "hm-cell hm-empty" });
        grid.appendChild(cell);
        continue;
      }
      const iso = localISO(dt);
      const amt = byDate[iso] || 0;
      const lvl = levelOf(amt);
      // role="img" with aria-label keeps the cell informational for screen
      // readers without triggering Lighthouse's target-size rule (the grid is
      // intentionally compact; tap still works via document-level click delegation).
      const cell = el("div", {
        class: `hm-cell`,
        role: "img",
        "data-level": String(lvl),
        "data-date": iso,
        "data-amount": String(amt),
        "aria-label": amt
          ? `${fmt.date(iso)} · ${fmt.try(amt)}`
          : `${fmt.date(iso)}`,
        title: amt ? `${fmt.date(iso)} · ${fmt.try(amt)}` : fmt.date(iso),
      });
      grid.appendChild(cell);
    }
    // Determine month label for this column based on the first day of the week
    const colStart = new Date(start);
    colStart.setDate(start.getDate() + w * 7);
    if (colStart <= today) {
      const m = colStart.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col: w, label: TR_MONTHS_SHORT[m] });
        lastMonth = m;
      }
      totalCols = w + 1;
    }
  }

  for (const ml of monthLabels) {
    const lab = el(
      "span",
      {
        class: "hm-month",
        style: `grid-column-start: ${ml.col + 1}`,
      },
      ml.label,
    );
    months.appendChild(lab);
  }
  months.style.setProperty("--hm-cols", String(weeks));

  if (meta) {
    if (!total) {
      meta.textContent = t("heatmap.empty");
    } else {
      meta.textContent = `${days} gün · ${fmt.try(total)}`;
    }
  }
}

// Tap any heatmap cell — show a brief toast with the date and amount
document.addEventListener("click", (e) => {
  const cell = e.target.closest && e.target.closest(".hm-cell");
  if (!cell || !cell.dataset.date) return;
  const amt = Number(cell.dataset.amount) || 0;
  const msg = amt
    ? `${fmt.date(cell.dataset.date)} · ${fmt.try(amt)}`
    : `${fmt.date(cell.dataset.date)} — ${t("heatmap.empty").toLowerCase()}`;
  if (typeof Toast !== "undefined") Toast.show(msg, "info", { duration: 1800 });
});

function renderWealth() {
  const w = wealthBreakdown();
  const wealthNode = $("#wealth-amount");
  setAmount(wealthNode, w.total);
  // wealth-amount uses different DOM than .hero-amount; sync neg class
  wealthNode.classList.toggle("is-negative", w.total < 0);

  // For the stack we visualize positives only; cash<0 ⇒ shown as warn segment.
  const cashPos = Math.max(0, w.cash);
  const cashNeg = Math.max(0, -w.cash);
  const denom = Math.max(1, cashPos + cashNeg + w.pending + w.silver);
  const stack = $("#wealth-stack");
  // Slot 0 doubles as "negative cash" warning when w.cash < 0
  stack.children[0].style.width =
    ((cashNeg > 0 ? cashNeg : cashPos) / denom) * 100 + "%";
  stack.children[0].classList.toggle("neg", cashNeg > 0);
  stack.children[1].style.width = (w.pending / denom) * 100 + "%";
  stack.children[2].style.width = (w.silver / denom) * 100 + "%";

  const legend = $("#wealth-legend");
  clear(legend);
  const items = [
    {
      label: "Nakit",
      value: w.cash,
      color: w.cash < 0 ? "#E5364E" : "#00E08F",
    },
    { label: "Bekleyen", value: w.pending, color: "#FF7A45" },
    { label: "Gümüş", value: w.silver, color: "#B8C0D2" },
  ];
  items.forEach((it) => {
    const leg = el("div", { class: "leg" });
    const top = el("div", { class: "top" });
    top.appendChild(
      el("span", { class: "dot", style: `background:${it.color}` }),
    );
    top.appendChild(el("span", {}, it.label));
    leg.appendChild(top);
    leg.appendChild(
      el(
        "div",
        { class: `v${it.value < 0 ? " is-negative" : ""}` },
        fmt.signed(it.value),
      ),
    );
    legend.appendChild(leg);
  });
}

function renderExpenseChart(list) {
  const section = $("#expense-section");
  const expenses = list.filter((t) => t.type === "expense");
  if (!expenses.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const byCat = new Map();
  for (const t of expenses)
    byCat.set(t.category, (byCat.get(t.category) || 0) + t.amount);
  const total = [...byCat.values()].reduce((a, b) => a + b, 0);
  const rows = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  const segments = rows.map(([cat, amt], i) => ({
    label: cat,
    value: amt,
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  drawDonut($("#expense-donut"), segments, fmt.try(total));

  const bars = $("#expense-bars");
  clear(bars);
  rows.forEach(([cat, amt], i) => {
    const pct = (amt / total) * 100;
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    const limit = Store.state.budgets?.[cat] || 0;
    const overBudget = limit > 0 && amt > limit;
    const budgetPct = limit > 0 ? (amt / limit) * 100 : 0;

    const item = el("div", {
      class: `bar-item${overBudget ? " over-budget" : ""}`,
    });
    const name = el("div", { class: "name" });
    name.appendChild(
      el("span", { class: "dot", style: `background:${color}` }),
    );
    name.appendChild(el("span", {}, cat));
    if (overBudget)
      name.appendChild(el("span", { class: "over-pill" }, "aşıldı"));
    item.appendChild(name);
    item.appendChild(
      el(
        "span",
        { class: "meta" },
        limit > 0
          ? `${fmt.try(amt)} / ${fmt.try(limit)}`
          : `${fmt.try(amt)} · ${pct.toFixed(0)}%`,
      ),
    );
    const bar = el("div", { class: "bar" });
    const fillPct = limit > 0 ? Math.min(100, budgetPct) : pct;
    const fillBg =
      overBudget && limit > 0
        ? "linear-gradient(90deg, #ff7585, var(--neg))"
        : color;
    const fill = el("i", {
      style: `background:${fillBg};width:0%`,
    });
    bar.appendChild(fill);
    item.appendChild(bar);
    bars.appendChild(item);
    requestAnimationFrame(() => {
      fill.style.width = Math.max(2, fillPct) + "%";
    });
  });
}

function renderTxList(list) {
  const root = $("#tx-list");
  const prev = captureRects(root);
  clear(root);

  if (!list.length) {
    root.appendChild(
      emptyEl("inbox", t("empty.cash.title"), t("empty.cash.sub")),
    );
    hydrateIcons(root);
    return;
  }

  const sorted = [...list].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  );
  for (const t of sorted) {
    const meta = categoryMeta(t.category);
    const sign = t.type === "income" ? "+" : "−";
    const sub = t.description
      ? `${t.description} · ${fmt.date(t.date)}`
      : fmt.date(t.date);

    const wrap = el("div", { class: "swipe-wrap", dataset: { id: t.id } });
    const action = el(
      "button",
      {
        class: "swipe-action",
        type: "button",
        "aria-label": "Sil",
      },
      el("span", { "data-icon": "trash" }),
      "Sil",
    );
    wrap.appendChild(action);

    const row = el("button", {
      class: "row tappable",
      type: "button",
      onclick: () => TxSheet.open(t.id),
    });
    let thumb = null;
    if (t.photoId) {
      thumb = el("img", {
        class: "row-thumb",
        alt: "",
        loading: "lazy",
        decoding: "async",
      });
      row.appendChild(thumb);
    } else {
      row.appendChild(
        el("span", {
          class: `row-icon ${meta.kind}`,
          "data-icon": meta.icon,
        }),
      );
    }
    const text = el("div", { class: "row-text" });
    const title = el("div", { class: "row-title" });
    title.appendChild(document.createTextNode(t.category));
    if (t.photoId) {
      title.appendChild(
        el("span", {
          class: "row-clip",
          "data-icon": "paperclip",
          "aria-label": "Fiş ekli",
        }),
      );
    }
    text.appendChild(title);
    text.appendChild(el("div", { class: "row-sub" }, sub));
    if (Array.isArray(t.tags) && t.tags.length) {
      const tagWrap = el("div", { class: "row-tags" });
      for (const tg of t.tags) {
        tagWrap.appendChild(el("span", { class: "row-tag" }, tg));
      }
      text.appendChild(tagWrap);
    }
    row.appendChild(text);
    row.appendChild(
      el(
        "div",
        {
          class: `row-amount ${t.type === "income" ? "pos" : "neg"}`,
        },
        `${sign}${fmt.int(t.amount).replace(/^-/, "")} ${currencyMeta().sym}`,
      ),
    );
    wrap.appendChild(row);
    root.appendChild(wrap);

    // Now that the thumb is in the DOM, attach the lazy-loader (observer needs layout)
    if (thumb && t.photoId) lazyLoadThumb(thumb, t.photoId);

    bindSwipeRow(wrap, async () => {
      const ok = await Confirm.show({
        title: "Hareket silinsin mi?",
        message: `${t.category} · ${fmt.try(t.amount)}`,
        confirmLabel: "Sil",
        danger: true,
      });
      if (!ok) {
        wrap.classList.remove("armed");
        return;
      }
      // Cleanup attached photo
      if (t.photoId) await Photos.remove(t.photoId);
      Store.update((s) => {
        s.transactions = s.transactions.filter((x) => x.id !== t.id);
      });
      Toast.show("Hareket silindi", "success");
    });
  }
  hydrateIcons(root);
  flipReorder(root, prev);
}

/* ==========================================================================
   RENDER — PENDING PAGE
   ========================================================================== */

function renderPending() {
  const list = Store.state.pending;
  const total = list.reduce((s, p) => s + p.amount, 0);

  setAmount($("#pending-amount"), total);

  const pills = $("#pending-pills");
  clear(pills);
  if (list.length) {
    pills.appendChild(
      el("span", { class: "hero-pill" }, `${list.length} kayıt bekliyor`),
    );
    const aged = list.filter((p) => daysSince(p.createdAt) >= AGED_DAYS).length;
    if (aged > 0)
      pills.appendChild(
        el("span", { class: "hero-pill neg" }, `${aged} eskidi`),
      );
  }

  // sparkline of pending across months (cumulative)
  drawSparkline($("#pending-spark"), monthlyTrend(6, "balance"));

  const root = $("#pending-list");
  const prev = captureRects(root);
  clear(root);

  if (!list.length) {
    root.appendChild(
      emptyEl("hourglass", t("empty.pending.title"), t("empty.pending.sub")),
    );
    hydrateIcons(root);
    return;
  }

  const sorted = [...list].sort((a, b) => b.amount - a.amount);
  for (const p of sorted) {
    const aged = daysSince(p.createdAt) >= AGED_DAYS;
    const etaText = p.exactDate
      ? fmt.date(p.exactDate)
      : etaLabel(p.eta) || t("eta.unknown");
    const subParts = [etaText];
    if (p.createdAt) subParts.push(`${daysSince(p.createdAt)} gün önce`);

    const row = el("button", {
      class: "row tappable",
      type: "button",
      dataset: { id: p.id },
      onclick: (e) => {
        if (e.target.closest("[data-collect]")) return;
        PendingSheet.open(p.id);
      },
    });
    row.appendChild(
      el("span", { class: "row-icon pending", "data-icon": "hourglass" }),
    );
    const text = el("div", { class: "row-text" });
    const titleLine = el("div", { class: "pending-title-line" });
    titleLine.appendChild(el("div", { class: "row-title" }, p.source));
    if (aged)
      titleLine.appendChild(
        el("span", { class: "badge-warn" }, t("label.aged")),
      );
    text.appendChild(titleLine);
    text.appendChild(el("div", { class: "row-sub" }, subParts.join(" · ")));
    row.appendChild(text);

    const stack = el("div", { class: "row-stack" });
    stack.appendChild(
      el(
        "div",
        { class: "row-amount bold" },
        fmt.int(p.amount) + " " + currencyMeta().sym,
      ),
    );
    stack.appendChild(
      el(
        "span",
        {
          class: "cta-chip",
          "data-collect": "",
          onclick: (e) => {
            e.stopPropagation();
            CollectSheet.open(p.id);
          },
        },
        t("label.collect"),
      ),
    );
    row.appendChild(stack);

    root.appendChild(row);
  }
  hydrateIcons(root);
  flipReorder(root, prev);
}

/* ==========================================================================
   RENDER — SILVER PAGE
   ========================================================================== */

function renderSilver() {
  const gramPrice = Number(Store.state.settings.silverGramPrice) || 0;
  const input = $("#silver-gram-price");
  if (document.activeElement !== input) input.value = inputAmount(gramPrice);

  let totalCost = 0,
    totalValue = 0;
  for (const p of Store.state.silver) {
    const s = silverStats(p, gramPrice);
    totalCost += s.cost;
    totalValue += s.value;
  }
  const totalPl = totalValue - totalCost;
  const totalPlPct = totalCost > 0 ? (totalPl / totalCost) * 100 : 0;

  setAmount($("#silver-amount"), totalValue);

  const pills = $("#silver-pills");
  clear(pills);
  if (Store.state.silver.length === 0) {
    pills.appendChild(el("span", { class: "hero-pill" }, "Henüz pozisyon yok"));
  } else {
    const sign = totalPl >= 0 ? "+" : "−";
    const cls = totalPl >= 0 ? "gain" : "neg";
    pills.appendChild(
      el(
        "span",
        { class: `hero-pill ${cls}` },
        `${sign} ${currencyMeta().sym}${fmt.int(Math.abs(totalPl))}`,
      ),
    );
    pills.appendChild(
      el("span", { class: `hero-pill ${cls}` }, fmt.pct(totalPlPct)),
    );
  }

  drawSparkline($("#silver-spark"), monthlyTrend(6, "balance"));

  renderSilverList(gramPrice);
  renderPriceMeta();
}

function renderSilverList(gramPrice) {
  const root = $("#silver-list");
  clear(root);

  if (!Store.state.silver.length) {
    root.appendChild(
      emptyEl("diamond", t("empty.silver.title"), t("empty.silver.sub")),
    );
    hydrateIcons(root);
    return;
  }

  for (const p of Store.state.silver) {
    const s = silverStats(p, gramPrice);
    const unit = SILVER_KIND_UNIT[p.kind];
    const wrap = el("div", { class: "position" });

    const head = el("div", { class: "position-head" });
    head.appendChild(
      el("span", {
        class: `row-icon ${p.kind === "fund" ? "totals" : "gold"}`,
        "data-icon": "diamond",
      }),
    );
    const text = el("div", { class: "row-text" });
    text.appendChild(
      el(
        "div",
        { class: "position-title" },
        `${fmt.num(p.amount)} ${unit} · ${SILVER_KIND_LABEL[p.kind]}`,
      ),
    );
    text.appendChild(
      el(
        "div",
        { class: "position-sub" },
        `Maliyet ${fmt.try(s.cost)} · ${fmt.try(s.unitNow)}/${unit}`,
      ),
    );
    head.appendChild(text);
    const stack = el("div");
    stack.appendChild(el("div", { class: "position-amt" }, fmt.try(s.value)));
    stack.appendChild(
      el(
        "div",
        { class: `position-pl ${s.pl >= 0 ? "pos" : "neg"}` },
        fmt.pct(s.plPct),
      ),
    );
    head.appendChild(stack);

    head.addEventListener("click", () => SilverSheet.open(p.id));
    wrap.appendChild(head);

    if (p.targetPrice > 0) {
      const buy = p.buyPrice;
      const tgt = p.targetPrice;
      const now = s.unitNow;
      const span = Math.max(1, tgt - buy);
      const ratio = Math.max(0, Math.min(1, (now - buy) / span));
      const pct = Math.round(ratio * 100);

      const numline = el("div", { class: "numline" });
      const track = el("div", { class: "numline-track" });
      const fill = el("div", {
        class: "numline-fill",
        style: `width:${pct}%`,
      });
      track.appendChild(fill);
      track.appendChild(
        el("div", { class: "numline-marker buy", style: "left:0%" }),
      );
      track.appendChild(
        el("div", {
          class: "numline-marker now",
          style: `left:${Math.max(2, Math.min(98, pct))}%`,
        }),
      );
      track.appendChild(
        el("div", { class: "numline-marker target", style: "left:100%" }),
      );
      numline.appendChild(track);

      const labels = el("div", { class: "numline-labels" });
      labels.appendChild(buildCol(t("numline.buy"), fmt.try(buy)));
      const nowCol = buildCol(t("numline.now"), fmt.try(now));
      nowCol.classList.add("now");
      labels.appendChild(nowCol);
      labels.appendChild(buildCol(t("numline.target"), fmt.try(tgt)));
      numline.appendChild(labels);

      if (s.targetHit) {
        numline.appendChild(
          el("div", { class: "numline-target-hit" }, t("label.targetReached")),
        );
      }
      wrap.appendChild(numline);
    }
    root.appendChild(wrap);
  }
  hydrateIcons(root);
}

function buildCol(label, value) {
  const c = el("div", { class: "col" });
  c.appendChild(el("div", { class: "lab" }, label));
  c.appendChild(el("div", { class: "v" }, value));
  return c;
}

function renderPriceMeta() {
  const meta = $("#price-meta");
  if (!meta) return;
  if (Store.state.settings.priceFetchedAt) {
    const d = new Date(Store.state.settings.priceFetchedAt);
    meta.className = "price-hint";
    meta.textContent = `Son çekim: ${fmt.date(
      d.toISOString().slice(0, 10),
    )} ${fmt.time(d)}`;
  } else {
    meta.className = "price-hint";
    meta.textContent = "Otomatik çekim için Çek'e bas, ya da manuel gir.";
  }
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

/* Swipe-to-delete — wraps a row in a .swipe-wrap with hidden action layer.
   Swipe ≥ 60px arms; tap action / re-swipe / outside-tap dismisses. */
function bindSwipeRow(wrap, onDelete) {
  let startX = 0;
  let lastX = 0;
  let dragging = false;
  let pid = null;
  const row = wrap.querySelector(".row");
  if (!row) return;

  row.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pid = e.pointerId;
    startX = e.clientX;
    lastX = e.clientX;
    dragging = true;
    row.classList.add("swiping");
  });
  row.addEventListener("pointermove", (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = Math.min(0, e.clientX - startX); // only leftward
    if (Math.abs(dx) < 8) return;
    lastX = e.clientX;
    row.style.transform = `translateX(${Math.max(-100, dx)}px)`;
  });
  function end() {
    if (!dragging) return;
    dragging = false;
    row.classList.remove("swiping");
    const dx = lastX - startX;
    if (dx < -45) {
      wrap.classList.add("armed");
      Haptics.medium();
    } else {
      wrap.classList.remove("armed");
    }
    row.style.transform = "";
  }
  row.addEventListener("pointerup", end);
  row.addEventListener("pointercancel", end);
  row.addEventListener("pointerleave", end);

  // Click on action layer
  const actionEl = wrap.querySelector(".swipe-action");
  if (actionEl) actionEl.addEventListener("click", () => onDelete(wrap));

  // Tap outside ⇒ disarm
  document.addEventListener("pointerdown", (e) => {
    if (!wrap.contains(e.target) && wrap.classList.contains("armed")) {
      wrap.classList.remove("armed");
    }
  });
}

/* FLIP — animate list reorder/insertion when items have stable id */
function flipReorder(parent, prevRects) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!prevRects) return;
  $$("[data-id]", parent).forEach((node) => {
    const id = node.dataset.id;
    const prev = prevRects.get(id);
    if (!prev) {
      // newly inserted — fade-in
      node.animate(
        [
          { opacity: 0, transform: "translateY(6px) scale(0.98)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 280, easing: "cubic-bezier(0.32,0.72,0,1)" },
      );
      return;
    }
    const next = node.getBoundingClientRect();
    const dy = prev.top - next.top;
    if (Math.abs(dy) < 1) return;
    node.animate(
      [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
      { duration: 320, easing: "cubic-bezier(0.32,0.72,0,1)" },
    );
  });
}

function captureRects(parent) {
  const map = new Map();
  $$("[data-id]", parent).forEach((node) => {
    map.set(node.dataset.id, node.getBoundingClientRect());
  });
  return map;
}

function emptyEl(icon, title, sub) {
  const node = el("div", { class: "empty" });
  const ill = el("div", { class: "empty-illu" });
  ill.appendChild(el("span", { "data-icon": icon }));
  node.appendChild(ill);
  node.appendChild(el("div", { class: "empty-title" }, title));
  if (sub) node.appendChild(el("div", { class: "empty-sub" }, sub));
  return node;
}

/* ==========================================================================
   SEGMENTED THUMB POSITION
   ========================================================================== */

function setSegThumb(rootSelector, activeIndex) {
  const root = $(rootSelector);
  if (!root) return;
  const thumb = root.querySelector(".seg-thumb");
  if (!thumb) return;
  thumb.style.transform = `translateX(${activeIndex * 100}%)`;
}

/* ==========================================================================
   TX SHEET
   ========================================================================== */

/* ==========================================================================
   SEARCH PALETTE — instant transaction search (Cmd+K / topbar button)
   ========================================================================== */

const SearchPalette = (() => {
  const MAX_RESULTS = 50;

  function open() {
    const input = $("#search-input");
    if (input) input.value = "";
    render("");
    Sheets.open("sheet-search", () => {
      setTimeout(() => input?.focus(), 250);
    });
  }

  function searchTransactions(query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return [];
    const list = Store.state.transactions;
    const out = [];
    for (const tx of list) {
      const cat = (tx.category || "").toLowerCase();
      const desc = (tx.description || "").toLowerCase();
      const amt = String(Math.round(Number(tx.amount) || 0));
      const tagHit = (tx.tags || []).some((tg) => tg.includes(q));
      if (cat.includes(q) || desc.includes(q) || amt.includes(q) || tagHit) {
        out.push(tx);
      }
    }
    out.sort(
      (a, b) =>
        (b.date || "").localeCompare(a.date || "") ||
        (b.id || "").localeCompare(a.id || ""),
    );
    return out;
  }

  function highlight(text, q) {
    if (!q || !text) return text || "";
    const lower = String(text).toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return text;
    const wrap = document.createDocumentFragment();
    wrap.appendChild(document.createTextNode(text.slice(0, idx)));
    wrap.appendChild(
      el("mark", { class: "search-mark" }, text.slice(idx, idx + q.length)),
    );
    wrap.appendChild(document.createTextNode(text.slice(idx + q.length)));
    return wrap;
  }

  function render(query) {
    const root = $("#search-results");
    const meta = $("#search-meta");
    if (!root) return;
    clear(root);
    const q = (query || "").toLowerCase().trim();

    if (!q) {
      if (meta) meta.textContent = t("search.hint");
      return;
    }

    const matches = searchTransactions(q);

    if (!matches.length) {
      if (meta) meta.textContent = t("search.empty");
      root.appendChild(emptyEl("search", t("search.empty"), ""));
      hydrateIcons(root);
      return;
    }

    if (meta) {
      meta.textContent =
        matches.length > MAX_RESULTS
          ? t("search.tooMany").replace("{n}", String(matches.length))
          : t("search.count").replace("{n}", String(matches.length));
    }

    const sliced = matches.slice(0, MAX_RESULTS);
    for (const tx of sliced) {
      const meta2 = categoryMeta(tx.category);
      const sign = tx.type === "income" ? "+" : "−";
      const sub = tx.description
        ? `${tx.description} · ${fmt.date(tx.date)}`
        : fmt.date(tx.date);

      const row = el("button", {
        class: "row tappable",
        type: "button",
        onclick: () => {
          Sheets.close("sheet-search");
          // Wait briefly so the close animation can settle, then open the editor
          setTimeout(() => TxSheet.open(tx.id), 120);
        },
      });
      row.appendChild(
        el("span", {
          class: `row-icon ${meta2.kind}`,
          "data-icon": meta2.icon,
        }),
      );
      const text = el("div", { class: "row-text" });
      const titleNode = el("div", { class: "row-title" });
      const hl = highlight(tx.category, q);
      if (typeof hl === "string") titleNode.textContent = hl;
      else titleNode.appendChild(hl);
      text.appendChild(titleNode);

      const subNode = el("div", { class: "row-sub" });
      const subHl = highlight(sub, q);
      if (typeof subHl === "string") subNode.textContent = subHl;
      else subNode.appendChild(subHl);
      text.appendChild(subNode);

      row.appendChild(text);
      row.appendChild(
        el(
          "div",
          {
            class: `row-amount ${tx.type === "income" ? "pos" : "neg"}`,
          },
          `${sign}${fmt.int(tx.amount).replace(/^-/, "")} ${currencyMeta().sym}`,
        ),
      );
      root.appendChild(row);
    }
    hydrateIcons(root);
  }

  function bind() {
    const btn = $("#open-search");
    if (btn) btn.addEventListener("click", open);
    const input = $("#search-input");
    if (input) {
      let debounceTimer = 0;
      input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => render(input.value), 80);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          Sheets.close("sheet-search");
        } else if (e.key === "Enter") {
          // First result → open
          const first = $("#search-results .row");
          if (first) first.click();
        }
      });
    }
    // Cmd+K / Ctrl+K shortcut (skip if typing in another input)
    document.addEventListener("keydown", (e) => {
      const key = e.key?.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        if (Sheets.topId && Sheets.topId() === "sheet-search") return;
        open();
      }
    });
  }

  return { open, bind, searchTransactions };
})();

const TxSheet = (() => {
  let editingId = null;
  let type = "expense";
  let category = null;
  // Photo state — separates "currently saved" from "pending change"
  let currentPhotoId = null; // photoId persisted on the tx (or null)
  let pendingBlob = null; // newly attached blob waiting to be saved
  let pendingRemove = false; // user removed an existing photo
  let _previewUrl = null;

  function open(id = null, prefill = null) {
    editingId = id;
    pendingBlob = null;
    pendingRemove = false;
    currentPhotoId = null;
    if (id) {
      const t = Store.state.transactions.find((x) => x.id === id);
      if (!t) return;
      type = t.type;
      category = t.category;
      currentPhotoId = t.photoId || null;
      $("#tx-title").textContent = "Hareket";
      $("#tx-amount").value = inputAmount(t.amount);
      $("#tx-desc").value = t.description || "";
      $("#tx-tags").value = (t.tags || []).join(", ");
      $("#tx-date").value = t.date;
      $("#tx-delete").hidden = false;
    } else {
      type = prefill?.type || "expense";
      category =
        prefill?.category ||
        Store.state.settings.lastUsedCategory?.[type] ||
        null;
      $("#tx-title").textContent = prefill
        ? prefill.label || "Yeni Hareket"
        : "Yeni Hareket";
      $("#tx-amount").value = prefill?.amount
        ? inputAmount(prefill.amount)
        : "";
      $("#tx-desc").value = prefill?.description || "";
      $("#tx-tags").value = (prefill?.tags || []).join(", ");
      $("#tx-date").value = todayISO();
      $("#tx-delete").hidden = true;
    }
    renderSeg();
    renderCats();
    renderReceipt();
    Sheets.open("sheet-tx", () =>
      setTimeout(() => $("#tx-amount").focus(), 250),
    );
  }

  function renderReceipt() {
    const preview = $("#receipt-preview");
    const attachBtn = $("#receipt-attach");
    const img = $("#receipt-thumb");
    if (_previewUrl) {
      URL.revokeObjectURL(_previewUrl);
      _previewUrl = null;
    }
    const showing = pendingBlob || (currentPhotoId && !pendingRemove);
    if (!showing) {
      preview.hidden = true;
      attachBtn.hidden = false;
      img.removeAttribute("src");
      return;
    }
    attachBtn.hidden = true;
    preview.hidden = false;
    if (pendingBlob) {
      _previewUrl = URL.createObjectURL(pendingBlob);
      img.src = _previewUrl;
    } else if (currentPhotoId) {
      Photos.get(currentPhotoId).then((blob) => {
        if (!blob) return;
        if (_previewUrl) URL.revokeObjectURL(_previewUrl);
        _previewUrl = URL.createObjectURL(blob);
        img.src = _previewUrl;
      });
    }
  }

  async function pickPhoto() {
    $("#receipt-file").click();
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Toast.show(t("toast.photoFailed"), "error");
      return;
    }
    try {
      const compressed = await compressImage(file);
      if (!compressed || compressed.size > 4_000_000) {
        Toast.show(t("toast.photoTooLarge"), "error");
        return;
      }
      pendingBlob = compressed;
      pendingRemove = false;
      Haptics.light();
      renderReceipt();
    } catch {
      Toast.show(t("toast.photoFailed"), "error");
    }
  }

  function removePhoto() {
    pendingBlob = null;
    pendingRemove = true;
    Haptics.light();
    renderReceipt();
  }

  let _viewerUrl = null;
  function setViewerSrc(blob) {
    const img = $("#receipt-viewer-img");
    if (!img || !blob) return;
    if (_viewerUrl) URL.revokeObjectURL(_viewerUrl);
    _viewerUrl = URL.createObjectURL(blob);
    img.src = _viewerUrl;
  }
  function clearViewerSrc() {
    const img = $("#receipt-viewer-img");
    if (_viewerUrl) {
      URL.revokeObjectURL(_viewerUrl);
      _viewerUrl = null;
    }
    if (img) img.removeAttribute("src");
  }
  function viewPhoto() {
    if (pendingBlob) {
      setViewerSrc(pendingBlob);
    } else if (currentPhotoId) {
      Photos.get(currentPhotoId).then((blob) => {
        if (blob) setViewerSrc(blob);
      });
    } else {
      return;
    }
    Sheets.open("sheet-receipt");
  }

  function renderSeg() {
    $$("[data-tx-type]", $("#sheet-tx")).forEach((b) => {
      const on = b.dataset.txType === type;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    setSegThumb("#sheet-tx .seg", type === "expense" ? 0 : 1);
  }

  function renderCats() {
    const grid = $("#tx-cat-grid");
    clear(grid);
    for (const c of Store.state.categories[type]) {
      const isActive = c === category;
      const chip = el(
        "button",
        {
          type: "button",
          class: `chip${isActive ? " active" : ""}`,
          "aria-pressed": String(isActive),
          onclick: () => {
            category = c;
            renderCats();
          },
        },
        c,
      );
      grid.appendChild(chip);
    }
    grid.appendChild(
      el(
        "button",
        {
          type: "button",
          class: "chip dashed",
          onclick: async () => {
            const name = await Prompt.show({
              title: "Yeni Kategori",
              label:
                type === "income" ? "Gelir kategorisi" : "Gider kategorisi",
              placeholder: "Örn. Ek gelir",
            });
            if (!name) return;
            if (Store.state.categories[type].includes(name)) {
              Toast.show("Bu kategori zaten var", "info");
              return;
            }
            Store.update((s) => s.categories[type].push(name));
            category = name;
            renderCats();
          },
        },
        "+ Yeni",
      ),
    );
  }

  let _saveInFlight = false;
  async function save() {
    if (_saveInFlight) return; // double-tap guard
    _saveInFlight = true;
    try {
      const amount = parseAmount($("#tx-amount").value);
      if (!amount || amount <= 0) {
        $("#tx-amount").focus();
        Toast.show("Tutar gerekli", "error");
        return;
      }
      if (!category) {
        Toast.show("Lütfen bir kategori seçin", "error");
        return;
      }
      const date = $("#tx-date").value || todayISO();
      const description = $("#tx-desc").value.trim();
      const tags = normalizeTags($("#tx-tags").value);

      // Resolve the new photoId BEFORE writing the store. If the write fails
      // halfway through, it's safer to orphan a blob (cleanable later) than
      // to leave the tx pointing at a deleted photoId.
      let nextPhotoId = currentPhotoId;
      let oldIdToCleanup = null;
      if (pendingBlob) {
        try {
          nextPhotoId = await Photos.add(pendingBlob);
          if (currentPhotoId && currentPhotoId !== nextPhotoId) {
            oldIdToCleanup = currentPhotoId;
          }
        } catch {
          Toast.show(t("toast.photoFailed"), "error");
          return;
        }
      } else if (pendingRemove && currentPhotoId) {
        oldIdToCleanup = currentPhotoId;
        nextPhotoId = null;
      }

      Store.update((s) => {
        if (editingId) {
          const tr = s.transactions.find((x) => x.id === editingId);
          if (tr) {
            Object.assign(tr, {
              type,
              category,
              amount,
              description,
              date,
              photoId: nextPhotoId || undefined,
            });
            if (!nextPhotoId) delete tr.photoId;
            if (tags.length) tr.tags = tags;
            else delete tr.tags;
          }
        } else {
          const tx = {
            id: uid(),
            type,
            category,
            amount,
            description,
            date,
          };
          if (nextPhotoId) tx.photoId = nextPhotoId;
          if (tags.length) tx.tags = tags;
          s.transactions.push(tx);
        }
        s.settings.lastUsedCategory = s.settings.lastUsedCategory || {};
        s.settings.lastUsedCategory[type] = category;
      });

      // Now that the store is durably updated, drop the old photo blob.
      // If this fails, the orphan is harmless — the tx no longer references it.
      if (oldIdToCleanup) Photos.remove(oldIdToCleanup);

      Sheets.close("sheet-tx");

      // Post-save budget check (only on expense)
      if (type === "expense") {
        const limit = Store.state.budgets?.[category] || 0;
        if (limit > 0) {
          const spent = budgetSpent(category, monthKeyOf(date));
          const overshoot = spent - limit;
          if (spent > limit) {
            Toast.show(
              `${category}: ${fmt.try(spent)} / ${fmt.try(limit)} — limit aşıldı`,
              "error",
              { duration: 4000 },
            );
            Haptics.warning();
            Notifier.send(
              t("notif.budgetTitle"),
              `${category}: ${fmt.try(overshoot)} ${t("notif.budgetOver")}`,
              { tag: "budget-" + category },
            );
          } else if (spent > limit * 0.9) {
            Toast.show(
              `${category}: limitin %${Math.round((spent / limit) * 100)}'ine ulaşıldı`,
              "info",
            );
          }
        }
      }
    } finally {
      _saveInFlight = false;
    }
  }

  async function remove() {
    if (!editingId) return;
    const ok = await Confirm.show({
      title: "Hareket silinsin mi?",
      message: "Bu işlem geri alınamaz.",
      confirmLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    // Cleanup: remove attached photo too
    const txn = Store.state.transactions.find((x) => x.id === editingId);
    if (txn?.photoId) await Photos.remove(txn.photoId);
    Store.update((s) => {
      s.transactions = s.transactions.filter((t) => t.id !== editingId);
    });
    Sheets.close("sheet-tx");
    Toast.show("Hareket silindi", "success");
  }

  /** Persist the current form as a reusable quick-add template. */
  async function saveAsTemplate() {
    if (!category) {
      Toast.show("Önce bir kategori seç", "error");
      return;
    }
    const amount = parseAmount($("#tx-amount").value) || 0;
    const description = $("#tx-desc").value.trim();
    const tags = normalizeTags($("#tx-tags").value);
    const label = await Prompt.show({
      title: "Şablon Adı",
      label: "Bu hızlı girişe ad ver",
      placeholder: category,
    });
    if (label === null) return; // cancelled
    Store.update((s) => {
      s.templates = s.templates || [];
      s.templates.push({
        id: uid(),
        label: label || category,
        type,
        category,
        amount: amount || undefined,
        description: description || undefined,
        tags: tags.length ? tags : undefined,
      });
    });
    Toast.show("Şablon kaydedildi", "success");
  }

  function bind() {
    $("#tx-save").addEventListener("click", save);
    $("#tx-delete").addEventListener("click", remove);
    const tplBtn = $("#tx-save-template");
    if (tplBtn) tplBtn.addEventListener("click", saveAsTemplate);
    const attach = $("#receipt-attach");
    if (attach) attach.addEventListener("click", pickPhoto);
    const file = $("#receipt-file");
    if (file) file.addEventListener("change", onPickFile);
    const replace = $("#receipt-replace");
    if (replace) replace.addEventListener("click", pickPhoto);
    const rm = $("#receipt-remove");
    if (rm) rm.addEventListener("click", removePhoto);
    const thumb = $("#receipt-thumb");
    if (thumb) thumb.addEventListener("click", viewPhoto);
    // Revoke the viewer's blob URL when its sheet closes
    const viewerSheet = $("#sheet-receipt");
    if (viewerSheet) {
      new MutationObserver(() => {
        if (!viewerSheet.classList.contains("open")) clearViewerSrc();
      }).observe(viewerSheet, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    $$("[data-tx-type]", $("#sheet-tx")).forEach((b) => {
      b.addEventListener("click", () => {
        type = b.dataset.txType;
        category = Store.state.settings.lastUsedCategory?.[type] || null;
        renderSeg();
        renderCats();
      });
    });
  }
  return { open, bind };
})();

/* ==========================================================================
   TEMPLATES — quick-add chip strip on the cash page
   ========================================================================== */

function bindTemplateLongPress(chip, tpl) {
  let timer = 0;
  const start = () => {
    timer = setTimeout(async () => {
      timer = 0;
      chip._lpFired = true; // suppress the click that follows pointerup
      Haptics.medium();
      const ok = await Confirm.show({
        title: "Şablon silinsin mi?",
        message: tpl.label,
        confirmLabel: "Sil",
        danger: true,
      });
      if (ok) {
        Store.update((s) => {
          s.templates = (s.templates || []).filter((x) => x.id !== tpl.id);
        });
      }
    }, 600);
  };
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
  };
  chip.addEventListener("pointerdown", start);
  chip.addEventListener("pointerup", cancel);
  chip.addEventListener("pointerleave", cancel);
  chip.addEventListener("pointercancel", cancel);
}

function renderTemplates() {
  const section = $("#templates-section");
  const strip = $("#template-strip");
  if (!section || !strip) return;
  const templates = Store.state.templates || [];
  if (!templates.length) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  clear(strip);
  for (const tpl of templates) {
    const chip = el("button", {
      type: "button",
      class: "tpl-chip",
      onclick: () => {
        if (chip._lpFired) {
          chip._lpFired = false;
          return; // long-press handled deletion; ignore the click
        }
        TxSheet.open(null, tpl);
      },
    });
    chip.appendChild(
      el("span", {
        class: `tpl-dot ${tpl.type === "income" ? "pos" : "neg"}`,
      }),
    );
    chip.appendChild(el("span", { class: "tpl-label" }, tpl.label));
    if (tpl.amount) {
      chip.appendChild(el("span", { class: "tpl-amt" }, fmt.try(tpl.amount)));
    }
    bindTemplateLongPress(chip, tpl);
    strip.appendChild(chip);
  }
}

/* ==========================================================================
   PENDING SHEET
   ========================================================================== */

const PendingSheet = (() => {
  let editingId = null;
  let eta = "unknown";

  function open(id = null) {
    editingId = id;
    if (id) {
      const p = Store.state.pending.find((x) => x.id === id);
      if (!p) return;
      eta = p.eta || "unknown";
      $("#pending-title").textContent = "Bekleyen";
      $("#pending-source").value = p.source;
      $("#pending-amount-in").value = inputAmount(p.amount);
      $("#pending-date").value = p.exactDate || "";
      $("#pending-delete").hidden = false;
    } else {
      eta = "unknown";
      $("#pending-title").textContent = "Yeni Bekleyen";
      $("#pending-source").value = "";
      $("#pending-amount-in").value = "";
      $("#pending-date").value = "";
      $("#pending-delete").hidden = true;
    }
    renderEta();
    Sheets.open("sheet-pending", () =>
      setTimeout(() => $("#pending-source").focus(), 250),
    );
  }

  function renderEta() {
    const grid = $("#eta-grid");
    clear(grid);
    for (const o of ETA_OPTIONS) {
      const isActive = o.key === eta;
      const chip = el(
        "button",
        {
          type: "button",
          class: `chip${isActive ? " active" : ""}`,
          "aria-pressed": String(isActive),
          onclick: () => {
            eta = o.key;
            renderEta();
          },
        },
        o.label,
      );
      grid.appendChild(chip);
    }
  }

  function save() {
    const source = $("#pending-source").value.trim();
    const amount = parseAmount($("#pending-amount-in").value);
    const exactDate = $("#pending-date").value || null;
    if (!source) {
      $("#pending-source").focus();
      return;
    }
    if (!amount || amount <= 0) {
      $("#pending-amount-in").focus();
      return;
    }
    Store.update((s) => {
      if (editingId) {
        const p = s.pending.find((x) => x.id === editingId);
        if (p) Object.assign(p, { source, amount, eta, exactDate });
      } else {
        s.pending.push({
          id: uid(),
          source,
          amount,
          eta,
          exactDate,
          createdAt: todayISO(),
        });
      }
    });
    Sheets.close("sheet-pending");
  }

  async function remove() {
    if (!editingId) return;
    const ok = await Confirm.show({
      title: "Bekleyen kayıt silinsin mi?",
      message: "Bu işlem geri alınamaz.",
      confirmLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    Store.update((s) => {
      s.pending = s.pending.filter((p) => p.id !== editingId);
    });
    Sheets.close("sheet-pending");
    Toast.show("Bekleyen silindi", "success");
  }

  function bind() {
    $("#pending-save").addEventListener("click", save);
    $("#pending-delete").addEventListener("click", remove);
  }
  return { open, bind };
})();

/* ==========================================================================
   COLLECT SHEET
   ========================================================================== */

const CollectSheet = (() => {
  let pendingId = null;
  let category = null;

  function open(id) {
    const p = Store.state.pending.find((x) => x.id === id);
    if (!p) return;
    pendingId = id;
    category =
      Store.state.settings.lastUsedCategory?.income ||
      Store.state.categories.income[0] ||
      null;

    $("#collect-source").textContent = p.source;
    $("#collect-pre-amount").textContent = fmt.try(p.amount);
    $("#collect-amount").value = inputAmount(p.amount);
    $("#collect-date").value = todayISO();
    renderCats();
    Sheets.open("sheet-collect");
  }

  function renderCats() {
    const grid = $("#collect-cat-grid");
    clear(grid);
    for (const c of Store.state.categories.income) {
      const isActive = c === category;
      const chip = el(
        "button",
        {
          type: "button",
          class: `chip${isActive ? " active" : ""}`,
          "aria-pressed": String(isActive),
          onclick: () => {
            category = c;
            renderCats();
          },
        },
        c,
      );
      grid.appendChild(chip);
    }
    grid.appendChild(
      el(
        "button",
        {
          type: "button",
          class: "chip dashed",
          onclick: async () => {
            const name = await Prompt.show({
              title: "Yeni Gelir Kategorisi",
              label: "Kategori adı",
              placeholder: "Örn. Ek gelir",
            });
            if (!name) return;
            if (Store.state.categories.income.includes(name)) {
              Toast.show("Bu kategori zaten var", "info");
              return;
            }
            Store.update((s) => s.categories.income.push(name));
            category = name;
            renderCats();
          },
        },
        "+ Yeni",
      ),
    );
  }

  function save() {
    if (!pendingId) return;
    const p = Store.state.pending.find((x) => x.id === pendingId);
    if (!p) return;
    const amount = parseAmount($("#collect-amount").value);
    if (!amount || amount <= 0) {
      $("#collect-amount").focus();
      Toast.show("Tutar gerekli", "error");
      return;
    }
    if (!category) {
      Toast.show("Lütfen bir kategori seçin", "error");
      return;
    }
    const date = $("#collect-date").value || todayISO();
    Store.update((s) => {
      s.transactions.push({
        id: uid(),
        type: "income",
        category,
        description: p.source,
        amount,
        date,
      });
      s.pending = s.pending.filter((x) => x.id !== pendingId);
      s.settings.lastUsedCategory = s.settings.lastUsedCategory || {};
      s.settings.lastUsedCategory.income = category;
    });
    Sheets.close("sheet-collect");
  }

  function bind() {
    $("#collect-save").addEventListener("click", save);
  }
  return { open, bind };
})();

/* ==========================================================================
   SILVER SHEET
   ========================================================================== */

const SilverSheet = (() => {
  let editingId = null;
  let kind = "gram";

  function open(id = null) {
    editingId = id;
    if (id) {
      const p = Store.state.silver.find((x) => x.id === id);
      if (!p) return;
      kind = p.kind;
      $("#silver-title").textContent = "Pozisyon";
      $("#silver-amount-in").value = inputAmount(p.amount);
      $("#silver-buy-price").value = inputAmount(p.buyPrice);
      $("#silver-buy-date").value = p.buyDate || "";
      $("#silver-current-price").value = inputAmount(p.currentPrice);
      $("#silver-target").value = inputAmount(p.targetPrice);
      $("#silver-delete").hidden = false;
    } else {
      kind = "gram";
      $("#silver-title").textContent = "Yeni Pozisyon";
      $("#silver-amount-in").value = "";
      $("#silver-buy-price").value = "";
      $("#silver-buy-date").value = "";
      $("#silver-current-price").value = "";
      $("#silver-target").value = "";
      $("#silver-delete").hidden = true;
    }
    renderSeg();
    Sheets.open("sheet-silver", () =>
      setTimeout(() => $("#silver-amount-in").focus(), 250),
    );
  }

  function renderSeg() {
    $$("[data-silver-kind]", $("#sheet-silver")).forEach((b) => {
      const on = b.dataset.silverKind === kind;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const idx = ["gram", "ounce", "fund"].indexOf(kind);
    setSegThumb("#sheet-silver .seg", idx);

    const unit = SILVER_KIND_UNIT[kind];
    $("#silver-amt-label").textContent = `Miktar (${unit})`;
    $("#silver-buy-label").textContent = `Alış Birim Fiyatı (₺/${unit})`;
    $("#silver-target-label").textContent =
      `Hedef Satış Fiyatı (₺/${unit}, opsiyonel)`;
    const isFund = kind === "fund";
    $("#silver-current-field").hidden = !isFund;
    $("#silver-current-label").textContent = `Güncel Birim Fiyatı (₺/${unit})`;
  }

  function save() {
    const amount = parseAmount($("#silver-amount-in").value);
    const buyPrice = parseAmount($("#silver-buy-price").value);
    const buyDate = $("#silver-buy-date").value || null;
    const currentPrice = parseAmount($("#silver-current-price").value);
    const targetPrice = parseAmount($("#silver-target").value);

    if (!amount || amount <= 0) {
      $("#silver-amount-in").focus();
      return;
    }
    if (!buyPrice || buyPrice <= 0) {
      $("#silver-buy-price").focus();
      return;
    }
    if (kind === "fund" && (!currentPrice || currentPrice <= 0)) {
      Toast.show("Fon pozisyonu için güncel birim fiyatı gerekli", "error");
      $("#silver-current-price").focus();
      return;
    }
    const data = {
      kind,
      amount,
      buyPrice,
      buyDate,
      currentPrice: currentPrice > 0 ? currentPrice : null,
      targetPrice: targetPrice > 0 ? targetPrice : null,
    };
    Store.update((s) => {
      if (editingId) {
        const p = s.silver.find((x) => x.id === editingId);
        if (p) Object.assign(p, data);
      } else {
        s.silver.push({ id: uid(), ...data });
      }
    });
    Sheets.close("sheet-silver");
  }

  async function remove() {
    if (!editingId) return;
    const ok = await Confirm.show({
      title: "Pozisyon silinsin mi?",
      message: "Bu işlem geri alınamaz.",
      confirmLabel: "Sil",
      danger: true,
    });
    if (!ok) return;
    Store.update((s) => {
      s.silver = s.silver.filter((p) => p.id !== editingId);
    });
    Sheets.close("sheet-silver");
    Toast.show("Pozisyon silindi", "success");
  }

  function bind() {
    $("#silver-save").addEventListener("click", save);
    $("#silver-delete").addEventListener("click", remove);
    $$("[data-silver-kind]", $("#sheet-silver")).forEach((b) => {
      b.addEventListener("click", () => {
        kind = b.dataset.silverKind;
        renderSeg();
      });
    });
  }
  return { open, bind };
})();

/* ==========================================================================
   GRAM PRICE
   ========================================================================== */

function onGramPriceInput() {
  const v = parseAmount($("#silver-gram-price").value);
  Store.update((s) => {
    s.settings.silverGramPrice = v > 0 ? v : null;
  });
}

function pickSilverGramPrice(data) {
  if (!data || typeof data !== "object") return null;
  const candidates = [
    data["gumus"],
    data["GUMUS"],
    data["Gümüş"],
    data["Gumus"],
    data["GA"],
    data["silver"],
  ].filter(Boolean);
  for (const c of candidates) {
    const sell = c.Selling ?? c.selling ?? c.satis ?? c.Satış ?? c.Satis;
    const buy = c.Buying ?? c.buying ?? c.alis ?? c.Alış ?? c.Alis;
    const v = parseAmount(String(sell ?? buy ?? ""));
    if (v > 0) return v;
  }
  return null;
}

async function fetchSilverPrice() {
  const meta = $("#price-meta");
  const btn = $("#fetch-price-btn");
  meta.className = "price-hint";
  meta.textContent = "Çekiliyor...";
  btn.disabled = true;

  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 8000);

  try {
    const res = await fetch(PRICE_ENDPOINT, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const price = pickSilverGramPrice(data);
    if (!price) throw new Error("Fiyat bulunamadı");
    Store.update((s) => {
      s.settings.silverGramPrice = price;
      s.settings.priceFetchedAt = new Date().toISOString();
    });
    Toast.show("Gümüş fiyatı güncellendi", "success");
  } catch (err) {
    meta.className = "price-hint error";
    if (err.name === "AbortError") {
      meta.textContent = "Zaman aşımı. Bağlantını kontrol edip tekrar dene.";
    } else {
      meta.textContent = `Çekilemedi: ${err.message}. Manuel girebilirsin.`;
    }
  } finally {
    clearTimeout(timeoutId);
    btn.disabled = false;
  }
}

/* ==========================================================================
   MONTH PICKER
   ========================================================================== */

const MonthPicker = (() => {
  function open() {
    pickerYear = Number(viewMonth.split("-")[0]);
    render();
    Sheets.open("sheet-month");
  }
  function render() {
    $("#year-label").textContent = String(pickerYear);
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth() + 1;
    const txMonths = new Set(
      Store.state.transactions.map((t) => monthKeyOf(t.date)),
    );
    const grid = $("#month-grid");
    clear(grid);
    for (let i = 0; i < 12; i++) {
      const m = i + 1;
      const key = `${pickerYear}-${String(m).padStart(2, "0")}`;
      const cell = el(
        "button",
        {
          type: "button",
          class: [
            "month-cell",
            key === viewMonth ? "active" : "",
            txMonths.has(key) ? "has" : "",
            pickerYear > cy || (pickerYear === cy && m > cm) ? "empty" : "",
          ]
            .filter(Boolean)
            .join(" "),
          onclick: () => {
            viewMonth = key;
            Sheets.close("sheet-month");
            renderCash();
          },
        },
        TR_MONTHS_SHORT[i],
      );
      grid.appendChild(cell);
    }
    renderHistory();
  }
  function renderHistory() {
    const root = $("#month-history");
    clear(root);
    const byMonth = new Map();
    for (const t of Store.state.transactions) {
      const k = monthKeyOf(t.date);
      if (!byMonth.has(k)) byMonth.set(k, { income: 0, expense: 0 });
      const b = byMonth.get(k);
      if (t.type === "income") b.income += t.amount;
      else b.expense += t.amount;
    }
    const keys = [...byMonth.keys()].sort().reverse().slice(0, 6);
    if (!keys.length) {
      root.appendChild(
        emptyEl("inbox", "Henüz veri yok", "İlk hareketini ekle"),
      );
      hydrateIcons(root);
      return;
    }
    for (const k of keys) {
      const b = byMonth.get(k);
      const bal = b.income - b.expense;
      const row = el("button", {
        class: "row tappable",
        type: "button",
        onclick: () => {
          viewMonth = k;
          Sheets.close("sheet-month");
          renderCash();
        },
      });
      row.appendChild(
        el("span", { class: "row-icon totals", "data-icon": "trend" }),
      );
      const text = el("div", { class: "row-text" });
      text.appendChild(el("div", { class: "row-title" }, fmt.monthLabel(k)));
      text.appendChild(
        el(
          "div",
          { class: "row-sub" },
          `+${fmt.try(b.income)} · −${fmt.try(b.expense)}`,
        ),
      );
      row.appendChild(text);
      row.appendChild(
        el(
          "div",
          {
            class: `row-amount ${bal >= 0 ? "pos" : "neg"} bold`,
          },
          fmt.signed(bal),
        ),
      );
      root.appendChild(row);
    }
    hydrateIcons(root);
  }
  function bind() {
    $("#year-prev").addEventListener("click", () => {
      pickerYear--;
      render();
    });
    $("#year-next").addEventListener("click", () => {
      pickerYear++;
      render();
    });
    $("#month-today").addEventListener("click", () => {
      viewMonth = currentMonthKey();
      Sheets.close("sheet-month");
      renderCash();
    });
  }
  return { open, bind };
})();

/* ==========================================================================
   BACKUP CRYPTO — AES-256-GCM + PBKDF2 (Web Crypto, no deps)
   ========================================================================== */

const BackupCrypto = (() => {
  // Encoders are created lazily inside functions so module load never touches
  // browser-only globals (keeps the vm test sandbox happy).

  /** Base64-encode an ArrayBuffer in chunks (avoids call-stack overflow on big backups). */
  function bufToB64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }
  function b64ToBuf(str) {
    return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
  }

  /** @returns {Promise<CryptoKey>} */
  function deriveKey(password, salt) {
    return crypto.subtle
      .importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
        "deriveKey",
      ])
      .then((base) =>
        crypto.subtle.deriveKey(
          { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
          base,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"],
        ),
      );
  }

  async function encrypt(plaintext, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    );
    return {
      app: "ggai",
      enc: "AES-GCM",
      kdf: "PBKDF2",
      iter: PBKDF2_ITERS,
      salt: bufToB64(salt),
      iv: bufToB64(iv),
      data: bufToB64(ct),
    };
  }

  async function decrypt(box, password) {
    const key = await deriveKey(password, b64ToBuf(box.salt));
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBuf(box.iv) },
      key,
      b64ToBuf(box.data),
    );
    return new TextDecoder().decode(pt);
  }

  function isEncrypted(obj) {
    return !!obj && obj.enc === "AES-GCM" && typeof obj.data === "string";
  }

  function supported() {
    return typeof crypto !== "undefined" && !!crypto.subtle;
  }

  return { encrypt, decrypt, isEncrypted, supported };
})();

/* ==========================================================================
   SETTINGS
   ========================================================================== */

const Settings = (() => {
  function open() {
    const sub = $("#export-sub");
    sub.textContent = Store.state.settings.lastBackup
      ? `Son yedek: ${fmt.date(Store.state.settings.lastBackup)}`
      : "Tüm verilerin tek dosyada";
    const meta = $("#settings-meta");
    const s = Store.state;
    meta.textContent = `Bütçe v1 · ${s.transactions.length} hareket · ${s.pending.length} bekleyen · ${s.silver.length} pozisyon`;
    Theme.syncThumb();
    // Sync lang thumb + active
    const cur = Lang.get();
    const idx = ["tr", "en"].indexOf(cur);
    const thumb = $("#lang-thumb");
    if (thumb) thumb.style.transform = `translateX(${idx * 100}%)`;
    $$("[data-lang-opt]").forEach((b) =>
      b.classList.toggle("active", b.dataset.langOpt === cur),
    );
    Currency.init();
    Sheets.open("sheet-settings");
  }
  /** Trigger a client-side file download from a string. */
  function download(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Record that a backup just happened (drives the reminder + Settings subtitle). */
  function stampBackup() {
    const today = todayISO();
    Store.update((s) => {
      s.settings.lastBackup = today;
    });
    const sub = $("#export-sub");
    if (sub) sub.textContent = `Son yedek: ${fmt.date(today)}`;
  }

  function backupPayload() {
    return {
      app: "ggai",
      version: STATE_VERSION,
      exportedAt: new Date().toISOString(),
      state: Store.state,
    };
  }

  function exportData() {
    download(
      JSON.stringify(backupPayload(), null, 2),
      `butce-yedek-${todayISO()}.json`,
      "application/json",
    );
    stampBackup();
  }

  async function exportEncrypted() {
    if (!BackupCrypto.supported()) {
      Toast.show("Bu tarayıcıda şifreleme desteği yok", "error");
      return;
    }
    const pw = await Prompt.show({
      title: "Şifreli Yedek",
      label: "Parola belirle",
      placeholder: "En az 4 karakter",
    });
    if (!pw) return;
    if (pw.length < 4) {
      Toast.show("Parola en az 4 karakter olmalı", "error");
      return;
    }
    try {
      const box = await BackupCrypto.encrypt(
        JSON.stringify(backupPayload()),
        pw,
      );
      download(
        JSON.stringify(box),
        `butce-sifreli-${todayISO()}.json`,
        "application/json",
      );
      stampBackup();
      Toast.show("Şifreli yedek indirildi", "success");
    } catch (err) {
      Toast.show("Şifreleme başarısız", "error");
      console.error("[Settings] encrypt failed:", err);
    }
  }

  /** Export all transactions as CSV (date,type,category,amount,description). */
  function exportCSV() {
    const escape = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [["date", "type", "category", "amount", "description"]];
    const sorted = [...Store.state.transactions].sort((a, b) =>
      (a.date || "").localeCompare(b.date || ""),
    );
    for (const tx of sorted) {
      rows.push([
        tx.date,
        tx.type,
        tx.category,
        tx.amount,
        tx.description || "",
      ]);
    }
    const csv = rows.map((r) => r.map(escape).join(",")).join("\n");
    download(csv, `butce-${todayISO()}.csv`, "text/csv;charset=utf-8");
    Toast.show(
      `${Store.state.transactions.length} hareket dışa aktarıldı`,
      "success",
    );
  }
  /** Overwrite the whole store from an imported state, preserving every key
      (recurring/budgets/goals/debts/templates were silently dropped before). */
  async function applyImportedState(incoming) {
    if (!incoming || typeof incoming !== "object") throw new Error("bad state");
    if (!Array.isArray(incoming.transactions))
      throw new Error("no transactions");

    const ok = await Confirm.show({
      title: "Yedeği yüklemek istiyor musun?",
      message: "Mevcut tüm verinin üzerine yazılacak.",
      confirmLabel: "Yükle",
      danger: true,
    });
    if (!ok) return false;

    // Backup file does not embed photos — clear stale blobs to avoid orphans
    await Photos.clear();
    Store.replace({
      transactions: incoming.transactions || [],
      pending: incoming.pending || [],
      silver: incoming.silver || [],
      categories: {
        income: incoming.categories?.income || [...DEFAULT_CATEGORIES.income],
        expense: incoming.categories?.expense || [
          ...DEFAULT_CATEGORIES.expense,
        ],
      },
      recurring: incoming.recurring || [],
      budgets: incoming.budgets || {},
      goals: incoming.goals || [],
      debts: incoming.debts || [],
      templates: incoming.templates || [],
      settings: incoming.settings || {},
    });
    Sheets.close("sheet-settings");
    Toast.show("Yedek yüklendi", "success");
    return true;
  }

  function importData(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let data = JSON.parse(String(e.target.result));

        // Encrypted backup → ask for the password and decrypt first.
        if (BackupCrypto.isEncrypted(data)) {
          const pw = await Prompt.show({
            title: "Şifreli Yedek",
            label: "Parolayı gir",
            placeholder: "Yedek parolası",
          });
          if (!pw) return;
          try {
            data = JSON.parse(await BackupCrypto.decrypt(data, pw));
          } catch {
            Toast.show("Parola yanlış veya dosya bozuk", "error");
            return;
          }
        }

        const incoming = data?.state || data;
        await applyImportedState(incoming);
      } catch {
        Toast.show("Geçersiz yedek dosyası", "error");
      } finally {
        $("#import-file").value = "";
      }
    };
    reader.readAsText(file);
  }
  function parseCSV(text) {
    const rows = [];
    let i = 0,
      cur = "",
      row = [],
      inQuotes = false;
    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        if (ch === '"') {
          inQuotes = false;
          i++;
          continue;
        }
        cur += ch;
        i++;
      } else {
        if (ch === '"') {
          inQuotes = true;
          i++;
          continue;
        }
        if (ch === ",") {
          row.push(cur);
          cur = "";
          i++;
          continue;
        }
        if (ch === "\r") {
          i++;
          continue;
        }
        if (ch === "\n") {
          row.push(cur);
          rows.push(row);
          cur = "";
          row = [];
          i++;
          continue;
        }
        cur += ch;
        i++;
      }
    }
    if (cur || row.length) {
      row.push(cur);
      rows.push(row);
    }
    return rows.filter((r) => r.some((c) => String(c).trim().length));
  }

  async function importCSV(file) {
    if (!file) return;
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) {
      Toast.show("Boş CSV", "error");
      return;
    }
    const first = rows[0].map((c) => c.toLowerCase().trim());
    const hasHeader =
      first.includes("date") ||
      first.includes("tarih") ||
      first.includes("type");
    const data = hasHeader ? rows.slice(1) : rows;

    let added = 0;
    let skipped = 0;
    const newTx = [];
    for (const r of data) {
      const [dateRaw, typeRaw, category, amountRaw, description = ""] = r;
      const dateStr = String(dateRaw || "").trim();
      let iso = dateStr;
      const trMatch = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(dateStr);
      if (trMatch) iso = `${trMatch[3]}-${trMatch[2]}-${trMatch[1]}`;
      const type = String(typeRaw || "")
        .trim()
        .toLowerCase();
      const amount = parseAmount(amountRaw);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
        !["income", "expense", "gelir", "gider"].includes(type) ||
        !amount ||
        amount <= 0 ||
        !category
      ) {
        skipped++;
        continue;
      }
      newTx.push({
        id: uid(),
        type: type === "income" || type === "gelir" ? "income" : "expense",
        category: String(category).trim(),
        amount,
        description: String(description || "").trim(),
        date: iso,
      });
      added++;
    }

    if (!added) {
      Toast.show(`Hiçbir satır eklenmedi (${skipped} atlandı)`, "error");
      return;
    }
    const ok = await Confirm.show({
      title: `${added} hareket eklensin mi?`,
      message: skipped
        ? `${skipped} satır atlandı (geçersiz format).`
        : "Mevcut verilere eklenir, üzerine yazmaz.",
      confirmLabel: "Ekle",
    });
    if (!ok) return;
    Store.update((s) => {
      const seen = new Set(s.categories.income.concat(s.categories.expense));
      for (const t of newTx) {
        if (!seen.has(t.category)) {
          (t.type === "income"
            ? s.categories.income
            : s.categories.expense
          ).push(t.category);
          seen.add(t.category);
        }
      }
      s.transactions.push(...newTx);
    });
    Toast.show(`${added} hareket eklendi`, "success");
    Sheets.close("sheet-settings");
  }

  async function reset() {
    const ok1 = await Confirm.show({
      title: "Tüm veriyi silmek istiyor musun?",
      message: "Önce yedek almanı öneririm. Bu işlem geri alınamaz.",
      confirmLabel: "Devam et",
      danger: true,
    });
    if (!ok1) return;
    const ok2 = await Confirm.show({
      title: "Son onay",
      message: "Tüm hareketler, bekleyenler ve pozisyonlar silinecek.",
      confirmLabel: "Sil",
      danger: true,
    });
    if (!ok2) return;
    await Photos.clear();
    Store.reset();
    Sheets.close("sheet-settings");
    Toast.show("Tüm veri silindi", "info");
  }
  function bind() {
    $("#open-settings").addEventListener("click", open);
    $("#export-btn").addEventListener("click", exportData);
    $("#import-btn").addEventListener("click", () => $("#import-file").click());
    $("#import-file").addEventListener("change", (e) =>
      importData(e.target.files[0]),
    );
    const csvBtn = $("#import-csv-btn");
    if (csvBtn) {
      csvBtn.addEventListener("click", () => $("#import-csv-file").click());
      $("#import-csv-file").addEventListener("change", async (e) => {
        try {
          await importCSV(e.target.files[0]);
        } catch (err) {
          Toast.show("CSV okunamadı", "error");
          console.error(err);
        } finally {
          $("#import-csv-file").value = "";
        }
      });
    }
    const csvOutBtn = $("#export-csv-btn");
    if (csvOutBtn) csvOutBtn.addEventListener("click", exportCSV);
    const encBtn = $("#export-enc-btn");
    if (encBtn) encBtn.addEventListener("click", exportEncrypted);
    $("#reset-btn").addEventListener("click", reset);
    $$("[data-theme-opt]").forEach((b) => {
      b.addEventListener("click", () => Theme.apply(b.dataset.themeOpt));
    });
    $$("[data-lang-opt]").forEach((b) => {
      b.addEventListener("click", () => {
        Lang.set(b.dataset.langOpt);
        // Sync segmented thumb
        const cur = Lang.get();
        const idx = ["tr", "en"].indexOf(cur);
        const thumb = $("#lang-thumb");
        if (thumb) thumb.style.transform = `translateX(${idx * 100}%)`;
        $$("[data-lang-opt]").forEach((x) =>
          x.classList.toggle("active", x.dataset.langOpt === cur),
        );
        Currency.renderFxMeta();
      });
    });
    $$("[data-currency-opt]").forEach((b) => {
      b.addEventListener("click", () => {
        Currency.set(b.dataset.currencyOpt);
        Haptics.light();
      });
    });
    const fxBtn = $("#fx-fetch-btn");
    if (fxBtn) fxBtn.addEventListener("click", () => Currency.fetchRates());
  }

  /** Gentle nudge to back up if there's data and the last backup is stale. */
  function maybeRemindBackup() {
    const s = Store.state;
    if (!s.transactions.length) return;
    const last = s.settings.lastBackup;
    const stale = !last || daysSince(last) >= BACKUP_REMINDER_DAYS;
    if (!stale) return;
    Toast.show(
      last
        ? `Son yedekten bu yana ${daysSince(last)} gün geçti — yedek almayı unutma`
        : "Henüz yedek almadın — verini korumak için Ayarlar'dan yedekle",
      "info",
      { duration: 5000 },
    );
  }

  return { open, bind, maybeRemindBackup };
})();

/* ==========================================================================
   GLOBAL RENDER
   ========================================================================== */

function renderAll() {
  // Only render the visible page; the others re-render on tab switch.
  if (activeTab === "cash") renderCash();
  else if (activeTab === "pending") renderPending();
  else if (activeTab === "silver") renderSilver();
}

/* ==========================================================================
   SERVICE WORKER
   ========================================================================== */

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => {
        // If a waiting worker already exists when we register, prompt now.
        if (reg.waiting && navigator.serviceWorker.controller) {
          showUpdatePrompt(reg.waiting);
        }
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              showUpdatePrompt(installing);
            }
          });
        });
      })
      .catch(() => {});
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

function showUpdatePrompt(worker) {
  // Lightweight inline toast with action — wraps Toast.show but stays until clicked
  const host = $("#toast-host");
  if (!host) return;
  const node = el("div", { class: "toast info update-toast" });
  const msg = el("span", {}, "Yeni sürüm hazır");
  const btn = el(
    "button",
    {
      class: "toast-action",
      type: "button",
      onclick: () => {
        worker.postMessage("SKIP_WAITING");
      },
    },
    "Yenile",
  );
  node.appendChild(msg);
  node.appendChild(btn);
  host.appendChild(node);
  requestAnimationFrame(() => node.classList.add("show"));
}

function bindOnlineStatus() {
  const indicator = el("span", {
    class: "online-dot",
    "aria-hidden": "true",
  });
  const topbar = $(".topbar");
  if (topbar) topbar.appendChild(indicator);
  const update = () => {
    indicator.classList.toggle("offline", !navigator.onLine);
    indicator.title = navigator.onLine ? "Çevrimiçi" : "Çevrimdışı";
  };
  window.addEventListener("online", () => {
    update();
    Toast.show("Çevrimiçi", "success", { duration: 1400 });
  });
  window.addEventListener("offline", () => {
    update();
    Toast.show("Çevrimdışı — değişiklikler yerel kaydedilir", "info", {
      duration: 2400,
    });
  });
  update();
}

/* ==========================================================================
   INIT
   ========================================================================== */

function bindPullToRefresh() {
  const ptr = $("#ptr");
  if (!ptr) return;
  let startY = 0;
  let pulling = false;
  let pid = null;

  const isAtTop = () => (window.scrollY || 0) <= 0;

  function onDown(e) {
    if (!isAtTop() || pulling) return;
    pid = e.pointerId;
    startY = e.clientY;
    pulling = true;
  }
  function onMove(e) {
    if (!pulling || e.pointerId !== pid) return;
    const dy = e.clientY - startY;
    if (dy <= 0) return;
    const h = Math.min(80, dy * 0.5);
    ptr.style.height = h + "px";
    ptr.classList.toggle("active", h > 30);
    if (h > 56) Haptics.light();
  }
  async function onUp(e) {
    if (!pulling || e.pointerId !== pid) return;
    pulling = false;
    const triggered = ptr.classList.contains("active");
    ptr.style.height = "";
    if (triggered && activeTab === "silver") {
      ptr.classList.add("refreshing");
      Haptics.medium();
      await fetchSilverPrice();
      ptr.classList.remove("refreshing");
    } else if (triggered) {
      // Generic refresh — re-render active page
      ptr.classList.add("refreshing");
      Haptics.medium();
      setTimeout(() => {
        renderAll();
        ptr.classList.remove("refreshing");
      }, 360);
    }
    ptr.classList.remove("active");
  }

  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerup", onUp, { passive: true });
  document.addEventListener("pointercancel", onUp, { passive: true });
}

function bindHaptics() {
  // Light tick on chip/seg/tab/cta-chip taps
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target.closest(
        ".chip, .seg-opt, .tab, .cta-chip, .month-cell, .pull-btn, [data-tx-type], [data-silver-kind]",
      );
      if (t) Haptics.light();
    },
    true,
  );
}

async function bindNotifToggle() {
  const btn = $("#notif-toggle");
  if (!btn) return;
  function syncUI() {
    const perm = Notifier.permission();
    const on = perm === "granted";
    btn.setAttribute("aria-pressed", String(on));
    const sub = $("#notif-sub");
    if (sub) {
      sub.textContent =
        perm === "granted"
          ? t("settings.notifOn")
          : perm === "denied"
            ? t("settings.notifDenied")
            : t("settings.notifOff");
    }
  }
  syncUI();
  btn.addEventListener("click", async () => {
    if (!Notifier.supported()) {
      Toast.show(
        "Bu tarayıcıda bildirim desteği yok / Notifications unsupported",
        "info",
      );
      return;
    }
    if (Notifier.permission() === "granted") {
      // Cannot revoke programmatically — show hint
      Toast.show(t("settings.notifOn"), "info");
      return;
    }
    const result = await Notifier.requestPermission();
    syncUI();
    if (result === "granted") {
      Toast.show(t("settings.notifOn"), "success");
      Notifier.send(t("notif.budgetTitle"), t("settings.notifOn"));
    }
  });
}

function bindPrivacyToggle() {
  const btn = $("#privacy-toggle");
  if (btn) btn.addEventListener("click", () => Privacy.toggle());
  // Long-press hero amount → toggle privacy quickly
  $$(".hero-amount").forEach((el) => {
    let t = 0;
    el.addEventListener("pointerdown", () => {
      t = setTimeout(() => Privacy.toggle(), 600);
    });
    const cancel = () => clearTimeout(t);
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("pointercancel", cancel);
  });
}

function bindHeroTilt() {
  // Mouse-only — touch already has drag/scroll; devicemotion would need permission flow.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover)").matches) return;
  $$(".hero").forEach((hero) => {
    let raf = 0;
    const reset = () => {
      hero.classList.remove("tilting");
      hero.style.transform = "";
    };
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      // Map [0..1] to [-1..1], scale by max tilt (4 deg)
      const ry = (px - 0.5) * 8;
      const rx = -(py - 0.5) * 6;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        hero.classList.add("tilting");
        hero.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(2px)`;
      });
    });
    hero.addEventListener("pointerleave", reset);
    hero.addEventListener("pointercancel", reset);
  });
}

function bindTopbarScrollBlur() {
  const scroll = $("#scroll-root");
  const topbar = $(".topbar");
  if (!scroll || !topbar) return;
  let raf = 0;
  const update = () => {
    topbar.classList.toggle("scrolled", scroll.scrollTop > 4);
    raf = 0;
  };
  scroll.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true },
  );
  // also listen on window since iOS Safari uses window scroll for the page
  window.addEventListener(
    "scroll",
    () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          topbar.classList.toggle(
            "scrolled",
            (window.scrollY || scroll.scrollTop) > 4,
          );
          raf = 0;
        });
    },
    { passive: true },
  );
}

function autoLabelInputs() {
  // Associate every .field-label div with its sibling input via aria-labelledby
  $$(".field").forEach((field) => {
    const lbl = field.querySelector(".field-label");
    const input = field.querySelector(".input, input");
    if (!lbl || !input) return;
    if (!lbl.id) lbl.id = "lbl-" + Math.random().toString(36).slice(2, 8);
    if (
      !input.hasAttribute("aria-label") &&
      !input.hasAttribute("aria-labelledby")
    ) {
      input.setAttribute("aria-labelledby", lbl.id);
    }
  });
}

/** Open the right sheet when launched via a PWA shortcut (?action=...). */
function handleLaunchAction() {
  try {
    const action = new URLSearchParams(location.search).get("action");
    if (!action) return;
    // Clean the URL so a reload/return doesn't re-trigger the sheet.
    history.replaceState({}, "", location.pathname);
    if (action === "new-tx") TxSheet.open();
    else if (action === "new-pending") PendingSheet.open();
  } catch {}
}

/** Notify about debts/pending whose due date has arrived. */
function remindDue() {
  const items = collectDueReminders(
    Store.state.debts,
    Store.state.pending,
    todayISO(),
  );
  if (!items.length) return;
  const msg =
    items.length === 1
      ? `Vadesi geldi: ${items[0].label} (${fmt.try(items[0].amount)})`
      : `${items.length} kayıt vadesinde — borç/bekleyen kontrol et`;
  Toast.show(msg, "info", { duration: 5000 });
  Notifier.send("Vade Hatırlatıcı", msg, { tag: "due-reminder" });
}

function init() {
  Theme.init();
  Lang.init();
  Privacy.init();
  hydrateIcons();
  autoLabelInputs();
  bindTopbarScrollBlur();
  bindHeroTilt();
  bindPrivacyToggle();
  bindNotifToggle();
  bindPullToRefresh();
  bindHaptics();

  // Header add button — opens sheet for active tab
  $("#header-add").addEventListener("click", () => {
    if (activeTab === "cash") TxSheet.open();
    else if (activeTab === "pending") PendingSheet.open();
    else if (activeTab === "silver") SilverSheet.open();
  });

  $("#month-pill").addEventListener("click", () => MonthPicker.open());

  $$(".tab").forEach((b) =>
    b.addEventListener("click", () => switchTab(b.dataset.target)),
  );

  $("#silver-gram-price").addEventListener("input", onGramPriceInput);
  $("#fetch-price-btn").addEventListener("click", fetchSilverPrice);

  TxSheet.bind();
  PendingSheet.bind();
  CollectSheet.bind();
  SilverSheet.bind();
  MonthPicker.bind();
  Settings.bind();
  Confirm.bind();
  Prompt.bind();
  DatePicker.bind();
  Budgets.bind();
  Recurring.bind();
  Goals.bind();
  Debts.bind();
  SearchPalette.bind();

  // Apply any due recurring rules — defer to idle so it doesn't block first paint
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
  idle(() => {
    const applied = applyRecurringDue();
    if (applied > 0) {
      Toast.show(`${applied} ${t("toast.recurringApplied")}`, "success");
    }
    // Backup reminder — delayed so it doesn't collide with the recurring toast
    setTimeout(() => Settings.maybeRemindBackup(), applied > 0 ? 3500 : 1200);
    // Due reminders (debts / pending) — staggered after the backup nudge
    setTimeout(remindDue, applied > 0 ? 5500 : 3000);
  });

  // Wrap native date inputs with custom pill
  [
    "#tx-date",
    "#pending-date",
    "#collect-date",
    "#silver-buy-date",
    "#debt-due",
  ].forEach((sel) => attachDatePill($(sel)));

  Store.subscribe(renderAll);
  switchTab("cash");
  handleLaunchAction();
  bindOnlineStatus();
  registerSW();
}

if (!globalThis.__GGAI_TEST__) init();
