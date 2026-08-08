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

      // Top selling products
      const { data: txItems } = await supabase.from('transaction_details').select('qty, items(name)');
      const productMap: Record<string, number> = {};
      txItems?.forEach((ti: any) => {
        const name = ti.items?.name || 'Unknown Item';
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
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 rounded-2xl md:rounded-3xl p-5 md:p-8 text-white shadow-2xl shadow-primary-900/30 relative overflow-hidden group">
        <div className="relative z-10 animate-fade-in-up">
          <h1 className="text-xl md:text-3xl font-black mb-1.5 md:mb-2 tracking-tight">Hai, {userName}! 👋</h1>
          <p className="text-primary-100 text-xs md:text-sm max-w-xl leading-relaxed font-medium">
            Pantau dan kelola seluruh transaksi, stok, hingga laporan akuntansi BUMDes secara real-time dari genggaman Anda.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 trans-all duration-700"></div>
        <div className="absolute right-10 -bottom-10 w-32 h-32 bg-emerald-400 opacity-20 rounded-full blur-2xl group-hover:translate-x-4 trans-all duration-700"></div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5">
        {statCards.map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.gradient} rounded-2xl md:rounded-3xl p-4 md:p-6 text-white shadow-lg hover:shadow-xl trans-all hover:-translate-y-1 relative overflow-hidden group animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
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

      {/* Aset Tetap Summary */}
      {stats.asetTetap > 0 && (
        <div className="card rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <Building2 size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Nilai Aset Tetap BUMDes</p>
              <h3 className="text-xl md:text-2xl font-black text-primary-900 dark:text-primary-300">Rp {stats.asetTetap.toLocaleString('id-ID')}</h3>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div> Tercatat di Neraca
          </span>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Bar Chart - Pendapatan vs Pengeluaran */}
        <div className="xl:col-span-2 card rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base md:text-lg">Pendapatan vs Pengeluaran</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tahun {new Date().getFullYear()}</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Live Data
            </span>
          </div>
          <div className="h-[250px] md:h-[320px]">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart - Sumber Pendapatan */}
        <div className="card rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base md:text-lg mb-1">Sumber Pendapatan</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 md:mb-6">Komposisi per unit usaha</p>
          <div className="h-[220px] md:h-[260px]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Barang Terlaris */}
      <div className="card rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base md:text-lg mb-1">🏆 Barang Terlaris</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4 md:mb-6">Top 5 barang paling banyak terjual</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
          {topProducts.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic py-4 text-center col-span-full">Belum ada data penjualan.</p>
          )}
          {topProducts.map((p, i) => {
            const maxQty = topProducts[0]?.qty || 1;
            const pct = Math.round((p.qty / maxQty) * 100);
            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500'];
            return (
              <div key={i} className="flex items-center gap-3 md:gap-4">
                <span className={`w-7 h-7 md:w-8 md:h-8 rounded-lg ${colors[i]} text-white flex items-center justify-center text-xs font-black flex-shrink-0`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate mr-2">{p.name}</span>
                    <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.qty} terjual</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i]} rounded-full trans-all duration-1000`} style={{ width: `${pct}%` }}></div>
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
