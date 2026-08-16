<div align="center">
  
# 🚀 BUMDes Digital: Sistem Enterprise Noto Mulyo
**Digitalisasi Keuangan & Operasional Terpadu BUMDes Noto Mulyo Pulodarat**

[![React](https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-729B1B?style=for-the-badge&logo=vitest)](https://vitest.dev/)

*Program Kerja Unggulan Kuliah Kerja Nyata (KKN) Angkatan XXI Tahun 2026*  
**Diciptakan dan Dikembangkan oleh: Muhammad Ashab Ibnu Abdul Aziz (NIM: 231240001399)**

</div>

---

## 📖 Latar Belakang Program (Proker KKN)
Berdasarkan hasil observasi lapangan di **BUMDes Noto Mulyo, Desa Pulodarat, Kecamatan Pecangaan, Kabupaten Jepara**, ditemukan tantangan dalam hal manajemen waktu pengurus dan sistem pembukuan yang masih konvensional. 

Program Kerja (Proker) KKN ini menginisiasi transformasi digital dengan membangun sistem pencatatan keuangan dan Point of Sale (POS) kelas *Enterprise* yang dirancang khusus untuk mempermudah operasional unit usaha (Toko ATK, Pengasapan Lele, Tempat Parkir, dll) agar lebih transparan, akuntabel, dan *real-time*.

## ✨ Fitur Utama (Core Features)

### 📊 1. Laporan Keuangan & Transaksi Periodik (Chart.js)
- **Visualisasi Data Real-Time:** Menampilkan grafik garis area (Area Line Chart) bergaya modern dan grafik donat dengan 20+ palet warna untuk membedah pendapatan, pengeluaran, dan sumber laba BUMDes secara presisi. Dilengkapi format angka jutaan cerdas ("Rp 12 Jt").
- **Integrasi Web Desa (Public Dashboard):** Tersedia *endpoint* khusus (`/public-dashboard`) berupa *live-widget* statistik anonim yang siap dipasang (*embed*) ke dalam website resmi desa (seperti WordPress).
- **Filter Fleksibel:** Laporan transaksi Mingguan, Bulanan, dan Tahunan.
- **Ringkasan Cepat:** Metrik utama (Kas, Laba, Total Pendapatan, Jumlah Transaksi, Total Pajak).

### 🛒 2. Kasir Pintar (Point of Sale) & Struk Thermal
- **Transaksi Super Cepat:** Desain kasir responsif untuk tablet & mobile.
- **Produk Custom / Jasa Khusus:** Bisa menambahkan item transaksi secara bebas (nama dan harga custom) untuk jasa seperti fotokopi, parkir, admin, tanpa memotong stok.
- **Kalkulasi Cerdas:** Menghitung total belanja, kembalian, dan **Pajak (PPN)** secara otomatis per barang.
- **Riwayat Transaksi & Cetak Ulang:** Tersedia tab khusus untuk melacak histori transaksi dan fitur cetak ulang struk lawas.

### 📦 3. Manajemen, Import Excel & Kartu Stok
- **Sinkronisasi Real-time:** Stok otomatis berkurang presisi pada setiap transaksi POS.
- **Kartu Stok Dinamis:** Pantau riwayat seluruh barang masuk (IN) dan keluar (OUT) lengkap dengan saldo berjalan.
- **Import Excel (Bulk):** Unggah ratusan data barang sekaligus menggunakan template Excel bawaan sistem.
- **Pajak Dinamis:** Pengaturan persentase pajak (0%, 2%, 11%, dll) khusus per masing-masing barang.

### ⚖️ 4. Akuntansi & Buku Kas Umum
Terintegrasi secara penuh dengan **Chart of Accounts (COA) 5-Level** standar BUMDes. Fitur meliputi:
- **Buku Kas Umum:** Terkoneksi otomatis! Setiap uang masuk dari mesin kasir otomatis masuk ke Debit Buku Kas. Dilengkapi saldo berjalan.
- **Buku Jurnal Umum:** Mencatat seluruh transaksi debit-kredit (termasuk jurnal PPN otomatis dari Kasir).
- **Buku Besar (General Ledger):** Memfilter riwayat per akun secara spesifik untuk melihat mutasi dan saldo berjalan.
- **Neraca Saldo (Trial Balance):** Memastikan keseimbangan (balance) keuangan BUMDes.

### 📈 5. Pelaporan Keuangan Komprehensif Real-Time
- **Laporan Laba Rugi:** Membedah Pendapatan, HPP, hingga Beban Operasional untuk Laba Bersih.
- **Laporan Posisi Keuangan (Neraca):** Pemantauan mendalam Kas, Piutang, Persediaan, Aset Tetap, Utang, dan Ekuitas.
- **Laporan Perubahan Ekuitas (LPE):** Mengkalkulasi otomatis penambahan modal dari SHU/Laba berjalan.

### 🖨️ 6. Export Laporan (PDF & Excel)
- **PDF Export (pdfmake):** Unduh laporan keuangan resmi berformat PDF siap cetak lengkap dengan Kop Surat.
- **Excel Export (exceljs):** Unduh laporan ke format *Spreadsheet* (`.xlsx`) lengkap dengan format angka *Currency*.

### 📂 7. Sistem Inventaris & Arsip Terpadu
- **Inventaris Barang BUMDes:** Mencatat seluruh aset tetap perusahaan (laptop, printer, mesin) beserta kondisinya.
- **Manajemen Arsip Surat:** Katalogisasi surat masuk dan surat keluar resmi BUMDes.
- **Notulen Rapat:** Pencatatan absensi peserta rapat, agenda, dan keputusan akhir secara digital.
- **Dokumentasi Kegiatan:** Pengarsipan galeri foto dan rekap acara BUMDes.

### 👤 8. Profil Pengguna & Avatar Dinamis
- **Manajemen Akun Mandiri:** Setiap pengurus bisa memperbarui detail kontak, pendidikan, NIK KTP, dan jabatan spesifik.
- **Unggah Foto Profil (Cloud Storage):** Avatar pengguna yang diunggah akan tersimpan aman di sistem *Cloud* dan tersinkronisasi.
- **Integrasi Bagan Organisasi:** Foto profil akan otomatis tampil pada bagan Struktur Organisasi, membuatnya lebih interaktif dan humanis.

### 👥 9. Struktur Organisasi & Hak Akses Bertingkat (RBAC)
- **Visualisasi Struktur Organisasi (Org Chart):** Tampilan hierarki cantik dari Direktur hingga staf lapis bawah secara otomatis.
- **Manajemen Multi-User & Role Khusus:**
  - `Admin/Direktur/Bendahara`: Akses penuh pengeditan (*Superuser*).
  - `Pengawas`: Mode lihat saja (*Read-only*) khusus pada Laporan Keuangan, Akuntansi, Buku Kas, dan Inventaris.
  - `Karyawan Toko`: Fokus operasional harian (Akses khusus ke halaman Dashboard, Kasir, dan Stok Barang).
- **Akun Demo / Default Login:**
  - Direktur: `direktur.bumdespulodarat@gmail.com`
  - Akuntan: `akuntan.bumdespulodarat@gmail.com`
  - Bendahara: `bendahara.bumdespulodarat@gmail.com`
  - Karyawan: `karyawan.bumdespulodarat@gmail.com`
  - Pengawas: `pengawas.bumdespulodarat@gmail.com`

### 📖 10. Buku Panduan (SOP) Digital
- **Built-in FAQ:** Jawaban untuk pertanyaan umum (troubleshooting dasar) tersedia langsung di dalam aplikasi.
- **Buku Panduan PDF:** Unduh otomatis *SOP (Standard Operating Procedure)* menjadi dokumen PDF yang profesional, komprehensif, dan siap cetak. Buku panduan ini secara lengkap membahas seluruh alur fitur BUMDes (termasuk *Public Dashboard*, Import Excel, Akuntansi Lanjutan, dan *Role-Based Access Control*) yang disertai dengan *screenshot* aktual dari sistem.

### 🎨 11. Identitas Visual & UI/UX Enterprise
- **Desain Autentik BUMDes:** Antarmuka bebas dari desain "template AI" generik. Menggunakan palet warna resmi BUMDes (Biru, Hijau, Oranye) dengan gaya visual (tanpa shadow berlebihan/gradien pelangi) yang profesional dan bersih.
- **Tipografi Berkarakter:** Penggunaan font serif (`Merriweather`) untuk judul modul demi memberikan kesan resmi institusi desa, dipadukan dengan sans-serif (`Plus Jakarta Sans`) untuk keterbacaan data numerik yang optimal.
- **Ergonomi Sentuhan (Touch-Friendly):** Seluruh elemen interaktif (tombol, *input*, *dropdown*) dirancang dengan standar target sentuh minimal 44px, sangat nyaman dioperasikan baik dari layar komputer, maupun HP dan tablet kasir.
- **Tabel Responsif:** Data panjang seperti Laporan, Inventaris, dan Buku Kas disajikan dengan gaya baris belang (*striped rows*) agar nyaman dan tidak membingungkan mata saat dibaca cepat.

## 🛠️ Stack Teknologi (Tech Stack)
Aplikasi ini dibangun menggunakan arsitektur modern untuk menjamin kecepatan, keamanan, dan keandalan data:
- **Frontend Layer:** React (Vite) dengan strict TypeScript.
- **Styling:** Tailwind CSS v4 (*Glassmorphism*, transisi mulus, dan *Dark Mode*).
- **Database & Backend:** Supabase (PostgreSQL) dengan perlindungan *Row Level Security* (RLS).
- **Reporting:** `pdfmake` (Dokumen PDF) & `exceljs` (Spreadsheet).
- **Testing:** Vitest & React Testing Library (Unit & Integration Test).
- **Icons & Visuals:** Lucide React icons.

## 🚀 Panduan Instalasi (Langkah demi Langkah)

Panduan ini dibuat agar mudah dipahami, bahkan bagi pemula sekalipun. Ikuti urutan di bawah ini untuk menjalankan aplikasi BUMDes Digital di komputer Anda.

### 1. Kloning (Download) Kode Aplikasi
Pertama, Anda perlu mengunduh kode aplikasi ini ke komputer Anda. Buka **Terminal** atau **Command Prompt**, lalu ketikkan perintah berikut:
```bash
git clone https://github.com/bumdespulodarat-digital/bumdes-digital.git
cd bumdes-digital
```
*(Perintah `cd bumdes-digital` akan mengarahkan Anda masuk ke dalam folder aplikasi yang baru saja diunduh).*

### 2. Install Dependensi (Komponen Tambahan)
Agar aplikasi bisa berjalan, Anda perlu mengunduh semua "alat bantu" (*library*) yang dibutuhkan. Pastikan Anda sudah menginstal **Node.js** di komputer Anda, lalu jalankan:
```bash
npm install
```
*(Tunggu beberapa saat sampai proses unduh selesai. Pastikan komputer terhubung dengan internet yang stabil).*

### 3. Konfigurasi Database (Menyambungkan ke Supabase)
Aplikasi ini membutuhkan database *Supabase* untuk menyimpan data secara *real-time*.
1. Buat sebuah file baru bernama `.env.local` tepat di dalam folder `bumdes-digital`.
2. Buka file tersebut, lalu masukkan link (`URL`) dan kunci rahasia (`KEY`) dari akun Supabase Anda dengan format berikut:
```env
VITE_SUPABASE_URL=https://[GANTI_DENGAN_PROJECT_ID_ANDA].supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...[GANTI_DENGAN_ANON_KEY_ANDA]
```
> **Catatan BUMDes:** Untuk mengelola *database* asli (*production*), pastikan Anda masuk ke *Dashboard Supabase* menggunakan akun resmi BUMDes (`bumdespulodarat@gmail.com`).

### 4. Memasukkan Struktur Database (PENTING!)
Agar aplikasi bisa membaca dan menyimpan data (seperti produk, transaksi, dll), Anda harus membangun kerangka databasenya terlebih dahulu:
1. Buka *Dashboard Supabase* Anda.
2. Pergi ke menu **SQL Editor**.
3. Buka tab **New query**.
4. *Copy* (salin) semua isi dari file `database_schema.sql` (yang ada di dalam folder aplikasi ini), lalu *Paste* (tempel) di layar, dan tekan **Run** (Jalankan).
5. Hapus teksnya, lalu *Copy* (salin) semua isi dari file `database_migration.sql`, dan tekan **Run** (Jalankan) sekali lagi untuk menambahkan seluruh fitur terbaru (sistem arsip, inventaris, kas otomatis, dll).

### 5. Menjalankan Aplikasi di Komputer
Semuanya sudah siap! Sekarang Anda tinggal menyalakan aplikasinya dengan perintah:
```bash
npm run dev
```
Buka *browser* (seperti Google Chrome atau Firefox), lalu ketikkan alamat: **`http://localhost:5173`**. Selamat, aplikasi BUMDes Noto Mulyo siap digunakan! 🎉

### (Opsional) Menguji Aplikasi (Automated Testing)
Bagi Anda yang ingin mengembangkan aplikasi ini lebih lanjut, Anda bisa menjalankan robot penguji otomatis untuk memastikan semua fitur (seperti perhitungan akuntansi dan kasir) berjalan normal. Aplikasi ini memiliki lebih dari 130+ skenario pengujian!
```bash
npm run test
```

## 🔧 Pemecahan Masalah (Troubleshooting & Error Handling)

Berikut adalah beberapa kendala umum yang mungkin Anda temui saat proses instalasi atau penggunaan, beserta solusinya:

### 1. Layar Putih Blank / Pesan "Failed to fetch"
- **Penyebab**: Aplikasi gagal terhubung ke database Supabase.
- **Solusi**: Pastikan Anda sudah membuat file `.env.local` dan memasukkan `VITE_SUPABASE_URL` serta `VITE_SUPABASE_ANON_KEY` dengan benar (tidak ada spasi ekstra). Pastikan juga komputer Anda terhubung ke internet.

### 2. Tabel Kosong / Data Tidak Muncul
- **Penyebab**: Kerangka database belum terbuat, atau kebijakan keamanan (RLS) menghalangi akses.
- **Solusi**: Pastikan Anda telah menjalankan **Langkah 4 (Memasukkan Struktur Database)**. Anda harus menjalankan file `database_schema.sql` dan `database_migration.sql` di SQL Editor Supabase.

### 3. Gagal Login (Invalid Login Credentials)
- **Penyebab**: Akun belum terdaftar di sistem *Authentication* Supabase.
- **Solusi**: Di *Dashboard* Supabase, masuk ke menu **Authentication > Users**, lalu tambahkan akun secara manual (misal: `direktur.bumdespulodarat@gmail.com`) beserta *password*-nya. Jangan lupa untuk menambahkan akun tersebut ke tabel `bumdes_users` di **Table Editor** agar jabatannya terbaca.

### 4. Error "Port 5173 is already in use" di Terminal
- **Penyebab**: Anda sudah menjalankan perintah `npm run dev` sebelumnya dan aplikasinya masih menyala di *background*.
- **Solusi**: Matikan server yang sedang berjalan (tekan `Ctrl + C` di terminal lama), atau buka alamat alternatif yang diberikan oleh Vite (biasanya `http://localhost:5174`).

### 5. Peringatan "Multiple GoTrueClient instances detected" di Console Browser
- **Penyebab**: Ini adalah peringatan bawaan dari sistem Supabase karena React berjalan dalam *Strict Mode* saat mode *Development*.
- **Solusi**: **Abaikan peringatan ini.** Hal ini sangat normal dan tidak akan muncul di versi *Production* (setelah aplikasi dipublikasikan/dideploy).

---
<div align="center">
  <b>Dibangun dengan 💻 dan ☕ untuk BUMDes Noto Mulyo Pulodarat</b><br>
  <i>Inovasi KKN Angkatan XXI Tahun 2026</i><br>
  <strong>&copy; 2026 Muhammad Ashab Ibnu Abdul Aziz (NIM: 231240001399)</strong>
</div>
