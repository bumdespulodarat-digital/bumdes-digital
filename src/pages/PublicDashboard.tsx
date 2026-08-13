import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Package, ShoppingCart, Store, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function PublicDashboard() {
  const [stats, setStats] = useState({
    kas: 0,
    pendapatan: 0,
    stokCount: 0,
    transaksiCount: 0,
    asetTetap: 0
  });
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState('BUMDes Noto Mulyo');
  const [lastUpdate, setLastUpdate] = useState('');

  // Chart Data
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(new Array(12).fill(0));
  const [monthlyExpense, setMonthlyExpense] = useState<number[]>(new Array(12).fill(0));
  const [revenueBySource, setRevenueBySource] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const currentYear = new Date().getFullYear();

      // Fetch store profile
      const { data: storeData } = await supabase.from('settings').select('store_name').limit(1).maybeSingle();
      if (storeData) setStoreName(storeData.store_name);

      // Fetch journals with account info
      const { data: journals } = await supabase.from('journals').select('debit, credit, created_at, description, accounts(code, name, type)');
      let kas = 0;
      let pendapatan = 0;
      const revByMonth = new Array(12).fill(0);
      const expByMonth = new Array(12).fill(0);
      const sourceMap: Record<string, number> = {};
      
      journals?.forEach((j: any) => {
        const month = new Date(j.created_at).getMonth();
        const year = new Date(j.created_at).getFullYear();

        if (j.accounts?.code.startsWith('1.1.01')) kas += (j.debit - j.credit);
        if (j.accounts?.type === 'Revenue') {
          const amount = j.credit - j.debit;
          pendapatan += amount;
          if (year === currentYear) revByMonth[month] += amount;
          
          // Group by source (Dynamic based on [Unit Usaha] tag)
          const desc = j.description || '';
          let sourceName = 'Lainnya';
          const match = desc.match(/^\[(.*?)\]/);
          if (match) {
            sourceName = match[1];
          } else {
            // Fallback for older transactions
            if (desc.includes('[Tempat Parkir]')) sourceName = 'Tempat Parkir';
            else if (desc.includes('[Pengasapan Lele]')) sourceName = 'Pengasapan Lele';
            else if (desc.includes('[Samsat Budiman]')) sourceName = 'Samsat Budiman';
            else if (desc.includes('[Agen Internet]')) sourceName = 'Agen Internet';
            else if (desc.includes('[Jasa Lainnya]')) sourceName = 'Jasa Lainnya';
            else if (desc.toLowerCase().includes('jual') || desc.toLowerCase().includes('kasir')) sourceName = 'Penjualan Toko';
          }
          sourceMap[sourceName] = (sourceMap[sourceName] || 0) + amount;
        }
        if (j.accounts?.type === 'Expense') {
          const amount = j.debit - j.credit;
          if (year === currentYear) expByMonth[month] += amount;
        }
      });

      setMonthlyRevenue(revByMonth);
      setMonthlyExpense(expByMonth);

      // Revenue by source
      const srcLabels = Object.keys(sourceMap);
      const srcData = Object.values(sourceMap);
      setRevenueBySource({ labels: srcLabels, data: srcData });

      // Stok & transaksi count
      const { count: stokCount } = await supabase.from('items').select('*', { count: 'exact', head: true });
      const { count: transaksiCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });

      // Fixed Assets total
      const { data: assets } = await supabase.from('fixed_assets').select('acquisition_cost');
      const totalAset = assets?.reduce((sum: number, a: any) => sum + a.acquisition_cost, 0) || 0;

      setStats({
        kas,
        pendapatan,
        stokCount: stokCount || 0,
        transaksiCount: transaksiCount || 0,
        asetTetap: totalAset
      });

      const now = new Date();
      setLastUpdate(`Terakhir diperbarui: Hari ini, pukul ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`);
      
      setLoading(false);
    };

    fetchDashboard();
  }, []);

  // Set explicit light mode or use system preference. We'll add a simple detection.
  const isDark = typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false;
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const barChartData = {
    labels: BULAN,
    datasets: [
      {
        label: 'Pendapatan',
        data: monthlyRevenue,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 40,
      },
      {
        label: 'Pengeluaran',
        data: monthlyExpense,
        backgroundColor: 'rgba(244, 63, 94, 0.5)',
        borderColor: 'rgb(244, 63, 94)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 40,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: textColor, font: { weight: 'bold' as const, size: 12 }, usePointStyle: true, pointStyle: 'circle' } },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#0f172a',
        titleFont: { weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 12,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: Rp ${ctx.raw.toLocaleString('id-ID')}` }
      }
    },
    scales: {
      x: { ticks: { color: textColor, font: { weight: 'bold' as const, size: 11 } }, grid: { display: false } },
      y: { ticks: { color: textColor, font: { size: 11 }, callback: (v: any) => `Rp ${(v / 1000).toFixed(0)}rb` }, grid: { color: gridColor } }
    }
  };

  const doughnutData = {
    labels: revenueBySource.labels.length > 0 ? revenueBySource.labels : ['Belum ada data'],
    datasets: [{
      data: revenueBySource.data.length > 0 ? revenueBySource.data : [1],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(168, 85, 247, 0.8)'],
      borderColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 4,
      hoverOffset: 8,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: textColor, font: { weight: 'bold' as const, size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 16 } },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#0f172a',
        padding: 12,
        cornerRadius: 12,
        callbacks: { 
          label: (ctx: any) => ctx.label === 'Belum ada data' 
            ? ' Belum ada data' 
            : ` ${ctx.label}: Rp ${ctx.raw.toLocaleString('id-ID')}` 
        }
      }
    }
  };

  const statCards = [
    { title: 'Saldo Kas', value: `Rp ${stats.kas.toLocaleString('id-ID')}`, icon: <DollarSign size={24} />, gradient: 'from-emerald-500 to-teal-600', iconBg: 'bg-emerald-400/20' },
    { title: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: <TrendingUp size={24} />, gradient: 'from-blue-500 to-indigo-600', iconBg: 'bg-blue-400/20' },
    { title: 'Macam Barang', value: `${stats.stokCount} Item`, icon: <Package size={24} />, gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-400/20' },
    { title: 'Total Transaksi', value: `${stats.transaksiCount}`, icon: <ShoppingCart size={24} />, gradient: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-400/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8 font-sans relative overflow-hidden z-0">
      
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-900 to-primary-700 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-primary-600/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight text-white drop-shadow-md animate-fade-in-up">Selamat Datang di Portal Resmi <br className="hidden md:block" /> BUMDes Noto Mulyo</h1>
            <p className="text-primary-100 text-base md:text-xl font-medium leading-relaxed mb-8 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Mewujudkan desa mandiri, inovatif, dan sejahtera melalui pengelolaan unit usaha profesional yang berfokus pada pelayanan dan pemberdayaan ekonomi masyarakat Desa Pulodarat.
            </p>
            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <button onClick={() => window.scrollTo({ top: document.getElementById('statistik')?.offsetTop || 500, behavior: 'smooth' })} className="bg-white text-primary-800 hover:bg-primary-50 px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center gap-2 cursor-pointer">
                <TrendingUp size={20} /> Lihat Statistik Real-time
              </button>
            </div>
          </div>
          <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 shrink-0 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
            <img src="/logo-bumdes.png" alt="Logo BUMDes" className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 animate-float" />
          </div>
          <div className="absolute right-[-10%] top-[-20%] w-96 h-96 bg-white opacity-[0.07] rounded-full blur-3xl group-hover:scale-110 trans-all duration-1000"></div>
          <div className="absolute left-[40%] bottom-[-50%] w-64 h-64 bg-primary-400 opacity-[0.15] rounded-full blur-2xl"></div>
        </div>
        
        {/* Header Widget */}
        <div id="statistik" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm scroll-mt-24">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-900/20 transform -rotate-2">
              <Store size={28} className="rotate-2" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Statistik {storeName}</h1>
              <p className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400">{lastUpdate || 'Pembaruan Data Otomatis (Real-time)'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 px-4 py-2.5 rounded-xl shadow-sm justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
              <span className="text-xs md:text-sm font-bold text-slate-600 dark:text-slate-300 sm:mr-2">Live Terhubung</span>
            </div>
            <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg text-xs md:text-sm font-bold transition-all shadow-md shadow-primary-900/20 hover:shadow-lg hover:-translate-y-0.5">
              <Lock size={14} /> Login Admin
            </Link>
          </div>
        </div>

        {/* Grid Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
          {statCards.map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl md:rounded-[2rem] p-5 md:p-6 text-white shadow-xl shadow-${stat.gradient.split('-')[1]}-900/20 hover:shadow-2xl hover:-translate-y-1 trans-all relative overflow-hidden group border border-white/10`}>
              <div className="flex flex-col relative z-10 h-full justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 trans-all backdrop-blur-md border border-white/20`}>
                    {stat.icon}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <TrendingUp size={14} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">{stat.title}</p>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight truncate drop-shadow-sm">
                    {loading ? '...' : stat.value}
                  </h3>
                </div>
              </div>
              {/* Decorative Background Elements */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white opacity-10 rounded-full group-hover:scale-150 trans-all duration-700 blur-2xl"></div>
              <div className="absolute -left-8 -top-8 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl md:rounded-[2rem] p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-2">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg md:text-xl tracking-tight">Pendapatan vs Pengeluaran</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Tahun {new Date().getFullYear()}</p>
              </div>
            </div>
            <div className="h-[280px] md:h-[350px]">
              {loading ? (
                <div className="w-full h-full flex flex-col gap-3 items-center justify-center text-slate-400 font-bold">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  Memuat Grafik...
                </div>
              ) : (
                <Bar data={barChartData} options={barChartOptions} />
              )}
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl md:rounded-[2rem] p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-800">
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg md:text-xl tracking-tight mb-1">Sumber Pendapatan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">Komposisi per unit usaha</p>
            <div className="h-[250px] md:h-[300px]">
              {loading ? (
                <div className="w-full h-full flex flex-col gap-3 items-center justify-center text-slate-400 font-bold">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  Memuat Grafik...
                </div>
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Unit Usaha Profile */}
        <div className="pt-8 md:pt-12">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Unit Usaha BUMDes</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium text-sm md:text-base">Mendukung perekonomian lokal melalui berbagai layanan unggulan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* ATK */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-500/30 trans-all duration-300">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Toko Alat Tulis Kantor (ATK)</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">Menyediakan berbagai macam kebutuhan alat tulis kantor, perlengkapan sekolah, dan jasa fotokopi berkualitas dengan harga terjangkau untuk warga desa.</p>
            </div>
            
            {/* Pengasapan Lele */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10 hover:border-orange-500/30 trans-all duration-300">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Package size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Pengasapan Lele</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">Pusat produksi dan distribusi lele asap premium yang diolah secara higienis, berupaya memberdayakan peternak ikan lokal Desa Pulodarat secara berkelanjutan.</p>
            </div>
            
            {/* Pengelolaan Parkir */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 trans-all duration-300">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">Pengelolaan Parkir</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">Menyediakan layanan tata kelola lahan parkir yang aman, tertib, dan terpadu di kawasan pusat keramaian dan pasar demi kenyamanan warga desa.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-10 pb-8 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 mx-auto md:mx-0">
                <Store size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{storeName}</h4>
                <p className="text-sm text-slate-500 font-medium mt-1">Sistem Informasi Digital & Keuangan Enterprise</p>
              </div>
            </div>
            
            <div className="text-center md:text-right text-slate-500 text-sm font-medium space-y-1">
              <p>Kantor: Balai Desa Pulodarat RT 01 / RW 01</p>
              <p>Kecamatan Pecangaan, Kabupaten Jepara</p>
              <p className="text-primary-600 dark:text-primary-400 pt-1">Email: admin@bumdespulodarat.id</p>
            </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center text-slate-400 text-xs md:text-sm font-medium flex flex-col sm:flex-row justify-center items-center gap-2">
            <span>&copy; {new Date().getFullYear()} {storeName}. Hak Cipta Dilindungi.</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>Program Kerja KKN Angkatan XXI</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
