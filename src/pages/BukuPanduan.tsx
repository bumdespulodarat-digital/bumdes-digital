import { useState } from 'react';
import { BookOpen, Download, ChevronDown, HelpCircle, Lightbulb, PlayCircle, ShieldQuestion } from 'lucide-react';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Register fonts for pdfmake
(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

export default function BukuPanduan() {
  const [openItem, setOpenItem] = useState<number | null>(0);

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

  const handleDownloadPDF = () => {
    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 70, 40, 60],
      info: {
        title: 'Buku Panduan BUMDes Digital',
        author: 'Tim IT KKN',
        subject: 'SOP Sistem BUMDes',
      },
      header: (currentPage) => {
        if (currentPage === 1) return null;
        return {
          columns: [
            { text: 'BUKU PANDUAN BUMDES DIGITAL', style: 'headerLeft' },
            { text: 'Pulodarat, Jepara', style: 'headerRight' }
          ],
          margin: [40, 20, 40, 0]
        };
      },
      footer: (currentPage, pageCount) => {
        return {
          columns: [
            { text: 'Sistem Informasi Digital BUMDes', style: 'footerLeft' },
            { text: `Halaman ${currentPage} dari ${pageCount}`, style: 'footerRight' }
          ],
          margin: [40, 20, 40, 0]
        };
      },
      content: [
        // COVER PAGE
        { text: '\n\n\n\n\n\n' },
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w: 515, h: 4, color: '#0F766E' }
          ]
        },
        { text: 'BUKU PANDUAN PENGGUNA', style: 'coverTitle', margin: [0, 20, 0, 5] as [number, number, number, number] },
        { text: '(Standard Operating Procedure)', style: 'coverSubtitle', margin: [0, 0, 0, 20] as [number, number, number, number] },
        { text: 'SISTEM INFORMASI DIGITAL BUMDES', style: 'coverMain', margin: [0, 0, 0, 20] as [number, number, number, number] },
        {
          canvas: [
            { type: 'rect', x: 0, y: 0, w: 515, h: 2, color: '#0F766E' }
          ]
        },
        { text: '\n\n\n' },
        { text: 'Disusun Oleh:\nTim Mahasiswa KKN\nDesa Pulodarat, Kec. Pecangaan, Kab. Jepara\n2024', style: 'coverAuthor', alignment: 'center' },
        { text: '', pageBreak: 'after' },

        // KATA PENGANTAR
        { text: 'KATA PENGANTAR', style: 'h1' },
        { 
          text: 'Sistem Informasi Digital BUMDes dibuat untuk memudahkan pencatatan transaksi kasir, manajemen stok, dan otomatisasi akuntansi (pembuatan Jurnal, Buku Kas, Laporan Laba Rugi, dan Neraca) secara terpadu.\n\nBuku panduan ini disusun sebagai pegangan bagi para pengurus BUMDes (Direktur, Bendahara, Admin, hingga Kasir) agar dapat mengoperasikan sistem dengan baik dan benar.',
          style: 'paragraph' 
        },

        // BAB 1: KASIR
        { text: '1. MODUL KASIR (POINT OF SALE)', style: 'h1', margin: [0, 20, 0, 10] as [number, number, number, number] },
        { text: 'Modul ini digunakan untuk melayani pembeli secara langsung.', style: 'paragraph' },
        {
          ul: [
            { text: 'Pilih Barang: Klik barang pada daftar atau ketikkan nama/barcode pada kolom pencarian.', style: 'listItem' },
            { text: 'Produk Custom: Jika ada layanan/jasa yang tidak ada di stok (misal: Jasa Fotokopi), klik tombol "Produk Custom" (ikon + kuning) lalu masukkan nama dan harga.', style: 'listItem' },
            { text: 'Pembayaran: Pilih metode pembayaran (Tunai/QRIS/Transfer), lalu masukkan nominal uang yang dibayar (jika tunai).', style: 'listItem' },
            { text: 'Checkout: Klik "Cetak Struk" untuk menyimpan data sekaligus mencetak struk thermal, atau "Simpan Data" jika tidak ingin mencetak kertas.', style: 'listItem' },
          ]
        },
        { 
          text: 'PENTING: Setiap transaksi yang berhasil di kasir akan secara otomatis memotong stok barang, menambah kas di Buku Kas, dan membuat Jurnal Akuntansi otomatis.',
          style: 'alertBox', margin: [0, 10, 0, 10] as [number, number, number, number]
        },

        // BAB 2: STOK & INVENTARIS
        { text: '2. MODUL STOK BARANG & INVENTARIS', style: 'h1', margin: [0, 15, 0, 10] as [number, number, number, number] },
        { text: 'Manajemen ketersediaan barang dagangan dan aset desa.', style: 'paragraph' },
        {
          ul: [
            { text: 'Tambah Stok Baru: Masuk ke menu "Stok Barang", klik tombol "+ Tambah Barang". Isi nama, kode/SKU (bisa dari barcode), harga beli, dan harga jual.', style: 'listItem' },
            { text: 'Kartu Stok: Klik tombol "Detail" pada salah satu barang untuk melihat riwayat keluar-masuk barang tersebut.', style: 'listItem' },
            { text: 'Inventaris & Arsip: Menu ini khusus untuk mencatat Aset Tetap (seperti Mesin Fotokopi, Meja, Kursi) dan menyimpan dokumen penting (PDF/Word).', style: 'listItem' },
          ]
        },

        // BAB 3: KEUANGAN
        { text: '3. MODUL KEUANGAN & AKUNTANSI', style: 'h1', margin: [0, 15, 0, 10] as [number, number, number, number] },
        { text: 'Sistem ini dilengkapi akuntansi otomatis berstandar ganda (Double-Entry).', style: 'paragraph' },
        {
          ul: [
            { text: 'Buku Kas: Catat semua pengeluaran operasional (seperti bayar listrik, beli galon) melalui menu "Buku Kas" agar saldo kas BUMDes selalu akurat.', style: 'listItem' },
            { text: 'Hutang & Piutang: Jika ada pembeli yang kasbon/berhutang, catat di menu Piutang. Sistem akan mencatatnya sebagai tagihan dan bisa dicicil/dilunasi.', style: 'listItem' },
            { text: 'Akuntansi (Laba Rugi & Neraca): Anda bisa memantau keuntungan harian atau bulanan secara langsung tanpa perlu menyusun laporan manual.', style: 'listItem' },
          ]
        },

        // BAB 4: PENGATURAN
        { text: '4. PENGATURAN & STRUKTUR PENGURUS', style: 'h1', margin: [0, 15, 0, 10] as [number, number, number, number] },
        {
          ul: [
            { text: 'Struktur Organisasi: Tampilan bagan hierarki kepengurusan BUMDes mulai dari Musdes hingga Karyawan.', style: 'listItem' },
            { text: 'Pengaturan Akun: Hanya Direktur dan Admin yang dapat mengakses menu ini untuk menambah atau menghapus hak akses (login) untuk pengurus lain.', style: 'listItem' },
            { text: 'Download PDF / Excel: Setiap laporan (Transaksi, Buku Kas, Keuangan) dilengkapi fitur Export untuk pelaporan fisik kepada Kepala Desa.', style: 'listItem' },
          ]
        },

        { text: '\n\n\n' },
        { text: '--- Selamat Bekerja Menggunakan Sistem Digital BUMDes ---', style: 'closing', alignment: 'center' }
      ],
      styles: {
        coverTitle: { fontSize: 28, bold: true, alignment: 'center', color: '#1E293B' },
        coverSubtitle: { fontSize: 16, italics: true, alignment: 'center', color: '#64748B' },
        coverMain: { fontSize: 24, bold: true, alignment: 'center', color: '#0F766E' },
        coverAuthor: { fontSize: 14, bold: true, color: '#334155', lineHeight: 1.5 },
        h1: { fontSize: 16, bold: true, color: '#0F766E', decoration: 'underline', margin: [0, 10, 0, 5] },
        paragraph: { fontSize: 11, color: '#334155', lineHeight: 1.5, margin: [0, 0, 0, 10] },
        listItem: { fontSize: 11, color: '#334155', lineHeight: 1.5, margin: [0, 0, 0, 6] },
        alertBox: { fontSize: 11, bold: true, color: '#991B1B', background: '#FEE2E2', margin: [0, 5, 0, 5] },
        closing: { fontSize: 12, italics: true, color: '#64748B', bold: true },
        headerLeft: { fontSize: 9, color: '#94A3B8', bold: true },
        headerRight: { fontSize: 9, color: '#94A3B8', alignment: 'right' },
        footerLeft: { fontSize: 9, color: '#94A3B8' },
        footerRight: { fontSize: 9, color: '#94A3B8', alignment: 'right' }
      },
      defaultStyle: { font: 'Roboto' }
    };

    pdfMake.createPdf(docDefinition).download('Buku_Panduan_BUMDes_Digital.pdf');
  };

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
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
            className="flex items-center justify-center gap-2 bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 shrink-0 cursor-pointer"
          >
            <Download size={18} /> Download PDF Panduan
          </button>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 trans-all duration-700"></div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* FAQ Section */}
        <div className="lg:col-span-2 card rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldQuestion size={20} className="text-primary-600" /> Pertanyaan yang Sering Diajukan (FAQ)
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
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
        <div className="flex flex-col gap-6 overflow-y-auto">
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

          <div className="card rounded-3xl shadow-sm p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-100 font-black flex items-center gap-2 mb-4">
              <PlayCircle size={20} className="text-primary-600" /> Video Tutorial
            </h3>
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700 group hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer">
              <PlayCircle size={40} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Tonton Video (Segera)</span>
            </div>
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
