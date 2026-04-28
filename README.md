# Bütçe — Gelir Gider AI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyusuf68435%2Fbutce&project-name=butce&repository-name=butce)
[![CI](https://github.com/yusuf68435/butce/actions/workflows/ci.yml/badge.svg)](https://github.com/yusuf68435/butce/actions/workflows/ci.yml)

Kişisel finans takibi yapan, **sunucusuz, çevrimdışı çalışan** PWA. Tüm veri tarayıcıda (`localStorage`) durur — sunucu, hesap, ücret yok.

## Özellikler

- **3 sekme**: Nakit (gelir/gider) · Bekleyen (tahsilat) · Gümüş (gram/ons/fon pozisyon)
- iOS HIG uyumlu UI: gradient hero kart, donut grafik, sparkline, alış→şimdi→hedef numline
- 3-wheel **Apple-tarzı tarih seçici**, drag-to-dismiss sheet'ler, FLIP animated reorder
- Dark/Light/Auto tema, **bakiyeyi gizle** (privacy mode)
- **Pull-to-refresh** (Gümüş sekmesinde fiyat çekimi)
- **Haptic feedback** (Vibration API)
- **CSV import** (`date,type,category,amount,description`)
- JSON yedekleme (içe/dışa)
- Çevrimdışı tam fonksiyonel (Service Worker)
- WCAG AA (Lighthouse 100), SEO 100

## Çalıştırma (yerel)

Statik dosyalardır, herhangi bir HTTP server yeterlidir:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Sonra: <http://localhost:8080>

> Service Worker `localhost` veya HTTPS gerektirir.

## Deploy (production)

### Seçenek A — Vercel (önerilen, 30 saniye)

1. <https://vercel.com> üzerinden GitHub ile giriş yap
2. Bu repoyu push'la (aşağıda)
3. "Import Project" → bu repo → "Deploy"
4. Otomatik HTTPS + Brotli + global CDN. Performance skoru 90+ otomatik.

### Seçenek B — Netlify Drop (en hızlı, repo gerekmez)

1. <https://app.netlify.com/drop>
2. Klasörü tarayıcıya sürükle-bırak (`butce-mobile/`, `node_modules/`, `screenshots/`, `tools/` hariç)
3. Anında URL alırsın

### Seçenek C — Cloudflare Pages

1. <https://dash.cloudflare.com> → Pages → Create
2. GitHub bağla
3. Build command: yok (boş bırak)
4. Output directory: `/` (root)

### Seçenek D — GitHub Pages

```bash
git remote add origin git@github.com:KULLANICI/butce.git
git push -u origin master
```

GitHub repo → Settings → Pages → Source: master / root.

## GitHub'a push

```bash
# 1. GitHub'da boş bir repo oluştur (örn. "butce")
# 2. Aşağıdakileri çalıştır:
git remote add origin git@github.com:KULLANICI_ADI/butce.git
git branch -M main
git push -u origin main
```

## Yapı

```
.
├── index.html          # Tek sayfa, 3 sekme + 8 sheet
├── style.css           # Token sistem, ~2200 satır
├── app.js              # Modüler vanilla JS, ~2700 satır
├── manifest.json       # PWA manifest (categories, shortcuts, maskable)
├── service-worker.js   # Cache-first + update prompt
└── tools/
    └── capture.mjs     # Playwright 20-screenshot pipeline
```

## Geliştirme

```bash
# Kurulum (sadece capture script için)
npm install

# 20 screenshot al
npm run capture
```

## Komutlar (Settings sheet)

- **Yedek İndir** — `butce-yedek-YYYY-MM-DD.json`
- **Yedekten Yükle** — JSON içe aktar (üzerine yazar)
- **CSV İçe Aktar** — `date,type,category,amount,description`
  - Tarih: `YYYY-MM-DD` veya `gg.aa.yyyy`
  - Type: `income`/`expense` veya `gelir`/`gider`
  - Olmayan kategoriler otomatik eklenir
- **Tüm Veriyi Sil** — `localStorage` siler

## Tarayıcı desteği

- iOS Safari 16+
- Chrome / Edge / Firefox son sürüm
- PWA install: iOS Safari "Ana Ekrana Ekle"

## Lisans

MIT — kişisel kullanım için yapıldı, dağıtmakta özgürsün.
