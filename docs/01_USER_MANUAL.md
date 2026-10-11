# FoodQueue — Panduan Pengguna (User Manual)

Dokumen ini merupakan panduan operasional komprehensif bagi tiga kelompok pengguna utama platform FoodQueue: **Pelanggan (Mahasiswa/Sivitas Akademika)**, **Pedagang Kantin (Tenant/Merchant)**, dan **Pengelola Sistem (Administrator)**.

---

## 1. Panduan Mahasiswa / Pelanggan (Customer)

### 1.1 Pemesanan Instan Tanpa Registrasi (Guest-First Paradigm)
1. Buka URL FoodQueue melalui browser ponsel pintar atau komputer (`http://localhost:3000` atau `/tenants`).
2. Platform menerapkan arsitektur **Zero-Registration**: pelanggan tidak diwajibkan membuat akun atau mengingat kata sandi untuk memesan makanan di kantin.
3. Keranjang belanja, token keamanan pesanan (`guestToken`), dan data biodata tersimpan secara aman di penyimpanan lokal peramban (`localStorage`).
4. Pada saat proses checkout, pelanggan cukup mengisi Nama Lengkap dan Nomor WhatsApp aktif satu kali. Informasi ini disimpan di peramban untuk pengisian otomatis pada pesanan berikutnya.
5. Pelanggan yang telah memiliki akun terdaftar tetap dapat masuk melalui halaman login (`/login`) jika diperlukan.

### 1.2 Menjelajahi Menu & Stand Makanan (Katalog Terpadu & Filter Kategori)
1. Halaman utama langsung menampilkan katalog seluruh stand kantin yang sedang beroperasi beserta status buka/tutup, lokasi meja/lantai di food court, estimasi waktu penyajian, dan rating kepuasan.
2. Gunakan tombol **Filter Kategori** (misal: Semua, Makanan Berat, Minuman Segar, Cemilan, Aneka Kopi, Paket Hemat) untuk menyortir stand makanan yang relevan dengan cepat.
3. Klik pada stand pilihan untuk membuka katalog menu.
4. Pada peramban ponsel pintar (mobile browser), hidangan disajikan dalam format **grid 2 kolom responsif** sehingga pelanggan dapat meninjau variasi hidangan dengan scrolling minimal.
5. Klik kartu menu untuk menambahkan catatan khusus (misal: "Tidak pakai sambal", "Gula sedikit"), lalu klik **Tambah ke Keranjang**.
6. Bilah keranjang mengambang (floating cart bar) di bagian bawah layar akan memperbarui ringkasan item, estimasi durasi persiapan dapur, dan menyediakan tombol pintas **Lanjut Checkout**.

### 1.3 Memilih Slot Waktu Pengambilan (Scheduled Pickup)
1. Buka halaman **Checkout** (`/checkout`) melalui tombol keranjang.
2. Di bagian pemilihan jadwal:
   - Sistem menampilkan tanggal hari ini dan hari berikutnya.
   - Pilih jendela waktu pengambilan berinterval 15 menit (misal: `12:00 - 12:15`).
   - Slot yang telah mencapai batas kapasitas maksimal akan dinonaktifkan secara otomatis (berlabel PENUH).
   - Slot yang berjarak terlalu dekat dengan waktu saat ini (kurang dari durasi memasak dapur) dinonaktifkan secara preventif guna mencegah keterlambatan penyajian.
3. Masukkan nama dan nomor kontak WhatsApp pemesan, lalu klik **Buat Pesanan & Bayar**.

### 1.4 Melakukan Pembayaran Nontunai & Simulasi Pengujian
1. Setelah pesanan dibuat, sistem mencadangkan stok porsi dan kuota slot waktu selama **15 menit** (masa berlaku pembayaran).
2. Di halaman pembayaran (`/orders/[id]/pay`):
   - Pelanggan dapat memilih saluran pembayaran: **QRIS**, **Virtual Account**, atau **E-Wallet**.
   - Untuk keperluan verifikasi akademik dan pengujian alur fungsional, tersedia tombol **Simulasi Bayar Berhasil (Instant Success)**.
3. Begitu pembayaran berhasil, status pesanan diperbarui menjadi `PAID` dan diteruskan secara instan ke portal antrean dapur stand.

### 1.5 Pengambilan Makanan di Stand & Pelacakan Status
1. Buka halaman pelacakan pesanan (`/orders/[id]`) atau daftar riwayat pesanan (`/orders`).
2. Pantau tahapan pesanan secara berkala: `Diterima Tenant` -> `Sedang Dimasak` -> `Siap Diambil` -> `Selesai`.
3. Untuk memfasilitasi pengujian interaktif menyeluruh dari sisi pengguna, tersedia tombol simulator transisi status pada antarmuka pelacakan:
   - **Simulasikan: Diterima Tenant** -> Mengubah status menjadi `ACCEPTED`.
   - **Simulasikan: Mulai Masak** -> Mengubah status menjadi `PREPARING`.
   - **Simulasikan: Siap Diambil** -> Mengubah status menjadi `READY_FOR_PICKUP`.
   - **Simulasikan: Selesai Diambil** -> Menyelesaikan pesanan menjadi `COMPLETED`.
4. Saat status mencapai **READY_FOR_PICKUP (Siap Diambil)**:
   - Sistem menampilkan **QR Code Pengambilan Dinamis** dan **Kode Pengambilan 6 Karakter** unik (misal: `7K9X2B`).
