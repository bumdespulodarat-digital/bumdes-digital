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
      pageMargins: [40, 60, 40, 60],
      header: {
        text: 'Buku Panduan Sistem Digital BUMDes',
        margin: [40, 20, 40, 0],
        fontSize: 9,
        color: 'gray',
        alignment: 'right'
      },
      content: [
        { text: 'BUKU PANDUAN PENGGUNA', style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
        { text: 'Sistem Informasi Digital BUMDes', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 40] },
        
        { text: 'Daftar Pertanyaan Umum (FAQ) & Panduan Singkat', style: 'sectionHeader', margin: [0, 0, 0, 20] },
        
        ...faqs.map((faq, index) => ([
          { text: `${index + 1}. ${faq.q}`, style: 'question', margin: [0, 10, 0, 5] },
          { text: faq.a, style: 'answer', margin: [15, 0, 0, 20] }
        ]))
      ],
      styles: {
        header: { fontSize: 24, bold: true, color: '#1E293B' },
        subheader: { fontSize: 16, bold: true, color: '#64748B' },
        sectionHeader: { fontSize: 14, bold: true, color: '#0F766E', decoration: 'underline' },
        question: { fontSize: 12, bold: true, color: '#334155' },
        answer: { fontSize: 11, color: '#475569', lineHeight: 1.6 }
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
