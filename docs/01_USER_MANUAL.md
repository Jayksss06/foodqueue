# FoodQueue — Panduan Pengguna (User Manual)

Dokumen ini merupakan panduan operasional komprehensif bagi tiga kelompok pengguna utama platform FoodQueue: **Pelanggan (Mahasiswa/Sivitas Akademika)**, **Pedagang Kantin (Tenant/Merchant)**, dan **Pengelola Sistem (Administrator)**.

---

## 1. Panduan Mahasiswa / Pelanggan (Customer)

### 1.1 Registrasi & Masuk ke Akun
1. Buka URL FoodQueue melalui browser HP atau laptop (`http://localhost:3000`).
2. Klik tombol **Masuk** di pojok kanan atas.
3. Untuk keperluan uji coba instan / demo, gunakan tombol **1-Click Demo Login** yang tersedia di halaman login (misal: *Customer: Rina*).
4. Untuk mendaftar akun baru, klik tab **Daftar Akun Baru**, isi Nama Lengkap, Email, Nomor WhatsApp, dan Kata Sandi.

### 1.2 Menjelajahi Menu & Stand Makanan
1. Buka menu **Daftar Stand** atau pilih kategori hidangan di beranda.
2. Setiap stand menampilkan lokasi di food court (misal: *Stand A-03, Lantai 2*), estimasi waktu masak, dan rating kepuasan.
3. Klik hidangan yang diinginkan untuk menambahkan catatan khusus (misal: *"Tidak pakai cabai, saus dipisah"*), lalu klik **Tambah ke Keranjang**.

### 1.3 Memilih Slot Waktu Pengambilan (Scheduled Pickup)
1. Buka halaman **Keranjang Belanja** (`/cart`) dan periksa item pesanan.
2. Klik tombol **Lanjut ke Pemilihan Slot**.
3. Di halaman **Checkout** (`/checkout`):
   - Sistem akan menampilkan tanggal hari ini dan besok.
   - Pilih jendela waktu pengambilan (misal: `12:00 - 12:15`).
   - Slot yang telah penuh kuotanya akan otomatis dinonaktifkan (berlabel *PENUH*).
   - Slot yang terlalu mepet dengan waktu saat ini (kurang dari estimasi waktu masak dapur) akan dinonaktifkan secara otomatis untuk mencegah keterlambatan.
4. Klik tombol **Buat Pesanan & Bayar**.

### 1.4 Melakukan Pembayaran Nontunai (Cashless)
1. Setelah checkout, sistem mengunci stok dan slot selama **15 menit** (*Batas Waktu Pembayaran*).
2. Di halaman pembayaran (`/orders/[id]/pay`):
   - Pilih metode: **QRIS**, **Virtual Account**, atau **E-Wallet**.
   - Untuk demonstrasi akademik, klik tombol **Simulasi Bayar Berhasil (Instant Success)**.
3. Pesanan akan otomatis berubah status menjadi `PAID` dan langsung diteruskan ke tablet/HP dapur tenant.

### 1.5 Pengambilan Makanan di Stand
1. Buka menu **Pesanan Saya** (`/orders`) dan pilih pesanan yang aktif.
2. Pantau timeline: `Diterima Tenant` ➔ `Sedang Dimasak` ➔ `Siap Diambil`.
3. Saat status menjadi **READY_FOR_PICKUP (Siap Diambil)**:
   - Aplikasi akan menampilkan **QR Code Dinamis** dan **Kode Pengambilan 6 Karakter** (misal: `7K9X2B`).
4. Datang ke stand tenant sesuai jadwal, tunjukkan QR Code di layar HP ke kasir/pedagang untuk dipindai.
5. Terima makanan tanpa perlu antre di loket pemesanan!
6. Setelah selesai, berikan bintang dan ulasan ulasan rasa serta ketepatan waktu.

---

## 2. Panduan Pedagang Kantin (Tenant / Merchant)

### 2.1 Akses Merchant Portal
1. Masuk menggunakan akun tenant (atau gunakan demo login: *Tenant: Warung Bu Sari*).
2. Dari menu atas, klik **Portal Merchant** untuk masuk ke Dashboard Operasional (`/tenant`).

