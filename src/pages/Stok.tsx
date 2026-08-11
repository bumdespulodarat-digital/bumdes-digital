import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, RefreshCw, X, FileText, Package, Upload, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
  tax_rate: number;
}

interface Movement {
  id: string;
  created_at: string;
  type: string;
  qty: number;
  description: string;
}

export default function Stok() {
  const { isPengawas } = useAuth();
  const [activeTab, setActiveTab] = useState<'Manajemen' | 'Kartu'>('Manajemen');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stok Management State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '', tax_rate: '0'
  });

  // Excel Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);

  // Kartu Stok State
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [movements, setMovements] = useState<Movement[]>([]);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setInventory(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchMovements = async (itemId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('item_movements')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });
    if (data) setMovements(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedItemId) {
      fetchMovements(selectedItemId);
    } else {
      setMovements([]);
    }
  }, [selectedItemId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      cost_price: Number(formData.cost_price),
      stock: Number(formData.stock),
      tax_rate: Number(formData.tax_rate) || 0
    };

    if (editingItem) {
      const stockDiff = payload.stock - editingItem.stock;
      const { data: updatedItem } = await supabase.from('items').update(payload).eq('id', editingItem.id).select('id').single();
      if (updatedItem && stockDiff !== 0) {
        await supabase.from('item_movements').insert({
          item_id: updatedItem.id,
          type: stockDiff > 0 ? 'IN' : 'OUT',
          qty: Math.abs(stockDiff),
          unit_price: payload.cost_price,
          total_price: payload.cost_price * Math.abs(stockDiff),
          description: 'Penyesuaian Stok Manual'
        });
      }
    } else {
      const { data: newItem } = await supabase.from('items').insert(payload).select('id').single();
      if (newItem && payload.stock > 0) {
        await supabase.from('item_movements').insert({
          item_id: newItem.id,
          type: 'IN',
          qty: payload.stock,
          unit_price: payload.cost_price,
          total_price: payload.cost_price * payload.stock,
          description: 'Saldo Awal Stok'
        });
      }
    }

    setShowModal(false);
    setEditingItem(null);
    setFormData({ sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '', tax_rate: '0' });
    fetchItems();
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku, name: item.name, category: item.category, 
      price: item.price.toString(), cost_price: item.cost_price.toString(), stock: item.stock.toString(),
      tax_rate: (item.tax_rate || 0).toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus barang ini? Data transaksi terkait mungkin terdampak.')) {
      await supabase.from('items').delete().eq('id', id);
      fetchItems();
    }
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  // ====== EXCEL IMPORT ======
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['SKU', 'Nama Barang', 'Kategori', 'Harga Jual', 'Harga Beli (HPP)', 'Stok', 'Pajak (%)'],
      ['BRG-001', 'Contoh Barang', 'ATK', 10000, 8000, 50, 11],
      ['BRG-002', 'Contoh Barang 2', 'Kebutuhan Pokok', 5000, 3500, 100, 0],
    ]);
    ws['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Barang');
    XLSX.writeFile(wb, 'Template_Import_Barang_BUMDes.xlsx');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const wb = XLSX.read(data, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws);
      const mapped = jsonData.map((row: any) => ({
        sku: String(row['SKU'] || ''),
        name: String(row['Nama Barang'] || ''),
        category: String(row['Kategori'] || 'ATK'),
        price: Number(row['Harga Jual'] || 0),
        cost_price: Number(row['Harga Beli (HPP)'] || 0),
        stock: Number(row['Stok'] || 0),
        tax_rate: Number(row['Pajak (%)'] || 0),
      })).filter((r: any) => r.sku && r.name);
      setImportData(mapped);
    };
    reader.readAsBinaryString(file);
  };

  const handleImportConfirm = async () => {
    if (importData.length === 0) return;
    setImportLoading(true);
    let successCount = 0;
    let skipCount = 0;
    for (const item of importData) {
      const { data: existing } = await supabase.from('items').select('id').eq('sku', item.sku).maybeSingle();
      if (existing) {
        await supabase.from('items').update(item).eq('id', existing.id);
        skipCount++;
      } else {
        const { data: newItem } = await supabase.from('items').insert(item).select('id').single();
        if (newItem && item.stock > 0) {
          await supabase.from('item_movements').insert({
            item_id: newItem.id, type: 'IN', qty: item.stock,
            unit_price: item.cost_price, total_price: item.cost_price * item.stock,
            description: 'Import dari Excel'
          });
        }
        successCount++;
      }
    }
    setImportLoading(false);
    setShowImportModal(false);
    setImportData([]);
    setToast({ message: `Import selesai! ✅`, type: 'success', subtitle: `${successCount} baru ditambah, ${skipCount} diperbarui.` });
    fetchItems();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} subtitle={toast.subtitle} onClose={() => setToast(null)} />}
      {/* Navbar Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center card rounded-2xl shadow-sm p-4 z-10">
        <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto snap-x">
          <button onClick={() => setActiveTab('Manajemen')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm trans-all ${activeTab === 'Manajemen' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><Package size={16} /> Manajemen Stok</button>
          <button onClick={() => setActiveTab('Kartu')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm trans-all ${activeTab === 'Kartu' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><FileText size={16} /> Kartu Stok</button>
        </div>
        {activeTab === 'Manajemen' && (
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <button onClick={fetchItems} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border dark:border-slate-700"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
            {!isPengawas && (
              <>
                <button onClick={handleDownloadTemplate} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-xl font-bold border border-emerald-200 dark:border-emerald-800 text-sm"><Download size={14} /> Template</button>
                <button onClick={() => setShowImportModal(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-2 rounded-xl font-bold border border-blue-200 dark:border-blue-800 text-sm"><Upload size={14} /> Import Excel</button>
                <button onClick={() => { setEditingItem(null); setFormData({ sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '', tax_rate: '0' }); setShowModal(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary-600/30"><Plus size={16} /> Tambah Barang</button>
              </>
            )}
          </div>
        )}
      </div>

      {activeTab === 'Manajemen' ? (
        <div className="flex-1 card rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden flex flex-col relative bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari berdasarkan nama atau kode barang..." 
                className="w-full pl-10 pr-4 py-2.5 border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold bg-white dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 font-bold">Memuat data...</div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">Tidak ada data barang.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                  <tr>
                    <th className="p-4 rounded-tl-xl w-32">Kode (SKU)</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4 text-right">Harga Beli</th>
                    <th className="p-4 text-right">Harga Jual</th>
                    <th className="p-4 text-center">Pajak</th>
                    <th className="p-4 text-center">Stok</th>
                    {!isPengawas && <th className="p-4 text-center rounded-tr-xl">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                      <td className="p-4 font-mono text-slate-500 dark:text-slate-400">{item.sku}</td>
                      <td className="p-4 font-bold dark:text-slate-100">{item.name}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 dark:text-slate-300">{item.category}</span></td>
                      <td className="p-4 text-right text-slate-500 dark:text-slate-400">Rp {item.cost_price?.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-right font-bold text-primary-600 dark:text-primary-400">Rp {item.price.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-center">
                        {(item.tax_rate || 0) > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{item.tax_rate}%</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.stock < 10 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {item.stock}
                        </span>
                      </td>
                      {!isPengawas && (
                        <td className="p-4 text-center space-x-2">
                          <button onClick={() => handleEdit(item)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white trans-all"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white trans-all"><Trash2 size={14} /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 card rounded-2xl shadow-sm border dark:border-slate-800 flex flex-col relative bg-white dark:bg-slate-900 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Buku Pembantu Persediaan</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Lihat riwayat pergerakan stok barang masuk dan keluar.</p>
            </div>
            
            <select value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} className="input-field w-full md:w-1/2 p-3 border-2 dark:border-slate-700 rounded-xl font-bold bg-slate-50 dark:bg-slate-800 dark:text-slate-100">
              <option value="">-- Pilih Barang --</option>
              {inventory.map(item => <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>)}
            </select>

            {selectedItemId && (
              <div className="border dark:border-slate-800 rounded-xl overflow-x-auto mt-6">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                    <tr><th className="p-4">Waktu</th><th className="p-4">Keterangan</th><th className="p-4 text-center">Masuk</th><th className="p-4 text-center">Keluar</th><th className="p-4 text-center">Saldo Stok</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                    {movements.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada riwayat pergerakan stok.</td></tr>}
                    {movements.map((m, idx) => {
                      let saldo = 0;
                      // Calculate running balance by summing up all previous movements
                      for(let i=0; i<=idx; i++){
                         saldo += (movements[i].type === 'IN' ? movements[i].qty : -movements[i].qty);
                      }
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                          <td className="p-4 dark:text-slate-300">{new Date(m.created_at).toLocaleString('id-ID')}</td>
                          <td className="p-4 dark:text-slate-300">{m.description}</td>
                          <td className="p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{m.type === 'IN' ? m.qty : '-'}</td>
                          <td className="p-4 text-center font-bold text-rose-600 dark:text-rose-400">{m.type === 'OUT' ? m.qty : '-'}</td>
                          <td className="p-4 text-center font-black dark:text-slate-100">{saldo}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
              <h3 className="text-xl font-bold dark:text-slate-100">{editingItem ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Kode (SKU)" />
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Nama Barang" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                  <option value="ATK">ATK</option>
                  <option value="Kebutuhan Pokok">Kebutuhan Pokok</option>
                  <option value="Jasa">Jasa</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Stok" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="number" min="0" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="HPP" />
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 font-bold text-primary-600 dark:text-primary-400" placeholder="Harga Jual" />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Pajak (%)</label>
                <input type="number" min="0" max="100" step="0.5" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="0" />
                <span className="absolute right-3 top-[34px] text-slate-400 text-sm font-bold">%</span>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== IMPORT EXCEL MODAL ====== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800 shrink-0">
              <h3 className="text-xl font-bold dark:text-slate-100">📥 Import Barang dari Excel</h3>
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">📄 Download template terlebih dahulu, isi data, lalu upload file Excel Anda di bawah ini.</p>
                <button onClick={handleDownloadTemplate} className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm"><Download size={14} /> Download Template Excel</button>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload File Excel (.xlsx)</label>
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-sm" />
              </div>
              {importData.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Preview Data ({importData.length} barang)</h4>
                  <div className="border dark:border-slate-700 rounded-xl overflow-x-auto max-h-64">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead className="bg-slate-100 dark:bg-slate-800 font-bold sticky top-0">
                        <tr><th className="p-2">SKU</th><th className="p-2">Nama</th><th className="p-2">Kategori</th><th className="p-2 text-right">Harga Jual</th><th className="p-2 text-right">HPP</th><th className="p-2 text-center">Stok</th><th className="p-2 text-center">Pajak</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {importData.map((item, i) => (
                          <tr key={i} className="dark:text-slate-300">
                            <td className="p-2 font-mono">{item.sku}</td>
                            <td className="p-2 font-semibold">{item.name}</td>
                            <td className="p-2">{item.category}</td>
                            <td className="p-2 text-right">Rp {item.price.toLocaleString('id-ID')}</td>
                            <td className="p-2 text-right">Rp {item.cost_price.toLocaleString('id-ID')}</td>
                            <td className="p-2 text-center">{item.stock}</td>
                            <td className="p-2 text-center">{item.tax_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold">Batal</button>
              <button onClick={handleImportConfirm} disabled={importData.length === 0 || importLoading} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">
                {importLoading ? 'Mengimport...' : `Import ${importData.length} Barang`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
