# FoodQueue — Arsitektur Sistem & Spesifikasi Database

Dokumen ini menjelaskan arsitektur perangkat lunak, rancangan basis data relasional, mekanisme keamanan, dan strategi penanganan konkurensi pada platform **FoodQueue**.

---

## 1. Arsitektur Perangkat Lunak (Layered Clean Architecture)

FoodQueue dibangun mengikuti prinsip **Separation of Concerns (SoC)** dan **Domain-Driven Design (DDD)** yang memisahkan logika bisnis murni dari kerangka kerja (framework) web:

```
┌─────────────────────────────────────────────────────────────┐
│                 Presentation Layer (Next.js 16)             │
│   App Router Pages, Vanilla CSS Design System, UI Contexts  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP Request / Response
┌──────────────────────────────▼──────────────────────────────┐
│                  API Route Handlers (HTTP Layer)            │
│   src/app/api/* - Request Validation (Zod), AuthGuard (JWT) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Service Layer                │
│   OrderService, PickupSlotService, CartService, PaymentSvc  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Pure Domain Layer (Zero Framework)         │
│   OrderStateMachine, PricingEngine, SlotPolicy, Domain Types│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Persistence Layer (Data Access)              │
│   Prisma ORM Client -> PostgreSQL Database (Cloud Neon)    │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 Keunggulan Pendekatan Domain Murni
- **Independent of Framework**: Berkas `src/server/domain/` tidak mengimpor modul Next.js, Prisma, atau Express. Logika state transition, kalkulasi diskon/fee, dan evaluasi kuota slot diuji secara independen menggunakan **Vitest** dengan eksekusi milidetik.
- **Academic Defensibility**: Struktur ini mempermudah pengujian unit murni tanpa membutuhkan database mock yang rumit saat demonstrasi sidang skripsi.

---

## 2. Struktur Basis Data Relasional (Entity Relationship)

Database dirancang dengan **19 model tabel relasional** ternormalisasi (3NF) di atas PostgreSQL:

| Model Tabel | Tujuan & Tanggung Jawab | Kunci Unik / Indeks Utama |
| :--- | :--- | :--- |
| `users` | Akun pengguna (Customer, Tenant Owner, Admin) | `email (unique)`, `[role, status]` |
| `venues` | Lokasi fisik food court / kampus | `id (PK)` |
| `tenant_categories` | Klasifikasi kategori stand kantin (Makanan, Minuman, Kopi, dsb.) | `name (unique)`, `slug (unique)` |
| `tenants` | Profil stand makanan UMKM mitra | `slug (unique)`, `[status, location]`, `[tenantCategoryId]` |
| `tenant_operating_hours` | Jam buka harian (0 = Minggu s/d 6 = Sabtu) | `[tenantId, dayOfWeek] (composite unique)` |
| `categories` | Taksonomi menu makanan & minuman per stan | `name (unique)`, `slug (unique)` |
| `menus` | Katalog hidangan, harga, waktu masak, dan sisa stok porsi | `[tenantId, status]`, `[categoryId]` |
| `carts` | Keranjang belanja pengguna terdaftar | `userId (unique)` |
| `cart_items` | Rincian menu dalam keranjang | `[cartId, menuId] (composite unique)` |
| `pickup_slots` | Jendela waktu pengambilan 15 menit | `[tenantId, startAt] (composite unique)`, `[tenantId, date]` |
| `orders` | Header transaksi pre-order & scheduled pickup (Guest & Member) | `orderNumber (unique)`, `pickupCode (unique)`, `guestToken (unique)`, `idempotencyKey (unique)`, `[guestPhone]` |
| `order_items` | Snapshot menu, harga historis, dan jumlah porsi | `[orderId, menuId]` |
| `payments` | Header pembayaran (QRIS, VA, E-Wallet) | `orderId (unique)`, `transactionReference (unique)` |
| `payment_attempts` | Jejak audit riwayat percobaan pembayaran | `[paymentId, createdAt]` |
| `order_status_logs` | Jejak audit histori perubahan status pesanan | `[orderId, createdAt]` |
| `notifications` | Notifikasi in-app untuk pembaruan status | `[userId, readAt, createdAt]` |
| `reviews` | Rating (1-5) dan testimoni pelanggan | `orderId (unique)`, `[tenantId, createdAt]` |
| `system_settings` | Parameter operasional platform global | `key (PK)` |
| `order_counters` | Generator nomor pesanan sekuensial per tahun | `year (PK)` |

---

## 3. Penanganan Konkurensi & Race Conditions

Tantangan utama sistem pre-order adalah **overselling stok** dan **overbooking kuota slot waktu**. Jika 10 mahasiswa menekan checkout pada milidetik yang sama ketika kuota slot hanya tersisa 1, sistem harus menjamin hanya 1 pesanan yang berhasil.

FoodQueue mengimplementasikan **Atomic Conditional SQL Updates** di dalam `prisma.$transaction`:

### 3.1 Pemesanan Kuota Slot yang Aman (Thread-Safe Slot Booking)
```typescript
const updatedCount = await tx.$executeRaw`
  UPDATE "pickup_slots"
  SET "current_orders" = "current_orders" + 1
  WHERE "id" = ${slotId}
    AND "status" = 'OPEN'
    AND "current_orders" < "capacity"
`;

