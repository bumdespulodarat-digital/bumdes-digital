import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Package, ShoppingCart, Lock, Moon, Sun, Menu, X, MapPin, Mail as MailIcon, ArrowRight } from 'lucide-react';
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
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Custom Hook for Scroll Reveal Animations
function useScrollReveal(dependencies: any[] = []) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
            // Optional: observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, dependencies);
}

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
  
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark Mode State
  const [isDark, setIsDark] = useState(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') === 'dark';
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

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
      const filteredSources = Object.entries(sourceMap).filter(([, val]) => val > 0);
      const srcLabels = filteredSources.map(([key]) => key);
      const srcData = filteredSources.map(([, val]) => val);
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

  // Initialize Scroll Reveal after loading
  useScrollReveal([loading]);

  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const areaChartData = {
    labels: BULAN,
    datasets: [
      {
        label: 'Pendapatan',
        data: monthlyRevenue,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Pengeluaran',
        data: monthlyExpense,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.4)');
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
          return gradient;
        },
        borderColor: 'rgb(244, 63, 94)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(244, 63, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const areaChartOptions = {
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
      y: { 
        ticks: { 
          color: textColor, 
          font: { size: 11 }, 
          callback: (v: any) => {
            if (v >= 1000000) return `Rp ${(v / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
            if (v >= 1000) return `Rp ${(v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} rb`;
            return `Rp ${v}`;
          }
        }, 
        grid: { color: gridColor } 
      }
    }
  };

  const doughnutData = {
    labels: revenueBySource.labels.length > 0 ? revenueBySource.labels : ['Belum ada data'],
    datasets: [{
      data: revenueBySource.data.length > 0 ? revenueBySource.data : [1],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(132, 204, 22, 0.8)',
        'rgba(20, 184, 166, 0.8)', 'rgba(99, 102, 241, 0.8)', 'rgba(249, 115, 22, 0.8)', 'rgba(244, 63, 94, 0.8)'
      ],
      borderColor: isDark ? '#0f172a' : '#ffffff',
      borderWidth: 1,
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
          label: (ctx: any) => ctx.label === 'Belum ada data' ? ' Belum ada data' : ` ${ctx.label}: Rp ${ctx.raw.toLocaleString('id-ID')}` 
        }
      }
    }
  };

  const statCards = [
    { title: 'Saldo Kas', value: `Rp ${stats.kas.toLocaleString('id-ID')}`, icon: <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Total Pendapatan', value: `Rp ${stats.pendapatan.toLocaleString('id-ID')}`, icon: <TrendingUp size={24} className="text-primary-600 dark:text-primary-400" />, bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-primary-100 dark:bg-primary-900/30' },
    { title: 'Macam Barang', value: `${stats.stokCount} Item`, icon: <Package size={24} className="text-orange-600 dark:text-orange-400" />, bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-orange-100 dark:bg-orange-900/30' },
    { title: 'Total Transaksi', value: `${stats.transaksiCount}`, icon: <ShoppingCart size={24} className="text-secondary-600 dark:text-secondary-400" />, bg: 'bg-white dark:bg-slate-900', iconBg: 'bg-secondary-100 dark:bg-secondary-900/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans relative overflow-x-hidden z-0 pt-24 pb-10">
      
      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo-bumdes.png" alt="Logo BUMDes" className="max-w-full max-h-full object-contain drop-shadow-md" />
              </div>
              <span className="font-serif font-bold text-slate-800 dark:text-white text-lg tracking-tight hidden sm:block">
                {storeName}
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 trans-all">Beranda</a>
              <a href="#statistik" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 trans-all">Statistik</a>
              <a href="#unit-usaha" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 trans-all">Unit Usaha</a>
              <a href="#kontak" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 trans-all">Kontak</a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button onClick={() => setIsDark(!isDark)} className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg trans-all shadow-sm">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link to="/login" className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-900/20 hover:shadow-xl hover:-translate-y-0.5">
                <Lock size={16} /> Login
              </Link>
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu Panel */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex flex-col px-6 py-6 space-y-5">
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">Beranda</a>
            <a href="#statistik" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">Statistik</a>
            <a href="#unit-usaha" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">Unit Usaha</a>
            <a href="#kontak" onClick={() => setMobileMenuOpen(false)} className="text-base font-bold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400">Kontak</a>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-600/30">
                <Lock size={18} /> Login Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Ambient Background Orbs */}
      <div className="absolute top-[0%] left-[-10%] w-96 h-96 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-secondary-100 dark:bg-secondary-900/20 rounded-full blur-[120px] -z-10"></div>
      <div className="absolute bottom-[0%] left-[-10%] w-[400px] h-[400px] bg-accent-100 dark:bg-accent-900/10 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-12 md:space-y-20 relative z-10">
        
        {/* Hero Section */}
        <div className="bg-primary-800 rounded-2xl p-6 md:p-12 lg:p-16 text-white shadow-lg relative overflow-hidden group border border-primary-700 flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12 mt-4 md:mt-8">
          <div className="relative z-10 max-w-2xl text-center md:text-left">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6 leading-tight text-white drop-shadow-sm animate-fade-in-up">Portal Resmi <br className="hidden md:block" /> {storeName}</h1>
            <p className="text-primary-100 text-sm md:text-xl font-medium leading-relaxed mb-6 md:mb-10 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Mewujudkan desa mandiri, inovatif, dan sejahtera melalui pengelolaan unit usaha profesional yang berfokus pada pelayanan dan pemberdayaan ekonomi masyarakat Desa Pulodarat.
            </p>
            <div className="animate-fade-in-up flex flex-col sm:flex-row justify-center md:justify-start gap-4" style={{animationDelay: '0.2s'}}>
              <a href="#statistik" className="bg-white text-primary-900 hover:bg-primary-50 px-8 py-4 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center w-full sm:w-auto gap-2">
                <TrendingUp size={20} /> Lihat Statistik Real-time
              </a>
              <a href="#unit-usaha" className="bg-primary-800/50 hover:bg-primary-800/80 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center w-full sm:w-auto gap-2">
                Jelajahi Unit Usaha
              </a>
            </div>
          </div>
          <div className="relative z-10 w-40 h-40 md:w-64 md:h-64 lg:w-80 lg:h-80 shrink-0 animate-fade-in-up mt-4 md:mt-0" style={{animationDelay: '0.3s'}}>
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <img src="/logo-bumdes.png" alt="Logo BUMDes" className="w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 animate-float relative z-20" />
          </div>
          <div className="absolute right-[-10%] top-[-20%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl group-hover:scale-110 trans-all duration-1000"></div>
          <div className="absolute left-[40%] bottom-[-50%] w-64 h-64 bg-secondary-400 opacity-10 rounded-full blur-2xl"></div>
        </div>
        
        {/* Header Widget Statistik */}
        <div id="statistik" className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl shadow-sm scroll-mt-32 text-center lg:text-left reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
              <img src="/logo-bumdes.png" alt="Logo BUMDes" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 tracking-tight">Perkembangan BUMDes</h2>
              <p className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 mt-1.5">{lastUpdate || 'Memuat pembaruan data...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 px-6 py-3.5 rounded-xl shadow-sm">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Terhubung ke Database Server</span>
          </div>
        </div>

        {/* Grid Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out" style={{transitionDelay: '100ms'}}>
          {statCards.map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-2xl p-6 md:p-7 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md trans-all duration-300 group`}>
              <div className="flex flex-col relative z-10 h-full justify-between gap-5">
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center trans-all duration-300`}>
                    {stat.icon}
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold uppercase tracking-widest mb-1.5">{stat.title}</p>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {loading ? '...' : stat.value}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out" style={{transitionDelay: '200ms'}}>
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-2">
              <div>
                <h3 className="font-serif font-bold text-slate-800 dark:text-slate-100 text-xl md:text-2xl tracking-tight">Kinerja Keuangan Bulanan</h3>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mt-1.5">Pendapatan vs Pengeluaran (Tahun {new Date().getFullYear()})</p>
              </div>
            </div>
            <div className="h-[300px] md:h-[380px]">
              {loading ? (
                <div className="w-full h-full flex flex-col gap-4 items-center justify-center text-slate-400 font-bold">
                  <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  Mensinkronisasi Data...
                </div>
              ) : (
                <div className="h-full w-full">
                  <Line data={areaChartData} options={areaChartOptions} />
                </div>
              )}
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <h3 className="font-serif font-bold text-slate-800 dark:text-slate-100 text-xl md:text-2xl tracking-tight mb-1">Sumber Pendapatan</h3>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">Komposisi omzet per unit usaha</p>
            <div className="flex-1 min-h-[250px] md:min-h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="w-full h-full flex flex-col gap-4 items-center justify-center text-slate-400 font-bold">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  Menganalisis Portofolio...
                </div>
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Unit Usaha Profile (Image Cards) */}
        <div id="unit-usaha" className="pt-8 md:pt-16 scroll-mt-24">
          <div className="text-center mb-10 md:mb-12 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 dark:text-slate-100 tracking-tight">Unit Usaha Unggulan</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium text-base md:text-lg max-w-2xl mx-auto">Mendukung perekonomian lokal melalui berbagai layanan dan produk berkualitas untuk kesejahteraan warga Desa Pulodarat.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* ATK */}
            <div className="group relative bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out min-h-[360px]" style={{ transitionDelay: '0ms' }}>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700 opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <div className="w-16 h-16 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <ShoppingCart size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Toko Alat Tulis Kantor</h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base opacity-90 group-hover:opacity-100 transition-opacity">Menyediakan berbagai macam kebutuhan alat tulis kantor, perlengkapan sekolah, dan jasa fotokopi berkualitas untuk warga desa.</p>
              </div>
            </div>
            
            {/* Pengasapan Lele */}
            <div className="group relative bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out min-h-[360px]" style={{ transitionDelay: '150ms' }}>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700 opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <Package size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Pengasapan Lele</h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base opacity-90 group-hover:opacity-100 transition-opacity">Pusat produksi dan distribusi lele asap premium yang diolah secara higienis, memberdayakan peternak ikan lokal.</p>
              </div>
            </div>
            
            {/* Pengelolaan Parkir */}
            <div className="group relative bg-slate-900 rounded-[2rem] shadow-xl overflow-hidden reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out min-h-[360px]" style={{ transitionDelay: '300ms' }}>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700 opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
              <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 transform group-hover:-translate-y-2 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Pengelolaan Parkir</h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base opacity-90 group-hover:opacity-100 transition-opacity">Menyediakan layanan tata kelola lahan parkir yang aman, tertib, dan terpadu di kawasan pusat keramaian dan pasar.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & Map Section */}
        <div id="kontak" className="pt-8 md:pt-16 scroll-mt-24 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700 ease-out">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-12 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row gap-12 lg:gap-16">
            {/* Contact Form */}
            <div className="w-full lg:w-1/2">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">Kirim Pesan</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-base">Punya pertanyaan, kritik, atau saran untuk BUMDes? Jangan ragu untuk menghubungi kami melalui form di bawah ini.</p>
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); alert("Pesan simulasi berhasil terkirim!"); }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                    <input type="text" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 trans-all text-sm font-medium" placeholder="Nama Anda" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                    <input type="email" required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 trans-all text-sm font-medium" placeholder="email@contoh.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pesan Anda</label>
                  <textarea required rows={4} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 trans-all text-sm font-medium resize-none" placeholder="Tuliskan pesan Anda di sini..."></textarea>
                </div>
                <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary-600/30 transition-all hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2 group w-full sm:w-auto">
                  Kirim Pesan <ArrowRight size={18} className="group-hover:translate-x-1 trans-all" />
                </button>
              </form>
            </div>
            
            {/* Map & Info */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="w-full h-[250px] md:h-[350px] rounded-[1.5rem] overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 mb-8">
                <iframe 
                  src="https://maps.google.com/maps?q=Balai%20Desa%20Pulodarat&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                  title="Lokasi BUMDes"
                ></iframe>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Alamat Kantor</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">Balai Desa Pulodarat RT 01/RW 01, Kec. Pecangaan, Kab. Jepara, Jawa Tengah</p>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <MailIcon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-base">Email Resmi</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">admin@bumdespulodarat.id</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-8 pb-4 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo-bumdes.png" alt="Logo BUMDes" className="max-w-full max-h-full object-contain drop-shadow-sm" />
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block">{storeName}</span>
                <span className="text-xs text-slate-500">Desa Mandiri, Inovatif, Sejahtera</span>
              </div>
            </div>
            <div className="text-slate-400 text-xs md:text-sm font-medium">
              &copy; {new Date().getFullYear()} Hak Cipta Dilindungi &bull; KKN Angkatan XXI Unisnu
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
