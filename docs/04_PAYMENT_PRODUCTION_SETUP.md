# Panduan Setup Pembayaran Xendit (Sandbox hingga Production) — FoodQueue

Dokumen ini menjelaskan langkah lengkap untuk mengaktifkan integrasi **Xendit Payments API v3 (Core API / Custom UI)** di FoodQueue mulai dari pengujian di **Sandbox** sampai **Go-Live Production**.

---

## 1. Ringkasan Arsitektur Pembayaran

FoodQueue menggunakan **Xendit Payments API v3** (`/v3/payment_requests`, header `api-version: 2024-11-11`) dengan Custom UI langsung di halaman `/orders/[id]/pay`:

| Metode | Channel Xendit Aktif | Pengalaman Pengguna di UI |
| :--- | :--- | :--- |
| **QRIS** | `QRIS` | QRIS dinamis dirender lokal oleh server (tanpa API eksternal pihak ketiga), dilengkapi tombol **Unduh Gambar QRIS**. |
| **Virtual Account** | `BCA_VIRTUAL_ACCOUNT`, `BNI_VIRTUAL_ACCOUNT`, `BRI_VIRTUAL_ACCOUNT`, `MANDIRI_VIRTUAL_ACCOUNT`, `PERMATA_VIRTUAL_ACCOUNT`, `BSI_VIRTUAL_ACCOUNT` | Pilihan bank di halaman pembayaran, nomor VA asli, tombol **Salin VA** & **Salin Nominal**, dan instruksi bank. |
| **E-Wallet** | `DANA`, `SHOPEEPAY`, `OVO` | Pilihan e-wallet, input nomor HP otomatis (E.164 `+62...`) untuk OVO, redirect/deeplink checkout, dan return URL otomatis. |

### Pengamanan Produksi Otomatis
- **Endpoint Webhook Terverifikasi**: `POST /api/payments/webhooks/xendit` memverifikasi header `x-callback-token` secara *constant-time* (`crypto.timingSafeEqual`), memeriksa kecocokan nominal pembayaran, dan bersifat **idempoten** (tahan terhadap webhook duplikat).
- **Sinkronisasi Aktif (Fallback)**: `POST /api/payments/[id]/sync` + polling otomatis di `/orders/[id]/pay` memastikan pembayaran tetap terkonfirmasi meski webhook sempat tertunda.
- **Proteksi Simulasi Otomatis**: Saat `PAYMENT_PROVIDER="XENDIT"` **atau** `NODE_ENV="production"`:
  - `POST /api/payments/[id]/simulate` dan `POST /api/orders/[id]/simulate-status` otomatis menolak request (`403 Forbidden`).
  - Seluruh tombol simulasi di `/orders/[id]/pay` dan `/orders/[id]` otomatis disembunyikan.
  - `PAYMENT_PROVIDER="MOCK"` otomatis ditolak di `NODE_ENV="production"` (*fail-closed*).
- **Penanganan Refund**:
  - QRIS & E-Wallet: memanggil `POST https://api.xendit.co/refunds` otomatis saat order ditolak/dibatalkan setelah bayar.
  - Virtual Account: Xendit tidak mendukung direct refund API untuk VA, sehingga sistem otomatis mencatat `MANUAL_REQUIRED` dan mengirim notifikasi ke Admin.

---

## 2. Langkah 1 — Pendaftaran Akun & Aktivasi Channel Xendit