### 2.2 Memantau Timeline Dapur & Batch Masak (SDG 12)
1. Halaman **Dashboard Operasional** menyinkronkan data dapur setiap 15 detik secara real-time.
2. **Kartu Batch Masak Dapur**: Menampilkan total agregat porsi yang harus disiapkan (misal: *8 porsi Nasi Ayam Bakar, 4 porsi Es Jeruk*). Pedagang dapat memasak sekaligus sesuai batch slot tanpa membuang-buang bahan makanan.
3. **Papan Slot Waktu (Slot Board)**: Menampilkan antrean pesanan yang dikelompokkan per 15 menit.

### 2.3 Memperbarui Status Pesanan
1. Untuk pesanan yang berstatus `PAID`, klik tombol **Mulai Masak** ➔ Status berubah menjadi `PREPARING`.
2. Saat hidangan selesai dikemas, klik tombol **Pesanan Siap Diambil** ➔ Status berubah menjadi `READY_FOR_PICKUP`.
3. Pelanggan akan menerima notifikasi otomatis bahwa makanan siap diambil di stand.

### 2.4 Verifikasi Serah Terima Makanan (Scan Pickup)
1. Buka menu **Scan Pickup** (`/tenant/scan`).
2. Masukkan 6 karakter kode pengambilan manual yang ditunjukkan mahasiswa atau scan QR code pembeli.
3. Klik **Verifikasi & Serahkan**.
4. Sistem akan memvalidasi kepemilikan pesanan dan mengubah status menjadi `COMPLETED` seketika.

### 2.5 Mengelola Menu & Stok Harian
1. Buka menu **Kelola Menu** (`/tenant/menus`).
2. Tambahkan hidangan baru dengan mengisi nama, kategori, harga, waktu masak, dan stok harian.
3. Jika menu habis mendadak di tengah hari, klik tombol cepat **Tandai Stok Habis (Out of Stock)** untuk menghentikan pesanan menu tersebut secara instan.

### 2.6 Mengatur Kapasitas Slot & Jam Buka Stand
1. Buka menu **Slot Pickup** (`/tenant/slots`):
   - Pedagang dapat menaikkan/menurunkan kuota pesanan per 15 menit menggunakan tombol `+` / `-`.
   - Tombol **Tutup Slot (Emergency Lock)** dapat digunakan jika dapur sedang mengalami lonjakan antrean.
2. Buka menu **Pengaturan Toko** (`/tenant/settings`):
   - Atur jam buka/tutup Senin s/d Minggu serta lokasi stand di food court.

---

## 3. Panduan Administrator Sistem (Admin)

### 3.1 Pusat Kendali Platform
1. Masuk menggunakan akun admin (demo: *Admin: Administrator*).
2. Halaman **Dashboard Utama** (`/admin`) menyajikan ringkasan Gross Merchandise Value (GMV), total pesanan kampus, tenant terpopuler, dan status transaksi.

### 3.2 SDG Impact Dashboard
1. Buka menu **SDG Impact** (`/admin/impact`).
2. Halaman ini menyajikan metrik dampak terukur untuk presentasi akademik:
   - **SDG 11**: Tingkat penurunan kepadatan antrean dan utilisasi slot berjadwal.
   - **SDG 12**: Estimasi efisiensi bahan dan pencegahan limbah makanan (Food Waste Reduction).
   - **SDG 8**: Jumlah UMKM mikro yang terdigitalisasi dan volume transaksi nontunai.

### 3.3 Verifikasi Pendaftaran Tenant Baru
1. Buka menu **Kelola Tenant** (`/admin/tenants`).
2. Filter tab **Perlu Verifikasi (PENDING_VERIFICATION)**.
3. Tinjau lokasi stand dan profil pemilik. Klik **Setujui** untuk mengaktifkan stand di katalog publik atau **Tolak** jika tidak memenuhi syarat.

### 3.4 Manajemen Pengguna & Penangguhan Akun
1. Buka menu **Kelola Pengguna** (`/admin/users`).
2. Admin dapat memfilter pengguna berdasarkan peran (`CUSTOMER`, `TENANT`, `ADMIN`).
3. Tombol **Suspend** akan menonaktifkan akun pelanggar dan otomatis membatalkan token otentikasi aktif (`sessionVersion` revocation).

### 3.5 Konfigurasi Biaya & Parameter Sistem
1. Buka menu **Pengaturan Sistem** (`/admin/settings`).
2. Atur besaran biaya layanan platform (default: Rp 1.000), batas waktu kedaluwarsa bayar (TTL), dan sakelar simulator pembayaran mock.
