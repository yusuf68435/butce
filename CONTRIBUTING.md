# Bütçe — Katkı rehberi

Teşekkürler! Bu küçük PWA tek kişiye yardımcı olmak için yazılıyor, basit kalsın istiyoruz. PR'larında lütfen şunlara dikkat et:

## Kod tarzı

- **Vanilla HTML/CSS/JS** — framework yok, build-step minify dışında yok.
- **TypeScript yok**, `any` zihinsel olarak yasak — JSDoc ile tip ipucu ver.
- **`console.log` commit etme** (debug için tut, gönderirken sil). `console.error` SW debug için kalabilir.
- **Magic number yerine sabit** (`OUNCE_TO_GRAM`, `AGED_DAYS` vs).
- **Türkçe arayüz**, **İngilizce kod** (değişken/fonksiyon adı).
- **Tarih formatı**: `gg.aa.yyyy` (TR), `iso` arka planda.
- **Para formatı**: `₺123.456` (binlik nokta, kuruşsuz).

## Apple-vari sade tasarım

- Mobile-first, tüm UI 480px konteyner içinde.
- Gölge yok (custom `--shadow-*` token'ları kullan), gradient sadece hero/icon/glow için, flat satırlar.
- Focus halkası: `:focus-visible` ile neon outline.
- Animasyon: `cubic-bezier(0.32, 0.72, 0, 1)` spring veya `ease-out`. `prefers-reduced-motion` mutlaka destekle.
- Touch hedefleri ≥ 44pt (HIG).

## Geliştirme akışı

```bash
git clone https://github.com/yusuf68435/butce
cd butce
npm install
npm test           # 15 unit tests
npm run serve      # http://localhost:8080
npm run capture    # 20 screenshot (Playwright)
npm run build      # dist/ minified bundle
```

## Commit formatı

Semantic commit: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `build:`, `ci:`, `perf:`, `style:`.

Örnek:

```
feat(phase-15): multi-currency display

- New state.settings.currency
- FX rate via /api...
```

Co-Authored-By satırı varsa korunur.

## i18n

Tüm yeni UI string'leri `app.js`'teki `I18N.tr` + `I18N.en` sözlüklerine ekle. **TR ve EN aynı anahtarlara sahip olmalı** — `npm test` bunu kontrol eder.

HTML için: `data-i18n="key"` attribute kullan, default text TR olsun (fallback).

## Yeni faz / Phase ekleme

Mevcut `app.js` ~3550 satır, modüler — her özellik kendi IIFE/modül içinde:

```js
const Foo = (() => {
  // private state
  function open() { ... }
  function bind() { ... }
  return { open, bind };
})();
```

`init()` fonksiyonuna `Foo.bind()` ekle.

## Cache versioning

CSS/JS değiştirdiğinde **3 yeri** birlikte güncelle:

1. `index.html` → `style.css?v=N` ve `app.js?v=N`
2. `service-worker.js` → `CACHE_NAME = "ggai-vN"`

Aksi takdirde service worker eski kodu serve eder.

## Test eklemek

Pure helper'lar için `tools/tests.mjs` içine ekle. DOM gerektiren testler için Playwright-based capture flow'u kullanılabilir.

## PR açmadan önce

- [ ] `npm test` geçiyor
- [ ] `npm run build` çalışıyor
- [ ] Console hatasız
- [ ] Light + Dark mode kontrol edildi
- [ ] Cache versiyonları senkronize

İyi kodlamalar. ☕️
