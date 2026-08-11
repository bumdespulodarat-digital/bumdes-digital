import { useEffect, useState, useMemo } from 'react';
import { BarChart3, Download, TrendingUp, ShoppingCart, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Bar } from 'react-chartjs-2';
import { exportToPDF, exportToExcel, type BumdesProfile, type ExportTableData } from '../utils/exportUtils';

type PeriodType = 'mingguan' | 'bulanan' | 'tahunan';

interface Transaction {
  id: string;
  invoice_number: string;
  total_amount: number;
  tax_amount: number;
  created_at: string;
  payment_method: string;
  cashier_name: string;
}

export default function LaporanTransaksi() {
  const [period, setPeriod] = useState<PeriodType>('bulanan');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [bumdesProfile, setBumdesProfile] = useState<BumdesProfile>({
    storeName: 'BUMDes Noto Mulyo',
    storeAddress: 'Desa Pulodarat',
    direkturName: '',
    bendaharaName: ''
  });

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [period, selectedYear, selectedMonth, selectedWeek]);

  const fetchProfile = async () => {
    const { data: storeData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (storeData) {
      setBumdesProfile(prev => ({ ...prev, storeName: storeData.store_name, storeAddress: storeData.store_address }));
    }
    const { data: usersData } = await supabase.from('bumdes_users').select('*');
    if (usersData) {
      const direktur = usersData.find((u: any) => u.role === 'Direktur BUMDes');
      const bendahara = usersData.find((u: any) => u.role === 'Bendahara');
      setBumdesProfile(prev => ({ ...prev, direkturName: direktur?.name || '', bendaharaName: bendahara?.name || '' }));
    }
  };

  const getDateRange = (): { start: string; end: string } => {
    if (period === 'tahunan') {
      return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31T23:59:59` };
    } else if (period === 'bulanan') {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const m = String(selectedMonth).padStart(2, '0');
      return { start: `${selectedYear}-${m}-01`, end: `${selectedYear}-${m}-${lastDay}T23:59:59` };
    } else {
      // Mingguan
      if (selectedWeek) {
        const startDate = new Date(selectedWeek);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        return { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] + 'T23:59:59' };
      }
      // Default: current week
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return { start: startOfWeek.toISOString().split('T')[0], end: endOfWeek.toISOString().split('T')[0] + 'T23:59:59' };
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const { start, end } = getDateRange();
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'Penjualan')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  };

  // ====== COMPUTED STATS ======
  const stats = useMemo(() => {
    const totalPendapatan = transactions.reduce((s, t) => s + t.total_amount, 0);
    const totalPajak = transactions.reduce((s, t) => s + (t.tax_amount || 0), 0);
    const jumlahTransaksi = transactions.length;
    const rataRata = jumlahTransaksi > 0 ? totalPendapatan / jumlahTransaksi : 0;
    return { totalPendapatan, totalPajak, jumlahTransaksi, rataRata };
  }, [transactions]);

  // ====== CHART DATA ======
  const chartData = useMemo(() => {
    if (period === 'tahunan') {
      const monthly = new Array(12).fill(0);
      transactions.forEach(t => {
        const month = new Date(t.created_at).getMonth();
        monthly[month] += t.total_amount;
      });
      return { labels: BULAN_SHORT, data: monthly };
    } else if (period === 'bulanan') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const daily = new Array(daysInMonth).fill(0);
      transactions.forEach(t => {
        const day = new Date(t.created_at).getDate() - 1;
        if (day >= 0 && day < daysInMonth) daily[day] += t.total_amount;
      });
      return { labels: Array.from({ length: daysInMonth }, (_, i) => String(i + 1)), data: daily };
    } else {
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      const daily = new Array(7).fill(0);
      const { start } = getDateRange();
      const startDate = new Date(start);
      transactions.forEach(t => {
        const d = new Date(t.created_at);
        const diff = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 7) daily[diff] += t.total_amount;
      });
      return { labels: days, data: daily };
    }
  }, [transactions, period, selectedYear, selectedMonth]);

  const getPeriodLabel = (): string => {
    if (period === 'tahunan') return `Tahun ${selectedYear}`;
    if (period === 'bulanan') return `${BULAN[selectedMonth - 1]} ${selectedYear}`;
    const { start, end } = getDateRange();
    return `${new Date(start).toLocaleDateString('id-ID')} - ${new Date(end).toLocaleDateString('id-ID')}`;
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    const exportData: ExportTableData = {
      title: `LAPORAN TRANSAKSI ${period.toUpperCase()} - ${getPeriodLabel().toUpperCase()}`,
      headers: ['No', 'Invoice', 'Tanggal', 'Kasir', 'Metode Bayar', 'Pajak', 'Total'],
      rows: transactions.map((t, i) => [
        i + 1,
        t.invoice_number,
        new Date(t.created_at).toLocaleDateString('id-ID'),
        t.cashier_name || '-',
        t.payment_method || 'Tunai',
        t.tax_amount || 0,
        t.total_amount,
      ]),
      totalRow: ['', '', '', '', 'TOTAL', stats.totalPajak, stats.totalPendapatan],
    };
    if (format === 'pdf') await exportToPDF(exportData, bumdesProfile);
    else await exportToExcel([exportData], bumdesProfile);
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center card rounded-2xl shadow-sm p-4 relative z-10">
        <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto snap-x">
          {([
            { key: 'mingguan' as PeriodType, label: 'Mingguan' },
            { key: 'bulanan' as PeriodType, label: 'Bulanan' },
            { key: 'tahunan' as PeriodType, label: 'Tahunan' },
          ]).map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm trans-all snap-start shrink-0 ${period === p.key ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          {period === 'mingguan' && (
            <input type="date" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold" />
          )}
          {(period === 'bulanan' || period === 'tahunan') && (
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="flex-1 sm:flex-none px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold">
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {period === 'bulanan' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="flex-1 sm:flex-none px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold">
              {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
            </select>
          )}
          <button onClick={() => handleExport('pdf')} disabled={isExporting || transactions.length === 0} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
            <Download size={16} /> PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={isExporting || transactions.length === 0} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pendapatan', value: `Rp ${stats.totalPendapatan.toLocaleString('id-ID')}`, icon: <DollarSign size={20} />, color: 'primary' },
          { label: 'Jumlah Transaksi', value: stats.jumlahTransaksi.toLocaleString('id-ID'), icon: <ShoppingCart size={20} />, color: 'emerald' },
          { label: 'Rata-rata / Transaksi', value: `Rp ${Math.round(stats.rataRata).toLocaleString('id-ID')}`, icon: <TrendingUp size={20} />, color: 'blue' },
          { label: 'Total Pajak', value: `Rp ${stats.totalPajak.toLocaleString('id-ID')}`, icon: <BarChart3 size={20} />, color: 'amber' },
        ].map((s, i) => (
          <div key={i} className="card rounded-2xl shadow-sm p-5 border dark:border-slate-800">
            <div className={`w-10 h-10 rounded-xl bg-${s.color}-100 dark:bg-${s.color}-900/30 text-${s.color}-600 dark:text-${s.color}-400 flex items-center justify-center mb-3`}>
              {s.icon}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{loading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card rounded-2xl shadow-sm p-5 border dark:border-slate-800">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-primary-600" /> Grafik Pendapatan — {getPeriodLabel()}
        </h3>
        <div className="h-64">
          <Bar
            data={{
              labels: chartData.labels,
              datasets: [{
                label: 'Pendapatan (Rp)',
                data: chartData.data,
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
                borderRadius: 8,
                borderSkipped: false,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, ticks: { callback: (v: any) => `Rp ${(v / 1000).toFixed(0)}rb` } },
                x: { grid: { display: false } }
              }
            }}
          />
        </div>
      </div>

      {/* Transaction Table */}
      <div className="card rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Detail Transaksi — {getPeriodLabel()}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{transactions.length} transaksi ditemukan</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin" /> Memuat data...</div>
          ) : (
            <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                <tr>
                  <th className="p-4">Invoice</th>
                  <th className="p-4">Waktu</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4 text-right">Pajak</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-medium">Tidak ada transaksi pada periode ini.</td></tr>
                )}
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                    <td className="p-4 font-bold text-primary-700 dark:text-primary-400">{t.invoice_number}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(t.created_at).toLocaleString('id-ID')}</td>
                    <td className="p-4 font-semibold dark:text-slate-300">{t.cashier_name || '-'}</td>
                    <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 dark:text-slate-300">{t.payment_method || 'Tunai'}</span></td>
                    <td className="p-4 text-right text-slate-500 dark:text-slate-400">{(t.tax_amount || 0) > 0 ? `Rp ${t.tax_amount.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="p-4 text-right font-black dark:text-slate-100">Rp {t.total_amount.toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              {transactions.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold">
                  <tr>
                    <td colSpan={4} className="p-4 text-right uppercase text-xs tracking-wider text-slate-500">Total</td>
                    <td className="p-4 text-right text-amber-600 dark:text-amber-400">{stats.totalPajak > 0 ? `Rp ${stats.totalPajak.toLocaleString('id-ID')}` : '-'}</td>
                    <td className="p-4 text-right text-lg text-primary-700 dark:text-primary-400">Rp {stats.totalPendapatan.toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