5. Pelanggan mendatangi stand kantin sesuai jadwal slot, menunjukkan QR Code atau kode 6 karakter ke kasir tanpa perlu mengantre dari awal.
6. Setelah makanan diterima, pelanggan dapat memberikan bintang dan ulasan kepuasan.

---

## 2. Panduan Pedagang Kantin (Tenant / Merchant)

### 2.1 Akses Merchant Portal
1. Masuk menggunakan akun pengelola stand melalui `/login` (tersedia akun demo: Tenant Warung Bu Sari).
2. Dari menu navigasi, pilih **Portal Merchant** untuk masuk ke Dashboard Operasional (`/tenant`).

### 2.2 Memantau Timeline Dapur & Batch Masak (SDG 12)
1. Dashboard Operasional melakukan sinkronisasi data dapur secara berkala.
2. **Kartu Batch Masak Dapur**: Mengelompokkan total agregat porsi per menu yang harus dimasak dalam interval slot yang sama (misal: 8 porsi Nasi Goreng, 4 porsi Es Teh). Pedagang dapat memproduksi secara serentak sehingga menghemat bahan baku dan energi.
3. **Papan Slot Waktu (Slot Board)**: Menampilkan antrean pesanan yang dikelompokkan per jendela 15 menit.

### 2.3 Memperbarui Status Pesanan
1. Untuk pesanan berstatus `PAID`, pedagang menekan tombol **Mulai Masak** -> Status berubah menjadi `PREPARING`.
2. Setelah hidangan selesai dikemas, pedagang menekan tombol **Pesanan Siap Diambil** -> Status berubah menjadi `READY_FOR_PICKUP`.
3. Notifikasi sistem dikirimkan kepada pemesan bahwa makanan telah siap di konter.

### 2.4 Verifikasi Serah Terima Makanan (Scan Pickup)
1. Buka menu **Scan Pickup** (`/tenant/scan`).
2. Masukkan 6 karakter kode pengambilan yang ditunjukkan mahasiswa atau pindai QR Code pembeli.
3. Klik **Verifikasi & Serahkan**.
4. Sistem memvalidasi keabsahan pesanan dan mengubah status menjadi `COMPLETED` secara seketika.

### 2.5 Mengelola Menu & Stok Harian
1. Buka menu **Kelola Menu** (`/tenant/menus`).
2. Daftarkan hidangan baru dengan melengkapi nama, kategori, harga, durasi persiapan, dan kuota stok harian.
3. Jika persediaan bahan menipis sebelum jam tutup, klik tombol cepat **Tandai Stok Habis (Out of Stock)** untuk memblokir pesanan baru secara langsung.

### 2.6 Mengatur Kapasitas Slot & Jam Buka Stand
1. Buka menu **Slot Pickup** (`/tenant/slots`):
   - Atur kuota maksimal pesanan per 15 menit dengan tombol kontrol kuota.
   - Tombol **Kunci Slot Darurat** dapat diaktifkan jika dapur mengalami penumpukan antrean mendadak.
2. Buka menu **Pengaturan Toko** (`/tenant/settings`):
   - Kelola jam buka dan tutup operasional untuk setiap hari dalam sepekan serta lokasi stand fisik di kantin.

---

## 3. Panduan Administrator Sistem (Admin)

### 3.1 Pusat Kendali Platform
1. Masuk menggunakan akun administrator via `/login` (tersedia akun demo: Admin Administrator).
2. Halaman **Dashboard Utama** (`/admin`) merangkum Gross Merchandise Value (GMV), volume pesanan seluruh kampus, stand terpopuler, dan status transaksi berjalan.

### 3.2 SDG Impact Dashboard
1. Buka menu **SDG Impact** (`/admin/impact`).
2. Menu ini menyajikan visualisasi indikator dampak lingkungan dan sosial:
   - **SDG 11**: Tingkat dekonstriksi antrean fisik dan utilisasi slot waktu terjadwal.
   - **SDG 12**: Estimasi efisiensi bahan pangan dan pencegahan limbah sisa makanan (Food Waste Prevention).
   - **SDG 8**: Jumlah UMKM kantin binaan yang terdigitalisasi dan volume transaksi nontunai.

### 3.3 Verifikasi Pendaftaran Tenant Baru
1. Buka menu **Kelola Tenant** (`/admin/tenants`).
2. Pilih tab penyaringan **Perlu Verifikasi (PENDING_VERIFICATION)**.
3. Tinjau legalitas dan lokasi stand pemohon. Klik **Setujui** untuk mempublikasikan stand pada katalog atau **Tolak** bila belum memenuhi kriteria kampus.

### 3.4 Manajemen Pengguna & Penangguhan Akun
1. Buka menu **Kelola Pengguna** (`/admin/users`).
2. Saring pengguna berdasarkan peran (`CUSTOMER`, `TENANT`, `ADMIN`).
3. Opsi **Suspend** akan membekukan akun yang melanggar ketentuan dan secara otomatis membatalkan seluruh token otentikasi aktif (`sessionVersion` revocation).

### 3.5 Konfigurasi Parameter Sistem
1. Buka menu **Pengaturan Sistem** (`/admin/settings`).
2. Tentukan tarif biaya layanan platform, batas waktu kedaluwarsa reservasi bayar (TTL 15 menit), serta pengaturan simulator transaksi.
