import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, ShoppingCart, Building2, Store } from 'lucide-react';
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
          
          // Group by source
          const desc = j.description || '';
          let sourceName = 'Penjualan Toko';
          if (desc.includes('[Tempat Parkir]')) sourceName = 'Tempat Parkir';
          else if (desc.includes('[Pengasapan Lele]')) sourceName = 'Pengasapan Lele';
          else if (desc.includes('[Samsat Budiman]')) sourceName = 'Samsat Budiman';
          else if (desc.includes('[Agen Internet]')) sourceName = 'Agen Internet';
          else if (desc.includes('[Jasa Lainnya]')) sourceName = 'Jasa Lainnya';
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
      },
      {
        label: 'Pengeluaran',
        data: monthlyExpense,
        backgroundColor: 'rgba(244, 63, 94, 0.5)',
        borderColor: 'rgb(244, 63, 94)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header Widget */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">Statistik {storeName}</h1>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Pembaruan Data Otomatis (Real-time)</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl shadow-sm">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Live Terhubung</span>
          </div>
        </div>

        {/* Grid Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
          {statCards.map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl trans-all relative overflow-hidden group`}>
              <div className="flex flex-col relative z-10">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${stat.iconBg} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 trans-all`}>
                  {stat.icon}
                </div>
                <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5 md:mb-1">{stat.title}</p>
                <h3 className="text-lg md:text-2xl font-black tracking-tight truncate">
                  {loading ? '...' : stat.value}
                </h3>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white opacity-10 rounded-full group-hover:scale-150 trans-all duration-500"></div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base md:text-lg">Pendapatan vs Pengeluaran</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tahun {new Date().getFullYear()}</p>
              </div>
            </div>
            <div className="h-[250px] md:h-[320px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Memuat Grafik...</div>
              ) : (
                <Bar data={barChartData} options={barChartOptions} />
              )}
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base md:text-lg mb-1">Sumber Pendapatan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 md:mb-6">Komposisi per unit usaha</p>
            <div className="h-[220px] md:h-[260px]">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">Memuat Grafik...</div>
              ) : (
                <Doughnut data={doughnutData} options={doughnutOptions} />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
