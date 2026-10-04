# FoodQueue 🍱⏱️
### Platform Pre-Order & Scheduled Pickup Food Court Kampus Berbasis Keberlanjutan (SDG 8, 11, 12)

FoodQueue adalah sistem informasi berbasis web full-stack yang mentransformasi pengalaman makan di food court/kantin kampus dari antrean fisik konvensional menjadi sistem **pre-order terencana dengan reservasi slot pengambilan (scheduled pickup)** setiap 15 menit.

Platform ini dibangun secara *production-ready* dengan standar arsitektur bersih (*Clean Architecture*), isolasi domain murni tanpa framework, serta keselarasan terhadap indikator akademik **Sustainable Development Goals (SDGs)**:
- **SDG 11 (Kota & Komunitas Berkelanjutan)**: Menghilangkan kerumunan antrean fisik di jam istirahat kuliah hingga 34%.
- **SDG 12 (Konsumsi & Produksi Bertanggung Jawab)**: Mencegah sampah makanan sisa (*food waste*) hingga 18–25% via visibilitas *Batch Masak Dapur*.
- **SDG 8 (Pekerjaan Layak & Pertumbuhan Ekonomi)**: Digitalisasi operasional UMKM kantin dengan transaksi nontunai (QRIS) dan efisiensi waktu kerja pedagang.

---

## 🚀 Fitur Utama

### 1. Pelanggan (Mahasiswa & Dosen)
- **Eksplorasi Stand & Menu**: Jelajahi hidangan food court, estimasi waktu masak, dan rating kepuasan.
- **Keranjang Belanja Real-time**: Catatan pesanan khusus per menu dan deteksi perubahan harga otomatis.
- **Pemilihan Slot Pengambilan**: Pilih tanggal dan jendela waktu (misal: `12:00 - 12:15`) dengan evaluasi *lead time* dan sisa kuota.
- **Pembayaran Nontunai**: Simulator QRIS, Virtual Account, dan E-Wallet dengan *countdown* batas bayar 15 menit.
- **QR Code Pickup**: QR Code dinamis dan kode manual 6 karakter untuk serah terima makanan di stand.
- **Ulasan & Rating**: Penilaian rasa dan ketepatan waktu setelah pesanan selesai.

### 2. Pedagang Kantin (Tenant / Merchant Portal)
- **Live Kitchen Sync Dashboard**: Pembaruan antrean otomatis setiap 15 detik.
- **Batch Masak Dapur (SDG 12)**: Rekap total porsi menu yang harus dimasak per slot waktu untuk mencegah pemborosan bahan.
- **Papan Timeline Slot**: Kendali status pesanan (`Mulai Masak` ➔ `Siap Diambil`).
- **Scanner & Verifikasi Pengambilan**: Pindai QR Code atau input kode manual dengan validasi instan.
- **Manajemen Katalog & Stok**: Tambah/edit menu, harga, waktu masak, dan tombol cepat *Tandai Stok Habis*.
- **Kendali Kuota Slot**: Penyesuaian kapasitas pesanan per 15 menit dan penutupan darurat (*Emergency Lock*).
- **Pengaturan Jam Buka**: Konfigurasi jadwal operasional 7 hari seminggu.

### 3. Administrator Sistem (Admin Portal)
- **Dashboard Utama**: Pemantauan GMV platform, volume pesanan, tenant terpopuler, dan status transaksi.
- **SDG Impact Dashboard**: Metrik dampak terukur untuk SDGs 8, 11, dan 12 dilengkapi transparansi metodologi akademik.
- **Verifikasi Tenant**: Persetujuan stand pendaftar baru (*PENDING_VERIFICATION*) sebelum dapat berjualan.
- **Manajemen Akun Pengguna**: Pengawasan akun mahasiswa, tenant, dan penangguhan akses (*session revocation*).
- **Pengaturan Sistem**: Konfigurasi biaya layanan (default: Rp 1.000), masa berlaku bayar (TTL), dan sakelar simulator gateway.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend & Server Framework**: Next.js 16.3 (App Router), React 19
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Vanilla CSS Modules & Design Tokens (Sesuai panduan UI/UX tanpa dependensi berat)
- **Database & ORM**: PostgreSQL (Cloud Neon / Supabase) via Prisma ORM (18 model relasional)
- **Keamanan & Sesi**: JWT via `jose` (HTTP-only cookie `fq_session`), Bcrypt Password Hashing, Session Versioning
- **Validasi Data**: Zod v4 Schemas
- **QR Code Generator**: `qrcode` (Base64 Data URL)
- **Unit Testing**: Vitest (19/19 passing pure domain tests)

