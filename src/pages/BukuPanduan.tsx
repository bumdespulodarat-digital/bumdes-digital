import { useState } from 'react';
import { BookOpen, Download, ChevronDown, HelpCircle, Lightbulb, ShieldQuestion } from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Register fonts for pdfmake
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

export default function BukuPanduan() {
  const [openItem, setOpenItem] = useState<number | null>(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const faqs = [
    {
      q: "Bagaimana cara mencatat penjualan di menu Kasir (POS)?",
      a: "1. Buka menu Kasir (POS).\n2. Pilih barang yang dibeli oleh pelanggan atau gunakan fitur Barcode Scanner.\n3. Masukkan jumlah uang yang dibayarkan pelanggan di kolom 'Nominal Bayar'.\n4. Klik 'Selesaikan Pembayaran'.\n5. Struk akan otomatis tercetak (atau bisa didownload PDF)."
    },
    {
      q: "Bagaimana cara menambah stok barang baru?",
      a: "1. Buka menu Stok Barang.\n2. Klik tombol '+ Tambah Barang' di pojok kanan atas.\n3. Isi nama barang, kategori, harga beli, harga jual, dan stok awal.\n4. Klik 'Simpan'."
    },
    {
      q: "Apakah laporan akuntansi dibuat secara otomatis?",
      a: "Ya! Setiap kali Anda melakukan transaksi penjualan di Kasir atau melunasi hutang/piutang, sistem akan OTOMATIS membuatkan Jurnal Umum. Anda bisa mengecek Laba Rugi dan Neraca secara langsung di menu Akuntansi tanpa perlu repot menghitung manual."
    },
    {
      q: "Bagaimana cara mencetak laporan bulanan?",
      a: "Anda bisa masuk ke menu Laporan Transaksi atau Akuntansi. Pilih rentang tanggal (misal: 1 Agustus - 31 Agustus), lalu klik tombol 'Export PDF' atau 'Export Excel'. Laporan akan langsung terunduh ke perangkat Anda."
    },
    {
      q: "Siapa saja yang bisa mengakses menu Pengaturan?",
      a: "Hanya pengguna dengan jabatan 'Admin' dan 'Direktur BUMDes' yang memiliki hak akses untuk membuka menu Pengaturan dan menambahkan atau menghapus akun pengurus lainnya."
    }
  ];

  // ====================================================================
  // PDF GENERATOR — BUKU PANDUAN PENGGUNA (SOP) LENGKAP
  // ====================================================================
  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);

    const fetchImageBase64 = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        // Validate that the response is actually an image (not an HTML SPA fallback)
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) return null;
        const blob = await response.blob();
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        return null;
      }
    };

    const logoBase64 = await fetchImageBase64('/logo-bumdes.png');
    const loginImg = await fetchImageBase64('/screenshots/login.png');
    const dashboardImg = await fetchImageBase64('/screenshots/dashboard.png');
    const kasirImg = await fetchImageBase64('/screenshots/kasir.png');
    const akuntansiImg = await fetchImageBase64('/screenshots/akuntansi.png');
    const stokTambahImg = await fetchImageBase64('/screenshots/stok-tambah.png');
    const piutangImg = await fetchImageBase64('/screenshots/piutang.png');

    // ==================== HELPER FUNCTIONS ====================

    /** Screenshot / image placeholder box */
    const screenshotBox = (text: string, base64Image?: string | null): any => {
      if (base64Image) {
        return {
          table: {
            widths: ['*'],
            body: [[{ image: base64Image, width: 420, alignment: 'center', margin: [0, 10, 0, 10] }]]
          },
          layout: {
            hLineWidth: () => 1, vLineWidth: () => 1,
            hLineColor: () => '#CBD5E1', vLineColor: () => '#CBD5E1'
          },
          margin: [0, 10, 0, 15]
        };
      }
      return {
        table: {
          widths: ['*'],
          body: [
            [{ text: `[ ${text} ]`, alignment: 'center', margin: [0, 30, 0, 30], color: '#64748B', fillColor: '#F1F5F9', fontSize: 10 }]
          ]
        },
        layout: {
          hLineWidth: () => 1, vLineWidth: () => 1,
          hLineColor: () => '#CBD5E1', vLineColor: () => '#CBD5E1'
        },
        margin: [0, 10, 0, 15]
      };
    };

    /** Callout box — styled info box with left border accent */
    const calloutBox = (title: string, body: string, type: 'warning' | 'info' | 'flow' = 'warning'): any => {
      const colors: Record<string, { bg: string; border: string; titleColor: string }> = {
        warning: { bg: '#FFFBEB', border: '#F59E0B', titleColor: '#92400E' },
        info:    { bg: '#EFF6FF', border: '#3B82F6', titleColor: '#1E40AF' },
        flow:    { bg: '#F0FDF4', border: '#22C55E', titleColor: '#166534' },
      };
      const c = colors[type];
      return {
        table: {
          widths: [4, '*'],
          body: [[
            { text: '', fillColor: c.border },
            {
              stack: [
                { text: title, bold: true, fontSize: 11, color: c.titleColor, margin: [0, 0, 0, 4] },
                { text: body, fontSize: 10, color: '#1a1a1a', lineHeight: 1.5 }
              ],
              fillColor: c.bg,
              margin: [8, 8, 8, 8]
            }
          ]]
        },
        layout: {
          hLineWidth: () => 0, vLineWidth: () => 0,
          paddingLeft: () => 0, paddingRight: () => 0,
          paddingTop: () => 0, paddingBottom: () => 0,
        },
        margin: [0, 8, 0, 15]
      };
    };

    /** Data flow callout — "Kemana Data Ini Mengalir?" */
    const dataFlowBox = (items: string[]): any => {
      const bodyText = items.map(item => `✓  ${item}`).join('\n');
      return calloutBox('🔄 KEMANA DATA INI MENGALIR?', bodyText, 'flow');
    };

    /** Fitur-Fungsi table at beginning of each chapter */
    const featureTable = (rows: [string, string][]): any => ({
      table: {
        headerRows: 1,
        widths: ['30%', '70%'],
        body: [
          [{ text: 'Fitur', style: 'tableHeader' }, { text: 'Fungsi Utama', style: 'tableHeader' }],
          ...rows.map(([fitur, fungsi]) => [
            { text: fitur, style: 'tableCell' },
            { text: fungsi, style: 'tableCell' }
          ])
        ]
      },
      layout: {
        hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
        vLineWidth: () => 0.5,
        hLineColor: (i: number) => i <= 1 ? '#4F46E5' : '#E2E8F0',
        vLineColor: () => '#E2E8F0',
        paddingLeft: () => 6, paddingRight: () => 6,
        paddingTop: () => 5, paddingBottom: () => 5,
      },
      margin: [0, 0, 0, 15] as [number, number, number, number]
    });

    // ==================== DOCUMENT DEFINITION ====================

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 80, 40, 60],
      info: {
        title: 'Buku Panduan BUMDes Digital Noto Mulyo',
        author: 'Tim IT KKN & Pengurus BUMDes',
        subject: 'Buku Panduan Pengguna (SOP)',
      },
      header: (currentPage: number) => {
        if (currentPage === 1) return null;
        return {
          columns: [
            { text: 'BUKU PANDUAN PENGGUNA', style: 'headerLeft' },
            { text: 'SISTEM DIGITAL BUMDES', style: 'headerRight' }
          ],
          margin: [40, 25, 40, 0]
        };
      },
      footer: (currentPage: number, pageCount: number) => {
        if (currentPage === 1) return null;
        return {
          columns: [
            { text: 'BUMDes Noto Mulyo — Desa Pulodarat', style: 'footerLeft' },
            { text: `Halaman ${currentPage} / ${pageCount}`, style: 'footerRight' }
          ],
          margin: [40, 20, 40, 0]
        };
      },
      content: [
        // ============================================================
        // COVER PAGE
        // ============================================================
        { text: '\n\n\n\n' },
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 6, color: '#4F46E5' }] },
        { text: 'BUKU PANDUAN PENGGUNA', style: 'coverTitle', margin: [0, 30, 0, 5] },
        { text: 'SISTEM INFORMASI DIGITAL BUMDES', style: 'coverSubtitle', margin: [0, 0, 0, 40] },
        
        {
          table: {
            widths: ['*'],
            body: [[
              logoBase64 
                ? { image: logoBase64, width: 160, alignment: 'center', margin: [0, 40, 0, 40] }
                : { text: '[ LOGO BUMDES ]', style: 'logoPlaceholder', margin: [0, 40, 0, 40], fillColor: '#F8FAFC' }
            ]]
          },
          layout: {
            hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#E2E8F0', vLineColor: () => '#E2E8F0'
          },
          margin: [0, 0, 0, 40]
        },

        { text: 'BUMDes Noto Mulyo', style: 'coverEntity' },
        { text: 'Balai Desa Pulodarat, Kecamatan Pecangaan,\nKabupaten Jepara', style: 'coverAddress' },
        
        { text: '\n\n\n\n\n\n' },
        { canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 3, color: '#4F46E5' }] },
        { text: 'Tahun 2024', style: 'coverYear', alignment: 'center', margin: [0, 20, 0, 0] },
        { text: 'Revisi: Agustus 2026, sesuai Versi 2.0 sistem', fontSize: 11, alignment: 'center', color: '#64748B', margin: [0, 5, 0, 0] },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // DAFTAR ISI
        // ============================================================
        {
          toc: {
            title: { text: 'DAFTAR ISI', style: 'h1', margin: [0, 0, 0, 20] as [number, number, number, number] },
            textMargin: [0, 5, 0, 5] as [number, number, number, number]
          }
        },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // KATA PENGANTAR & PERSYARATAN SISTEM
        // ============================================================
        { text: 'KATA PENGANTAR', style: 'h1', tocItem: true },
        { 
          text: 'Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas selesainya penyusunan "Buku Panduan Pengguna (SOP) Sistem Informasi Digital BUMDes".\n\nSistem ini dirancang khusus untuk mempermudah dan mendigitalisasi operasional BUMDes Noto Mulyo, mulai dari transaksi kasir, manajemen stok, pencatatan hutang-piutang, hingga otomatisasi pembukuan (akuntansi).\n\nBuku panduan ini disusun dengan bahasa yang sederhana agar dapat menjadi pedoman yang mudah dipahami oleh seluruh jajaran pengurus BUMDes (Direktur, Bendahara, Admin, dan Karyawan). Dengan adanya sistem ini, diharapkan transparansi dan efisiensi pengelolaan BUMDes semakin meningkat.',
          style: 'paragraph' 
        },

        { text: 'PERSYARATAN SISTEM', style: 'h2' },
        {
          ul: [
            { text: 'Koneksi Internet: Sistem ini berbasis Cloud (Web-Based), sehingga membutuhkan koneksi internet (Wi-Fi/Kuota) agar bisa melakukan transaksi secara real-time.', style: 'listItem' },
            { text: 'Perangkat: Bisa dibuka melalui Laptop, Komputer Kasir (PC), Tablet, maupun Smartphone (HP).', style: 'listItem' },
            { text: 'Browser Rekomendasi: Gunakan Google Chrome, Mozilla Firefox, atau Safari versi terbaru untuk performa dan tampilan terbaik.', style: 'listItem' }
          ]
        },
        { text: 'Jepara, 2024\n\n\n\nTim Penyusun', style: 'paragraph', alignment: 'right', margin: [0, 30, 0, 0] as [number, number, number, number] },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 1 — PENDAHULUAN & AKSES SISTEM
        // ============================================================
        { text: 'BAB 1 — PENDAHULUAN & AKSES SISTEM', style: 'h1', tocItem: true },
        featureTable([
          ['Login Sistem', 'Melindungi data BUMDes agar hanya bisa diakses pengurus yang terdaftar.'],
          ['Dark Mode', 'Mengubah warna layar menjadi gelap agar mata tidak lelah saat bekerja malam.'],
          ['Navigasi Sidebar', 'Menu samping untuk berpindah antar halaman (Dashboard, Kasir, Stok, dll).'],
        ]),

        { text: '1.1 Cara Login ke Dalam Sistem', style: 'h2' },
        screenshotBox('Halaman Login Aplikasi', loginImg),
        {
          ol: [
            { text: 'Buka alamat website sistem BUMDes melalui browser (Google Chrome/Safari) di Laptop atau HP Anda.', style: 'listItem' },
            { text: 'Masukkan Email dan Password yang telah didaftarkan oleh Admin.', style: 'listItem' },
            { text: 'Klik tombol "Masuk ke Sistem". Jika berhasil, Anda akan langsung diarahkan ke halaman Dashboard.', style: 'listItem' },
            { text: 'Jika muncul pesan "Email atau Password salah", periksa kembali ejaan email dan password Anda. Jika lupa password, hubungi Admin atau Direktur BUMDes.', style: 'listItem' },
          ]
        },

        { text: '1.2 Navigasi & Tampilan (Dark Mode)', style: 'h2' },
        {
          ol: [
            { text: 'Di sebelah kiri layar terdapat Sidebar (Menu Samping) untuk berpindah halaman.', style: 'listItem' },
            { text: 'Jika Anda menggunakan HP, klik ikon Garis Tiga (☰) di pojok kiri atas untuk memunculkan menu.', style: 'listItem' },
            { text: 'Untuk mengaktifkan Tema Gelap, klik ikon Bulan di pojok kanan atas. Klik ikon Matahari untuk mengembalikan ke Tema Terang.', style: 'listItem' },
            { text: 'Klik foto profil/avatar Anda di kanan atas untuk membuka menu Profil, Ubah Password, atau Keluar Sistem.', style: 'listItem' },
          ]
        },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 2 — MODUL DASHBOARD & ANALITIK
        // ============================================================
        { text: 'BAB 2 — MODUL DASHBOARD & ANALITIK', style: 'h1', tocItem: true },
        featureTable([
          ['Kartu Statistik', 'Menampilkan Saldo Kas, Total Pendapatan, Jumlah Macam Barang, Total Transaksi, dan Nilai Aset Tetap.'],
          ['Grafik Pendapatan vs Pengeluaran', 'Grafik garis area interaktif per bulan untuk melihat tren keuangan tahunan.'],
          ['Grafik Sumber Pendapatan', 'Grafik donat yang menampilkan porsi pemasukan per unit usaha (Parkir, Toko, dll).'],
          ['Barang Terlaris', 'Peringkat 5 barang paling banyak terjual.'],
          ['Dashboard Publik', 'Halaman statistik anonim yang bisa dipasang di website desa untuk transparansi.'],
          ['Laporan Transaksi', 'Riwayat penjualan kasir dengan filter mingguan/bulanan/tahunan dan grafik batang.'],
        ]),

        { text: '2.1 Dashboard Utama (Halaman Setelah Login)', style: 'h2' },
        screenshotBox('Tampilan Dashboard dengan Grafik', dashboardImg),
        {
          ol: [
            { text: 'Perhatikan 5 Kotak Statistik di bagian atas: Saldo Kas, Total Pendapatan, Macam Barang, Total Transaksi, dan Aset Tetap.', style: 'listItem' },
            { text: 'Lihat Grafik Garis Area di bagian tengah. Grafik ini menampilkan tren Pendapatan (hijau) vs Pengeluaran (merah) per bulan selama setahun, dengan satuan angka pintar ("Jt" untuk jutaan).', style: 'listItem' },
            { text: 'Grafik Donat menunjukkan porsi sumber dana per unit usaha. Warna donat berubah dinamis sesuai jumlah unit usaha yang aktif.', style: 'listItem' },
            { text: 'Tabel Barang Terlaris di bagian bawah menampilkan 5 produk yang paling banyak terjual.', style: 'listItem' },
          ]
        },

        { text: '2.2 Dashboard Publik', style: 'h2' },
        { text: 'Sistem juga dilengkapi Dashboard Publik yang dapat diakses tanpa login melalui alamat "/public-dashboard". Dashboard ini menampilkan statistik anonim (tanpa data rahasia perusahaan) yang bisa dipasang (di-embed) ke website resmi desa untuk transparansi informasi keuangan BUMDes kepada masyarakat.', style: 'paragraph' },

        { text: '2.3 Laporan Transaksi', style: 'h2' },
        { text: 'Menu Laporan Transaksi menampilkan riwayat penjualan Kasir dengan fitur analitik lengkap.', style: 'paragraph' },
        {
          ol: [
            { text: 'Pilih periode laporan: Mingguan, Bulanan, atau Tahunan.', style: 'listItem' },
            { text: 'Pada mode Bulanan, pilih bulan dan tahun yang diinginkan. Pada mode Mingguan, pilih tanggal awal minggu.', style: 'listItem' },
            { text: 'Lihat ringkasan: Total Pendapatan, Jumlah Transaksi, Total PPN, dan Rata-rata per Transaksi.', style: 'listItem' },
            { text: 'Grafik batang menampilkan pendapatan per hari/bulan sesuai filter yang dipilih.', style: 'listItem' },
            { text: 'Klik "Export PDF" atau "Export Excel" untuk mengunduh laporan resmi dengan kop surat BUMDes.', style: 'listItem' },
          ]
        },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 3 — MODUL KASIR (POINT OF SALE)
        // ============================================================
        { text: 'BAB 3 — MODUL KASIR (POINT OF SALE)', style: 'h1', tocItem: true },
        featureTable([
          ['Cari & Scan Barang', 'Memasukkan barang ke keranjang belanja menggunakan pencarian nama atau scan barcode.'],
          ['Produk Custom', 'Menambahkan barang/jasa yang belum terdaftar di database (misal: Jasa Fotokopi).'],
          ['PPN Otomatis', 'Menghitung pajak PPN secara otomatis sesuai tarif per barang (0%, 2%, 11%, dll).'],
          ['Metode Pembayaran', 'Mendukung 3 metode: Tunai (dengan perhitungan kembalian), QRIS, dan Transfer Bank.'],
          ['Cetak Struk', 'Menyimpan transaksi dan mencetak struk/nota untuk pembeli.'],
          ['Riwayat & Reprint', 'Melihat semua riwayat transaksi lama dan mencetak ulang struk.'],
        ]),

        { text: '3.1 Cara Melakukan Transaksi Penjualan', style: 'h2' },
        screenshotBox('Tampilan Menu Kasir & Keranjang', kasirImg),
        {
          ol: [
            { text: 'Buka menu Kasir (POS) di sidebar.', style: 'listItem' },
            { text: 'Cari barang dengan mengetik nama di kolom pencarian, atau tembakkan alat Scan Barcode ke kemasan produk.', style: 'listItem' },
            { text: 'Klik barang yang muncul untuk memasukkannya ke Keranjang Belanja di sebelah kanan. Gunakan tombol + dan - untuk mengubah jumlah.', style: 'listItem' },
            { text: 'Jika pembeli membeli layanan atau barang yang belum terdaftar, klik ikon "+" (Produk Custom), lalu ketik nama jasa, harga, jumlah, dan tarif pajak.', style: 'listItem' },
            { text: 'Pilih Metode Pembayaran: Tunai, QRIS, atau Transfer Bank.', style: 'listItem' },
            { text: 'Jika Tunai, ketikkan jumlah uang yang diberikan pembeli di kolom "Uang Bayar". Sistem otomatis menampilkan nominal Kembalian.', style: 'listItem' },
            { text: 'Pajak PPN dihitung otomatis berdasarkan tarif pajak masing-masing barang dan langsung tercatat di Jurnal PPN Keluaran.', style: 'listItem' },
            { text: 'Klik "Cetak Struk" untuk menyimpan transaksi dan mencetak nota. Atau klik "Simpan Data" jika pembeli tidak meminta struk.', style: 'listItem' },
          ]
        },
        
        calloutBox('Catatan Penting: Otomatisasi Kasir', 'Setiap transaksi di Kasir akan secara OTOMATIS:\n1. Mengurangi sisa stok barang yang terjual\n2. Menambah saldo masuk di Buku Kas\n3. Membuat jurnal pembukuan akuntansi (debit Kas, kredit Pendapatan)\n4. Membuat jurnal HPP jika barang memiliki harga beli\n5. Mencatat PPN Keluaran jika barang kena pajak\n\nAnda TIDAK PERLU mencatatnya lagi secara manual!', 'warning'),

        { text: '3.2 Riwayat Transaksi & Cetak Ulang Struk', style: 'h2' },
        {
          ol: [
            { text: 'Di dalam menu Kasir, klik tab "Riwayat" di bagian atas.', style: 'listItem' },
            { text: 'Cari transaksi lama berdasarkan Nomor Invoice, Nama Kasir, atau Tanggal.', style: 'listItem' },
            { text: 'Klik tombol "Detail" pada transaksi yang diinginkan untuk melihat rincian barang yang dibeli.', style: 'listItem' },
            { text: 'Di dalam modal Detail, klik "Cetak Ulang" untuk mencetak ulang struk (Reprint) — berguna jika printer mati atau kertas habis saat transaksi.', style: 'listItem' },
          ]
        },

        dataFlowBox([
          'Stok Barang berkurang otomatis sesuai jumlah yang dibeli',
          'Buku Kas bertambah (kolom Debit / Kas Masuk) di kategori "Penjualan Toko"',
          'Jurnal Umum otomatis dibuat: Debit akun Kas Tunai, Kredit akun Pendapatan Penjualan',
          'Jurnal HPP otomatis: Debit akun HPP, Kredit akun Persediaan Barang (jika ada harga beli)',
          'PPN Keluaran tercatat otomatis jika barang memiliki tarif pajak > 0%',
          'Muncul di Laporan Laba Rugi sebagai Pendapatan',
          'Muncul di Dashboard (Saldo Kas, Grafik Pendapatan, Barang Terlaris)',
          'Muncul di Laporan Transaksi untuk rekap penjualan',
        ]),
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 4 — MODUL STOK BARANG & INVENTARIS
        // ============================================================
        { text: 'BAB 4 — MODUL STOK BARANG & INVENTARIS', style: 'h1', tocItem: true },
        featureTable([
          ['Tambah/Edit Barang', 'Mendaftarkan atau mengedit barang dagangan (nama, SKU, harga beli, harga jual, stok, pajak).'],
          ['Kartu Stok', 'Melihat riwayat keluar/masuk setiap barang secara kronologis.'],
          ['Import Excel Massal', 'Menambahkan ratusan barang sekaligus menggunakan file Excel.'],
          ['Inventaris Barang', 'Mendata aset tetap BUMDes (meja, kursi, komputer) yang bukan barang dagangan.'],
          ['Arsip Surat', 'Mengelola arsip surat masuk dan surat keluar BUMDes.'],
          ['Notulen Rapat', 'Mencatat dan mencetak notulen rapat resmi dalam format PDF ber-KOP.'],
          ['Dokumentasi Kegiatan', 'Mendokumentasikan kegiatan BUMDes beserta foto-foto.'],
        ]),

        { text: '4.1 Cara Menambahkan Barang Dagangan Baru', style: 'h2' },
        screenshotBox('Form Tambah Barang Stok', stokTambahImg),
        {
          ol: [
            { text: 'Buka menu Stok Barang, pastikan Anda berada di tab "Manajemen Stok".', style: 'listItem' },
            { text: 'Klik tombol "+ Tambah Barang" di pojok kanan atas.', style: 'listItem' },
            { text: 'Isi Kode SKU (bisa diisi dengan men-scan barcode di kemasan produk) dan Nama Barang.', style: 'listItem' },
            { text: 'Pilih Kategori barang (ATK, Kebutuhan Pokok, Minuman, dll).', style: 'listItem' },
            { text: 'Isi Harga Beli (modal/HPP) dan Harga Jual (untuk pelanggan).', style: 'listItem' },
            { text: 'Pilih persentase Pajak (0%, 2%, 11%, dll) jika barang tersebut dikenakan pajak PPN.', style: 'listItem' },
            { text: 'Isi Jumlah Stok Awal yang ada di toko, lalu klik "Simpan".', style: 'listItem' },
          ]
        },

        { text: '4.2 Kartu Stok (Riwayat Keluar-Masuk)', style: 'h2' },
        {
          ol: [
            { text: 'Klik tab "Kartu Stok" di bagian atas halaman Stok Barang.', style: 'listItem' },
            { text: 'Pilih nama barang dari dropdown. Sistem akan menampilkan seluruh riwayat pergerakan stok barang tersebut.', style: 'listItem' },
            { text: 'Setiap baris menunjukkan: tanggal, tipe (Masuk/Keluar), jumlah, harga satuan, total harga, dan keterangan.', style: 'listItem' },
            { text: 'Contoh: Ketika barang terjual di Kasir, akan tercatat sebagai "OUT" (Keluar) di Kartu Stok.', style: 'listItem' },
          ]
        },

        { text: '4.3 Import Barang via Excel (Massal)', style: 'h2' },
        {
          ol: [
            { text: 'Jika BUMDes memiliki ratusan barang, Anda tidak perlu menginput satu per satu.', style: 'listItem' },
            { text: 'Klik tombol "Import Excel" di menu Stok Barang.', style: 'listItem' },
            { text: 'Klik "Download Template" untuk mengunduh template Excel yang sudah diformat.', style: 'listItem' },
            { text: 'Isi data barang di Excel tersebut dengan kolom: SKU, Nama Barang, Kategori, Harga Jual, Harga Beli, Stok, dan Pajak (%).', style: 'listItem' },
            { text: 'Simpan file Excel, lalu Upload kembali ke sistem. Ratusan barang akan otomatis masuk ke database.', style: 'listItem' },
          ]
        },
        calloutBox('Tips: Import Update', 'Jika SKU barang yang di-import sudah ada di database, sistem akan otomatis meng-update data barang tersebut (bukan membuat duplikat).', 'info'),

        { text: '4.4 Inventaris (Aset Tetap BUMDes)', style: 'h2' },
        { text: 'Menu Inventaris & Arsip memiliki 4 sub-tab:', style: 'paragraph' },
        {
          ul: [
            { text: 'Inventaris Barang: Untuk mendata aset tetap milik BUMDes (Meja, Kursi, Komputer, Kendaraan). Setiap item memiliki data: Nama, Kategori, Jumlah, Kondisi, Lokasi, Tanggal Perolehan, Biaya Perolehan, dan Catatan.', style: 'listItem' },
            { text: 'Arsip Surat: Mencatat surat masuk dan surat keluar BUMDes dengan nomor surat, tanggal, perihal, dan pengirim/penerima.', style: 'listItem' },
            { text: 'Notulen Rapat: Mencatat hasil rapat BUMDes. Anda dapat langsung mencetak notulen dalam format PDF resmi ber-KOP BUMDes.', style: 'listItem' },
            { text: 'Dokumentasi Kegiatan: Mendokumentasikan kegiatan BUMDes dengan judul, tanggal, deskripsi, dan lokasi.', style: 'listItem' },
          ]
        },
        calloutBox('Perbedaan Stok Barang vs Inventaris', 'Stok Barang = barang dagangan yang dijual ke pelanggan lewat Kasir (habis saat terjual).\nInventaris = aset tetap milik BUMDes yang tidak dijual (contoh: meja kantor, komputer).\nKeduanya dicatat di menu yang berbeda agar tidak tercampur.', 'info'),

        dataFlowBox([
          'Tambah/edit barang dagangan HANYA memengaruhi Modul Stok & Kartu Stok',
          'Stok TIDAK memengaruhi Buku Kas sampai barang benar-benar terjual lewat Kasir',
          'Inventaris (aset tetap) tercatat terpisah dan masuk ke perhitungan Neraca sebagai Aset Tetap',
        ]),
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 5 — MODUL HUTANG & PIUTANG
        // ============================================================
        { text: 'BAB 5 — MODUL HUTANG & PIUTANG', style: 'h1', tocItem: true },
        featureTable([
          ['Catat Piutang', 'Mencatat tagihan kepada warga/pelanggan yang belum dibayar (kasbon).'],
          ['Catat Utang', 'Mencatat hutang BUMDes kepada pihak luar (supplier/vendor).'],
          ['Tandai Lunas', 'Menandai hutang/piutang yang sudah dibayar lunas.'],
          ['Batalkan Lunas', 'Mengembalikan status menjadi "Belum Lunas" jika terjadi kesalahan.'],
          ['Edit & Hapus', 'Mengubah nominal, tanggal jatuh tempo, atau menghapus data.'],
          ['Kelola Kontak', 'Menambahkan data kontak pelanggan/supplier (nama, tipe, nomor telepon).'],
        ]),

        { text: '5.1 Cara Mencatat Piutang (Kasbon Warga)', style: 'h2' },
        screenshotBox('Tabel Piutang Pelanggan', piutangImg),
        {
          ol: [
            { text: 'Buka menu Hutang Piutang, pastikan Anda berada di tab "Piutang".', style: 'listItem' },
            { text: 'Jika kontak pelanggan belum ada, klik "Tambah Kontak" untuk mendaftarkan nama, tipe (Customer/Supplier), dan nomor telepon.', style: 'listItem' },
            { text: 'Klik tombol "+ Catat Piutang". Pilih nama kontak, masukkan nominal piutang, tanggal jatuh tempo (opsional), dan catatan.', style: 'listItem' },
            { text: 'Klik "Simpan". Piutang akan tercatat dengan status "Belum Lunas".', style: 'listItem' },
          ]
        },

        { text: '5.2 Cara Mencatat Utang BUMDes', style: 'h2' },
        {
          ol: [
            { text: 'Pindah ke tab "Utang".', style: 'listItem' },
            { text: 'Klik "+ Catat Utang". Pilih kontak supplier, masukkan nominal utang, tanggal jatuh tempo, dan catatan.', style: 'listItem' },
            { text: 'Klik "Simpan". Utang akan tercatat dengan status "Belum Lunas".', style: 'listItem' },
          ]
        },

        { text: '5.3 Cara Melunasi Hutang/Piutang', style: 'h2' },
        {
          ol: [
            { text: 'Pada baris hutang/piutang yang ingin dilunasi, klik tombol centang hijau (Tandai Lunas).', style: 'listItem' },
            { text: 'Konfirmasi pada dialog yang muncul. Status akan berubah menjadi "Lunas".', style: 'listItem' },
            { text: 'Jika terjadi kesalahan, klik tombol "Batalkan Lunas" untuk mengembalikan status.', style: 'listItem' },
          ]
        },

        dataFlowBox([
          'Saat CATAT piutang baru: Jurnal Umum otomatis dibuat (Debit Piutang Usaha, Kredit Kas Tunai)',
          'Saat CATAT utang baru: Jurnal Umum otomatis dibuat (Debit Kas Tunai, Kredit Utang Usaha)',
          'Saat LUNASI piutang: Kas bertambah (Debit Kas), Piutang berkurang (Kredit Piutang)',
          'Saat LUNASI utang: Utang berkurang (Debit Utang), Kas berkurang (Kredit Kas)',
          'Semua jurnal muncul di Buku Besar, Neraca Saldo, dan Neraca',
        ]),
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 6 — BUKU KAS & AKUNTANSI OTOMATIS
        // ============================================================
        { text: 'BAB 6 — BUKU KAS & AKUNTANSI OTOMATIS', style: 'h1', tocItem: true },
        { text: 'Ini adalah jantung dari sistem pelaporan BUMDes. Sistem menggunakan standar Akuntansi Double-Entry yang berjalan secara otomatis setiap kali Anda melakukan transaksi di Kasir, Buku Kas, atau Hutang Piutang.', style: 'paragraph' },

        featureTable([
          ['Buku Kas Umum', 'Mencatat seluruh arus uang masuk dan keluar, baik otomatis dari Kasir maupun manual.'],
          ['Kas Tunai & Kas Bank', 'Memisahkan pencatatan kas laci/tunai dengan kas rekening bank.'],
          ['Lampiran Bukti', 'Mengupload foto bukti transaksi (nota, kwitansi) ke setiap entri Buku Kas.'],
          ['Setor Pemasukan', 'Mencatat pemasukan dari unit usaha lain (Parkir, Agen Internet, Pengasapan Lele, dll).'],
          ['Catat Pengeluaran', 'Mencatat biaya operasional (listrik, gaji, pembelian ATK, dll).'],
          ['Laporan Laba Rugi', 'Menampilkan Pendapatan - HPP - Beban = Laba Bersih.'],
          ['Neraca', 'Menampilkan posisi keuangan: Aset = Kewajiban + Modal.'],
          ['Jurnal Umum', 'Catatan mentah seluruh transaksi (otomatis & manual) dengan debit-kredit.'],
          ['Buku Besar', 'Mutasi per akun tertentu (misal: hanya akun Kas Tunai atau Pendapatan Parkir).'],
          ['Neraca Saldo', 'Ringkasan total debit & kredit seluruh akun untuk memastikan keseimbangan.'],
          ['LPE', 'Laporan Perubahan Ekuitas — melacak perubahan modal dari awal periode.'],
          ['LAK', 'Laporan Arus Kas — aliran uang riil berdasarkan aktivitas Operasi, Investasi, Pendanaan.'],
          ['Kelola Akun (COA)', 'Menambah/mengedit kode akun akuntansi (Chart of Accounts).'],
          ['Tutup Buku', 'Mengunci transaksi pada bulan tertentu agar tidak bisa diubah.'],
        ]),

        { text: '6.1 Buku Kas (Arus Kas Harian)', style: 'h2' },
        {
          ol: [
            { text: 'Buka menu Buku Kas. Pilih tab "Kas Tunai (Laci)" atau "Kas Bank (Rekening)" sesuai kebutuhan.', style: 'listItem' },
            { text: 'Pilih bulan dan tahun yang ingin dilihat. Saldo Awal, Total Masuk, Total Keluar, dan Saldo Akhir ditampilkan otomatis.', style: 'listItem' },
            { text: 'Pemasukan dari Kasir sudah OTOMATIS masuk ke sini — Anda tidak perlu mengetik ulang.', style: 'listItem' },
            { text: 'Untuk entri manual, klik "+ Tambah Entri". Pilih tipe (Uang Masuk/Keluar), isi tanggal, keterangan, kategori, dan nominal.', style: 'listItem' },
            { text: 'Anda dapat mengupload foto bukti transaksi (nota/kwitansi) saat menambah entri.', style: 'listItem' },
            { text: 'Gunakan filter pencarian dan kategori untuk menemukan entri tertentu.', style: 'listItem' },
            { text: 'Klik "Export PDF" atau "Export Excel" untuk mengunduh laporan Buku Kas bulan tersebut.', style: 'listItem' },
          ]
        },
        calloutBox('Catatan: Periode Tertutup', 'Jika suatu bulan sudah di-"Tutup Buku" di menu Akuntansi, maka entri Buku Kas pada bulan tersebut tidak bisa ditambah, diubah, atau dihapus. Ini untuk menjaga integritas data laporan.', 'warning'),

        { text: '6.2 Setor Pemasukan (Unit Usaha Lain)', style: 'h2' },
        { text: 'Untuk mencatat pemasukan dari unit usaha selain toko (misal: Parkir, Agen Internet, Pengasapan Lele, Samsat), gunakan tombol "Setor Pemasukan" di menu Akuntansi.', style: 'paragraph' },
        {
          ol: [
            { text: 'Pilih Sumber Pemasukan dari daftar unit usaha yang tersedia.', style: 'listItem' },
            { text: 'Masukkan nominal dan keterangan.', style: 'listItem' },
            { text: 'Sistem akan otomatis membuat jurnal: Debit Kas Tunai, Kredit akun Pendapatan sesuai unit usaha.', style: 'listItem' },
          ]
        },

        { text: '6.3 Catat Pengeluaran', style: 'h2' },
        {
          ol: [
            { text: 'Klik tombol "Catat Pengeluaran" di menu Akuntansi.', style: 'listItem' },
            { text: 'Masukkan nominal dan keterangan (misal: "Bayar Listrik Bulan Agustus").', style: 'listItem' },
            { text: 'Sistem membuat jurnal otomatis: Debit Beban Administrasi, Kredit Kas Tunai.', style: 'listItem' },
          ]
        },

        { text: '6.4 Laporan Laba Rugi', style: 'h2' },
        screenshotBox('Laporan Laba Rugi Akuntansi', akuntansiImg),
        {
          ol: [
            { text: 'Buka menu Akuntansi, klik tab "Laba Rugi". Anda akan langsung melihat laporan keuangan tanpa perlu menghitung manual.', style: 'listItem' },
            { text: 'Pendapatan: Total pemasukan dari semua sumber (Penjualan Toko, Parkir, dll).', style: 'listItem' },
            { text: 'HPP: Harga Pokok Penjualan (harga modal barang yang sudah laku).', style: 'listItem' },
            { text: 'Laba Kotor = Pendapatan - HPP.', style: 'listItem' },
            { text: 'Beban Operasional: Biaya-biaya (listrik, gaji, ATK, dll).', style: 'listItem' },
            { text: 'Laba Bersih = Laba Kotor - Beban Operasional. Ini keuntungan murni BUMDes.', style: 'listItem' },
            { text: 'Gunakan filter periode (Semua, Bulan Ini, 3 Bulan, 6 Bulan) dan klik Export PDF/Excel.', style: 'listItem' },
          ]
        },

        { text: '6.5 Neraca', style: 'h2' },
        { text: 'Tab Neraca menunjukkan posisi keuangan BUMDes pada suatu periode:', style: 'paragraph' },
        {
          ul: [
            { text: 'Aktiva (Aset): Kas Tunai + Piutang + Persediaan + Aset Tetap.', style: 'listItem' },
            { text: 'Kewajiban (Hutang): Utang Usaha, PPN Keluaran.', style: 'listItem' },
            { text: 'Ekuitas (Modal): Modal awal + Laba Bersih periode berjalan.', style: 'listItem' },
            { text: 'Rumus: Total Aset = Total Kewajiban + Total Ekuitas. Jika seimbang, pembukuan Anda benar.', style: 'listItem' },
          ]
        },

        { text: '6.6 Akuntansi Lanjutan', style: 'h2' },
        { text: 'Sistem menggunakan standar Chart of Accounts (COA) 5-Level untuk klasifikasi akun. Tab-tab berikut tersedia:', style: 'paragraph' },
        {
          ul: [
            { text: 'Jurnal Umum: "Buku catatan mentah" dari SEMUA transaksi. Setiap baris menunjukkan akun, debit, kredit, dan keterangan. Jurnal dibuat otomatis dari Kasir, Buku Kas, dan Hutang Piutang, tapi Anda juga bisa menghapus jurnal manual.', style: 'listItem' },
            { text: 'Buku Besar: Mengelompokkan jurnal per akun. Pilih akun dari dropdown (misal: "Kas Tunai") untuk melihat semua mutasi dan saldo berjalan akun tersebut.', style: 'listItem' },
            { text: 'Neraca Saldo: Ringkasan total Debit dan Kredit seluruh akun aktif. Jika total Debit = total Kredit, pembukuan seimbang.', style: 'listItem' },
            { text: 'LPE (Laporan Perubahan Ekuitas): Melacak perubahan modal BUMDes dari modal awal, ditambah laba ditahan, hingga modal akhir.', style: 'listItem' },
            { text: 'LAK (Laporan Arus Kas): Melihat aliran uang riil berdasarkan 3 aktivitas: Operasi (kegiatan usaha sehari-hari), Investasi (beli/jual aset), dan Pendanaan (modal/deviden).', style: 'listItem' },
            { text: 'Kelola Akun (COA): Menambah, mengedit, atau melihat daftar kode akun akuntansi. Setiap akun memiliki Kode, Nama, dan Tipe (Asset/Liability/Equity/Revenue/Expense).', style: 'listItem' },
          ]
        },

        { text: '6.7 Tutup Buku Bulanan', style: 'h2' },
        {
          ol: [
            { text: 'Di menu Akuntansi, klik tombol "Tutup Buku".', style: 'listItem' },
            { text: 'Pilih bulan dan tahun yang ingin ditutup.', style: 'listItem' },
            { text: 'Setelah dikonfirmasi, seluruh transaksi pada periode tersebut akan DIKUNCI — tidak bisa ditambah, diubah, atau dihapus lagi.', style: 'listItem' },
            { text: 'Fitur ini hanya tersedia untuk Admin, Direktur, Akuntan, dan Bendahara.', style: 'listItem' },
          ]
        },

        { text: '6.8 Export Laporan Keuangan', style: 'h2' },
        {
          ol: [
            { text: 'Setiap tab laporan (Laba Rugi, Neraca, Neraca Saldo, LPE, LAK) memiliki tombol "Export PDF" dan "Export Excel".', style: 'listItem' },
            { text: 'Laporan PDF langsung berformat resmi dengan kop surat BUMDes, tanda tangan Bendahara & Direktur, dan nomor halaman.', style: 'listItem' },
            { text: 'Untuk mengunduh SEMUA laporan sekaligus dalam satu file Excel (multi-sheet), klik "Export Semua ke Excel".', style: 'listItem' },
          ]
        },

        // ---------- DIAGRAM ALUR TRANSAKSI ----------
        { text: '6.9 Diagram Alur: Perjalanan Satu Transaksi Kasir', style: 'h2' },
        { text: 'Diagram berikut menunjukkan bagaimana satu transaksi penjualan di Kasir mengalir ke seluruh laporan keuangan secara otomatis:', style: 'paragraph' },
        {
          table: {
            widths: ['*'],
            body: [
              [{ text: 'DIAGRAM ALUR TRANSAKSI', bold: true, fontSize: 12, alignment: 'center', color: '#166534', margin: [0, 8, 0, 12], fillColor: '#F0FDF4' }],
              [{
                stack: [
                  { text: '┌─────────────────────────────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '│     PELANGGAN MEMBELI DI KASIR (POS)    │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a', bold: true },
                  { text: '└────────────────────┬────────────────────┘', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '                     ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '   ┌─────────────────┴──────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '   ↓                                    ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '┌──────────────────┐    ┌──────────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '│ STOK BERKURANG   │    │ BUKU KAS BERTAMBAH   │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a', bold: true },
                  { text: '│ (Kartu Stok: OUT)│    │ (Debit: Kas Masuk)   │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '└──────────────────┘    └──────────┬───────────┘', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '                                   ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '                     ┌─────────────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '                     │  JURNAL UMUM OTOMATIS   │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a', bold: true },
                  { text: '                     │ (Debit Kas = Kredit     │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '                     │  Pendapatan + HPP)      │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '                     └────────────┬────────────┘', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '                                  ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '              ┌───────────────────┴──────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '              ↓                                      ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '   ┌──────────────────┐               ┌──────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '   │    BUKU BESAR    │               │  NERACA SALDO    │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a', bold: true },
                  { text: '   │ (mutasi per akun)│               │ (total D = K)    │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '   └────────┬─────────┘               └──────────────────┘', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '            ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '   ┌────────┴─────────────────────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '   ↓                                          ↓', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#4F46E5', bold: true },
                  { text: '┌──────────────────┐               ┌──────────────────┐', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '│  LABA RUGI       │               │    NERACA        │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a', bold: true },
                  { text: '│ (+Pendapatan,    │               │ (+Aset Kas,      │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '│  -HPP, -Beban)   │               │  -Persediaan)    │', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                  { text: '└──────────────────┘               └──────────────────┘', font: 'Roboto', fontSize: 9, alignment: 'center', color: '#1a1a1a' },
                ],
                margin: [10, 10, 10, 10],
                fillColor: '#FAFFFE'
              }]
            ]
          },
          layout: {
            hLineWidth: () => 1, vLineWidth: () => 1,
            hLineColor: () => '#86EFAC', vLineColor: () => '#86EFAC',
          },
          margin: [0, 5, 0, 15]
        },

        calloutBox('Hubungan Antar Laporan — Ringkasan',
          'Jurnal Umum = catatan mentah SEMUA transaksi (otomatis & manual)\n' +
          'Buku Besar = mengelompokkan jurnal per akun\n' +
          'Neraca Saldo = memastikan total Debit = total Kredit\n' +
          'Laba Rugi = hasil usaha per periode (Pendapatan - Biaya)\n' +
          'Neraca = posisi akhir (Aset = Kewajiban + Modal)\n' +
          'LPE = perubahan modal (Modal Awal + Laba Ditahan)\n' +
          'LAK = aliran kas riil (Operasi + Investasi + Pendanaan)',
          'info'),

        dataFlowBox([
          'Transaksi Kasir → otomatis masuk Buku Kas + Jurnal Umum → muncul di semua laporan',
          'Entri manual Buku Kas → Jurnal dibuat otomatis → muncul di Laba Rugi jika kategori pendapatan/beban',
          'Setor Pemasukan → Jurnal: Debit Kas, Kredit Pendapatan sesuai unit usaha',
          'Catat Pengeluaran → Jurnal: Debit Beban, Kredit Kas → muncul di Laba Rugi sebagai Beban',
          'Pelunasan Piutang → Kas bertambah, Piutang berkurang di Neraca',
        ]),
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 7 — PENGATURAN & STRUKTUR ORGANISASI
        // ============================================================
        { text: 'BAB 7 — PENGATURAN & STRUKTUR ORGANISASI', style: 'h1', tocItem: true },
        featureTable([
          ['Profil Usaha', 'Mengatur nama toko, alamat, dan nomor telepon/WA yang tampil di struk dan laporan.'],
          ['Manajemen Pengurus', 'Menambah, menghapus, dan mengubah password akun pengurus BUMDes.'],
          ['Struktur Organisasi', 'Menampilkan bagan hierarki kepengurusan BUMDes secara visual.'],
          ['Role/Hak Akses', 'Membatasi akses menu berdasarkan jabatan (Admin, Direktur, Karyawan, Pengawas).'],
        ]),

        { text: '7.1 Profil Usaha', style: 'h2' },
        {
          ol: [
            { text: 'Buka menu Pengaturan, tab "Profil Usaha".', style: 'listItem' },
            { text: 'Isi Nama Toko/Usaha BUMDes, Alamat Lengkap, dan Nomor Telepon/WhatsApp.', style: 'listItem' },
            { text: 'Klik "Simpan Perubahan". Informasi ini akan muncul pada kop Struk Kasir dan Laporan PDF/Excel.', style: 'listItem' },
          ]
        },

        { text: '7.2 Manajemen Pengurus (Akun)', style: 'h2' },
        {
          ol: [
            { text: 'Buka tab "Manajemen Pengurus" di menu Pengaturan. Tab ini hanya muncul untuk Admin dan Direktur.', style: 'listItem' },
            { text: 'Untuk menambah pengurus baru: isi Nama, Jabatan (Role), Email, dan Password, lalu klik "Tambah Pengurus".', style: 'listItem' },
            { text: 'Untuk mengubah password pengurus: klik ikon kunci di sebelah nama pengurus, masukkan password baru.', style: 'listItem' },
            { text: 'Untuk menghapus pengurus: klik ikon tempat sampah. Akun akan dihapus dari database dan sistem login.', style: 'listItem' },
          ]
        },

        { text: '7.3 Hak Akses (Role-Based Access)', style: 'h2' },
        { text: 'Untuk menjaga keamanan data, sistem membatasi akses menu berdasarkan jabatan (Role):', style: 'paragraph' },
        {
          table: {
            headerRows: 1,
            widths: ['25%', '75%'],
            body: [
              [{ text: 'Jabatan', style: 'tableHeader' }, { text: 'Hak Akses', style: 'tableHeader' }],
              [{ text: 'Admin, Direktur, Bendahara, Akuntan, Sekretaris', style: 'tableCell' }, { text: 'Akses PENUH ke semua menu (Dashboard, Kasir, Stok, Inventaris, Hutang Piutang, Buku Kas, Akuntansi, Laporan, Pengaturan, Struktur Organisasi, Profil).', style: 'tableCell' }],
              [{ text: 'Pengawas', style: 'tableCell' }, { text: 'Hanya MEMBACA (Read-Only): Dashboard, Akuntansi, Laporan Transaksi, Buku Kas, dan Inventaris. Tidak bisa menambah, mengubah, atau menghapus data.', style: 'tableCell' }],
              [{ text: 'Karyawan', style: 'tableCell' }, { text: 'Akses TERBATAS: Hanya Dashboard, Kasir (POS), dan Stok Barang. Tidak bisa melihat laporan keuangan atau pengaturan.', style: 'tableCell' }],
            ]
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: (i: number) => i <= 1 ? '#4F46E5' : '#E2E8F0',
            vLineColor: () => '#E2E8F0',
            paddingLeft: () => 6, paddingRight: () => 6,
            paddingTop: () => 5, paddingBottom: () => 5,
          },
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },

        { text: '7.4 Struktur Organisasi', style: 'h2' },
        { text: 'Menu Struktur Organisasi menampilkan bagan kepengurusan BUMDes secara visual dengan hierarki:', style: 'paragraph' },
        {
          ol: [
            { text: 'Musyawarah Desa (MUSDES) — Forum tertinggi pengambil keputusan.', style: 'listItem' },
            { text: 'Penasihat (Kepala Desa) — Memberikan arahan dan pengawasan struktural.', style: 'listItem' },
            { text: 'Pengawas — Mengawasi operasional dan keuangan BUMDes.', style: 'listItem' },
            { text: 'Direktur BUMDes — Memimpin operasional sehari-hari.', style: 'listItem' },
            { text: 'Sekretaris & Bendahara — Mengurus administrasi dan keuangan.', style: 'listItem' },
            { text: 'Manager Unit Usaha — Mengelola unit usaha tertentu.', style: 'listItem' },
            { text: 'Karyawan / Staff — Menjalankan operasional teknis (Kasir, dll).', style: 'listItem' },
          ]
        },
        { text: 'Anda dapat mengedit profil setiap pengurus (NIK, Jabatan, Pendidikan Terakhir, Foto) langsung dari halaman Struktur Organisasi dengan klik tombol Edit.', style: 'paragraph' },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 8 — PROFIL PENGGUNA & AVATAR
        // ============================================================
        { text: 'BAB 8 — PROFIL PENGGUNA & AVATAR', style: 'h1', tocItem: true },
        featureTable([
          ['Edit Profil', 'Memperbarui nama, email, telepon, NIK, pendidikan, dan jabatan.'],
          ['Upload Avatar', 'Mengunggah foto profil (maks 2MB) yang tampil di seluruh sistem.'],
        ]),

        { text: '8.1 Mengatur Profil & Detail Akun', style: 'h2' },
        {
          ol: [
            { text: 'Klik foto profil (atau inisial nama) Anda di pojok kanan atas layar.', style: 'listItem' },
            { text: 'Pilih menu "Profil Saya".', style: 'listItem' },
            { text: 'Anda dapat memperbarui: Nama, Email, Nomor Telepon/WhatsApp, NIK KTP, Pendidikan Terakhir, dan Jabatan Spesifik.', style: 'listItem' },
            { text: 'Klik "Simpan Profil". Perubahan akan tersinkronisasi dengan Pengaturan dan Struktur Organisasi.', style: 'listItem' },
          ]
        },
        calloutBox('Perhatian: Ubah Email', 'Jika Anda mengubah alamat email, sistem akan mengirim email verifikasi ke email baru DAN email lama. Anda harus mengklik link verifikasi di kedua email tersebut. Setelah verifikasi, Anda akan otomatis keluar dan perlu login kembali dengan email baru.', 'warning'),

        { text: '8.2 Mengganti Foto Profil (Avatar)', style: 'h2' },
        {
          ol: [
            { text: 'Di halaman Profil Saya, arahkan kursor (mouse) ke foto profil Anda yang berbentuk bulat.', style: 'listItem' },
            { text: 'Klik ikon Kamera yang muncul.', style: 'listItem' },
            { text: 'Pilih foto dari komputer atau HP (ukuran maksimal 2MB).', style: 'listItem' },
            { text: 'Foto akan otomatis diunggah dan langsung tampil di seluruh sistem, termasuk di Bagan Struktur Organisasi.', style: 'listItem' },
          ]
        },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 9 — GLOSARIUM
        // ============================================================
        { text: 'BAB 9 — GLOSARIUM (Kamus Istilah)', style: 'h1', tocItem: true },
        { text: 'Berikut adalah penjelasan sederhana istilah-istilah yang sering muncul dalam sistem:', style: 'paragraph' },
        {
          table: {
            headerRows: 1,
            widths: ['28%', '72%'],
            body: [
              [{ text: 'Istilah', style: 'tableHeader' }, { text: 'Penjelasan', style: 'tableHeader' }],
              [{ text: 'Debit', style: 'tableCellBold' }, { text: 'Sisi kiri pencatatan akuntansi. Untuk akun Kas dan Beban, debit berarti BERTAMBAH. Contoh: Kas masuk Rp 100.000 dicatat di kolom Debit.', style: 'tableCell' }],
              [{ text: 'Kredit', style: 'tableCellBold' }, { text: 'Sisi kanan pencatatan akuntansi. Untuk akun Pendapatan dan Hutang, kredit berarti BERTAMBAH. Contoh: Pendapatan Rp 100.000 dicatat di kolom Kredit.', style: 'tableCell' }],
              [{ text: 'Jurnal Umum', style: 'tableCellBold' }, { text: '"Buku catatan mentah" yang mencatat setiap kejadian keuangan menjadi dua sisi (Debit dan Kredit) agar seimbang.', style: 'tableCell' }],
              [{ text: 'Buku Besar', style: 'tableCellBold' }, { text: 'Kumpulan mutasi (pergerakan) dari satu akun tertentu. Misal: Buku Besar "Kas Tunai" menunjukkan semua uang yang masuk dan keluar di kas.', style: 'tableCell' }],
              [{ text: 'Neraca Saldo', style: 'tableCellBold' }, { text: 'Daftar ringkasan seluruh akun dengan total Debit dan Kredit masing-masing. Jika total Debit = total Kredit, artinya pembukuan seimbang (balance).', style: 'tableCell' }],
              [{ text: 'HPP', style: 'tableCellBold' }, { text: 'Harga Pokok Penjualan — harga modal (harga beli) dari barang yang sudah laku terjual. Contoh: beli semen Rp 50.000, jual Rp 65.000, maka HPP-nya Rp 50.000.', style: 'tableCell' }],
              [{ text: 'Laba Kotor', style: 'tableCellBold' }, { text: 'Pendapatan dikurangi HPP. Ini keuntungan "kasar" sebelum dipotong biaya operasional.', style: 'tableCell' }],
              [{ text: 'Laba Bersih', style: 'tableCellBold' }, { text: 'Laba Kotor dikurangi semua Beban Operasional (listrik, gaji, ATK, dll). Ini keuntungan murni BUMDes.', style: 'tableCell' }],
              [{ text: 'Aset', style: 'tableCellBold' }, { text: 'Harta milik BUMDes yang memiliki nilai ekonomi. Contoh: Kas, Piutang, Persediaan Barang, Komputer, Kendaraan.', style: 'tableCell' }],
              [{ text: 'Kewajiban', style: 'tableCellBold' }, { text: 'Hutang BUMDes kepada pihak lain. Contoh: Utang Usaha ke supplier, PPN yang belum disetor.', style: 'tableCell' }],
              [{ text: 'Modal / Ekuitas', style: 'tableCellBold' }, { text: 'Harta bersih BUMDes setelah dikurangi semua hutang. Modal = Aset - Kewajiban.', style: 'tableCell' }],
              [{ text: 'Neraca', style: 'tableCellBold' }, { text: 'Laporan posisi keuangan pada suatu waktu. Rumus: Aset = Kewajiban + Modal.', style: 'tableCell' }],
              [{ text: 'PPN Keluaran', style: 'tableCellBold' }, { text: 'Pajak Pertambahan Nilai yang dipungut dari pembeli saat penjualan. Dicatat otomatis jika barang memiliki tarif pajak > 0%.', style: 'tableCell' }],
              [{ text: 'Piutang', style: 'tableCellBold' }, { text: 'Uang yang menjadi hak BUMDes tapi belum diterima. Contoh: warga beli barang tapi belum bayar (kasbon).', style: 'tableCell' }],
              [{ text: 'Kasbon', style: 'tableCellBold' }, { text: 'Istilah sehari-hari untuk Piutang — warga "berhutang" ke BUMDes.', style: 'tableCell' }],
              [{ text: 'COA', style: 'tableCellBold' }, { text: 'Chart of Accounts — daftar kode akun akuntansi yang digunakan sistem. Contoh: 1.1.01.01 = Kas Tunai, 4.2.01.91 = Pendapatan Penjualan.', style: 'tableCell' }],
              [{ text: 'SKU', style: 'tableCellBold' }, { text: 'Stock Keeping Unit — kode unik untuk mengidentifikasi setiap barang dagangan. Bisa diisi dengan barcode produk.', style: 'tableCell' }],
              [{ text: 'LPE', style: 'tableCellBold' }, { text: 'Laporan Perubahan Ekuitas — menunjukkan perubahan modal BUMDes dari awal hingga akhir periode.', style: 'tableCell' }],
              [{ text: 'LAK', style: 'tableCellBold' }, { text: 'Laporan Arus Kas — menunjukkan aliran uang riil: dari mana uang masuk dan ke mana uang keluar, dibagi 3 kategori: Operasi, Investasi, Pendanaan.', style: 'tableCell' }],
              [{ text: 'Tutup Buku', style: 'tableCellBold' }, { text: 'Mengunci semua transaksi pada bulan tertentu agar tidak bisa diubah lagi. Dilakukan setiap akhir bulan untuk menjaga integritas laporan.', style: 'tableCell' }],
            ]
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: (i: number) => i <= 1 ? '#4F46E5' : '#E2E8F0',
            vLineColor: () => '#E2E8F0',
            paddingLeft: () => 6, paddingRight: () => 6,
            paddingTop: () => 4, paddingBottom: () => 4,
          },
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },
        { text: '', pageBreak: 'after' },

        // ============================================================
        // BAB 10 — PUSAT BANTUAN, FAQ, TROUBLESHOOTING
        // ============================================================
        { text: 'BAB 10 — PUSAT BANTUAN & TROUBLESHOOTING', style: 'h1', tocItem: true },
        { text: 'Selain membaca Buku Panduan ini, Anda juga dapat mengakses menu "Pusat Bantuan" langsung dari sidebar aplikasi. Di sana terdapat FAQ interaktif dan kontak bantuan teknis.', style: 'paragraph' },

        { text: '10.1 Pertanyaan yang Sering Diajukan (FAQ)', style: 'h2' },
        {
          ol: [
            {
              stack: [
                { text: 'T: Saya lupa Password, bagaimana cara masuk?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Hubungi Admin atau Direktur BUMDes. Mereka memiliki akses ke menu Pengaturan → Manajemen Pengurus untuk mengubah (reset) password akun Anda.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Mengapa Struk/Printer tidak mau keluar?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Pastikan kabel USB/Bluetooth printer tersambung. Jika mencetak via browser (Chrome), pastikan pop-up/dialog cetak tidak diblokir. Coba juga gunakan tombol "Cetak Ulang" di Riwayat Transaksi.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Apakah data aman jika laptop rusak?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Sangat aman. Sistem ini berbasis Cloud. Data tersimpan di server, bukan di laptop Anda. Pinjam laptop atau HP lain, buka website-nya, login, dan semua data tetap utuh.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Bagaimana jika ada barang yang sama tapi harganya beda?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Anda bisa mengubah Harga Jual di menu Stok Barang → klik Edit. Atau gunakan fitur Produk Custom di Kasir untuk memasukkan harga khusus saat transaksi.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Bagaimana cara import ratusan barang sekaligus?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Gunakan fitur Import Excel di menu Stok Barang. Download template-nya dulu, isi di Excel, lalu upload kembali. Semua barang akan masuk otomatis.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Apa bedanya Stok Barang vs Inventaris?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Stok Barang = barang dagangan yang dijual ke pelanggan (habis saat terjual). Inventaris = aset tetap milik BUMDes yang tidak dijual (meja, kursi, komputer). Dicatat di menu berbeda.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Kenapa saya tidak bisa buka menu Akuntansi atau Pengaturan?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Anda mungkin login sebagai Karyawan. Karyawan hanya bisa mengakses Dashboard, Kasir, dan Stok. Minta Admin untuk mengubah jabatan Anda jika memang diperlukan.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
            {
              stack: [
                { text: 'T: Bagaimana cara Tutup Buku akhir bulan?', bold: true, color: '#1a1a1a', fontSize: 10.5 },
                { text: 'J: Buka menu Akuntansi, klik tombol "Tutup Buku", pilih bulan dan tahun, lalu konfirmasi. Setelah ditutup, transaksi pada bulan tersebut tidak bisa diubah lagi.', color: '#1a1a1a', fontSize: 10.5, margin: [0, 2, 0, 8] as [number, number, number, number] },
              ]
            },
          ]
        },

        { text: '10.2 Bantuan Teknis', style: 'h2' },
        { 
          text: 'Jika Anda menemukan kendala, error, atau kesulitan dalam menggunakan aplikasi yang tidak tercakup di buku panduan ini, silakan hubungi:\n\nTim IT / Administrator\nEmail: admin@bumdespulodarat.id\nNo. Telp / WA: 0812-3456-7890\n\n(Silakan ubah kontak di atas sesuai data asli melalui Admin)',
          style: 'paragraph'
        },
      ],

      // ============================================================
      // STYLES
      // ============================================================
      styles: {
        coverTitle: { fontSize: 32, bold: true, alignment: 'center', color: '#1E293B', font: 'Roboto' },
        coverSubtitle: { fontSize: 18, italics: true, alignment: 'center', color: '#4F46E5', margin: [0, 0, 0, 10] },
        coverEntity: { fontSize: 20, bold: true, alignment: 'center', color: '#0F766E' },
        coverAddress: { fontSize: 12, alignment: 'center', color: '#64748B', margin: [0, 5, 0, 0] },
        coverYear: { fontSize: 14, bold: true, color: '#334155' },
        logoPlaceholder: { fontSize: 16, bold: true, alignment: 'center', color: '#CBD5E1' },
        
        h1: { fontSize: 18, bold: true, color: '#4F46E5', margin: [0, 15, 0, 10] },
        h2: { fontSize: 14, bold: true, color: '#1E293B', margin: [0, 12, 0, 8] },
        
        paragraph: { fontSize: 11, color: '#1a1a1a', lineHeight: 1.5, margin: [0, 0, 0, 10] },
        listItem: { fontSize: 11, color: '#1a1a1a', lineHeight: 1.5, margin: [0, 0, 0, 6] },
        
        tableHeader: { fontSize: 11, bold: true, fillColor: '#EEF2FF', color: '#4F46E5', margin: [5, 5, 5, 5] },
        tableCell: { fontSize: 10, color: '#1a1a1a', margin: [5, 4, 5, 4] },
        tableCellBold: { fontSize: 10, color: '#1a1a1a', bold: true, margin: [5, 4, 5, 4] },
        
        headerLeft: { fontSize: 9, color: '#4F46E5', bold: true },
        headerRight: { fontSize: 9, color: '#64748B', alignment: 'right' },
        footerLeft: { fontSize: 9, color: '#64748B' },
        footerRight: { fontSize: 9, color: '#64748B', alignment: 'right' }
      },
      defaultStyle: { font: 'Roboto' }
    };

    try {
      pdfMake.createPdf(docDefinition).download('Buku_Panduan_Lengkap_BUMDes.pdf');
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <div className="flex flex-col lg:h-[calc(100vh-130px)] space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="relative z-10 animate-fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-serif font-black mb-2 flex items-center gap-3">
              <BookOpen className="text-primary-200" /> Pusat Bantuan & Panduan
            </h1>
            <p className="text-primary-100 text-sm leading-relaxed font-medium">
              Selamat datang di Pusat Bantuan. Di sini Anda dapat menemukan jawaban atas pertanyaan umum dan mengunduh buku panduan lengkap (SOP) penggunaan Sistem Digital BUMDes.
            </p>
          </div>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 min-h-[44px] bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
          >
            <Download size={18} className={isGeneratingPdf ? 'animate-bounce' : ''} /> 
            {isGeneratingPdf ? 'Menyiapkan PDF...' : 'Download PDF Panduan'}
          </button>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 trans-all duration-700"></div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:overflow-hidden">
        
        {/* FAQ Section */}
        <div className="lg:col-span-2 card rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-serif font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldQuestion size={20} className="text-primary-600" /> Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
          </div>
          <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 space-y-3">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-300 overflow-hidden ${openItem === index ? 'border-primary-300 dark:border-primary-700 bg-primary-50/30 dark:bg-primary-900/10 shadow-sm' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-200 dark:hover:border-primary-800'}`}
              >
                <button 
                  onClick={() => toggleItem(index)}
                  className="w-full text-left min-h-[44px] px-5 py-4 flex items-center justify-between gap-4 focus:outline-none"
                >
                  <span className={`font-bold text-sm md:text-base pr-4 ${openItem === index ? 'text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {faq.q}
                  </span>
                  <ChevronDown size={18} className={`shrink-0 transition-transform duration-300 ${openItem === index ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} />
                </button>
                <div 
                  className={`px-5 transition-all duration-300 ease-in-out overflow-hidden ${openItem === index ? 'max-h-[400px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="flex flex-col gap-6 lg:overflow-y-auto pb-8 lg:pb-0">
          <div className="card rounded-3xl shadow-sm p-6 border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Lightbulb size={100} />
            </div>
            <h3 className="text-amber-800 dark:text-amber-500 font-serif font-black flex items-center gap-2 mb-3 relative z-10">
              <Lightbulb size={20} /> Tips Harian
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-relaxed relative z-10 font-medium">
              Selalu cek <span className="font-bold">Buku Kas</span> di akhir hari kerja untuk memastikan total uang tunai yang ada di laci kasir sama persis dengan saldo kas yang tercatat di sistem digital.
            </p>
          </div>


          
          <div className="card rounded-3xl shadow-sm p-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="text-slate-800 dark:text-slate-100 font-serif font-black flex items-center gap-2 mb-2">
              <HelpCircle size={20} className="text-primary-600" /> Butuh Bantuan Ekstra?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Jika Anda mengalami kendala teknis atau menemukan bug/error, silakan hubungi tim IT.
            </p>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full min-h-[44px] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-bold text-sm transition-all">
              Hubungi Tim IT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
