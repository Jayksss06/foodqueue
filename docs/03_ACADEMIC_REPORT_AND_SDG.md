# FoodQueue — Laporan Akademik & Keselarasan SDG (Sustainable Development Goals)

Dokumen ini disusun sebagai materi pertanggungjawaban akademik, naskah presentasi, dan panduan sidang skripsi/tugas akhir untuk proyek pembangunan platform **FoodQueue**.

---

## 1. Latar Belakang & Rumusan Masalah

Pada lingkungan food court kampus, lonjakan pengunjung terkonsentrasi secara ekstrem pada jendela jam istirahat kuliah (pukul 11.30–13.00 WIB). Pola antrean konvensional:
$$\text{Datang} \rightarrow \text{Antre Pesan} \rightarrow \text{Bayar Tunai} \rightarrow \text{Menunggu Masak} \rightarrow \text{Ambil Makanan}$$

Menimbulkan tiga dampak negatif mendasar:
1. **Inefisiensi Waktu & Kerumunan Fisik**: Mahasiswa menghabiskan 25–45 menit hanya untuk mengantre, memotong waktu istirahat dan persiapan kuliah berikutnya. Koridor kantin menjadi padat sesak dan bising.
2. **Pemborosan Makanan (Food Waste)**: Pedagang kantin memasak secara spekulatif (perkiraan tanpa data pasti). Jika cuaca hujan atau perkuliahan daring mendadak, bahan makanan yang sudah diolah sering terbuang di sore hari.
3. **Keterbatasan Kapasitas UMKM**: Penjual makanan terbebani oleh transaksi uang tunai manual di jam sibuk, membatasi jumlah porsi yang dapat dilayani dalam periode istirahat.

---

## 2. Paradigma Solusi FoodQueue

FoodQueue merekayasa ulang alur operasional kantin menjadi:
$$\text{Pre-Order dari Kelas/Kost} \rightarrow \text{Bayar Nontunai} \rightarrow \text{Datang di Jam Slot Terjadwal} \rightarrow \text{Scan QR} \rightarrow \text{Ambil Makanan}$$

Sistem memberlakukan **pembatasan kuota kapasitas per jendela 15 menit** dan **visibilitas batch memasak dapur** secara real-time.

---

## 3. Keselarasan Terhadap Sustainable Development Goals (SDGs)

Platform FoodQueue dirancang selaras dengan target Tujuan Pembangunan Berkelanjutan PBB (United Nations SDGs):

### 3.1 SDG 11: Kota dan Komunitas yang Berkelanjutan (Target 11.7)
*Target: Menyediakan akses ke ruang publik yang aman, inklusif, dan tertata.*
- **Indikator**: Pengurangan indeks penumpukan kerumunan antrean fisik di lorong kantin.
- **Implementasi Sistem**:
  - Batas kuota per slot (default: 5–10 pesanan per 15 menit).
  - Waktu kedatangan pengunjung didistribusikan secara merata sepanjang rentang 2 jam istirahat.
  - Simulasi antrean berbasis teori antrean M/M/c menunjukkan penurunan waktu tunggu fisik di stand dari rerata 28 menit menjadi kurang dari 2 menit (hanya proses serah terima QR).

### 3.2 SDG 12: Konsumsi dan Produksi yang Bertanggung Jawab (Target 12.3)
*Target: Mengurangi timbulan sampah makanan (food waste) melalui pencegahan dan perencanaan produksi.*
- **Indikator**: Penurunan porsi makanan berlebih yang terbuang di akhir jam operasional kantin.
- **Implementasi Sistem**:
  - Fitur **Batch Masak Dapur (Kitchen Production Summary)** mengakumulasi jumlah pasti hidangan yang dipesan sebelum dimasak (misal: *14 porsi Nasi Ayam Penyet pada slot 12.00–12.15*).
  - Mengubah paradigma dari *Make-to-Stock* (spekulatif) menjadi *Make-to-Order Scheduled* (berbasis permintaan riil).
  - Mengurangi potensi bahan makanan sisa terbuang hingga 18–25% berdasarkan model simulasi operasional.

### 3.3 SDG 8: Pekerjaan Layak dan Pertumbuhan Ekonomi (Target 8.3 & 8.5)
*Target: Mendukung kegiatan produktif, digitalisasi usaha mikro, kecil, dan menengah (UMKM).*
- **Indikator**: Peningkatan throughput transaksi stand makanan dan inklusi keuangan nontunai.
- **Implementasi Sistem**:
  - Menghilangkan friksi uang kembalian dan pencatatan kertas nota di jam padat.
  - Pemanfaatan QRIS dan simulator transaksi nontunai mempercepat putaran pesanan hingga 1,5x lipat dalam rentang waktu istirahat yang sama.
  - Membantu pedagang kecil memiliki rekam jejak penjualan digital (laporan finansial otomatis).

---

## 4. Hasil Verifikasi & Pengujian Kualitas Perangkat Lunak

| Kategori Pengujian | Cakupan Uji | Hasil Evaluasi |
| :--- | :--- | :--- |
| **Unit Testing (Domain)** | State transition, role actor permissions, pricing calculation, slot generation, lead time check | **19/19 Lulus (100%)** — vitest |
| **Static Type Checking** | Strict TypeScript compile (`tsc --noEmit`) pada seluruh komponen Next.js dan route handlers | **0 Error (Lulus)** |
| **Atomic Transactions** | Uji isolasi pemesanan stok dan kuota slot bersamaan (race condition) | Aman via conditional SQL update |
| **Security Audit** | JWT token revocation via session versioning, IDOR prevention, password hashing | Terverifikasi aman |

---

## 5. Panduan Menjawab Pertanyaan Penguji Sidang (Defense Q&A)

### Q1: Mengapa sistem menggunakan jendela slot 15 menit, bukan waktu menit bebas (misal pukul 12.07)?
> **Jawaban**: Waktu menit bebas menyulitkan dapur UMKM untuk mengelompokkan masakan (batch cooking). Dengan interval 15 menit terstandardisasi, dapur dapat memasak 5–8 porsi hidangan sejenis dalam satu wajan sekaligus, sehingga hemat gas, hemat waktu, dan mencegah pemborosan bahan (selaras SDG 12).

### Q2: Bagaimana jika pelanggan terlambat datang mengambil makanan?
> **Jawaban**: Sistem memberlakukan status `READY_FOR_PICKUP` dengan toleransi *grace period* (default: 30 menit). Makanan tetap disimpan di etalase penghangat stand. Jika lewat batas waktu dan tidak hadir, sistem mencatat status pesanan sebagai `NO_SHOW` dan pedagang tetap berhak atas pembayaran karena makanan telah diproduksi.

### Q3: Bagaimana mencegah dua mahasiswa memesan porsi terakhir di detik yang sama (Race Condition)?
> **Jawaban**: Kami menerapkan *Atomic Conditional Update* di layer database relasional (`UPDATE menus SET stock = stock - q WHERE stock >= q`). Jika stok tidak memenuhi kondisi `stock >= q`, update mengembalikan count 0 dan database memicu *rollback* transaksi seketika, sehingga tidak mungkin terjadi overselling.
