# Sleep n Dream Dashboard

Dashboard admin Sleep n Dream berbasis React, TypeScript, Vite, dan Tailwind CSS.

## Cloudflare production build

Set these values in Settings > Builds > Variables and secrets before rebuilding:

```env
VITE_API_BASE_URL=https://sleepndream-api.vicecersaa.workers.dev/api/v1
VITE_STOREFRONT_URL=https://sleepndream-white.vicecersaa.workers.dev
VITE_DEMO_MODE=false
```

These are public build settings, not runtime secrets. A new build is required;
redeploying an old bundle retains its previous API configuration. With these
settings, authentication uses the backend and MongoDB instead of demo sessions.

## Menjalankan

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Isi `VITE_API_BASE_URL` dengan URL backend Sleep n Dream (termasuk prefix API), dan `VITE_STOREFRONT_URL` dengan origin website Sleep n Dream. Jangan masukkan secret ke variabel VITE karena nilainya tersedia di browser.

Backend harus mendukung kontrak endpoint di `src/lib/api.ts`, autentikasi cookie, dan CORS dengan credentials dari origin dashboard. Tanpa konfigurasi API, halaman login dapat ditampilkan tetapi akses data dan autentikasi belum tersedia. Backend/database tidak termasuk dalam repo ini.

Link checkout memerlukan konfigurasi storefront. Konten homepage perlu disesuaikan dengan schema backend dan integrasi website Sleep n Dream sebelum dipublikasikan. Gambar, testimoni, klaim garansi, dan promosi bawaan telah dikosongkan atau dinetralkan.

## Pemeriksaan

```sh
npm run build
npm run typecheck
npm run lint
```

## Status validasi

Build produksi berhasil. Typecheck masih menemukan 14 error yang diwarisi dari sumber pada CustomersPage dan InventoryPage (field model lama). Kedua halaman tersebut belum dimigrasikan ke kontrak model terbaru.
# Public client demo

With `VITE_API_BASE_URL` empty, the dashboard runs a standalone public demo.
Use `admin@sleepndream.com` / `Sleep n Dream@1234` to enter. These are public demo
credentials, not a security boundary or a production account.

The demo includes seven sample products. Website editor saves and publish actions
are browser-local simulations; other mutations show a preview-only message.
It never sends requests to the real backend. Login lasts for the browser tab session.
Set `VITE_DEMO_MODE=false` to disable this mode, or configure a real API URL to use
normal server authentication. API failures never trigger a fallback to demo.
Cloudflare must rebuild after these build-time variables change.
