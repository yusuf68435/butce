# Bütçe — Gelir Gider AI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyusuf68435%2Fbutce&project-name=butce&repository-name=butce)
[![CI](https://github.com/yusuf68435/butce/actions/workflows/ci.yml/badge.svg)](https://github.com/yusuf68435/butce/actions/workflows/ci.yml)

Kişisel finans takibi yapan, **sunucusuz, çevrimdışı çalışan** PWA. Tüm veri tarayıcıda (`localStorage`) durur — sunucu, hesap, ücret yok.

## Özellikler

- **3 sekme**: Nakit (gelir/gider) · Bekleyen (tahsilat) · Gümüş (gram/ons/fon pozisyon)
- iOS HIG uyumlu UI: gradient hero kart, donut grafik, sparkline, 3-wheel tarih seçici, drag-to-dismiss sheet'ler
- **İçgörüler**: ay sonu bakiye tahmini, geçen aya kıyas, en çok kategori, anomali tespiti
- **Etiketler** (işlem başına) + **etiket harcama raporu** + **hızlı giriş şablonları**
- **Birikim hedefleri** (ilerleme çubuğu) + **borç takibi** (kim kime, net durum, vade hatırlatıcı)
- **Kategori bütçe limitleri** — harcanan/limit çubukları + native `Notification API` uyarısı
- **Aylık tekrarlayan işlemler** (otomatik kira/maaş/fatura)
- **GitHub-tarzı yıllık ısı haritası** + **aylık takvim** (güne dokun → o tarihe kayıt) + **kategori trendi**
- **Aylık yazdırılabilir / PDF rapor**
- **Uygulama kilidi** — PBKDF2 ile hash'lenmiş PIN (açılışta keypad)
- **Şifreli yedek** (AES-256-GCM + PBKDF2) · JSON + CSV içe/dışa aktarma
- **Cmd+K arama paleti** — metin + tür/tarih aralığı filtresi; canlı debounce + highlight
- **PWA kısayolları** (`?action=new-tx`) + **ilk açılış onboarding** (örnek veri)
- **Fiş fotoğrafı** (IndexedDB, JPEG sıkıştırma, lazy thumbnail)
- **Multi-currency** (TRY / USD / EUR — Frankfurter.app FX cache, offline-first, veri ₺ saklanır)
- Dark/Light/Auto tema · **TR/EN dil** · **bakiyeyi gizle** · Pull-to-refresh · Haptic feedback
- Çevrimdışı tam fonksiyonel (Service Worker), WCAG AA (Lighthouse 100), SEO 100

## Çalıştırma (yerel)

Statik dosyalardır, herhangi bir HTTP server yeterlidir:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Sonra: <http://localhost:8080/uygulama/> (uygulama `uygulama/` altında; `apple-tasarim.css` kökten yüklenir)

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
├── apple-tasarim.css   # Apple-tarzı tasarım dosyası — token sistem, ~3500 satır (kökte)
├── uygulama/           # Çalışan uygulama (apple-tasarim.css'i ../ ile çeker)
│   ├── index.html      # Tek sayfa, 3 sekme + ~15 sheet (~1480 satır)
│   ├── app.js          # Modüler vanilla JS IIFE, ~6400 satır
│   │                   #   Store · FX · Photos (IDB) · Currency · Theme · Lang
│   │                   #   Privacy · Sheets · Toast · Confirm · Prompt · DatePicker
│   │                   #   TxSheet · PendingSheet · CollectSheet · SilverSheet
│   │                   #   MonthPicker · Settings · Budgets · Recurring · SearchPalette
│   ├── manifest.json   # PWA manifest (categories, shortcuts, maskable)
│   └── service-worker.js   # Cache-first + update prompt (ggai-v38)
└── tools/                  # build düz dist/ üretir (Vercel buradan deploy eder)
    ├── build.mjs       # terser + csso → dist/
    ├── capture.mjs     # Playwright 25-screenshot pipeline
    └── tests.mjs       # 40 unit tests, vm sandbox
```

## Geliştirme

```bash
# Kurulum (sadece capture script için)
npm install

# 25 screenshot al
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
