import { useEffect, useState, useMemo } from 'react';
import { FileText, TrendingUp, DollarSign, ArrowDownCircle, ArrowUpCircle, BookOpen, Scale, Wallet, Activity, Download, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { exportToPDF, exportToExcel, type BumdesProfile, type ExportTableData } from '../utils/exportUtils';
import Toast, { ConfirmDialog } from '../components/Toast';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

interface FixedAsset {
  id: string;
  name: string;
  category: string;
  acquisition_date: string;
  acquisition_cost: number;
  notes: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Journal {
  id: string;
  transaction_id?: string;
  created_at: string;
  description: string;
  debit: number;
  credit: number;
  account_id: string;
  accounts?: Account;
}

type TabType = 'laba-rugi' | 'neraca' | 'jurnal' | 'buku-besar' | 'neraca-saldo' | 'lpe' | 'lak' | 'aset-tetap' | 'kelola-akun';
type ReportPeriod = 'all' | 'this_month' | '3_months' | '6_months';

export default function Akuntansi() {
  const { userName, userRole } = useAuth();
  const canManageClosing = ['Admin', 'Direktur BUMDes', 'Akuntan', 'Bendahara'].includes(userRole);

  const [activeTab, setActiveTab] = useState<TabType>('laba-rugi');
  
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseData, setExpenseData] = useState({ amount: '', desc: '' });
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeData, setIncomeData] = useState({ amount: '', source: 'Tempat Parkir', desc: '', relatedParty: '' });
  
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingData, setClosingData] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [closedMonths, setClosedMonths] = useState<any[]>([]);
  
  // Filters
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('all');
  
  // Account Management
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountData, setAccountData] = useState<Partial<Account>>({ code: '', name: '', type: 'Asset' });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // BUMDes profile for export headers/signatures
  const [bumdesProfile, setBumdesProfile] = useState<BumdesProfile>({
    storeName: 'BUMDes Noto Mulyo',
    storeAddress: 'Desa Polodarat, Kec. Pecalungan',
    direkturName: '',
    bendaharaName: ''
  });

  const fetchData = async () => {
    setLoading(true);

    // Fetch Accounts
    const { data: accData } = await supabase.from('accounts').select('*').order('code');
    if (accData) setAccounts(accData);

    // Fetch Journals
    let query = supabase.from('journals').select(`id, transaction_id, created_at, description, debit, credit, account_id, accounts(id, code, name, type)`).order('created_at', { ascending: false });
    const { data: jrnData } = await query;
    if (jrnData) setJournals(jrnData as any);

    // Fetch Assets
    const { data: assets } = await supabase.from('fixed_assets').select('*').order('name');
    if (assets) setFixedAssets(assets);

    // Fetch BUMDes profile for export kop surat
    const { data: storeData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (storeData) {
      setBumdesProfile(prev => ({
        ...prev,
        storeName: storeData.store_name || prev.storeName,
        storeAddress: storeData.store_address || prev.storeAddress
      }));
    }

    // Fetch pengurus for signature block
    const { data: usersData } = await supabase.from('bumdes_users').select('*');
    if (usersData) {
      const direktur = usersData.find((u: any) => u.role === 'Direktur BUMDes');
      const bendahara = usersData.find((u: any) => u.role === 'Bendahara');
      setBumdesProfile(prev => ({
        ...prev,
        direkturName: direktur?.name || '',
        bendaharaName: bendahara?.name || ''
      }));
    }

    // Fetch closed months
    const { data: closingData } = await supabase.from('monthly_closing').select('*');
    if (closingData) setClosedMonths(closingData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredJournals = useMemo(() => {
    if (reportPeriod === 'all') return journals;
    const now = new Date();
    let startDate = new Date();
    if (reportPeriod === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (reportPeriod === '3_months') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (reportPeriod === '6_months') {
      startDate.setMonth(now.getMonth() - 6);
    }
    return journals.filter(j => new Date(j.created_at) >= startDate);
  }, [journals, reportPeriod]);

  // Derived Data
  const accountBalances = useMemo(() => {
    const balances: Record<string, { debit: number; credit: number; balance: number; account: Account }> = {};
    accounts.forEach(acc => {
      balances[acc.id] = { debit: 0, credit: 0, balance: 0, account: acc };
    });
    
    filteredJournals.forEach(j => {
      if (!balances[j.account_id]) return;
      balances[j.account_id].debit += Number(j.debit || 0);
      balances[j.account_id].credit += Number(j.credit || 0);
    });

    Object.values(balances).forEach(b => {
      if (b.account.type === 'Asset' || b.account.type === 'Expense') {
        b.balance = b.debit - b.credit;
      } else {
        b.balance = b.credit - b.debit;
      }
    });

    return balances;
  }, [filteredJournals, accounts]);

  // Derived Reports
  const labaRugiData = useMemo(() => {
    let pendapatan = 0;
    let hpp = 0;
    let beban = 0;
    
    Object.values(accountBalances).forEach(b => {
      if (b.account.type === 'Revenue') pendapatan += b.balance;
      else if (b.account.type === 'Expense') {
        if (b.account.code.startsWith('5')) hpp += b.balance;
        else beban += b.balance;
      }
    });
    
    return { pendapatan, hpp, beban, labaKotor: pendapatan - hpp, labaBersih: pendapatan - hpp - beban };
  }, [accountBalances]);

  const neracaData = useMemo(() => {
    let aktivaLancar = 0;
    let kewajiban = 0;
    let ekuitas = 0;

    Object.values(accountBalances).forEach(b => {
      if (b.account.type === 'Asset' && !b.account.code.startsWith('1.3') && !b.account.code.startsWith('1.4')) {
        aktivaLancar += b.balance;
      } else if (b.account.type === 'Liability') {
        kewajiban += b.balance;
      } else if (b.account.type === 'Equity') {
        ekuitas += b.balance;
      }
    });
    
    const asetTetap = fixedAssets.reduce((sum, a) => sum + a.acquisition_cost, 0);
    const totalAset = aktivaLancar + asetTetap;
    const totalPasiva = kewajiban + ekuitas + labaRugiData.labaBersih;

    return { aktivaLancar, asetTetap, totalAset, kewajiban, ekuitas, totalPasiva };
  }, [accountBalances, fixedAssets, labaRugiData]);

  const lakData = useMemo(() => {
    let operasi = 0, investasi = 0, pendanaan = 0;
    filteredJournals.forEach(j => {
      if (j.accounts?.code.startsWith('1.1.01')) {
        const netCash = Number(j.debit || 0) - Number(j.credit || 0);
        // Simple heuristic: if description has Modal/Deviden -> Pendanaan. Aset -> Investasi. Else -> Operasi.
        const desc = (j.description || '').toLowerCase();
        if (desc.includes('modal') || desc.includes('deviden') || desc.includes('investor')) {
          pendanaan += netCash;
        } else if (desc.includes('aset') || desc.includes('bangunan') || desc.includes('kendaraan')) {
          investasi += netCash;
        } else {
          operasi += netCash;
        }
      }
    });
    return { operasi, investasi, pendanaan, total: operasi + investasi + pendanaan };
  }, [filteredJournals]);

  // ... (Include handlers: getOrCreateAccount, handleCatatPengeluaran, handleCatatPemasukan)
  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    let { data: acc } = await supabase.from('accounts').select('id').eq('code', code).single();
    if (!acc) {
      const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
      acc = newAcc;
    }
    return acc?.id;
  };

  const handleCatatPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(expenseData.amount);
      const desc = expenseData.desc;
      const bebanId = await getOrCreateAccount('6.1.99.99', 'Beban Administrasi dan Umum Lainnya', 'Expense');
      const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');
      const { data: trx } = await supabase.from('transactions').insert({ invoice_number: `EXP-${Date.now()}`, type: 'Biaya', total_amount: amount, notes: desc }).select('id').single();
      if (trx && bebanId && kasId) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: bebanId, debit: amount, credit: 0, description: desc },
          { transaction_id: trx.id, account_id: kasId, debit: 0, credit: amount, description: desc }
        ]);
      }
      setShowExpenseModal(false); setExpenseData({ amount: '', desc: '' }); fetchData(); setToast({ message: 'Pengeluaran berhasil dicatat!', type: 'success', subtitle: `Rp ${Number(expenseData.amount).toLocaleString('id-ID')} telah tercatat.` });
    } catch (error) { console.error(error); setToast({ message: 'Gagal mencatat pengeluaran', type: 'error', subtitle: 'Terjadi kesalahan. Silakan coba lagi.' }); }
    setLoading(false);
  };

  const handleCatatPemasukan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = Number(incomeData.amount);
      const desc = `[${incomeData.source}] ${incomeData.relatedParty ? 'Pihak: ' + incomeData.relatedParty + ' - ' : ''}${incomeData.desc}`;
      let revCode = '4.1.99.99';
      let revName = 'Pendapatan Lain-lain lainnya';
      if (incomeData.source === 'Tempat Parkir') { revCode = '4.1.07.01'; revName = 'Pendapatan Parkir Mobil'; }
      else if (incomeData.source === 'Pengasapan Lele') { revCode = '4.3.01.91'; revName = 'Pendapatan Penjualan Barang Jadi'; }
      else if (incomeData.source === 'Samsat Budiman') { revCode = '4.1.12.01'; revName = 'Pendapatan Samsat Budiman'; }
      else if (incomeData.source === 'Agen Internet') { revCode = '4.1.05.99'; revName = 'Pendapatan Jasa INTERNET'; }
      else if (incomeData.source === 'Jasa Lainnya') { revCode = '4.1.99.99'; revName = 'Pendapatan Lain-lain lainnya'; }
      const pendapatanId = await getOrCreateAccount(revCode, revName, 'Revenue');
      const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');
      const { data: trx } = await supabase.from('transactions').insert({ invoice_number: `INC-${Date.now()}`, type: 'Pendapatan Lain', total_amount: amount, notes: desc }).select('id').single();
      if (trx && pendapatanId && kasId) {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: kasId, debit: amount, credit: 0, description: desc },
          { transaction_id: trx.id, account_id: pendapatanId, debit: 0, credit: amount, description: desc }
        ]);
      }
      setShowIncomeModal(false); setIncomeData({ amount: '', source: 'Tempat Parkir', desc: '', relatedParty: '' }); fetchData(); setToast({ message: 'Pemasukan berhasil dicatat!', type: 'success', subtitle: `Rp ${Number(incomeData.amount).toLocaleString('id-ID')} dari ${incomeData.source} telah tercatat.` });
    } catch (error) { console.error(error); setToast({ message: 'Gagal mencatat pemasukan', type: 'error', subtitle: 'Terjadi kesalahan. Silakan coba lagi.' }); }
    setLoading(false);
  };

  const handleDeleteTransaction = async (transactionId: string | undefined) => {
    if (!transactionId) return;
    setDeleteConfirm(transactionId);
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteConfirm) return;
    setDeleteConfirm(null);
    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', deleteConfirm);
      if (error) throw error;
      setToast({ message: 'Transaksi berhasil dihapus!', type: 'success' });
      fetchData();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Gagal menghapus transaksi', type: 'error', subtitle: 'Silakan coba lagi nanti.' });
    }
    setLoading(false);
  };

  const handleTutupBuku = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isClosed = closedMonths.some(c => c.month === closingData.month && c.year === closingData.year);
      if (isClosed) {
        setToast({ message: 'Bulan ini sudah ditutup', type: 'error', subtitle: 'Anda tidak bisa menutup buku pada periode yang sama dua kali.' });
        setLoading(false);
        return;
      }
      const { error } = await supabase.from('monthly_closing').insert({
        month: closingData.month,
        year: closingData.year,
        closed_by: userName
      });
      if (error) throw error;
      setToast({ message: 'Tutup Buku Berhasil!', type: 'success', subtitle: `Buku bulan ${closingData.month}/${closingData.year} telah resmi ditutup. Transaksi pada periode ini telah dikunci.` });
      setShowClosingModal(false);
      fetchData();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Gagal melakukan tutup buku', type: 'error', subtitle: 'Terjadi kesalahan pada server.' });
    }
    setLoading(false);
  };

  // ============================================================
  // Export Handlers
  // ============================================================
  const handleExportPDF = async (reportType: string) => {
    setIsExporting(true);
    try {
      const data = buildExportData(reportType);
      if (data) await exportToPDF(data, bumdesProfile);
    } catch (err) {
      console.error('Export PDF error:', err);
      setToast({ message: 'Gagal membuat file PDF', type: 'error' });
    }
    setIsExporting(false);
  };

  const handleExportExcel = async (reportType: string) => {
    setIsExporting(true);
    try {
      const data = buildExportData(reportType);
      if (data) await exportToExcel([data], bumdesProfile);
    } catch (err) {
      console.error('Export Excel error:', err);
      setToast({ message: 'Gagal membuat file Excel', type: 'error' });
    }
    setIsExporting(false);
  };

  const handleExportAllExcel = async () => {
    setIsExporting(true);
    try {
      const types = ['laba-rugi', 'neraca', 'neraca-saldo', 'lpe', 'lak'];
      const allData = types.map(t => buildExportData(t)).filter(Boolean) as ExportTableData[];
      if (allData.length > 0) await exportToExcel(allData, bumdesProfile);
    } catch (err) {
      console.error('Export All Excel error:', err);
      setToast({ message: 'Gagal membuat file Excel', type: 'error' });
    }
    setIsExporting(false);
  };

  const buildExportData = (reportType: string): ExportTableData | null => {
    switch (reportType) {
      case 'laba-rugi': {
        const pendapatanAccounts = Object.values(accountBalances).filter(b => b.account.type === 'Revenue' && b.balance !== 0);
        const hppAccounts = Object.values(accountBalances).filter(b => b.account.type === 'Expense' && b.account.code.startsWith('5') && b.balance !== 0);
        const bebanAccounts = Object.values(accountBalances).filter(b => b.account.type === 'Expense' && !b.account.code.startsWith('5') && b.balance !== 0);
        const rows: (string | number)[][] = [];
        const subtotalRows: number[] = [];

        rows.push(['', 'PENDAPATAN', '', '']);
        pendapatanAccounts.forEach(b => rows.push([b.account.code, b.account.name, '', b.balance]));
        subtotalRows.push(rows.length);
        rows.push(['', 'Total Pendapatan', '', labaRugiData.pendapatan]);

        rows.push(['', '', '', '']);
        rows.push(['', 'HARGA POKOK PENJUALAN', '', '']);
        hppAccounts.forEach(b => rows.push([b.account.code, b.account.name, b.balance, '']));
        subtotalRows.push(rows.length);
        rows.push(['', 'Total HPP', labaRugiData.hpp, '']);

        subtotalRows.push(rows.length);
        rows.push(['', 'LABA KOTOR', '', labaRugiData.labaKotor]);

        rows.push(['', '', '', '']);
        rows.push(['', 'BEBAN OPERASIONAL', '', '']);
        bebanAccounts.forEach(b => rows.push([b.account.code, b.account.name, b.balance, '']));
        subtotalRows.push(rows.length);
        rows.push(['', 'Total Beban Operasional', labaRugiData.beban, '']);

        return {
          title: 'LAPORAN LABA RUGI',
          headers: ['Kode', 'Keterangan', 'Debit', 'Kredit'],
          rows, subtotalRows,
          totalRow: ['', 'LABA (RUGI) BERSIH', '', labaRugiData.labaBersih]
        };
      }
      case 'neraca': {
        const rows: (string | number)[][] = [];
        const subtotalRows: number[] = [];

        rows.push(['', 'AKTIVA (ASET)', '']);
        rows.push(['', 'Aktiva Lancar', neracaData.aktivaLancar]);
        rows.push(['', 'Aset Tetap', neracaData.asetTetap]);
        subtotalRows.push(rows.length);
        rows.push(['', 'Total Aktiva', neracaData.totalAset]);

        rows.push(['', '', '']);
        rows.push(['', 'PASIVA (KEWAJIBAN & EKUITAS)', '']);
        rows.push(['', 'Kewajiban', neracaData.kewajiban]);
        rows.push(['', 'Modal Ekuitas', neracaData.ekuitas]);
        rows.push(['', 'Laba Berjalan', labaRugiData.labaBersih]);
        subtotalRows.push(rows.length);
        rows.push(['', 'Total Pasiva', neracaData.totalPasiva]);

        return {
          title: 'NERACA (LAPORAN POSISI KEUANGAN)',
          headers: ['No', 'Keterangan', 'Jumlah (Rp)'],
          rows, subtotalRows
        };
      }
      case 'neraca-saldo': {
        const activeAccounts = Object.values(accountBalances).filter(b => b.debit > 0 || b.credit > 0 || b.balance !== 0);
        activeAccounts.sort((a, b) => a.account.code.localeCompare(b.account.code));
        const totalDeb = activeAccounts.reduce((sum, b) => sum + (b.account.type === 'Asset' || b.account.type === 'Expense' ? b.balance : 0), 0);
        const totalKre = activeAccounts.reduce((sum, b) => sum + (b.account.type !== 'Asset' && b.account.type !== 'Expense' ? b.balance : 0), 0);

        const rows: (string | number)[][] = activeAccounts.map(b => [
          b.account.code,
          b.account.name,
          (b.account.type === 'Asset' || b.account.type === 'Expense') && b.balance > 0 ? b.balance : 0,
          (b.account.type !== 'Asset' && b.account.type !== 'Expense') && b.balance > 0 ? b.balance : 0
        ]);

        return {
          title: 'NERACA SALDO',
          headers: ['Kode', 'Nama Akun', 'Debit', 'Kredit'],
          rows,
          totalRow: ['', 'TOTAL', totalDeb, totalKre]
        };
      }
      case 'lpe': {
        const ekuitasAkhir = neracaData.ekuitas + labaRugiData.labaBersih;
        return {
          title: 'LAPORAN PERUBAHAN EKUITAS (LPE)',
          headers: ['No', 'Keterangan', 'Jumlah (Rp)'],
          rows: [
            [1, 'Modal Awal (Ekuitas)', neracaData.ekuitas],
            [2, 'Laba (Rugi) Periode Berjalan', labaRugiData.labaBersih]
          ],
          totalRow: ['', 'Ekuitas Akhir', ekuitasAkhir]
        };
      }
      case 'lak': {
        return {
          title: 'LAPORAN ARUS KAS (LAK)',
          headers: ['No', 'Keterangan', 'Jumlah (Rp)'],
          rows: [
            [1, 'Arus Kas dari Aktivitas Operasi', lakData.operasi],
            [2, 'Arus Kas dari Aktivitas Investasi', lakData.investasi],
            [3, 'Arus Kas dari Aktivitas Pendanaan', lakData.pendanaan]
          ],
          totalRow: ['', 'Kenaikan (Penurunan) Kas Bersih', lakData.total]
        };
      }
      case 'buku-besar': {
        const accName = accounts.find(a => a.id === selectedLedgerAccount);
        if (!accName) return null;
        const accountJournals = journals.filter(j => j.account_id === selectedLedgerAccount);
        let runningBalance = 0;
        const sorted = [...accountJournals].reverse();
        const rows: (string | number)[][] = sorted.map(j => {
          const type = accName.type;
          const isPositive = type === 'Asset' || type === 'Expense' ? j.debit - j.credit : j.credit - j.debit;
          runningBalance += isPositive;
          return [
            new Date(j.created_at).toLocaleDateString('id-ID'),
            j.description,
            j.debit > 0 ? j.debit : 0,
            j.credit > 0 ? j.credit : 0,
            runningBalance
          ];
        });
        return {
          title: `BUKU BESAR - ${accName.code} ${accName.name}`,
          headers: ['Tanggal', 'Keterangan', 'Debit', 'Kredit', 'Saldo'],
          rows
        };
      }
      default:
        return null;
    }
  };

  // ============================================================
  // Export Buttons Component
  // ============================================================
  const ExportButtons = ({ reportType }: { reportType: string }) => (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => handleExportPDF(reportType)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 trans-all disabled:opacity-50"
      >
        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Export PDF
      </button>
      <button
        onClick={() => handleExportExcel(reportType)}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 trans-all disabled:opacity-50"
      >
        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Export Excel
      </button>
    </div>
  );

  // UI Render function pieces
  const renderLabaRugi = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Laporan Laba Rugi</h2>
          <ExportButtons reportType="laba-rugi" />
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6 rounded-2xl border">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">PENDAPATAN</h3>
          <div className="flex justify-between gap-2 text-sm md:text-base"><span>Total Pendapatan</span><span className="font-bold text-right">Rp {labaRugiData.pendapatan.toLocaleString('id-ID')}</span></div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6 rounded-2xl border">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">HARGA POKOK & LABA KOTOR</h3>
          <div className="flex justify-between gap-2 text-sm md:text-base text-rose-600 dark:text-rose-400 mb-3 md:mb-4"><span>HPP</span><span className="text-right">(Rp {labaRugiData.hpp.toLocaleString('id-ID')})</span></div>
          <div className="flex justify-between gap-2 font-extrabold text-sm md:text-lg p-3 md:p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <span>Laba Kotor</span><span className="text-right">Rp {labaRugiData.labaKotor.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 md:p-6 rounded-2xl border">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">BEBAN OPERASIONAL</h3>
          <div className="flex justify-between gap-2 text-sm md:text-base text-rose-600 dark:text-rose-400 mb-2"><span>Total Beban Operasional</span><span className="text-right">(Rp {labaRugiData.beban.toLocaleString('id-ID')})</span></div>
        </div>
        <div className="flex justify-between gap-2 font-black text-base md:text-2xl text-white bg-primary-900 p-4 md:p-6 rounded-2xl shadow-xl">
          <span>LABA BERSIH</span><span className="text-right">Rp {labaRugiData.labaBersih.toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );

  const renderNeraca = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-8">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Neraca (Posisi Keuangan)</h2>
          <ExportButtons reportType="neraca" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="card rounded-2xl p-6 shadow-sm border">
            <h3 className="font-extrabold text-lg mb-4 border-b-2 border-emerald-500 pb-2">AKTIVA (ASET)</h3>
            <div className="flex justify-between mb-2"><span>Aktiva Lancar</span><span className="font-bold">Rp {neracaData.aktivaLancar.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-4"><span>Aset Tetap</span><span className="font-bold">Rp {neracaData.asetTetap.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between font-extrabold bg-emerald-50 text-emerald-700 p-4 rounded-xl">
              <span>Total Aktiva</span><span>Rp {neracaData.totalAset.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="card rounded-2xl p-6 shadow-sm border">
            <h3 className="font-extrabold text-lg mb-4 border-b-2 border-rose-500 pb-2">PASIVA (KEWAJIBAN & EKUITAS)</h3>
            <div className="flex justify-between mb-2"><span>Kewajiban</span><span className="font-bold">Rp {neracaData.kewajiban.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-2"><span>Modal Ekuitas</span><span className="font-bold">Rp {neracaData.ekuitas.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between mb-4"><span>Laba Berjalan</span><span className="font-bold text-emerald-600 dark:text-emerald-400">Rp {labaRugiData.labaBersih.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between font-extrabold bg-rose-50 text-rose-700 p-4 rounded-xl">
              <span>Total Pasiva</span><span>Rp {neracaData.totalPasiva.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBukuBesar = () => {
    const accountJournals = journals.filter(j => j.account_id === selectedLedgerAccount);
    let runningBalance = 0;
    const sorted = [...accountJournals].reverse(); // oldest first
    const rows = sorted.map(j => {
      const type = accounts.find(a => a.id === selectedLedgerAccount)?.type;
      const isPositive = type === 'Asset' || type === 'Expense' ? j.debit - j.credit : j.credit - j.debit;
      runningBalance += isPositive;
      return { ...j, runningBalance };
    });

    return (
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Buku Besar</h2>
            {selectedLedgerAccount && <ExportButtons reportType="buku-besar" />}
          </div>
          <select value={selectedLedgerAccount} onChange={e => setSelectedLedgerAccount(e.target.value)} className="input-field w-full md:w-1/2 px-4 py-3 border-2 rounded-xl text-sm md:text-base">
            <option value="">-- Pilih Akun --</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </select>
          {selectedLedgerAccount && (
            <div className="card rounded-2xl overflow-hidden border">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                  <tr><th className="p-4">Tgl</th><th className="p-4">Keterangan</th><th className="p-4">Debit</th><th className="p-4">Kredit</th><th className="p-4">Saldo</th></tr>
                </thead>
                <tbody className="">
                  {rows.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all border-b">
                      <td className="p-4">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="p-4">{r.description}</td>
                      <td className="p-4">{r.debit > 0 ? r.debit.toLocaleString() : '-'}</td>
                      <td className="p-4">{r.credit > 0 ? r.credit.toLocaleString() : '-'}</td>
                      <td className="p-4 font-bold">Rp {r.runningBalance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderNeracaSaldo = () => {
    const activeAccounts = Object.values(accountBalances).filter(b => b.debit > 0 || b.credit > 0 || b.balance !== 0);
    const totalDeb = activeAccounts.reduce((sum, b) => sum + (b.account.type === 'Asset' || b.account.type === 'Expense' ? b.balance : 0), 0);
    const totalKre = activeAccounts.reduce((sum, b) => sum + (b.account.type !== 'Asset' && b.account.type !== 'Expense' ? b.balance : 0), 0);
    
    return (
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Neraca Saldo</h2>
            <ExportButtons reportType="neraca-saldo" />
          </div>
          <div className="card rounded-2xl overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                <tr><th className="p-4 w-32">Kode</th><th className="p-4">Nama Akun</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Kredit</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeAccounts.sort((a,b) => a.account.code.localeCompare(b.account.code)).map(b => (
                  <tr key={b.account.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                    <td className="p-4">{b.account.code}</td>
                    <td className="p-4 font-bold">{b.account.name}</td>
                    <td className="p-4 text-right">{(b.account.type === 'Asset' || b.account.type === 'Expense') && b.balance > 0 ? b.balance.toLocaleString('id-ID') : '-'}</td>
                    <td className="p-4 text-right">{(b.account.type !== 'Asset' && b.account.type !== 'Expense') && b.balance > 0 ? b.balance.toLocaleString('id-ID') : '-'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 dark:bg-slate-800 font-black text-primary-900 dark:text-primary-400">
                  <td className="p-4" colSpan={2}>TOTAL</td>
                  <td className="p-4 text-right">Rp {totalDeb.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right">Rp {totalKre.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLPE = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Laporan Perubahan Ekuitas (LPE)</h2>
          <ExportButtons reportType="lpe" />
        </div>
        <div className="card rounded-2xl p-4 md:p-6 border space-y-3 md:space-y-4">
          <div className="flex justify-between gap-2 text-sm md:text-base"><span>Modal Awal (Ekuitas)</span><span className="font-bold text-right">Rp {neracaData.ekuitas.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between gap-2 text-sm md:text-base text-emerald-600 dark:text-emerald-400"><span>Laba (Rugi) Periode Berjalan</span><span className="font-bold text-right">Rp {labaRugiData.labaBersih.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between gap-2 font-extrabold border-t pt-3 md:pt-4 text-sm md:text-lg"><span>Ekuitas Akhir</span><span className="text-right">Rp {(neracaData.ekuitas + labaRugiData.labaBersih).toLocaleString('id-ID')}</span></div>
        </div>
      </div>
    </div>
  );

  const renderLAK = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Laporan Arus Kas (LAK)</h2>
          <ExportButtons reportType="lak" />
        </div>
        <div className="card rounded-2xl p-4 md:p-6 border space-y-3 md:space-y-4">
          <div className="flex justify-between gap-2 text-sm md:text-base"><span>Arus Kas dari Aktivitas Operasi</span><span className="font-bold text-right">Rp {lakData.operasi.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between gap-2 text-sm md:text-base"><span>Arus Kas dari Aktivitas Investasi</span><span className="font-bold text-right">Rp {lakData.investasi.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between gap-2 text-sm md:text-base"><span>Arus Kas dari Aktivitas Pendanaan</span><span className="font-bold text-right">Rp {lakData.pendanaan.toLocaleString('id-ID')}</span></div>
          <div className="flex justify-between gap-2 font-extrabold border-t pt-3 md:pt-4 text-sm md:text-lg"><span>Kenaikan (Penurunan) Kas Bersih</span><span className="text-right">Rp {lakData.total.toLocaleString('id-ID')}</span></div>
        </div>
      </div>
    </div>
  );

  const renderJurnal = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Jurnal Umum</h2>
        <div className="card rounded-2xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
              <tr><th className="p-4">Waktu</th><th className="p-4">Deskripsi</th><th className="p-4">Akun</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Kredit</th><th className="p-4 text-center w-16">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {journals.map(j => (
                <tr key={j.id} className="hover:bg-primary-50 dark:hover:bg-primary-900/20 trans-all group">
                  <td className="p-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{new Date(j.created_at).toLocaleString('id-ID')}</td>
                  <td className="p-4 text-slate-700 dark:text-slate-200">{j.description}</td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{j.accounts?.code} {j.accounts?.name}</td>
                  <td className={`p-4 text-right font-medium ${j.debit > 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>{j.debit > 0 ? j.debit.toLocaleString('id-ID') : '-'}</td>
                  <td className={`p-4 text-right font-medium ${j.credit > 0 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>{j.credit > 0 ? j.credit.toLocaleString('id-ID') : '-'}</td>
                  <td className="p-4 text-center">
                    {j.transaction_id && (
                      <button 
                        onClick={() => handleDeleteTransaction(j.transaction_id)}
                        className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-lg trans-all opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus Transaksi Ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAccountId) {
        await supabase.from('accounts').update({ code: accountData.code, name: accountData.name, type: accountData.type }).eq('id', editingAccountId);
        setToast({ message: 'Akun berhasil diperbarui', type: 'success' });
      } else {
        await supabase.from('accounts').insert({ code: accountData.code, name: accountData.name, type: accountData.type });
        setToast({ message: 'Akun berhasil ditambahkan', type: 'success' });
      }
      setShowAccountModal(false);
      setAccountData({ code: '', name: '', type: 'Asset' });
      setEditingAccountId(null);
      fetchData();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Gagal menyimpan akun', type: 'error' });
    }
    setLoading(false);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
      setToast({ message: 'Akun berhasil dihapus', type: 'success' });
      fetchData();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Gagal menghapus akun, mungkin masih digunakan di jurnal.', type: 'error' });
    }
    setLoading(false);
  };

  const renderKelolaAkun = () => (
    <div className="flex-1 overflow-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Kelola Akun Buku Besar</h2>
          <button onClick={() => { setAccountData({ code: '', name: '', type: 'Asset' }); setEditingAccountId(null); setShowAccountModal(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 trans-all">
            + Tambah Akun
          </button>
        </div>
        <div className="card rounded-2xl overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
              <tr><th className="p-4">Kode Akun</th><th className="p-4">Nama Akun</th><th className="p-4">Tipe Akun</th><th className="p-4 text-center w-24">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {accounts.map(a => (
                <tr key={a.id} className="hover:bg-primary-50 dark:hover:bg-primary-900/20 trans-all">
                  <td className="p-4 font-bold">{a.code}</td>
                  <td className="p-4">{a.name}</td>
                  <td className="p-4">{a.type}</td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => { setAccountData(a); setEditingAccountId(a.id); setShowAccountModal(true); }} className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDeleteAccount(a.id)} className="text-rose-500 hover:text-rose-700">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingAccountId ? 'Edit Akun' : 'Tambah Akun'}</h3>
            <form onSubmit={handleSaveAccount} className="space-y-4">
              <input required type="text" value={accountData.code} onChange={e => setAccountData({...accountData, code: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Kode Akun (Cth: 1.1.01.01)" />
              <input required type="text" value={accountData.name} onChange={e => setAccountData({...accountData, name: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Nama Akun" />
              <select required value={accountData.type} onChange={e => setAccountData({...accountData, type: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl">
                <option value="Asset">Asset (Harta)</option>
                <option value="Liability">Liability (Kewajiban/Hutang)</option>
                <option value="Equity">Equity (Modal)</option>
                <option value="Revenue">Revenue (Pendapatan)</option>
                <option value="Expense">Expense (Beban)</option>
              </select>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAccountModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)] space-y-4">
      {/* Navbar Tabs */}
      <div className="flex flex-col gap-3 md:gap-4 card rounded-2xl shadow-sm p-3 md:p-4 z-10">
        <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-1.5 md:gap-2 w-full pb-1 snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          {[
            { id: 'laba-rugi', name: 'Laba Rugi', icon: <TrendingUp size={14} /> },
            { id: 'neraca', name: 'Neraca', icon: <Scale size={14} /> },
            { id: 'lpe', name: 'LPE', icon: <Wallet size={14} /> },
            { id: 'lak', name: 'LAK', icon: <Activity size={14} /> },
            { id: 'jurnal', name: 'Jurnal', icon: <FileText size={14} /> },
            { id: 'buku-besar', name: 'Buku Besar', icon: <BookOpen size={14} /> },
            { id: 'neraca-saldo', name: 'Neraca Saldo', icon: <DollarSign size={14} /> },
            { id: 'kelola-akun', name: 'Kelola Akun', icon: <BookOpen size={14} /> },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-1 md:gap-1.5 py-2 px-2.5 md:px-3 rounded-xl text-xs md:text-sm font-bold trans-all whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200' : 'text-slate-500 hover:bg-slate-50'}`}>
              {tab.icon} <span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full items-center justify-between">
          <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value as ReportPeriod)} className="p-2.5 border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300">
            <option value="all">Semua Waktu</option>
            <option value="this_month">Bulan Ini</option>
            <option value="3_months">3 Bulan Terakhir</option>
            <option value="6_months">6 Bulan Terakhir</option>
          </select>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 flex-1 justify-end">
            <button onClick={() => setShowIncomeModal(true)} className="flex-1 min-w-[calc(50%-0.25rem)] sm:max-w-xs flex items-center justify-center gap-1.5 md:gap-2 bg-emerald-50 text-emerald-700 px-3 md:px-4 py-2.5 rounded-xl font-bold border border-emerald-200 text-xs md:text-sm"><ArrowDownCircle size={14} /> Pemasukan</button>
            <button onClick={() => setShowExpenseModal(true)} className="flex-1 min-w-[calc(50%-0.25rem)] sm:max-w-xs flex items-center justify-center gap-1.5 md:gap-2 bg-rose-50 text-rose-700 px-3 md:px-4 py-2.5 rounded-xl font-bold border border-rose-200 text-xs md:text-sm"><ArrowUpCircle size={14} /> Pengeluaran</button>
          {canManageClosing && (
            <button onClick={() => setShowClosingModal(true)} disabled={isExporting} className="flex-1 min-w-[calc(50%-0.25rem)] sm:min-w-0 flex items-center justify-center gap-1.5 md:gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 md:px-4 py-2.5 rounded-xl font-bold border border-indigo-200 dark:border-indigo-800 text-xs md:text-sm disabled:opacity-50">
              <BookOpen size={14} /> Tutup Buku
            </button>
          )}
          <button onClick={handleExportAllExcel} disabled={isExporting} className="flex-1 min-w-full sm:min-w-0 flex items-center justify-center gap-1.5 md:gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 md:px-4 py-2.5 rounded-xl font-bold border border-primary-200 dark:border-primary-800 text-xs md:text-sm disabled:opacity-50">
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Semua Laporan (.xlsx)
          </button>
        </div>
      </div>
    </div>
      
    {/* Content Area */}
    <div className="flex-1 card rounded-2xl shadow-sm overflow-hidden flex flex-col relative bg-white">
        {loading && <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center font-bold text-primary-600">Memuat Laporan...</div>}
        {activeTab === 'laba-rugi' && renderLabaRugi()}
        {activeTab === 'neraca' && renderNeraca()}
        {activeTab === 'buku-besar' && renderBukuBesar()}
        {activeTab === 'neraca-saldo' && renderNeracaSaldo()}
        {activeTab === 'lpe' && renderLPE()}
        {activeTab === 'lak' && renderLAK()}
        {activeTab === 'jurnal' && renderJurnal()}
        {activeTab === 'kelola-akun' && renderKelolaAkun()}
      </div>
      
      {/* Modals omitted for brevity, logic remains identical to previous modals using handleCatatPengeluaran, handleCatatPemasukan */}
      {/* To satisfy the compiler and user's functionality, I will include the minimal functional modals */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Setor Pemasukan</h3>
            <form onSubmit={handleCatatPemasukan} className="space-y-4">
              <select value={incomeData.source} onChange={e => setIncomeData({...incomeData, source: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl">
                <option value="Tempat Parkir">Tempat Parkir</option>
                <option value="Pengasapan Lele">Pengasapan Lele</option>
                <option value="Samsat Budiman">Samsat Budiman</option>
                <option value="Agen Internet">Agen Internet</option>
                <option value="Jasa Lainnya">Jasa Lainnya</option>
              </select>
              <input type="text" value={incomeData.relatedParty} onChange={e => setIncomeData({...incomeData, relatedParty: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Pihak Terkait (Opsional)" />
              <input required type="number" value={incomeData.amount} onChange={e => setIncomeData({...incomeData, amount: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Nominal" />
              <textarea required value={incomeData.desc} onChange={e => setIncomeData({...incomeData, desc: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Catatan" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowIncomeModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl">Batal</button><button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
      
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Catat Pengeluaran</h3>
            <form onSubmit={handleCatatPengeluaran} className="space-y-4">
              <input required type="number" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Nominal" />
              <textarea required value={expenseData.desc} onChange={e => setExpenseData({...expenseData, desc: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Keterangan Beban" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl">Batal</button><button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {showClosingModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Tutup Buku Bulanan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Pilih bulan dan tahun yang ingin ditutup. Transaksi pada periode ini tidak akan bisa diedit atau dihapus lagi.</p>
            <form onSubmit={handleTutupBuku} className="space-y-4">
              <div className="flex gap-4">
                <select required value={closingData.month} onChange={e => setClosingData({...closingData, month: Number(e.target.value)})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl">
                  {BULAN.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <input required type="number" min="2000" max="2100" value={closingData.year} onChange={e => setClosingData({...closingData, year: Number(e.target.value)})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Tahun" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowClosingModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2">Tutup Buku</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          subtitle={toast.subtitle}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Delete Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Transaksi?"
          message="Yakin ingin menghapus seluruh transaksi ini secara permanen? Data jurnal dan perubahan stok yang terkait akan ikut terhapus dan tidak dapat dikembalikan."
          confirmText="Hapus Permanen"
          cancelText="Batal"
          type="danger"
          onConfirm={confirmDeleteTransaction}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
