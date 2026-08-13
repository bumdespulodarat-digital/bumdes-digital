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

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const fetchImageBase64 = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
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

    const screenshotBox = (text: string, base64Image?: string | null): any => {
      if (base64Image) {
        return {
          table: {
            widths: ['*'],
            body: [[{ image: base64Image, width: 420, alignment: 'center', margin: [0, 10, 0, 10] }]]
          },
          layout: {
            hLineWidth: () => 1, vLineWidth: () => 1,
            hLineColor: () => '#E2E8F0', vLineColor: () => '#E2E8F0'
          },
          margin: [0, 10, 0, 15]
        };
      }
      return {
        table: {
          widths: ['*'],
          body: [
            [{ text: `📷 [ ${text} ]\n(Area Placeholder Gambar)`, alignment: 'center', margin: [0, 40, 0, 40], color: '#94A3B8', fillColor: '#F1F5F9' }]
          ]
        },
        layout: {
          hLineWidth: () => 1, vLineWidth: () => 1,
          hLineColor: () => '#E2E8F0', vLineColor: () => '#E2E8F0'
        },
        margin: [0, 10, 0, 15]
      };
    };

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
            { text: 'BUMDes Noto Mulyo - Desa Pulodarat', style: 'footerLeft' },
            { text: `Halaman ${currentPage} / ${pageCount}`, style: 'footerRight' }
          ],
          margin: [40, 20, 40, 0]
        };
      },
      content: [
        // COVER PAGE
        { text: '\n\n\n\n' },
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 6, color: '#4F46E5' }] // Indigo accent
        },
        { text: 'BUKU PANDUAN PENGGUNA', style: 'coverTitle', margin: [0, 30, 0, 5] },
        { text: 'SISTEM INFORMASI DIGITAL BUMDES', style: 'coverSubtitle', margin: [0, 0, 0, 40] },
        
        {
          table: {
            widths: ['*'],
            body: [[
              logoBase64 
                ? { image: logoBase64, width: 160, alignment: 'center', margin: [0, 40, 0, 40] }
                : { text: '📷 [ LOGO BUMDES ]', style: 'logoPlaceholder', margin: [0, 40, 0, 40], fillColor: '#F8FAFC' }
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
        {
          canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 3, color: '#4F46E5' }]
        },
        { text: 'Tahun 2024', style: 'coverYear', alignment: 'center', margin: [0, 20, 0, 0] },
        { text: '', pageBreak: 'after' },

        // DAFTAR ISI (TOC)
        {
          toc: {
            title: { text: 'DAFTAR ISI', style: 'h1', margin: [0, 0, 0, 20] as [number, number, number, number] },
            textMargin: [0, 5, 0, 5] as [number, number, number, number]
          }
        },
        { text: '', pageBreak: 'after' },

        // KATA PENGANTAR
        { text: 'KATA PENGANTAR', style: 'h1', tocItem: true },
        { 
          text: 'Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas selesainya penyusunan "Buku Panduan Pengguna (SOP) Sistem Informasi Digital BUMDes". \n\nSistem ini dirancang khusus untuk mempermudah dan mendigitalisasi operasional BUMDes Noto Mulyo, mulai dari transaksi kasir, manajemen stok, pencatatan hutang-piutang, hingga otomatisasi pembukuan (akuntansi).\n\nBuku panduan ini disusun dengan bahasa yang sederhana agar dapat menjadi pedoman yang mudah dipahami oleh seluruh jajaran pengurus BUMDes (Direktur, Bendahara, Admin, dan Karyawan). Dengan adanya sistem ini, diharapkan transparansi dan efisiensi pengelolaan BUMDes semakin meningkat.',
          style: 'paragraph' 
        },

        // PERSYARATAN SISTEM
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

        // BAB 1
        { text: 'BAB 1 - PENDAHULUAN & AKSES SISTEM', style: 'h1', tocItem: true },
        {
          table: {
            headerRows: 1,
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Fitur', style: 'tableHeader' }, { text: 'Fungsi Utama', style: 'tableHeader' }],
              [{ text: 'Login Sistem', style: 'tableCell' }, { text: 'Melindungi data BUMDes agar hanya bisa diakses pengurus.', style: 'tableCell' }],
              [{ text: 'Dark Mode', style: 'tableCell' }, { text: 'Mengubah warna layar menjadi gelap agar mata tidak lelah.', style: 'tableCell' }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },
        { text: '1. Cara Login ke Dalam Sistem', style: 'h2' },
        screenshotBox('Halaman Login Aplikasi', loginImg),
        {
          ol: [
            { text: 'Buka alamat website sistem BUMDes melalui browser (Google Chrome/Safari) di Laptop atau HP Anda.', style: 'listItem' },
            { text: 'Masukkan Email dan Password yang telah didaftarkan oleh Admin.', style: 'listItem' },
            { text: 'Klik tombol "Masuk". Jika berhasil, Anda akan langsung diarahkan ke halaman Dashboard.', style: 'listItem' }
          ]
        },
        { text: '2. Navigasi & Tampilan (Dark Mode)', style: 'h2' },
        {
          ol: [
            { text: 'Di sebelah kiri layar terdapat Sidebar (Menu Samping) untuk berpindah halaman.', style: 'listItem' },
            { text: 'Jika Anda menggunakan HP, klik ikon Garis Tiga di pojok kiri atas untuk memunculkan menu.', style: 'listItem' },
            { text: 'Untuk mengaktifkan Tema Gelap, klik ikon Bulan di pojok kanan atas. Klik ikon Matahari untuk mengembalikan ke Tema Terang.', style: 'listItem' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // BAB 2
        { text: 'BAB 2 - MODUL DASHBOARD & ANALITIK', style: 'h1', tocItem: true },
        {
          table: {
            headerRows: 1,
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Fitur', style: 'tableHeader' }, { text: 'Fungsi Utama', style: 'tableHeader' }],
              [{ text: 'Ringkasan Utama', style: 'tableCell' }, { text: 'Melihat Pemasukan dan Laba secara instan.', style: 'tableCell' }],
              [{ text: 'Grafik Interaktif', style: 'tableCell' }, { text: 'Memantau naik-turunnya penjualan per hari.', style: 'tableCell' }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },
        { text: 'Dashboard adalah halaman pertama yang Anda lihat setelah login. Halaman ini berfungsi sebagai pusat informasi (rapor) harian BUMDes. Sistem ini juga dilengkapi dengan Dashboard Publik untuk memberikan transparansi informasi secara live kepada masyarakat desa.', style: 'paragraph' },
        screenshotBox('Tampilan Dashboard dengan Grafik'),
        {
          ol: [
            { text: 'Perhatikan Kotak Ringkasan di bagian atas. Anda bisa melihat total pemasukan hari ini, bulan ini, dan saldo kas secara langsung.', style: 'listItem' },
            { text: 'Lihat Grafik Garis Area (Area Line Chart) mulus di bagian tengah untuk menganalisa tren pendapatan vs pengeluaran secara presisi dengan satuan angka Jutaan pintar ("Jt").', style: 'listItem' },
            { text: 'Gunakan Grafik Donat untuk membedah porsi sumber dana per unit usaha (Mendukung 20 warna dinamis & filter cerdas untuk menyembunyikan nominal Rp 0).', style: 'listItem' },
            { text: 'Di bagian bawah, terdapat tabel peringatan Piutang Belum Lunas. Segera hubungi pelanggan yang bersangkutan jika tanggal jatuh tempo sudah lewat.', style: 'listItem' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // BAB 3
        { text: 'BAB 3 - MODUL KASIR (POINT OF SALE)', style: 'h1', tocItem: true },
        {
          table: {
            headerRows: 1,
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Fitur', style: 'tableHeader' }, { text: 'Fungsi Utama', style: 'tableHeader' }],
              [{ text: 'Cari & Scan Barang', style: 'tableCell' }, { text: 'Memasukkan barang ke keranjang belanja pembeli.', style: 'tableCell' }],
              [{ text: 'Cetak Struk', style: 'tableCell' }, { text: 'Mencetak bukti pembayaran (nota) untuk pembeli.', style: 'tableCell' }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },
        { text: 'Modul ini digunakan oleh Karyawan atau Kasir saat melayani pembeli di toko.', style: 'paragraph' },
        
        { text: 'Catatan Penting: Otomatisasi', style: 'noteTitle' },
        { text: 'Setiap transaksi di Kasir akan secara OTOMATIS: \n1. Mengurangi sisa stok barang.\n2. Menambah saldo di Buku Kas.\n3. Membuat jurnal pembukuan akuntansi.\nAnda TIDAK PERLU mencatatnya lagi secara manual!', style: 'noteBox', margin: [0, 0, 0, 15] as [number, number, number, number] },

        { text: '1. Cara Melakukan Transaksi Penjualan', style: 'h2' },
        screenshotBox('Tampilan Menu Kasir & Keranjang', kasirImg),
        {
          ol: [
            { text: 'Buka menu Kasir (POS) di sidebar.', style: 'listItem' },
            { text: 'Cari barang dengan cara mengetik nama barang di kolom pencarian ATAU tembakkan alat Scan Barcode ke produk.', style: 'listItem' },
            { text: 'Klik barang yang muncul untuk memasukannya ke Keranjang Belanja di sebelah kanan.', style: 'listItem' },
            { text: 'Jika pembeli membeli layanan (misal: Jasa Fotokopi), klik ikon "+" (Produk Custom), lalu ketik nama jasa dan harganya.', style: 'listItem' },
            { text: 'Pilih Metode Pembayaran (Tunai, QRIS, atau Transfer).', style: 'listItem' },
            { text: 'Jika Tunai, ketikkan jumlah uang yang diberikan pembeli di kolom "Uang Bayar". Sistem akan otomatis menampilkan nominal Kembalian.', style: 'listItem' },
            { text: 'Klik tombol "Cetak Struk" untuk menyimpan transaksi dan mencetak nota. Sistem secara otomatis mencetak dalam format kertas hemat (kertas A4 dibagi 2 / format A5). Klik "Simpan Data" jika pembeli tidak meminta struk.', style: 'listItem' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // BAB 4
        { text: 'BAB 4 - MODUL STOK BARANG & INVENTARIS', style: 'h1', tocItem: true },
        {
          table: {
            headerRows: 1,
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Fitur', style: 'tableHeader' }, { text: 'Fungsi Utama', style: 'tableHeader' }],
              [{ text: 'Tambah Barang', style: 'tableCell' }, { text: 'Mendaftarkan barang dagangan baru ke sistem.', style: 'tableCell' }],
              [{ text: 'Kartu Stok', style: 'tableCell' }, { text: 'Melihat riwayat keluar/masuk barang.', style: 'tableCell' }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },
        { text: '1. Cara Menambahkan Barang Baru', style: 'h2' },
        screenshotBox('Tampilan Form Tambah Barang'),
        {
          ol: [
            { text: 'Buka menu Stok Barang, lalu klik tombol "+ Tambah Barang" di pojok kanan atas.', style: 'listItem' },
            { text: 'Isi Nama Barang dan Kode SKU (Bisa diisi dengan men-scan barcode di kemasan produk).', style: 'listItem' },
            { text: 'Isi Harga Beli (modal) dan Harga Jual (untuk pelanggan).', style: 'listItem' },
            { text: 'Isi Jumlah Stok Awal yang ada di toko, lalu klik "Simpan".', style: 'listItem' }
          ]
        },
        { text: '2. Inventaris (Aset Tetap) & Arsip Digital', style: 'h2' },
        { text: 'Berbeda dengan barang dagangan, menu Inventaris & Arsip digunakan khusus untuk mendata Aset Tetap milik BUMDes (seperti Meja, Kursi, Komputer) agar tidak hilang dan terdata dengan rapi. Selain itu, Anda juga dapat mengelola surat masuk, surat keluar, dan mencetak dokumen Notulen Rapat dalam format PDF resmi dengan KOP BUMDes.', style: 'paragraph' },
        { text: '', pageBreak: 'after' },

        // BAB 5
        { text: 'BAB 5 - MODUL HUTANG & PIUTANG', style: 'h1', tocItem: true },
        {
          table: {
            headerRows: 1,
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Fitur', style: 'tableHeader' }, { text: 'Fungsi Utama', style: 'tableHeader' }],
              [{ text: 'Catat Hutang', style: 'tableCell' }, { text: 'Mencatat hutang BUMDes ke pihak luar (Supplier).', style: 'tableCell' }],
              [{ text: 'Catat Piutang', style: 'tableCell' }, { text: 'Mencatat kasbon/hutang warga ke BUMDes.', style: 'tableCell' }]
            ]
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15] as [number, number, number, number]
        },
        screenshotBox('Tabel Piutang Pelanggan'),
        { text: '1. Cara Mencatat Warga yang Kasbon (Piutang)', style: 'h2' },
        {
          ol: [
            { text: 'Buka menu Hutang Piutang, pilih tab Piutang.', style: 'listItem' },
            { text: 'Klik tombol "+ Catat Piutang", masukkan nama warga, nominal, dan tanggal janji bayar (Jatuh Tempo).', style: 'listItem' },
            { text: 'Jika warga tersebut datang untuk menyicil, klik tombol "Bayar/Cicil" di sebelah namanya, masukkan nominal uang yang dibayar.', style: 'listItem' },
            { text: 'Sistem akan otomatis memotong sisa hutang warga tersebut dan memasukkan uang cicilan ke Buku Kas BUMDes.', style: 'listItem' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // BAB 6
        { text: 'BAB 6 - BUKU KAS & AKUNTANSI OTOMATIS', style: 'h1', tocItem: true },
        { text: 'Ini adalah jantung dari sistem pelaporan BUMDes. Sistem menggunakan standar Akuntansi Double-Entry yang berjalan secara otomatis.', style: 'paragraph' },
        
        { text: '1. Buku Kas (Arus Kas Harian)', style: 'h2' },
        { text: 'Buku kas mencatat semua uang nyata yang masuk dan keluar.', style: 'paragraph' },
        {
          ol: [
            { text: 'Pemasukan dari Kasir sudah OTOMATIS masuk ke sini. Anda tidak perlu repot mengetik ulang.', style: 'listItem' },
            { text: 'Untuk mencatat pemasukan khusus/lainnya, Anda dapat menggunakan menu Setor Pemasukan dengan fitur Unit Usaha (Pihak Terkait) yang bisa Anda ketik atau tambahkan sendiri secara fleksibel.', style: 'listItem' },
            { text: 'Untuk mencatat pengeluaran harian (misal: Beli ATK, Bayar Listrik, Gaji), klik tombol "+ Catat Transaksi" lalu pilih tipe "Uang Keluar".', style: 'listItem' }
          ]
        },

        { text: '1. Laporan Laba Rugi', style: 'h2' },
        screenshotBox('Laporan Laba Rugi Akuntansi', akuntansiImg),
        {
          ol: [
            { text: 'Buka menu Akuntansi. Anda akan langsung melihat laporan keuangan BUMDes tanpa perlu menghitung rumus rumit.', style: 'listItem' },
            { text: 'Laba Rugi: Menampilkan total Pendapatan dikurangi Harga Pokok Penjualan (HPP) dan Beban (Pengeluaran), sehingga ketemu nilai Laba Bersih.', style: 'listItem' },
            { text: 'Neraca: Menampilkan posisi keuangan BUMDes (Berapa total Kas, total Aset, dan Modal).', style: 'listItem' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // BAB 7
        { text: 'BAB 7 - PENGATURAN & STRUKTUR', style: 'h1', tocItem: true },
        
        { text: '1. Struktur Organisasi', style: 'h2' },
        { text: 'BUMDes dikelola dengan hierarki kepengurusan yang jelas, yang terangkum dalam menu Struktur Organisasi interaktif. Anda juga dapat memperbarui profil pengurus secara langsung, seperti mengedit NIK, Jabatan, dan Pendidikan Terakhir.', style: 'paragraph' },
        {
          ul: [
            { text: 'Musyawarah Desa (Musdes): Forum tertinggi pengambil keputusan di BUMDes.', style: 'listItem' },
            { text: 'Penasihat (Kepala Desa): Memberikan arahan dan pengawasan secara struktural.', style: 'listItem' },
            { text: 'Direktur / Ketua: Memimpin operasional BUMDes sehari-hari.', style: 'listItem' },
            { text: 'Sekretaris & Bendahara: Mengurus administrasi dan keuangan (memegang akses penuh sistem).', style: 'listItem' },
            { text: 'Staff / Karyawan: Menjalankan unit usaha teknis (seperti Kasir POS).', style: 'listItem' }
          ]
        },

        { text: '2. Mengelola Akun Pengurus', style: 'h2' },
        {
          ol: [
            { text: 'Menu Pengaturan hanya bisa diakses oleh jabatan Admin dan Direktur.', style: 'listItem' },
            { text: 'Di sini, Anda bisa membuatkan akun (email & password) baru jika ada pergantian pengurus BUMDes.', style: 'listItem' }
          ]
        },

        { text: '3. Mencetak Laporan Bulanan (Export PDF/Excel)', style: 'h2' },
        { text: 'Setiap akhir bulan, BUMDes wajib melapor ke Kepala Desa. Caranya sangat mudah:', style: 'paragraph' },
        {
          ol: [
            { text: 'Buka menu Laporan Transaksi atau Akuntansi.', style: 'listItem' },
            { text: 'Atur filter tanggal. Anda bisa dengan cepat memilih filter 3 Bulan Terakhir atau 6 Bulan Terakhir.', style: 'listItem' },
            { text: 'Klik tombol "Export PDF" atau "Export Excel".', style: 'listItem' },
            { text: 'Laporan resmi lengkap dengan KOP Surat BUMDes akan otomatis terunduh dan siap di-print.', style: 'listItem' }
          ]
        },
        { text: '', pageBreak: 'after' },

        // GLOSARIUM & FAQ
        { text: 'GLOSARIUM (Kamus Istilah Singkat)', style: 'h1', tocItem: true },
        {
          ul: [
            { text: 'HPP (Harga Pokok Penjualan): Harga modal awal dari barang yang sudah laku terjual.', style: 'listItem' },
            { text: 'Laba Kotor: Keuntungan dari penjualan (Harga Jual - Harga Beli/HPP), tapi belum dikurangi biaya operasional.', style: 'listItem' },
            { text: 'Laba Bersih: Keuntungan murni setelah dipotong semua biaya operasional (listrik, gaji, dll).', style: 'listItem' },
            { text: 'Kasbon / Piutang: Uang yang dipinjam oleh warga, atau barang yang diambil warga tapi belum dibayar lunas.', style: 'listItem' },
            { text: 'Jurnal Umum: Buku catatan akuntansi yang mencatat setiap kejadian keuangan menjadi dua sisi (Debit dan Kredit) agar seimbang.', style: 'listItem' }
          ]
        },

        { text: 'TROUBLESHOOTING & FAQ', style: 'h1', tocItem: true, margin: [0, 20, 0, 10] as [number, number, number, number] },
        {
          ul: [
            { text: 'T: Saya lupa Password, bagaimana cara masuk?\nJ: Anda bisa menghubungi Admin/Direktur BUMDes. Mereka memiliki akses ke menu Pengaturan untuk mereset password akun Anda.', style: 'listItem' },
            { text: 'T: Mengapa Struk Printer tidak mau keluar?\nJ: Pastikan kabel Bluetooth/USB printer sudah tersambung dengan perangkat. Jika mencetak melalui browser (Chrome), pastikan pop-up tidak diblokir.', style: 'listItem' },
            { text: 'T: Apakah data aman jika laptop rusak?\nJ: Sangat aman! Sistem ini berbasis digital (Cloud). Anda cukup meminjam laptop atau HP lain, buka website-nya, login, dan semua data Anda masih utuh.', style: 'listItem' },
            { text: 'T: Bagaimana jika ada barang yang sama tapi harganya beda?\nJ: Anda bisa mengubah Harga Jual langsung saat berada di menu Kasir sebelum menekan tombol Bayar, atau perbarui data barang di menu Stok.', style: 'listItem' }
          ]
        },

        { text: 'BANTUAN TEKNIS', style: 'h1', tocItem: true, margin: [0, 20, 0, 10] as [number, number, number, number] },
        { 
          text: 'Jika Anda menemukan kendala, error, atau kesulitan dalam menggunakan aplikasi, silakan hubungi:\n\nTim IT / Administrator\nEmail: admin@bumdespulodarat.id\nNo. Telp / WA: 0812-3456-7890 (Dummy - Silakan diganti melalui PDF Editor)',
          style: 'paragraph'
        }
      ],
      styles: {
        coverTitle: { fontSize: 32, bold: true, alignment: 'center', color: '#1E293B', font: 'Roboto' },
        coverSubtitle: { fontSize: 18, italics: true, alignment: 'center', color: '#4F46E5', margin: [0, 0, 0, 10] },
        coverEntity: { fontSize: 20, bold: true, alignment: 'center', color: '#0F766E' },
        coverAddress: { fontSize: 12, alignment: 'center', color: '#64748B', margin: [0, 5, 0, 0] },
        coverYear: { fontSize: 14, bold: true, color: '#334155' },
        logoPlaceholder: { fontSize: 16, bold: true, alignment: 'center', color: '#CBD5E1' },
        
        h1: { fontSize: 18, bold: true, color: '#4F46E5', margin: [0, 15, 0, 10] },
        h2: { fontSize: 14, bold: true, color: '#334155', margin: [0, 10, 0, 8] },
        
        paragraph: { fontSize: 11, color: '#334155', lineHeight: 1.5, margin: [0, 0, 0, 10] },
        listItem: { fontSize: 11, color: '#334155', lineHeight: 1.5, margin: [0, 0, 0, 6] },
        
        tableHeader: { fontSize: 11, bold: true, fillColor: '#EEF2FF', color: '#4F46E5', margin: [5, 5, 5, 5] },
        tableCell: { fontSize: 10, color: '#475569', margin: [5, 5, 5, 5] },
        
        noteTitle: { fontSize: 11, bold: true, color: '#B45309', margin: [0, 10, 0, 2] },
        noteBox: { fontSize: 11, color: '#92400E', background: '#FEF3C7', margin: [0, 0, 0, 15] },
        
        headerLeft: { fontSize: 9, color: '#4F46E5', bold: true },
        headerRight: { fontSize: 9, color: '#64748B', alignment: 'right' },
        footerLeft: { fontSize: 9, color: '#64748B' },
        footerRight: { fontSize: 9, color: '#64748B', alignment: 'right' }
      },
      defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download('Buku_Panduan_Lengkap_BUMDes.pdf');
    setIsGeneratingPdf(false);
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
            <h1 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
              <BookOpen className="text-primary-200" /> Pusat Bantuan & Panduan
            </h1>
            <p className="text-primary-100 text-sm leading-relaxed font-medium">
              Selamat datang di Pusat Bantuan. Di sini Anda dapat menemukan jawaban atas pertanyaan umum dan mengunduh buku panduan lengkap (SOP) penggunaan Sistem Digital BUMDes.
            </p>
          </div>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
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
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none"
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
            <h3 className="text-amber-800 dark:text-amber-500 font-black flex items-center gap-2 mb-3 relative z-10">
              <Lightbulb size={20} /> Tips Harian
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-relaxed relative z-10 font-medium">
              Selalu cek <span className="font-bold">Buku Kas</span> di akhir hari kerja untuk memastikan total uang tunai yang ada di laci kasir sama persis dengan saldo kas yang tercatat di sistem digital.
            </p>
          </div>


          
          <div className="card rounded-3xl shadow-sm p-6 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-2 mb-2">
              <HelpCircle size={20} className="text-primary-600" /> Butuh Bantuan Ekstra?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Jika Anda mengalami kendala teknis atau menemukan bug/error, silakan hubungi tim IT.
            </p>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl font-bold text-sm transition-all">
              Hubungi Tim IT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
