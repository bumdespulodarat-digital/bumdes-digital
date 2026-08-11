import { useEffect, useState, useMemo } from 'react';
import { BookOpen, Plus, Edit, Trash2, Search, Download, X, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast, { ConfirmDialog } from '../components/Toast';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { exportToPDF, exportToExcel, type BumdesProfile, type ExportTableData } from '../utils/exportUtils';

interface CashEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  debit: number;
  credit: number;
  balance: number;
  source: string;
  reference_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export default function BukuKas() {
  const { isPengawas, userName } = useAuth();
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCategory, setFilterCategory] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [saldoAwal, setSaldoAwal] = useState(0);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Umum',
    type: 'debit' as 'debit' | 'credit',
    amount: '',
  });

  const [bumdesProfile, setBumdesProfile] = useState<BumdesProfile>({
    storeName: 'BUMDes Noto Mulyo',
    storeAddress: 'Desa Pulodarat',
    direkturName: '',
    bendaharaName: ''
  });

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const CATEGORIES = ['Umum', 'Penjualan Toko', 'Biaya Operasional', 'Gaji', 'Pembelian Barang', 'Pendapatan Lain', 'Pajak', 'Lainnya'];

  useEffect(() => {
    fetchEntries();
    fetchProfile();
  }, [filterMonth, filterYear]);

  const fetchProfile = async () => {
    const { data: storeData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (storeData) setBumdesProfile(prev => ({ ...prev, storeName: storeData.store_name, storeAddress: storeData.store_address }));
    const { data: usersData } = await supabase.from('bumdes_users').select('*');
    if (usersData) {
      const d = usersData.find((u: any) => u.role === 'Direktur BUMDes');
      const b = usersData.find((u: any) => u.role === 'Bendahara');
      setBumdesProfile(prev => ({ ...prev, direkturName: d?.name || '', bendaharaName: b?.name || '' }));
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(filterYear, filterMonth, 0).getDate();
    const endDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${lastDay}T23:59:59`;

    const { data: previousData } = await supabase
      .from('cash_book')
      .select('debit, credit')
      .lt('date', startDate);
      
    if (previousData) {
      const awal = previousData.reduce((acc, curr) => acc + (Number(curr.debit) || 0) - (Number(curr.credit) || 0), 0);
      setSaldoAwal(awal);
    } else {
      setSaldoAwal(0);
    }

    const { data } = await supabase
      .from('cash_book')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate.split('T')[0])
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
    if (data) setEntries(data);
    setLoading(false);
  };

  // ====== COMPUTED ======
  const filteredEntries = useMemo(() => {
    let result = entries;
    if (search) {
      result = result.filter(e => e.description.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterCategory) {
      result = result.filter(e => e.category === filterCategory);
    }
    return result;
  }, [entries, search, filterCategory]);

  const runningBalanceEntries = useMemo(() => {
    let balance = saldoAwal;
    return filteredEntries.map(e => {
      balance += (Number(e.debit) - Number(e.credit));
      return { ...e, runningBalance: balance };
    });
  }, [filteredEntries, saldoAwal]);

  const summary = useMemo(() => {
    const totalDebit = filteredEntries.reduce((s, e) => s + Number(e.debit), 0);
    const totalCredit = filteredEntries.reduce((s, e) => s + Number(e.credit), 0);
    return { totalDebit, totalCredit, saldo: saldoAwal + totalDebit - totalCredit };
  }, [filteredEntries, saldoAwal]);

  // ====== HANDLERS ======
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = Number(form.amount);
    const payload = {
      date: form.date,
      description: form.description,
      category: form.category,
      debit: form.type === 'debit' ? amount : 0,
      credit: form.type === 'credit' ? amount : 0,
      source: 'Manual',
      created_by: userName,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await supabase.from('cash_book').update(payload).eq('id', editingId);
        setToast({ message: 'Entri berhasil diperbarui! ✅', type: 'success' });
      } else {
        await supabase.from('cash_book').insert(payload);
        setToast({ message: 'Entri kas berhasil ditambahkan! ✅', type: 'success' });
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ date: new Date().toISOString().split('T')[0], description: '', category: 'Umum', type: 'debit', amount: '' });
      fetchEntries();
    } catch (err: any) {
      setToast({ message: 'Gagal menyimpan data', type: 'error', subtitle: err?.message });
    }
    setLoading(false);
  };

  const handleEdit = (entry: CashEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date,
      description: entry.description,
      category: entry.category,
      type: entry.debit > 0 ? 'debit' : 'credit',
      amount: (entry.debit > 0 ? entry.debit : entry.credit).toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    await supabase.from('cash_book').delete().eq('id', deleteConfirm);
    setToast({ message: 'Entri berhasil dihapus', type: 'success' });
    setDeleteConfirm(null);
    fetchEntries();
    setLoading(false);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    const periodLabel = `${BULAN[filterMonth - 1]} ${filterYear}`;
    const exportData: ExportTableData = {
      title: `BUKU KAS UMUM - ${periodLabel.toUpperCase()}`,
      headers: ['No', 'Tanggal', 'Keterangan', 'Kategori', 'Debit (Masuk)', 'Kredit (Keluar)', 'Saldo'],
      rows: runningBalanceEntries.map((e, i) => [
        i + 1,
        new Date(e.date).toLocaleDateString('id-ID'),
        e.description,
        e.category,
        e.debit || 0,
        e.credit || 0,
        e.runningBalance,
      ]),
      totalRow: ['', '', '', 'TOTAL', summary.totalDebit, summary.totalCredit, summary.saldo],
    };
    if (format === 'pdf') await exportToPDF(exportData, bumdesProfile);
    else await exportToExcel([exportData], bumdesProfile);
    setIsExporting(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} subtitle={toast.subtitle} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center card rounded-2xl shadow-sm p-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
            <BookOpen size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Buku Kas Umum</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{BULAN[filterMonth - 1]} {filterYear}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} className="flex-1 sm:flex-none px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold">
            {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} className="flex-1 sm:flex-none px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold">
            {Array.from({ length: Math.max(10, new Date().getFullYear() - 2024 + 5) }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!isPengawas && (
            <button onClick={() => { setEditingId(null); setForm({ date: new Date().toISOString().split('T')[0], description: '', category: 'Umum', type: 'debit', amount: '' }); setShowModal(true); }} className="w-full sm:w-auto flex justify-center items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary-600/30 mt-2 sm:mt-0">
              <Plus size={16} /> Tambah Entri
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card rounded-2xl shadow-sm p-4 border dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Total Masuk</span>
          </div>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">Rp {summary.totalDebit.toLocaleString('id-ID')}</p>
        </div>
        <div className="card rounded-2xl shadow-sm p-4 border dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp size={16} className="text-rose-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Total Keluar</span>
          </div>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400">Rp {summary.totalCredit.toLocaleString('id-ID')}</p>
        </div>
        <div className="card rounded-2xl shadow-sm p-4 border dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-primary-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Saldo Akhir</span>
          </div>
          <p className={`text-lg font-black ${summary.saldo >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600 dark:text-rose-400'}`}>
            Rp {summary.saldo.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Filters & Export */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari keterangan..." className="w-full pl-10 pr-4 py-2.5 border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold bg-white dark:bg-slate-900 dark:text-slate-100" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2.5 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold">
          <option value="">Semua Kategori</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => handleExport('pdf')} disabled={isExporting || entries.length === 0} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
            <Download size={14} /> PDF
          </button>
          <button onClick={() => handleExport('excel')} disabled={isExporting || entries.length === 0} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 card rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden flex flex-col relative bg-white dark:bg-slate-900">
        {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600"><Loader2 size={20} className="animate-spin mr-2" /> Memuat...</div>}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300 sticky top-0 z-10">
              <tr>
                <th className="p-4 w-12">No</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Debit (Masuk)</th>
                <th className="p-4 text-right">Kredit (Keluar)</th>
                <th className="p-4 text-right">Saldo</th>
                <th className="p-4 text-center w-16">Sumber</th>
                {!isPengawas && <th className="p-4 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {saldoAwal !== 0 && (
                <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-medium text-slate-500">
                  <td className="p-4" colSpan={3}>Saldo Awal dari bulan sebelumnya</td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4 text-right font-black text-slate-800 dark:text-slate-200">
                    Rp {saldoAwal.toLocaleString('id-ID')}
                  </td>
                  <td colSpan={isPengawas ? 1 : 2}></td>
                </tr>
              )}
              {runningBalanceEntries.length === 0 && (
                <tr><td colSpan={isPengawas ? 8 : 9} className="p-12 text-center text-slate-400 font-medium">Belum ada entri buku kas untuk periode ini.</td></tr>
              )}
              {runningBalanceEntries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                  <td className="p-4 text-slate-500 text-center">{idx + 1}</td>
                  <td className="p-4 dark:text-slate-300">{new Date(entry.date).toLocaleDateString('id-ID')}</td>
                  <td className="p-4 font-semibold dark:text-slate-100">{entry.description}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 dark:text-slate-300">{entry.category}</span></td>
                  <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{entry.debit > 0 ? `Rp ${entry.debit.toLocaleString('id-ID')}` : '-'}</td>
                  <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">{entry.credit > 0 ? `Rp ${entry.credit.toLocaleString('id-ID')}` : '-'}</td>
                  <td className={`p-4 text-right font-black ${entry.runningBalance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600'}`}>
                    Rp {entry.runningBalance.toLocaleString('id-ID')}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${entry.source === 'Kasir' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                      {entry.source}
                    </span>
                  </td>
                  {!isPengawas && (
                    <td className="p-4 text-center space-x-1">
                      <button onClick={() => handleEdit(entry)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white trans-all"><Edit size={13} /></button>
                      {entry.source === 'Manual' && (
                        <button onClick={() => setDeleteConfirm(entry.id)} className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white trans-all"><Trash2 size={13} /></button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {runningBalanceEntries.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold sticky bottom-0">
                <tr>
                  <td colSpan={4} className="p-4 text-right uppercase text-xs tracking-wider text-slate-500">Total</td>
                  <td className="p-4 text-right font-black text-emerald-600 dark:text-emerald-400">Rp {summary.totalDebit.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right font-black text-rose-600 dark:text-rose-400">Rp {summary.totalCredit.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right font-black text-primary-700 dark:text-primary-400">Rp {summary.saldo.toLocaleString('id-ID')}</td>
                  <td colSpan={isPengawas ? 1 : 2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
              <h3 className="text-xl font-bold dark:text-slate-100">{editingId ? 'Edit Entri Kas' : 'Tambah Entri Kas'}</h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" />
              <input required type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2.5 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Keterangan" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2.5 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as 'debit' | 'credit'})} className="w-full px-3 py-2.5 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                  <option value="debit">💰 Uang Masuk (Debit)</option>
                  <option value="credit">💸 Uang Keluar (Kredit)</option>
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                <input required type="number" min="1" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 font-bold text-right text-lg" placeholder="0" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800 mt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Entri Kas?"
          message="Entri ini akan dihapus permanen dan tidak dapat dikembalikan."
          confirmText="Ya, Hapus"
          cancelText="Batal"
          type="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
