# Gelir Gider AI

Kişisel finans takip PWA'sı. Tek kullanıcı (sahibi), mobil öncelikli, sunucusuz.

## Teknoloji Stack

- Vanilla HTML / CSS / JavaScript (framework yok, build step yok)
- PWA (manifest + service worker, offline çalışır)
- localStorage (tüm veri tarayıcıda)
- JSON export / import ile yedekleme

## Çalıştırma

Statik dosyalardır, herhangi bir static server yeterlidir:

```bash
# Python
python -m http.server 8080

# Node (npx)
npx serve .

# Sonra: http://localhost:8080/uygulama/
```

Service worker test etmek için `localhost` üzerinden veya HTTPS gereklidir.

## Build / Test

- Build adımı **yok** — kaynak doğrudan tarayıcıda çalışır
- Test framework **yok** — manuel tarayıcı testi
- Lint **yok** — vanilla JS, kurallar elle korunur

## Klasör Yapısı

```
.
├── apple-tasarim.css   # Apple-tarzı tasarım (mobil öncelikli, dark/light, max-width 480px) — KÖKTE
└── uygulama/           # Çalışan uygulama (apple-tasarim.css'i ../ ile çeker)
    ├── index.html      # Tek sayfa, 3 sekme (Nakit / Bekleyen / Gümüş)
    ├── app.js          # Tüm uygulama mantığı (state, render, storage)
    ├── manifest.json   # PWA manifest
    └── service-worker.js   # Offline cache
```

## Veri Modeli (localStorage)

Tek anahtar: `ggai:state:v1` — JSON olarak şu yapı:

```js
{
  transactions: [{ id, type: 'income'|'expense', category, description, amount, date }],
  pending: [{ id, source, amount, eta: 'unknown'|'thisWeek'|'thisMonth'|'1to3m'|'3mPlus', exactDate?, createdAt }],
  silver: [{ id, kind: 'gram'|'ounce'|'fund', amount, buyPrice, buyDate?, targetPrice? }],
  categories: { income: [...], expense: [...] },
  settings: { silverGramPrice?, lastUsedCategory?, theme? }
}
```

## Kod Standartları

- TypeScript yok, ama `any` zihinsel olarak da yasak — JSDoc ile tip ipucu ver
- `console.log` commit etme
- Magic number yerine sabitler (örn. `OUNCE_TO_GRAM = 31.1035`)
- Para formatı: `₺123.456` (binlik nokta, kuruş yok normalde)
- Türkçe arayüz, İngilizce kod (değişken/fonksiyon isimleri)
- Tarih formatı: `gg.aa.yyyy` (TR)
- Apple-vari sade tasarım: gölge yok, gradient yok, flat
- Mobile-first: tüm UI 480px konteyner içinde

## PWA Notları

- Service worker cache versiyonu (`CACHE_NAME`) her dağıtımda artırılmalı
- `manifest.json` içinde `display: standalone`, theme color sistem temasıyla uyumlu

## Geliştirme Sırası

1. ✅ İskelet + manifest
2. ✅ Nakit sekmesi
3. ⏳ Bekleyen sekmesi + "Geldi" akışı
4. ⏳ Gümüş sekmesi
5. ⏳ Üst toplam servet
6. ⏳ Export / Import
7. ⏳ Aylık filtre
8. ⏳ Service worker
9. ⏳ Tema (auto)
10. ⏳ (Opsiyonel) Gümüş fiyat API

## Commit Formatı

Semantic commit (global kural):

- `feat:` yeni özellik
- `fix:` düzeltme
- `refactor:` yeniden yapılandırma
- `docs:` doküman
- `chore:` bakım
