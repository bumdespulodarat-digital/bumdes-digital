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

### 📊 1. Dashboard Interaktif (Chart.js)
- **Visualisasi Data Real-Time:** Menampilkan grafik pendapatan, pengeluaran, dan tren laba menggunakan visualisasi Chart.js yang dinamis.
- **Ringkasan Cepat:** Metrik utama (Kas, Laba, Total Penjualan, Total Aset) di satu halaman.

### 🛒 2. Kasir Pintar (Point of Sale) & Struk Thermal
- **Transaksi Super Cepat:** Desain kasir responsif untuk tablet & mobile.
- **Kalkulasi Cerdas:** Menghitung total belanja & kembalian secara otomatis.
- **Otomatisasi Jurnal:** Setiap penjualan otomatis menjurnal ke Akuntansi (Kas, Pendapatan, HPP, Persediaan).
- **Cetak Struk:** Fitur cetak struk kompatibel dengan printer kasir (thermal).

### 📦 3. Manajemen & Kartu Stok (Buku Pembantu Persediaan)
- **Sinkronisasi Real-time:** Stok otomatis berkurang presisi pada setiap transaksi POS.
- **Kartu Stok Dinamis:** Pantau riwayat seluruh barang masuk (IN) dan keluar (OUT) lengkap dengan saldo berjalan.
- **Visualisasi Stok Cerdas:** Indikator warna barang yang hampir habis dengan antarmuka dinamis.

### ⚖️ 4. Akuntansi Kelas Enterprise (Standar Noto Mulyo 2025)
Terintegrasi secara penuh dengan **Chart of Accounts (COA) 5-Level** standar BUMDes. Fitur meliputi:
- **Buku Jurnal Umum:** Mencatat seluruh transaksi debit-kredit otomatis dan manual.
- **Buku Besar (General Ledger):** Memfilter riwayat per akun secara spesifik untuk melihat mutasi dan saldo berjalan.
- **Neraca Saldo (Trial Balance):** Memastikan keseimbangan (balance) antara seluruh aktiva, kewajiban, ekuitas, pendapatan, dan beban.

### 📈 5. Pelaporan Keuangan Komprehensif Real-Time
- **Laporan Laba Rugi:** Membedah Pendapatan, HPP, hingga Beban Operasional untuk Laba Bersih.
- **Laporan Posisi Keuangan (Neraca):** Pemantauan mendalam Kas, Piutang, Persediaan, Aset Tetap, Utang, dan Ekuitas.
- **Laporan Perubahan Ekuitas (LPE):** Mengkalkulasi otomatis penambahan modal dari SHU/Laba berjalan.
- **Laporan Arus Kas (LAK):** Merekap arus uang masuk dan keluar BUMDes.

### 🖨️ 6. Export Laporan (PDF & Excel)
- **PDF Export (pdfmake):** Unduh laporan keuangan resmi berformat PDF siap cetak lengkap dengan Kop Surat, tabel profesional, dan blok Tanda Tangan (Direktur & Bendahara).
- **Excel Export (exceljs):** Unduh satu atau seluruh laporan ke format *Spreadsheet* (`.xlsx`) multi-sheet (Buku Besar, Neraca, Laba Rugi, dll) lengkap dengan format angka *Currency* dan border tabel siap analisa.

### 💳 7. Buku Pembantu Utang & Piutang
- **Catatan Pihak Terkait:** Pantau seluruh *customer* dan *supplier* BUMDes.
- **Sistem Cicilan/Pelunasan:** Kelola status piutang warga atau utang supplier. Pelunasan otomatis menjurnal ke Kas.

### 🎨 8. Tema UI/UX Premium
- **Dark Mode Penuh:** Transisi halus antara mode terang dan gelap untuk kenyamanan mata.
- **Responsive Layout:** 100% Mobile-friendly dan dioptimalkan untuk desktop/tablet.

### 👥 9. Manajemen Multi-Pengurus & Profil BUMDes
- Pengaturan Profil BUMDes (Nama, Alamat, Nomor Kontak).
- Manajemen Hak Akses Multi-User untuk kolaborasi Direktur, Bendahara, dan Akuntan.
- **Akun Login BUMDes:**
  - Direktur: `direktur.bumdespulodarat@gmail.com`
  - Bendahara: `bendahara.bumdespulodarat@gmail.com`
  - Akuntan: `akuntan.bumdespulodarat@gmail.com`

## 🛠️ Stack Teknologi (Tech Stack)
Aplikasi ini dibangun menggunakan arsitektur modern untuk menjamin kecepatan, keamanan, dan keandalan data:
- **Frontend Layer:** React (Vite) dengan strict TypeScript.
- **Styling:** Tailwind CSS v4 (*Glassmorphism*, transisi mulus, dan *Dark Mode*).
- **Database & Backend:** Supabase (PostgreSQL) dengan perlindungan *Row Level Security* (RLS).
- **Reporting:** `pdfmake` (Dokumen PDF) & `exceljs` (Spreadsheet).
- **Testing:** Vitest & React Testing Library (Unit & Integration Test).
- **Icons & Visuals:** Lucide React icons.

## 🚀 Panduan Instalasi (Quick Start)

### 1. Kloning Repositori
```bash
git clone https://github.com/bumdespulodarat-digital/bumdes-digital.git
cd bumdes-digital
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Database (Supabase)
Buat file `.env.local` di folder *root* dan masukkan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

**Catatan:** Gunakan akun Supabase BUMDes (`bumdespulodarat@gmail.com`) untuk mengelola database production.

**Penting:** Jangan lupa jalankan script SQL yang ada di file `database_schema.sql` dan `database_update.sql` ke menu **SQL Editor** pada Supabase Anda untuk melakukan migrasi & *seeding* tabel.

### 4. Menjalankan Server Development
```bash
npm run dev
```
Aplikasi dapat diakses di browser pada alamat `http://localhost:5173`.

### 5. Menjalankan Unit Test (Vitest)
Aplikasi dilengkapi dengan *Test Suite* komprehensif (130+ Test Cases) untuk menjamin kualitas fitur dan kalkulasi akuntansi, termasuk pengujian checkout POS (Simpan Data & Cetak Struk).
```bash
npm run test
```

---
<div align="center">
  <b>Dibangun dengan 💻 dan ☕ untuk BUMDes Noto Mulyo Pulodarat</b><br>
  <i>Inovasi KKN Angkatan XXI Tahun 2026</i><br>
  <strong>&copy; 2026 Muhammad Ashab Ibnu Abdul Aziz (NIM: 231240001399)</strong>
</div>
