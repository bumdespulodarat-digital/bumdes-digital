import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, RefreshCw, X, FileText, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  stock: number;
}

interface Movement {
  id: string;
  created_at: string;
  type: string;
  qty: number;
  description: string;
}

export default function Stok() {
  const [activeTab, setActiveTab] = useState<'Manajemen' | 'Kartu'>('Manajemen');
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stok Management State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: ''
  });

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
      stock: Number(formData.stock)
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
    setFormData({ sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '' });
    fetchItems();
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      sku: item.sku, name: item.name, category: item.category, 
      price: item.price.toString(), cost_price: item.cost_price.toString(), stock: item.stock.toString()
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

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] space-y-4">
      {/* Navbar Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center card rounded-2xl shadow-sm p-4 z-10">
        <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto snap-x">
          <button onClick={() => setActiveTab('Manajemen')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm trans-all ${activeTab === 'Manajemen' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><Package size={16} /> Manajemen Stok</button>
          <button onClick={() => setActiveTab('Kartu')} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm trans-all ${activeTab === 'Kartu' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}><FileText size={16} /> Kartu Stok</button>
        </div>
        {activeTab === 'Manajemen' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={fetchItems} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border dark:border-slate-700"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
            <button onClick={() => { setEditingItem(null); setFormData({ sku: '', name: '', category: 'ATK', price: '', cost_price: '', stock: '' }); setShowModal(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary-600/30"><Plus size={16} /> Tambah Barang</button>
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
                    <th className="p-4 rounded-tl-xl">Kode (SKU)</th>
                    <th className="p-4">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4 text-right">Harga Beli</th>
                    <th className="p-4 text-right">Harga Jual</th>
                    <th className="p-4 text-center">Stok</th>
                    <th className="p-4 text-center rounded-tr-xl">Aksi</th>
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
                      <td className="p-4 text-center font-black dark:text-slate-100">{item.stock}</td>
                      <td className="p-4 text-center space-x-2">
                        <button onClick={() => handleEdit(item)} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white trans-all"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white trans-all"><Trash2 size={14} /></button>
                      </td>
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
              <div className="grid grid-cols-2 gap-4">
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                  <option value="ATK">ATK</option>
                  <option value="Kebutuhan Pokok">Kebutuhan Pokok</option>
                  <option value="Jasa">Jasa</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Stok" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" min="0" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="HPP" />
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 font-bold text-primary-600 dark:text-primary-400" placeholder="Harga Jual" />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold shadow-lg">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