1. Daftar akun di [dashboard.xendit.co](https://dashboard.xendit.co/register) (gratis untuk memulai di mode **Test / Sandbox**).
2. Untuk mengaktifkan **Mode Live (Production)** di Indonesia, lengkapi KYC / verifikasi bisnis di Dashboard Xendit:
   - **Perorangan / UMKM**: KTP, NPWP pribadi (jika ada), foto lokasi/website FoodQueue, dan rekening bank atas nama pemilik.
   - **Badan Usaha (PT / CV / Yayasan / Koperasi Kampus)**: Akta Pendirian + SK Kemenkumham, NIB, NPWP Badan, KTP Direktur, dan rekening bank perusahaan.
3. Aktifkan payment channels yang ingin dipakai di **Settings → Payment Methods**:
   - **QR Codes**: QRIS
   - **Virtual Accounts**: BCA, BNI, BRI, Mandiri, Permata, BSI (aktifkan minimal bank yang Anda inginkan; channel yang belum aktif akan menampilkan pesan error jelas saat dipilih)
   - **E-Wallets**: DANA, ShopeePay, OVO

---

## 3. Langkah 2 — Pengujian End-to-End di Xendit Sandbox (Test Mode)

1. Masuk ke [Dashboard Xendit](https://dashboard.xendit.co/) lalu pastikan toggle di pojok kiri atas berada di **Test Mode**.
2. Buka **Settings → Developers → API Keys → Generate Secret Key**:
   - Beri nama misalnya `FoodQueue Sandbox`.
   - Izin (*Permissions*): **Money-In Products → Write** (mencakup Payment Requests & Refunds).
   - Salin key yang diawali `xnd_development_...`.
3. Buka **Settings → Developers → Webhooks**:
   - Salin **Webhook Verification Token**.
   - Untuk mengetes webhook di komputer lokal, jalankan tunnel publik (misal `ngrok http 3000` atau `cloudflared tunnel --url http://localhost:3000`) lalu masukkan URL:
     ```
     https://<subdomain-tunnel-anda>/api/payments/webhooks/xendit
     ```
   - Centang event pada bagian **Payments API (v3)**:
     - `payment.capture` (dan `payment.succeeded` jika tersedia)
     - `payment.failure` (dan `payment.failed`)
     - `payment_request.expiry`
     - `refund.succeeded` & `refund.failed`
4. Perbarui `.env` lokal Anda:
   ```env
   NODE_ENV="development"
   NEXT_PUBLIC_APP_URL="https://<subdomain-tunnel-anda>"

   PAYMENT_PROVIDER="XENDIT"
   XENDIT_SECRET_KEY="xnd_development_xxxxxxxxxxxxxxxxxxxxxxxx"
   XENDIT_WEBHOOK_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxx"
   XENDIT_API_BASE_URL="https://api.xendit.co"
   XENDIT_API_VERSION="2024-11-11"
   ENABLE_PAYMENT_SIMULATION="false"
   ```
5. Restart server (`npm run dev`), buat pesanan di FoodQueue, lalu uji:
   - **QRIS**: Muncul QRIS dinamis asli Xendit. Simulasikan bayar dari Xendit Dashboard (**Transactions → Payment Requests** atau API Simulator Xendit) → status pesanan di FoodQueue otomatis berubah jadi `PAID` dalam < 5 detik.
   - **Virtual Account**: Pilih BCA / BNI / BRI / Mandiri → nomor VA asli Xendit muncul.
   - **E-Wallet**: Pilih DANA / ShopeePay / OVO → klik **Buka Halaman Pembayaran** → selesaikan di halaman simulator Xendit → kembali otomatis ke `/orders/[id]`.

> **Tip**: Untuk kembali ke mode demo cepat tanpa Xendit saat pengembangan lokal, cukup ubah `PAYMENT_PROVIDER="MOCK"` dan `ENABLE_PAYMENT_SIMULATION="true"` di `.env` lokal.

---

## 4. Langkah 3 — Go-Live ke Xendit Production (Live Mode)

Setelah akun bisnis Anda disetujui Xendit (toggle **Live Mode** aktif):

1. Di Dashboard Xendit, pindahkan toggle ke **Live Mode**.
2. Buat **Live Secret API Key** (`Settings → Developers → API Keys`) dengan izin **Money-In → Write**. Key diawali `xnd_production_...`.
3. Buka **Settings → Developers → Webhooks** (di Live Mode):
   - Salin **Live Webhook Verification Token** (berbeda dari token Sandbox!).
   - Daftarkan URL Production Anda:
     ```
     https://domain-production-anda.com/api/payments/webhooks/xendit
     ```
   - Aktifkan event: `payment.capture`, `payment.failure`, `payment_request.expiry`, `refund.succeeded`, `refund.failed`.
   - Klik **Test and Save** untuk memastikan server FoodQueue merespons dengan benar.
4. Set Environment Variables berikut di platform hosting Anda (**Vercel / Railway / VPS / Cloud Run**):
   ```env
   NODE_ENV="production"
   NEXT_PUBLIC_APP_URL="https://domain-production-anda.com"

   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   JWT_SECRET="<random-minimal-64-karakter-kuat>"

   PAYMENT_PROVIDER="XENDIT"
   XENDIT_SECRET_KEY="xnd_production_xxxxxxxxxxxxxxxxxxxxxxxx"
   XENDIT_WEBHOOK_TOKEN="<live-webhook-verification-token>"
   XENDIT_API_BASE_URL="https://api.xendit.co"
   XENDIT_API_VERSION="2024-11-11"
   ENABLE_PAYMENT_SIMULATION="false"

   CRON_SECRET="<random-secret-minimal-32-karakter>"
   ```
5. Jalankan migrasi skema database pada database production:
   ```bash
   npx prisma db push
   ```
6. Buka halaman **Admin → Pengaturan (`/admin/settings`)** dan pastikan panel **Status Payment Gateway** menampilkan:
   - Provider Aktif: **`XENDIT`**
   - Mode Environment: **`PRODUCTION`**
   - Webhook Token: **`Terkonfigurasi`**
   - Proteksi Simulasi: **`Terkunci (Production Safe)`**

---

## 5. Langkah 4 — Jadwalkan Cron Auto-Expire Pesanan

Agar pesanan yang tidak dibayar dalam 15 menit otomatis dibatalkan, stok menu dikembalikan, slot pickup dilepas, dan charge Xendit dibatalkan, jadwalkan pemanggilan endpoint:

```
GET https://domain-production-anda.com/api/cron/expire-orders
Header: Authorization: Bearer <CRON_SECRET>
```

### Opsi A: GitHub Actions (Gratis, tiap 5 menit)
Tambahkan workflow `.github/workflows/expire-orders.yml` di repo Anda:
```yaml
name: Expire Unpaid FoodQueue Orders
on:
  schedule:
    - cron: '*/5 * * * *'
jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger expire-orders endpoint
        run: |
          curl -fsS -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.APP_URL }}/api/cron/expire-orders"
```

### Opsi B: Cron Job Server / Cloud Scheduler / cron-job.org
Jadwalkan HTTP GET setiap 5 menit ke `/api/cron/expire-orders` dengan header `Authorization: Bearer <CRON_SECRET>`.

---

## 6. Checklist Pre-Flight Sebelum Launch

- [ ] `JWT_SECRET` sudah diganti dari nilai default menjadi string acak ≥ 64 karakter.
- [ ] Akun demo seed (`Admin123!`, `Tenant123!`, `User123!`) sudah dihapus atau diganti password-nya di database production.
- [ ] `NEXT_PUBLIC_APP_URL` menggunakan `https://` domain asli (bukan `localhost`).
- [ ] `XENDIT_SECRET_KEY` diawali `xnd_production_...` dan `XENDIT_WEBHOOK_TOKEN` berasal dari **Live Mode**.
- [ ] Sudah melakukan **1 transaksi uji coba asli nominal kecil** (misal Rp 1.000 via QRIS) untuk memverifikasi webhook → status `PAID` → notifikasi masuk ke Tenant → QR Pickup terbit.
- [ ] Cron `/api/cron/expire-orders` sudah berjalan dan dilindungi `CRON_SECRET`.
