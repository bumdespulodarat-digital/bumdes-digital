import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Package, ShoppingCart, Building2 } from 'lucide-react';
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

export default function Dashboard() {
  const [stats, setStats] = useState({
    kas: 0,
    pendapatan: 0,
    stokCount: 0,
    transaksiCount: 0,
    asetTetap: 0
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin');

  // Chart Data
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(new Array(12).fill(0));
  const [monthlyExpense, setMonthlyExpense] = useState<number[]>(new Array(12).fill(0));
  const [revenueBySource, setRevenueBySource] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });
  const [topProducts, setTopProducts] = useState<{ name: string, qty: number }[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      const currentYear = new Date().getFullYear();

      // Get user name
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
        const namePart = userData.user.email.split('@')[0];
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }

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

      // Top selling products
      const { data: txItems } = await supabase.from('transaction_details').select('qty, custom_item_name, items(name)');
      const productMap: Record<string, number> = {};
      txItems?.forEach((ti: any) => {
        const name = ti.items?.name || ti.custom_item_name || 'Item Custom';
        productMap[name] = (productMap[name] || 0) + ti.qty;
      });
      const sorted = Object.entries(productMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));
      setTopProducts(sorted);

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

  const isDark = document.documentElement.classList.contains('dark');
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
      y: { ticks: { color: textColor, font: { size: 11 }, callback: (v: any) => `Rp ${(v / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 })}rb` }, grid: { color: gridColor } }
    }
  };

  const doughnutData = {
    labels: revenueBySource.labels.length > 0 ? revenueBySource.labels : ['Belum ada data'],
    datasets: [{
      data: revenueBySource.data.length > 0 ? revenueBySource.data : [1],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(168, 85, 247, 0.8)',
        'rgba(239, 68, 68, 0.8)', 'rgba(6, 182, 212, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(132, 204, 22, 0.8)',
        'rgba(20, 184, 166, 0.8)', 'rgba(99, 102, 241, 0.8)'
      ],
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
    <div className="space-y-4 md:space-y-6 pb-6 relative z-0">
      
      {/* Ambient Background Orbs */}
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
      <div className="absolute top-[40%] left-[-10%] w-[300px] h-[300px] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 rounded-2xl md:rounded-[2rem] p-6 md:p-10 text-white shadow-2xl shadow-primary-900/30 relative overflow-hidden group border border-white/10">
        <div className="relative z-10 animate-fade-in-up">
          <h1 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 tracking-tight">Hai, {userName}! 👋</h1>
          <p className="text-primary-100 text-sm md:text-base max-w-2xl leading-relaxed font-medium">
            Pantau dan kelola seluruh transaksi, stok, hingga laporan akuntansi BUMDes secara real-time dari genggaman Anda.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-125 trans-all duration-1000"></div>
        <div className="absolute right-20 -bottom-10 w-40 h-40 bg-emerald-400 opacity-20 rounded-full blur-3xl group-hover:translate-x-8 trans-all duration-1000"></div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl md:rounded-[2rem] p-5 md:p-6 text-white shadow-xl shadow-${stat.gradient.split('-')[1]}-900/20 hover:shadow-2xl hover:-translate-y-1 trans-all relative overflow-hidden group border border-white/10 animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
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

      {/* Aset Tetap Summary */}
      {stats.asetTetap > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl md:rounded-[2rem] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-slate-200/50 dark:shadow-none animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
              <Building2 size={26} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Nilai Aset Tetap BUMDes</p>
              <h3 className="text-2xl md:text-3xl font-black text-primary-900 dark:text-primary-300 tracking-tight">Rp {stats.asetTetap.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-xl flex items-center gap-2 border border-primary-100 dark:border-primary-800/50">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div> Tercatat di Neraca
          </span>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Bar Chart - Pendapatan vs Pengeluaran */}
        <div className="xl:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3">
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg md:text-xl tracking-tight">Pendapatan vs Pengeluaran</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Tahun {new Date().getFullYear()}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100 dark:border-emerald-800/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Live Data
            </span>
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

        {/* Doughnut Chart - Sumber Pendapatan */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none">
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

      {/* Barang Terlaris */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl md:rounded-[2rem] p-5 md:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none">
        <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg md:text-xl tracking-tight mb-1">🏆 Barang Terlaris</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">Top 5 barang paling banyak terjual</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6">
          {topProducts.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium italic py-6 text-center col-span-full">Belum ada data penjualan.</p>
          )}
          {topProducts.map((p, i) => {
            const maxQty = topProducts[0]?.qty || 1;
            const pct = Math.round((p.qty / maxQty) * 100);
            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
            return (
              <div key={i} className="flex items-center gap-3 md:gap-4 p-3 rounded-xl hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <span className={`w-10 h-10 rounded-xl ${colors[i]} text-white flex items-center justify-center text-sm font-black shadow-md flex-shrink-0`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate mr-2" title={p.name}>{p.name}</span>
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{p.qty}x</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full ${colors[i]} rounded-full trans-all duration-1000 relative overflow-hidden`} style={{ width: `${pct}%` }}>
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