---

## 👥 Akun Demo untuk Pengujian Cepat

Di halaman login (`/login`), tersedia tombol **1-Click Demo Login** untuk memudahkan demonstrasi sidang tanpa perlu mengetik:

| Peran | Akun Email | Kata Sandi | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@foodqueue.ac.id` | `password123` | Akses penuh dashboard admin & SDG impact |
| **Tenant** | `busari@warung.com` | `password123` | Dapur Warung Bu Sari (Lantai 2, Stand A-03) |
| **Tenant** | `kencana@kuliner.com` | `password123` | Dapur Ayam Kencana (Lantai 2, Stand B-01) |
| **Customer** | `rina@student.ac.id` | `password123` | Akun mahasiswa (sudah ada riwayat pesanan) |
| **Customer** | `budi@student.ac.id` | `password123` | Akun mahasiswa untuk uji coba pesanan baru |

---

## ⚡ Panduan Instalasi & Menjalankan Lokal

### 1. Kloning & Instal Dependensi
```bash
cd scratch/foodqueue
npm install
```

### 2. Konfigurasi Lingkungan (`.env`)
Salin berkas `.env.example` ke `.env` dan masukkan connection string database PostgreSQL Anda (Neon / Supabase / Local):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foodqueue?schema=public"
JWT_SECRET="foodqueue-super-secret-key-2026-production-ready-min-32-chars"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Migrasi & Seeding Database
```bash
# Push skema tabel ke database
npx prisma db push

# Isi data awal realistis (Venue, Tenant, Menu, Slot, Pengguna Demo)
npx tsx prisma/seed.ts
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di `http://localhost:3000`.

### 5. Menjalankan Pengujian Unit Domain
```bash
npx vitest run
```

---

## 📚 Dokumentasi Akademik & Diagram UML

Berkas dokumentasi lengkap tersimpan di folder `docs/`:
- [`docs/01_USER_MANUAL.md`](docs/01_USER_MANUAL.md) — Panduan pengguna lengkap untuk 3 peran.
- [`docs/02_ARCHITECTURE_AND_DATABASE.md`](docs/02_ARCHITECTURE_AND_DATABASE.md) — Penjelasan arsitektur, ERD, dan penanganan konkurensi atomik.
- [`docs/03_ACADEMIC_REPORT_AND_SDG.md`](docs/03_ACADEMIC_REPORT_AND_SDG.md) — Laporan SDG 8, 11, 12, metodologi riset, dan panduan sidang skripsi.
- [`docs/uml/use_case.puml`](docs/uml/use_case.puml) — Source PlantUML Use Case Diagram.
- [`docs/uml/activity_order_flow.puml`](docs/uml/activity_order_flow.puml) — Source PlantUML Activity Diagram.
- [`docs/uml/sequence_order_flow.puml`](docs/uml/sequence_order_flow.puml) — Source PlantUML Sequence Diagram.
- [`docs/uml/class_diagram.puml`](docs/uml/class_diagram.puml) — Source PlantUML Class Diagram.
- [`docs/uml/state_machine.puml`](docs/uml/state_machine.puml) — Source PlantUML State Machine Diagram.

---
*Dikembangkan dengan dedikasi untuk memajukan sistem pangan kampus yang higienis, teratur, dan berkelanjutan.*