if (updatedCount === 0) {
  throw new Error('SLOT_FULL: Waktu pengambilan yang Anda pilih sudah penuh. Silakan pilih waktu lain.');
}
```

### 3.2 Reservasi Stok Porsi Menu (Atomic Stock Reservation)
```typescript
const updatedRows = await tx.$executeRaw`
  UPDATE "menus"
  SET "stock" = "stock" - ${item.quantity}
  WHERE "id" = ${item.menuId}
    AND "status" = 'AVAILABLE'
    AND "stock" >= ${item.quantity}
`;

if (updatedRows === 0) {
  throw new Error(`MENU_OUT_OF_STOCK: Stok ${item.name} tidak mencukupi untuk jumlah yang dipesan.`);
}
```

### 3.3 Idempotency Key
Setiap permintaan checkout membawa `idempotencyKey` acak (RFC 4122 UUID v4) yang disimpan di tabel `orders` dengan constraint unik global `idempotencyKey (unique)`. Jika terjadi koneksi jaringan tidak stabil dan pengguna menekan tombol checkout berkali-kali, pesanan ganda dicegah pada level basis data.

---

## 4. Keamanan & Autentikasi (Security Architecture)

1. **Password Hashing**: Kata sandi pengelola di-hash menggunakan algoritma **Bcrypt** dengan salt round 10.
2. **Stateless JWT with State Revocation**:
   - Token ditandatangani menggunakan pustaka `jose` (HS256) dengan masa berlaku 7 hari.
   - Disimpan di dalam cookie `fq_session` bertipe `httpOnly`, `sameSite=lax`, dan `secure` pada production.
   - Dilengkapi atribut `sessionVersion`. Saat pengguna keluar atau admin melakukan suspend, kolom `sessionVersion` pada tabel `users` di-increment, sehingga seluruh token lama yang beredar langsung tidak valid.
3. **Pencegahan Insecure Direct Object References (IDOR)**:
   - Endpoint portal merchant (`/api/tenant/*`) mengekstrak `tenantId` langsung dari JWT sesi terotentikasi, bukan dari URL parameter yang dapat dimanipulasi klien.
   - **Otorisasi Tamu (Guest Secret Token)**: Pesanan tamu dilindungi oleh `guestToken` (UUID v4) kriptografis. Endpoint pelacakan individu (`/orders/[id]?token=...`) dan kueri daftar pesanan (`/api/orders?guestOrderIds=...&guestTokens=...`) memvalidasi pencocokan berpasangan ketat 1-to-1 (`id`, `guestToken`). Permintaan tanpa token tamu yang sah ditolak secara mutlak untuk mencegah penyerang menebak nomor pesanan orang lain.
4. **Validasi Input Ketat**:
   - Seluruh payload request divalidasi menggunakan skema **Zod** sebelum mencapai layer service, termasuk regex format jam operasional `^([01]\d|2[0-3]):([0-5]\d)$` dan verifikasi logis `closeTime > openTime`.
5. **Pencegahan Efek Samping Tulis pada GET (Throttled Expiration & Dedicated Cron)**:
   - Pembersihan pesanan kedaluwarsa dibatasi oleh in-memory throttle maksimal 1 kali per 60 detik pada endpoint GET untuk mencegah lonjakan konkurensi (database lock contention).
   - Tersedia endpoint dedikasi `/api/cron/expire-orders` dengan pengamanan `CRON_SECRET` yang dapat dipicu secara berkala oleh Vercel Cron atau GitHub Actions.

---

## 5. Arsitektur Pemesanan Langsung Tanpa Login (Direct Guest Checkout)

Dalam rancangan sistem mutakhir, sistem login bagi pembeli tidak lagi menjadi prasyarat untuk bertransaksi:
1. **Client-Side Cart Engine**: Keranjang belanja beroperasi di browser melalui `localStorage` (`foodqueue_guest_cart`) dengan validasi otomatis aturan bisnis BR-05 (satu pesanan hanya boleh berasal dari satu tenant).
2. **Seamless Biodata Capture**: Pembeli hanya perlu memasukkan Nama Lengkap dan Nomor WhatsApp saat checkout. Data tersimpan di browser (`foodqueue_guest_info`) untuk digunakan kembali secara otomatis pada pesanan berikutnya.
3. **Portal Pengelola Terisolasi**: Halaman login (`/login`) didedikasikan secara terfokus bagi pemilik stan (Tenant) dan Administrator untuk mengelola operasional kantin.
4. **Dual-Query Order Tracking**: Endpoint `/api/orders` mendukung pemuatan pesanan terpadu baik untuk pesanan berotentikasi maupun pesanan tamu melalui agregasi berpasangan `(id, guestToken)` yang kebal terhadap manipulasi IDOR.
