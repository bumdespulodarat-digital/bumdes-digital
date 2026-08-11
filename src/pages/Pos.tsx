import { useEffect, useState } from 'react';
import { Search, Plus, Minus, Trash2, Printer, ShoppingBag, Package, FileText, ChevronRight, X, Calendar, RefreshCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface Item {
  id: string;
  sku: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  tax_rate: number;
}

interface CartItem extends Item {
  qty: number;
  isCustom?: boolean;
}

interface PrintData {
  items: CartItem[];
  total: number;
  subtotal: number;
  totalTax: number;
  invoice: string;
  date: string;
  cashier: string;
  paymentMethod: string;
  amountPaid: number;
  changeAmount: number;
}

interface Transaction {
  id: string;
  invoice_number: string;
  total_amount: number;
  created_at: string;
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  cashier_name: string;
}

export default function Pos() {
  const [activeTab, setActiveTab] = useState<'Kasir' | 'Riwayat'>('Kasir');

  // --- STATES KASIR ---
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Transfer Bank'>('Tunai');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // --- STATES RIWAYAT ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any[]>([]);

  // --- GENERAL STATES ---
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Noto Mulyo', address: 'Pulodarat, Jepara', contact: '' });
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [cashierName, setCashierName] = useState('');

  // Custom item modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', price: '', qty: '1', tax_rate: '0' });

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').order('name');
    if (data) setItems(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (data) {
      setStoreInfo({ name: data.store_name, address: data.store_address, contact: data.store_contact || '' });
    }
  };

  const fetchCashierName = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.email) {
      const { data: userData } = await supabase
        .from('bumdes_users')
        .select('name')
        .eq('email', authData.user.email)
        .maybeSingle();
      if (userData?.name) {
        setCashierName(userData.name);
      } else {
        const namePart = authData.user.email.split('@')[0];
        setCashierName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('type', 'Penjualan')
      .order('created_at', { ascending: false });
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
    fetchCashierName();
  }, []);

  useEffect(() => {
    if (activeTab === 'Kasir') {
      fetchItems();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  // --- KASIR LOGIC ---
  const addToCart = (item: Item) => {
    if (item.stock <= 0) { setToast({ message: 'Stok habis!', type: 'warning', subtitle: `${item.name} tidak tersedia.` }); return; }
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.qty >= item.stock) { setToast({ message: 'Melebihi sisa stok!', type: 'warning', subtitle: `Stok ${item.name} tersisa ${item.stock} unit.` }); return; }
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const addCustomToCart = () => {
    if (!customForm.name || !customForm.price) return;
    const customId = `custom-${Date.now()}`;
    const customItem: CartItem = {
      id: customId,
      sku: 'CUSTOM',
      name: customForm.name,
      price: Number(customForm.price),
      cost_price: 0,
      stock: 9999,
      tax_rate: Number(customForm.tax_rate) || 0,
      qty: Number(customForm.qty) || 1,
      isCustom: true,
    };
    setCart([...cart, customItem]);
    setCustomForm({ name: '', price: '', qty: '1', tax_rate: '0' });
    setShowCustomModal(false);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.qty + delta;
        if (newQty > c.stock) { setToast({ message: 'Melebihi sisa stok!', type: 'warning', subtitle: `Stok ${c.name} tersisa ${c.stock} unit.` }); return c; }
        return { ...c, qty: Math.max(1, newQty) };
      }
      return c;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));

  const total = cart.reduce((sum, item) => {
    const itemSubtotal = item.price * item.qty;
    const itemTax = itemSubtotal * ((item.tax_rate || 0) / 100);
    return sum + itemSubtotal + itemTax;
  }, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalTax = cart.reduce((sum, item) => sum + (item.price * item.qty * ((item.tax_rate || 0) / 100)), 0);
  const changeAmount = paymentMethod === 'Tunai' ? Math.max(0, amountPaid - total) : 0;

  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    const { data, error: selectErr } = await supabase.from('accounts').select('id').eq('code', code).maybeSingle();
    if (selectErr) throw new Error(`Gagal mencari akun ${code}: ${selectErr.message}`);
    if (data) return data.id;

    const { data: newAcc, error: insertErr } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
    if (insertErr || !newAcc) throw new Error(`Gagal membuat akun ${code}: ${insertErr?.message || 'Unknown error'}`);
    return newAcc.id;
  };

  const generateInvoiceNumber = async (): Promise<string> => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const prefix = `INV-${dateStr}-`;

    const { data: existing, error } = await supabase
      .from('transactions')
      .select('invoice_number')
      .like('invoice_number', `${prefix}%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (!error && existing && existing.length > 0) {
      const lastInvoice = existing[0].invoice_number; 
      const lastNumStr = lastInvoice.split('-').pop();
      const lastNum = parseInt(lastNumStr || '0', 10);
      nextNum = lastNum + 1;
    }

    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  };

  const formatReceiptDateTime = (date: Date): string => {
    const dateStr = date.toLocaleDateString('id-ID');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${dateStr} ${h}:${min}:${s}`;
  };

  const handleCheckout = async (andPrint: boolean = false) => {
    if (cart.length === 0) return;

    if (paymentMethod === 'Tunai' && amountPaid < total) {
      setToast({ message: 'Uang bayar kurang!', type: 'warning', subtitle: `Total tagihan Rp ${total.toLocaleString('id-ID')}, uang bayar Rp ${amountPaid.toLocaleString('id-ID')}.` });
      return;
    }

    setLoading(true);

    try {
      const invoiceNumber = await generateInvoiceNumber();
      const now = new Date();
      const currentChangeAmount = paymentMethod === 'Tunai' ? Math.max(0, amountPaid - total) : 0;

      setPrintData({
        items: [...cart],
        total: total,
        subtotal: subtotal,
        totalTax: totalTax,
        invoice: invoiceNumber,
        date: formatReceiptDateTime(now),
        cashier: cashierName,
        paymentMethod: paymentMethod,
        amountPaid: paymentMethod === 'Tunai' ? amountPaid : total,
        changeAmount: currentChangeAmount
      });

      const { data: trx, error: trxErr } = await supabase.from('transactions').insert({
        invoice_number: invoiceNumber,
        type: 'Penjualan',
        total_amount: total,
        tax_amount: totalTax,
        notes: 'Penjualan Kasir',
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'Tunai' ? amountPaid : total,
        change_amount: currentChangeAmount,
        cashier_name: cashierName
      }).select('id').single();

      if (trxErr || !trx) throw new Error(`Gagal membuat transaksi header: ${trxErr?.message || 'Unknown error'}`);

      let totalHpp = 0;
      for (const item of cart) {
        const itemTaxRate = item.tax_rate || 0;
        const itemTaxAmount = item.price * item.qty * (itemTaxRate / 100);

        if (item.isCustom) {
          // Custom item — no stock deduction, item_id = null
          const { error: detErr } = await supabase.from('transaction_details').insert({
            transaction_id: trx.id,
            item_id: null,
            custom_item_name: item.name,
            qty: item.qty,
            unit_price: item.price,
            subtotal: item.price * item.qty,
            tax_rate: itemTaxRate,
            tax_amount: itemTaxAmount
          });
          if (detErr) throw new Error(`Gagal insert detail transaksi custom: ${detErr.message}`);
        } else {
          // Normal item — deduct stock
          const { error: detErr } = await supabase.from('transaction_details').insert({
            transaction_id: trx.id,
            item_id: item.id,
            qty: item.qty,
            unit_price: item.price,
            subtotal: item.price * item.qty,
            tax_rate: itemTaxRate,
            tax_amount: itemTaxAmount
          });
          if (detErr) throw new Error(`Gagal insert detail transaksi: ${detErr.message}`);

          const { error: updErr } = await supabase.from('items').update({ stock: item.stock - item.qty }).eq('id', item.id);
          if (updErr) throw new Error(`Gagal update stok barang: ${updErr.message}`);

          const { error: movErr } = await supabase.from('item_movements').insert({
            item_id: item.id,
            type: 'OUT',
            qty: item.qty,
            unit_price: item.cost_price || 0,
            total_price: (item.cost_price || 0) * item.qty,
            description: `Penjualan Kasir - Nota ${invoiceNumber}`,
            transaction_id: trx.id
          });
          if (movErr) throw new Error(`Gagal mencatat kartu stok: ${movErr.message}`);

          totalHpp += (item.cost_price || 0) * item.qty;
        }
      }

      const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');
      const penjId = await getOrCreateAccount('4.2.01.91', 'Pendapatan Penjualan Barang Dagangan', 'Revenue');
      const hppId = await getOrCreateAccount('5.1.01.01', 'Harga Pokok Penjualan Barang Dagangan', 'Expense');
      const persId = await getOrCreateAccount('1.1.05.01', 'Persediaan Barang Dagangan', 'Asset');

      const { error: jrnErr } = await supabase.from('journals').insert([
        { transaction_id: trx.id, account_id: kasId, debit: total, credit: 0, description: `Penjualan ${invoiceNumber}` },
        { transaction_id: trx.id, account_id: penjId, debit: 0, credit: total, description: `Penjualan ${invoiceNumber}` }
      ]);
      if (jrnErr) throw new Error(`Gagal mencatat jurnal penjualan: ${jrnErr.message}`);

      if (totalHpp > 0) {
        const { error: hppErr } = await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: hppId, debit: totalHpp, credit: 0, description: `HPP Penjualan ${invoiceNumber}` },
          { transaction_id: trx.id, account_id: persId, debit: 0, credit: totalHpp, description: `HPP Penjualan ${invoiceNumber}` }
        ]);
        if (hppErr) throw new Error(`Gagal mencatat jurnal HPP: ${hppErr.message}`);
      }

      // Auto-insert PPN journal if there's tax
      if (totalTax > 0) {
        const ppnKeluaranId = await getOrCreateAccount('2.1.02.01', 'PPN Keluaran', 'Liability');
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: kasId, debit: totalTax, credit: 0, description: `PPN Penjualan ${invoiceNumber}` },
          { transaction_id: trx.id, account_id: ppnKeluaranId, debit: 0, credit: totalTax, description: `PPN Penjualan ${invoiceNumber}` }
        ]);
      }

      // Auto-insert to Cash Book
      try {
        await supabase.from('cash_book').insert({
          date: now.toISOString().split('T')[0],
          description: `Penjualan Kasir - ${invoiceNumber}`,
          category: 'Penjualan Toko',
          debit: total,
          credit: 0,
          source: 'Kasir',
          reference_id: trx.id,
          created_by: cashierName
        });
      } catch (cashBookErr) {
        console.warn('Gagal auto-insert buku kas:', cashBookErr);
      }

      setCart([]);
      setIsMobileCartOpen(false);
      setPaymentMethod('Tunai');
      setAmountPaid(0);
      fetchItems();

      if (andPrint) {
        setTimeout(() => window.print(), 600);
      } else {
        setToast({ message: `Transaksi Berhasil! 🎉`, type: 'success', subtitle: `Nota ${invoiceNumber} — Total Rp ${total.toLocaleString('id-ID')}` });
      }
    } catch (err: any) {
      console.error(err);
      setToast({ message: 'Gagal memproses transaksi', type: 'error', subtitle: err?.message || 'Terjadi kesalahan saat checkout. Silakan coba lagi.' });
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  // --- RIWAYAT LOGIC ---
  const filteredHistory = transactions.filter(t => {
    const matchSearch = t.invoice_number.toLowerCase().includes(historySearch.toLowerCase()) || 
                        (t.cashier_name || '').toLowerCase().includes(historySearch.toLowerCase());
    let matchDate = true;
    if (historyDate) {
      const trxDate = t.created_at.split('T')[0];
      matchDate = trxDate === historyDate;
    }
    return matchSearch && matchDate;
  });

  const openHistoryDetail = async (trx: Transaction) => {
    setSelectedTransaction(trx);
    setShowHistoryModal(true);
    setLoading(true);
    const { data } = await supabase
      .from('transaction_details')
      .select('*, items(name, sku)')
      .eq('transaction_id', trx.id);
    if (data) setTransactionDetails(data);
    setLoading(false);
  };

  const handleReprint = (trx: Transaction, details: any[]) => {
    const itemsForPrint: CartItem[] = details.map(d => ({
      id: d.item_id,
      name: d.items?.name || d.custom_item_name || 'Item Custom',
      sku: d.items?.sku || '',
      qty: d.qty,
      price: d.unit_price,
      cost_price: 0,
      stock: 0,
      tax_rate: 0,
    }));

    setPrintData({
      items: itemsForPrint,
      total: trx.total_amount,
      subtotal: trx.total_amount - (trx.amount_paid || 0) + (trx.change_amount || 0), // approximate
      totalTax: 0,
      invoice: trx.invoice_number,
      date: formatReceiptDateTime(new Date(trx.created_at)),
      cashier: trx.cashier_name || '',
      paymentMethod: trx.payment_method || 'Tunai',
      amountPaid: trx.amount_paid || trx.total_amount,
      changeAmount: trx.change_amount || 0
    });

    setTimeout(() => window.print(), 300);
  };


  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} subtitle={toast.subtitle} onClose={() => setToast(null)} />
      )}
      
      <div className="flex flex-col h-full min-h-[calc(100vh-130px)] print:hidden relative pb-20 xl:pb-0">
        
        {/* TAB NAVIGATION */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-900/40 p-4 border dark:border-slate-800/60 rounded-2xl shadow-sm relative z-10 mb-6">
          <div className="flex overflow-x-auto whitespace-nowrap no-scrollbar bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto snap-x">
            <button 
              onClick={() => setActiveTab('Kasir')} 
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm trans-all flex items-center gap-2 justify-center ${activeTab === 'Kasir' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <ShoppingBag size={16} /> Kasir
            </button>
            <button 
              onClick={() => setActiveTab('Riwayat')} 
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm trans-all flex items-center gap-2 justify-center ${activeTab === 'Riwayat' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <FileText size={16} /> Riwayat Transaksi
            </button>
          </div>
        </div>

        {activeTab === 'Kasir' ? (
          /* =========================================================================
             TAB KASIR 
             ========================================================================= */
          <div className="flex flex-col xl:flex-row gap-6 flex-1">
            {/* AREA BARANG (KIRI) */}
            <div className="flex-1 card rounded-3xl shadow-sm p-4 md:p-6 flex flex-col h-[60vh] xl:h-auto">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
                <input
                  type="text"
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari barang (nama atau barcode)..."
                  className="w-full pl-12 pr-4 py-3.5 input-field border-2 rounded-2xl focus:outline-none focus:border-primary-400 focus:ring-4 focus:ring-primary-50 dark:focus:ring-primary-950 trans-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 overflow-y-auto pr-2 pb-4">
                {/* Custom Product Button */}
                <div
                  onClick={() => setShowCustomModal(true)}
                  className="card rounded-2xl p-4 cursor-pointer hover:border-amber-400 hover:shadow-lg trans-all flex flex-col justify-between group relative overflow-hidden border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2 py-4">
                    <Plus size={28} className="text-amber-500" />
                    <h4 className="font-bold text-amber-700 dark:text-amber-400 text-sm text-center">Produk Custom</h4>
                    <p className="text-xs text-amber-500 dark:text-amber-500 text-center">Jasa / Biaya Lainnya</p>
                  </div>
                </div>
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="card rounded-2xl p-4 cursor-pointer hover:border-primary-400 hover:shadow-lg trans-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-bl-full -mr-8 -mt-8 trans-all group-hover:scale-150 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50"></div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base mb-1 line-clamp-2">{item.name}</h4>
                      <p className="text-xs font-semibold text-slate-400 mb-3">Sisa Stok: <span className={item.stock < 5 ? 'text-rose-500' : 'text-emerald-500'}>{item.stock}</span></p>
                    </div>
                    <p className="text-primary-700 dark:text-primary-400 font-extrabold text-sm md:text-base relative z-10">Rp {item.price.toLocaleString('id-ID')}</p>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400">
                    <Package size={48} className="mb-3 opacity-20" />
                    <p className="font-medium">Barang tidak ditemukan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Custom Item Button */}
            <button
              onClick={() => setShowCustomModal(true)}
              className="xl:hidden fixed bottom-24 right-6 z-40 bg-amber-500 text-white p-3 rounded-full shadow-xl flex items-center gap-2 trans-all hover:bg-amber-600"
              title="Tambah Produk Custom"
            >
              <Plus size={20} />
            </button>

            {/* Floating Toggle Button for Mobile */}
            <button
              onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
              className={`xl:hidden fixed bottom-6 right-6 z-40 bg-primary-900 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 trans-all ${cart.length > 0 ? 'animate-bounce' : ''}`}
            >
              <div className="relative">
                <ShoppingBag size={24} />
                {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary-900">{cart.length}</span>}
              </div>
              <span className="font-bold hidden sm:block">Lihat Keranjang</span>
            </button>

            {/* Cart Panel */}
            <div className={`
              fixed xl:static inset-x-0 bottom-0 z-30 w-full xl:w-[420px] flex-shrink-0 card xl:rounded-3xl border-t xl:border shadow-2xl xl:shadow-sm flex flex-col h-[75vh] xl:h-auto trans-all
              ${isMobileCartOpen ? 'translate-y-0' : 'translate-y-full xl:translate-y-0'}
            `}>
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 xl:rounded-t-3xl">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-primary-600 dark:text-primary-400" /> Keranjang Belanja
                </h2>
                <button onClick={() => setIsMobileCartOpen(false)} className="xl:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                  <Minus size={18} />
                </button>
              </div>

              <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3">
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                    <ShoppingBag size={48} className="opacity-20" />
                    <p className="font-medium">Belum ada barang dipilih.</p>
                  </div>
                )}
                {cart.map(item => (
                  <div key={item.id} className={`flex gap-3 items-center p-3 rounded-2xl border shadow-sm hover:border-primary-200 dark:hover:border-primary-700 trans-all ${item.isCustom ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{item.name}</h4>
                        {item.isCustom && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">CUSTOM</span>}
                      </div>
                      <p className="text-primary-600 dark:text-primary-400 font-extrabold text-sm">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                        {(item.tax_rate || 0) > 0 && <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1">+{item.tax_rate}%</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shrink-0">
                      <button onClick={() => updateQty(item.id, -1)} className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm trans-all"><Minus size={14} /></button>
                      <span className="w-7 text-center font-bold text-sm text-slate-800 dark:text-slate-100">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm trans-all"><Plus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="w-11 h-11 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white trans-all ml-1"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl">
                {/* Totals */}
                <div className="mb-4 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Subtotal</span>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-300">Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {totalTax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">Pajak</span>
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400">Rp {Math.round(totalTax).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Tagihan</span>
                    <span className="text-xl sm:text-2xl font-black text-primary-900 dark:text-primary-300">Rp {Math.round(total).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                {cart.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Metode Pembayaran</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Tunai', 'QRIS', 'Transfer Bank'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => { setPaymentMethod(method); if (method !== 'Tunai') setAmountPaid(0); }}
                            className={`py-2.5 px-2 rounded-xl text-xs font-bold trans-all border-2 ${
                              paymentMethod === method
                                ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-400 text-primary-700 dark:text-primary-300 shadow-sm'
                                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === 'Tunai' && (
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Uang Bayar</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                            <input
                              type="number"
                              min={0}
                              value={amountPaid || ''}
                              onChange={e => setAmountPaid(Number(e.target.value))}
                              placeholder="0"
                              className="w-full pl-10 pr-4 py-3 input-field border-2 rounded-xl focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 dark:focus:ring-primary-950 trans-all font-bold text-right text-lg"
                            />
                          </div>
                        </div>
                        {/* Tombol nominal cepat */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: 'Uang Pas', value: total },
                            { label: '50rb', value: 50000 },
                            { label: '100rb', value: 100000 },
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setAmountPaid(preset.value)}
                              className="py-1.5 px-2 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 trans-all border border-slate-200 dark:border-slate-600"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        {amountPaid >= total && total > 0 && (
                          <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">Kembalian</span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-black text-lg">Rp {changeAmount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {amountPaid > 0 && amountPaid < total && (
                          <div className="flex justify-between items-center bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-800">
                            <span className="text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wide">Kurang</span>
                            <span className="text-rose-600 dark:text-rose-300 font-black text-lg">Rp {(total - amountPaid).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button disabled={cart.length === 0 || loading || (paymentMethod === 'Tunai' && amountPaid < total)} onClick={() => handleCheckout(true)} className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-slate-800 text-white hover:bg-slate-900 trans-all disabled:opacity-50 active:scale-95 shadow-lg shadow-slate-800/20">
                    <Printer size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">Cetak Struk</span>
                  </button>
                  <button disabled={cart.length === 0 || loading || (paymentMethod === 'Tunai' && amountPaid < total)} onClick={() => handleCheckout(false)} className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 trans-all disabled:opacity-50 active:scale-95 shadow-lg shadow-emerald-600/30">
                    <ShoppingBag size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider">{loading ? 'Memproses...' : 'Simpan Data'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             TAB RIWAYAT TRANSAKSI 
             ========================================================================= */
          <div className="flex-1 bg-white dark:bg-slate-900/40 border dark:border-slate-800/60 rounded-3xl shadow-sm p-4 sm:p-8 overflow-hidden relative flex flex-col">
            {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat...</div>}
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-400" size={18} />
                <input
                  type="text"
                  value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Cari Invoice atau nama Kasir..."
                  className="w-full pl-11 pr-4 py-2.5 input-field border dark:border-slate-700 rounded-xl font-medium"
                />
              </div>
              <div className="relative w-full md:w-64">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  value={historyDate} onChange={e => setHistoryDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 input-field border dark:border-slate-700 rounded-xl font-medium"
                />
              </div>
              <button onClick={fetchHistory} className="w-full md:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 trans-all flex items-center justify-center gap-2">
                <RefreshCcw size={18} /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                  <tr>
                    <th className="p-4 rounded-tl-xl">Invoice</th>
                    <th className="p-4">Waktu</th>
                    <th className="p-4">Kasir</th>
                    <th className="p-4">Metode Bayar</th>
                    <th className="p-4 text-right">Total Transaksi</th>
                    <th className="p-4 text-center rounded-tr-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-12 text-slate-400 font-medium">
                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                        Tidak ada riwayat transaksi yang ditemukan.
                      </td>
                    </tr>
                  )}
                  {filteredHistory.map(trx => (
                    <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                      <td className="p-4 font-bold text-primary-700 dark:text-primary-400">{trx.invoice_number}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{formatReceiptDateTime(new Date(trx.created_at))}</td>
                      <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">{trx.cashier_name || '-'}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {trx.payment_method || 'Tunai'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-800 dark:text-slate-100">
                        Rp {trx.total_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => openHistoryDetail(trx)}
                          className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-bold hover:bg-primary-600 hover:text-white trans-all inline-flex items-center gap-1.5"
                        >
                          Detail <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===== MODAL DETAIL RIWAYAT ===== */}
      {showHistoryModal && selectedTransaction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Detail Transaksi</h3>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">{selectedTransaction.invoice_number}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 trans-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Tanggal</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{formatReceiptDateTime(new Date(selectedTransaction.created_at))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Kasir</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedTransaction.cashier_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Pembayaran</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedTransaction.payment_method || 'Tunai'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Total</p>
                <p className="font-bold text-primary-600 dark:text-primary-400">Rp {selectedTransaction.total_amount.toLocaleString('id-ID')}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] border dark:border-slate-800 rounded-2xl mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold text-xs sticky top-0">
                  <tr>
                    <th className="p-3 pl-4">Barang</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Harga</th>
                    <th className="p-3 pr-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading ? (
                    <tr><td colSpan={4} className="text-center p-8 text-slate-400 font-medium">Memuat item...</td></tr>
                  ) : (
                    transactionDetails.map(detail => (
                      <tr key={detail.id}>
                        <td className="p-3 pl-4 font-semibold text-slate-800 dark:text-slate-200">{detail.items?.name || detail.custom_item_name || 'Item Custom'}</td>
                        <td className="p-3 text-center font-medium text-slate-600 dark:text-slate-400">{detail.qty}</td>
                        <td className="p-3 text-right font-medium text-slate-600 dark:text-slate-400">{detail.unit_price.toLocaleString('id-ID')}</td>
                        <td className="p-3 pr-4 text-right font-bold text-slate-800 dark:text-slate-200">{(detail.qty * detail.unit_price).toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowHistoryModal(false)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 trans-all">Tutup</button>
              <button 
                type="button" 
                onClick={() => handleReprint(selectedTransaction, transactionDetails)} 
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 trans-all shadow-lg flex items-center gap-2"
              >
                <Printer size={18} /> Cetak Ulang Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL CUSTOM ITEM ===== */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800 shrink-0">
              <h3 className="text-xl font-bold dark:text-slate-100 flex items-center gap-2">
                <Plus size={22} className="text-amber-500" /> Produk Custom
              </h3>
              <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Jasa / Barang</label>
                <input required type="text" value={customForm.name} onChange={e => setCustomForm({...customForm, name: e.target.value})} className="w-full px-4 py-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2" placeholder="Contoh: Jasa Fotokopi / Biaya Admin" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Harga (Rp)</label>
                <input required type="number" min="0" value={customForm.price} onChange={e => setCustomForm({...customForm, price: e.target.value})} className="w-full px-4 py-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 font-bold" placeholder="0" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pajak (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={customForm.tax_rate} onChange={e => setCustomForm({...customForm, tax_rate: e.target.value})} className="w-full px-4 py-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Jumlah / Qty</label>
                  <input required type="number" min="1" value={customForm.qty} onChange={e => setCustomForm({...customForm, qty: e.target.value})} className="w-full px-4 py-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 font-bold" placeholder="1" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowCustomModal(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Batal</button>
              <button onClick={addCustomToCart} disabled={!customForm.name || !customForm.price} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">Tambahkan</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AREA STRUK CETAK ===== */}
      {printData && (
        <div className="hidden print:block w-[58mm] text-[11px] leading-snug font-mono text-black mx-auto p-1 pb-4 bg-white">
          <div className="text-center mb-4">
            <h2 className="font-bold text-[14px]">{storeInfo.name}</h2>
            <p>{storeInfo.address}</p>
            {storeInfo.contact && <p>Telp: {storeInfo.contact}</p>}
            <div className="border-b border-dashed border-black my-2"></div>
          </div>

          <div className="mb-2">
            <p>No: {printData.invoice}</p>
            <p>Tgl: {printData.date}</p>
            {printData.cashier && <p>Kasir: {printData.cashier}</p>}
            <div className="border-b border-dashed border-black my-2"></div>
          </div>

          <div className="mb-2">
            {printData.items.map((item, i) => (
              <div key={i} className="mb-2">
                <p>{item.name}</p>
                <div className="flex justify-between">
                  <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                  <span>{(item.qty * item.price).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-black my-2"></div>

          {totalTax > 0 && printData.totalTax > 0 && (
            <div className="mb-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rp {printData.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak:</span>
                <span>Rp {Math.round(printData.totalTax).toLocaleString('id-ID')}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between font-bold text-[13px] mb-1">
            <span>TOTAL:</span>
            <span>Rp {printData.total.toLocaleString('id-ID')}</span>
          </div>

          <div className="mb-2">
            <div className="flex justify-between">
              <span>Bayar ({printData.paymentMethod}):</span>
              <span>Rp {printData.amountPaid.toLocaleString('id-ID')}</span>
            </div>
            {printData.paymentMethod === 'Tunai' && printData.changeAmount > 0 && (
              <div className="flex justify-between">
                <span>Kembalian:</span>
                <span>Rp {printData.changeAmount.toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <div className="text-center mt-6">
            <p>Terima Kasih</p>
            <p>Barang yang dibeli tidak dapat</p>
            <p>ditukar.</p>
          </div>
        </div>
      )}
    </>
  );
}
