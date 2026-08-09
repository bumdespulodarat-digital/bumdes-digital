import { useEffect, useState } from 'react';
import { Users, Plus, CheckCircle, XCircle, Pencil, Trash2, Undo2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast, { ConfirmDialog } from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface Contact {
  id: string;
  name: string;
  type: string;
  phone: string;
}

interface Debt {
  id: string;
  contact_id: string;
  type: string;
  amount: number;
  due_date: string;
  status: string;
  notes: string;
  created_at: string;
  contacts?: Contact;
}

export default function HutangPiutang() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Piutang' | 'Utang'>('Piutang');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);

  // Modals
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Confirm dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<Debt | null>(null);
  const [lunasConfirm, setLunasConfirm] = useState<Debt | null>(null);
  const [batalLunasConfirm, setBatalLunasConfirm] = useState<Debt | null>(null);

  const [contactForm, setContactForm] = useState({ name: '', type: 'Customer', phone: '' });
  const [debtForm, setDebtForm] = useState({ contact_id: '', type: 'Piutang', amount: '', due_date: '', notes: '' });
  const [editForm, setEditForm] = useState({ id: '', contact_id: '', amount: '', due_date: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    const { data: contactsData } = await supabase.from('contacts').select('*').order('name');
    if (contactsData) setContacts(contactsData);

    const { data: debtsData } = await supabase.from('debts').select('*, contacts(*)').order('created_at', { ascending: false });
    if (debtsData) setDebts(debtsData as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * Validasi tanggal: tahun harus 4 digit dan antara 2000-2099
   * Mengembalikan true jika valid (atau kosong), false jika invalid
   */
  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return true; // tanggal opsional
    const parts = dateStr.split('-'); // format HTML date: YYYY-MM-DD
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    return year >= 2000 && year <= 2099 && parts[0].length === 4;
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('contacts').insert([contactForm]);
    if (error) {
      setToast({ message: 'Gagal menambah kontak', type: 'error', subtitle: error.message });
    } else {
      setToast({ message: 'Kontak berhasil ditambahkan! ✨', type: 'success', subtitle: `${contactForm.name} telah ditambahkan ke daftar kontak.` });
    }
    setContactForm({ name: '', type: 'Customer', phone: '' });
    setShowContactModal(false);
    fetchData();
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi tanggal
    if (!validateDate(debtForm.due_date)) {
      setToast({ message: 'Format tanggal salah', type: 'error', subtitle: 'Tahun harus 4 digit (contoh: 2026). Periksa kembali tanggal jatuh tempo.' });
      return;
    }

    setLoading(true);
    const amount = Number(debtForm.amount);
    
    // Insert debt
    const { data: newDebt, error: debtErr } = await supabase.from('debts').insert([{
      contact_id: debtForm.contact_id,
      type: debtForm.type,
      amount,
      due_date: debtForm.due_date || null,
      notes: debtForm.notes,
      status: 'Belum Lunas'
    }]).select('id').single();

    if (debtErr) {
      setToast({ message: 'Gagal menyimpan data', type: 'error', subtitle: debtErr.message });
      setLoading(false);
      return;
    }

    if (newDebt) {
      // Create journal
      const piutangId = await getOrCreateAccount('1.1.03.01', 'Piutang Usaha', 'Asset');
      const utangId = await getOrCreateAccount('2.1.01.01', 'Utang Usaha', 'Liability');
      const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');

      const { data: trx } = await supabase.from('transactions').insert({
        invoice_number: `DEBT-${Date.now()}`,
        type: debtForm.type,
        total_amount: amount,
        notes: debtForm.notes
      }).select('id').single();

      if (trx) {
        if (debtForm.type === 'Piutang') {
          await supabase.from('journals').insert([
            { transaction_id: trx.id, account_id: piutangId, debit: amount, credit: 0, description: `Piutang baru: ${debtForm.notes}` },
            { transaction_id: trx.id, account_id: kasId, debit: 0, credit: amount, description: `Piutang baru: ${debtForm.notes}` }
          ]);
        } else {
          await supabase.from('journals').insert([
            { transaction_id: trx.id, account_id: kasId, debit: amount, credit: 0, description: `Utang baru: ${debtForm.notes}` },
            { transaction_id: trx.id, account_id: utangId, debit: 0, credit: amount, description: `Utang baru: ${debtForm.notes}` }
          ]);
        }
      }

      setToast({ message: `${debtForm.type} berhasil dicatat! 📝`, type: 'success', subtitle: `Rp ${amount.toLocaleString('id-ID')} — ${debtForm.notes}` });
    }

    setDebtForm({ contact_id: '', type: 'Piutang', amount: '', due_date: '', notes: '' });
    setShowDebtModal(false);
    fetchData();
  };

  // ===== TANDAI LUNAS =====
  const handlePayDebt = async (debt: Debt) => {
    setLunasConfirm(debt);
  };

  const confirmPayDebt = async () => {
    if (!lunasConfirm) return;
    const debt = lunasConfirm;
    setLunasConfirm(null);
    setLoading(true);

    const { error } = await supabase.from('debts').update({ status: 'Lunas' }).eq('id', debt.id);
    if (error) {
      setToast({ message: 'Gagal mengubah status', type: 'error', subtitle: error.message });
      setLoading(false);
      return;
    }

    const piutangId = await getOrCreateAccount('1.1.03.01', 'Piutang Usaha', 'Asset');
    const utangId = await getOrCreateAccount('2.1.01.01', 'Utang Usaha', 'Liability');
    const kasId = await getOrCreateAccount('1.1.01.01', 'Kas Tunai', 'Asset');

    const { data: trx } = await supabase.from('transactions').insert({
      invoice_number: `PAY-${Date.now()}`,
      type: `Pelunasan ${debt.type}`,
      total_amount: debt.amount,
      notes: `Pelunasan ${debt.type} - ${debt.contacts?.name}`
    }).select('id').single();

    if (trx) {
      if (debt.type === 'Piutang') {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: kasId, debit: debt.amount, credit: 0, description: `Pelunasan Piutang: ${debt.contacts?.name}` },
          { transaction_id: trx.id, account_id: piutangId, debit: 0, credit: debt.amount, description: `Pelunasan Piutang: ${debt.contacts?.name}` }
        ]);
      } else {
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: utangId, debit: debt.amount, credit: 0, description: `Pelunasan Utang: ${debt.contacts?.name}` },
          { transaction_id: trx.id, account_id: kasId, debit: 0, credit: debt.amount, description: `Pelunasan Utang: ${debt.contacts?.name}` }
        ]);
      }
    }

    setToast({ message: `${debt.type} telah dilunasi! ✅`, type: 'success', subtitle: `${debt.contacts?.name} — Rp ${debt.amount.toLocaleString('id-ID')}` });
    fetchData();
  };

  // ===== BATALKAN LUNAS =====
  const handleBatalLunas = (debt: Debt) => {
    setBatalLunasConfirm(debt);
  };

  const confirmBatalLunas = async () => {
    if (!batalLunasConfirm) return;
    const debt = batalLunasConfirm;
    setBatalLunasConfirm(null);
    setLoading(true);

    const { error } = await supabase.from('debts').update({ status: 'Belum Lunas' }).eq('id', debt.id);
    if (error) {
      setToast({ message: 'Gagal mengubah status', type: 'error', subtitle: error.message });
    } else {
      setToast({ message: `Status dikembalikan ke Belum Lunas`, type: 'info', subtitle: `${debt.contacts?.name} — Rp ${debt.amount.toLocaleString('id-ID')}` });
    }
    fetchData();
  };

  // ===== EDIT =====
  const handleOpenEdit = (debt: Debt) => {
    setEditForm({
      id: debt.id,
      contact_id: debt.contact_id,
      amount: String(debt.amount),
      due_date: debt.due_date ? debt.due_date.split('T')[0] : '',
      notes: debt.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDate(editForm.due_date)) {
      setToast({ message: 'Format tanggal salah', type: 'error', subtitle: 'Tahun harus 4 digit (contoh: 2026). Periksa kembali tanggal jatuh tempo.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('debts').update({
      contact_id: editForm.contact_id,
      amount: Number(editForm.amount),
      due_date: editForm.due_date || null,
      notes: editForm.notes
    }).eq('id', editForm.id);

    if (error) {
      setToast({ message: 'Gagal menyimpan perubahan', type: 'error', subtitle: error.message });
    } else {
      setToast({ message: 'Data berhasil diperbarui! ✏️', type: 'success', subtitle: 'Perubahan telah tersimpan.' });
    }
    setShowEditModal(false);
    fetchData();
  };

  // ===== HAPUS =====
  const handleDeleteDebt = (debt: Debt) => {
    setDeleteConfirm(debt);
  };

  const confirmDeleteDebt = async () => {
    if (!deleteConfirm) return;
    const debt = deleteConfirm;
    setDeleteConfirm(null);
    setLoading(true);

    const { error } = await supabase.from('debts').delete().eq('id', debt.id);
    if (error) {
      setToast({ message: 'Gagal menghapus data', type: 'error', subtitle: error.message });
    } else {
      setToast({ message: 'Data berhasil dihapus 🗑️', type: 'success', subtitle: `${debt.type} ${debt.contacts?.name} — Rp ${debt.amount.toLocaleString('id-ID')} telah dihapus.` });
    }
    fetchData();
  };

  const getOrCreateAccount = async (code: string, name: string, type: string) => {
    let { data: acc } = await supabase.from('accounts').select('id').eq('code', code).single();
    if (!acc) {
      const { data: newAcc } = await supabase.from('accounts').insert({ code, name, type }).select('id').single();
      acc = newAcc;
    }
    return acc?.id;
  };

  const filteredDebts = debts.filter(d => d.type === activeTab);

  return (
    <div className="flex flex-col min-h-[calc(100vh-130px)] space-y-4">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          subtitle={toast.subtitle}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white dark:bg-slate-900/40 p-4 border dark:border-slate-800/60 rounded-2xl shadow-sm relative z-10">
        <div className="flex overflow-x-auto whitespace-nowrap no-scrollbar bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto snap-x">
          <button onClick={() => setActiveTab('Piutang')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm trans-all ${activeTab === 'Piutang' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Buku Piutang</button>
          <button onClick={() => setActiveTab('Utang')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm trans-all ${activeTab === 'Utang' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Buku Utang</button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowContactModal(true)} className="flex-1 sm:flex-none justify-center items-center flex gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 trans-all"><Users size={16} /> Kontak</button>
          <button onClick={() => { setDebtForm({...debtForm, type: activeTab}); setShowDebtModal(true); }} className={`flex-1 sm:flex-none justify-center items-center flex gap-2 px-4 py-2 text-white rounded-xl font-bold trans-all hover:-translate-y-0.5 ${activeTab === 'Piutang' ? 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30' : 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/30'}`}><Plus size={16} /> Tambah {activeTab}</button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900/40 border dark:border-slate-800/60 rounded-2xl shadow-sm p-4 sm:p-8 overflow-hidden relative flex flex-col">
        {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat...</div>}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Pihak Terkait</th>
              <th className="p-4">Jatuh Tempo</th>
              <th className="p-4">Keterangan</th>
              <th className="p-4 text-right">Nominal</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDebts.length === 0 && <tr><td colSpan={7} className="text-center p-8 text-slate-400">Tidak ada data.</td></tr>}
            {filteredDebts.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                <td className="p-4 text-slate-600 dark:text-slate-400">{formatDate(d.created_at)}</td>
                <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{d.contacts?.name || '-'}</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">{formatDate(d.due_date)}</td>
                <td className="p-4 text-slate-600 dark:text-slate-400">{d.notes || '-'}</td>
                <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-100">Rp {d.amount.toLocaleString('id-ID')}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${d.status === 'Lunas' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>{d.status}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Toggle Lunas / Belum Lunas */}
                    {d.status !== 'Lunas' ? (
                      <button
                        onClick={() => handlePayDebt(d)}
                        title="Tandai Lunas"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 trans-all"
                      >
                        <CheckCircle size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBatalLunas(d)}
                        title="Batalkan Lunas"
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 trans-all"
                      >
                        <Undo2 size={16} />
                      </button>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(d)}
                      title="Edit"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 trans-all"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* Hapus */}
                    <button
                      onClick={() => handleDeleteDebt(d)}
                      title="Hapus"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 trans-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL: Tambah Kontak ===== */}
      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Tambah Kontak Baru</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
                <input required type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" placeholder="Nama Lengkap" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tipe Kontak</label>
                <select value={contactForm.type} onChange={e => setContactForm({...contactForm, type: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold">
                  <option value="Customer">Pelanggan (Customer)</option>
                  <option value="Supplier">Pemasok (Supplier)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">No HP (Opsional)</label>
                <input type="text" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" placeholder="08xxxxxxxxxx" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowContactModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 trans-all">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold trans-all shadow-lg shadow-primary-600/30">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Tambah Hutang/Piutang ===== */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Catat {debtForm.type}</h3>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Pihak Terkait</label>
                <select required value={debtForm.contact_id} onChange={e => setDebtForm({...debtForm, contact_id: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold">
                  <option value="">-- Pilih Pihak Terkait --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Nominal (Rp)</label>
                <input required type="number" min="1" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Jatuh Tempo (Opsional)</label>
                <input type="date" min="2000-01-01" max="2099-12-31" value={debtForm.due_date} onChange={e => setDebtForm({...debtForm, due_date: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Keterangan</label>
                <textarea required value={debtForm.notes} onChange={e => setDebtForm({...debtForm, notes: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" rows={3} placeholder="Keterangan..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowDebtModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 trans-all">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold trans-all shadow-lg shadow-primary-600/30">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: Edit Hutang/Piutang ===== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Pencil size={20} className="text-primary-600" /> Edit Data
            </h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Pihak Terkait</label>
                <select required value={editForm.contact_id} onChange={e => setEditForm({...editForm, contact_id: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold">
                  <option value="">-- Pilih Pihak Terkait --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Nominal (Rp)</label>
                <input required type="number" min="1" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Jatuh Tempo (Opsional)</label>
                <input type="date" min="2000-01-01" max="2099-12-31" value={editForm.due_date} onChange={e => setEditForm({...editForm, due_date: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Keterangan</label>
                <textarea required value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full p-3 input-field border dark:border-slate-700 rounded-xl font-semibold" rows={3} placeholder="Keterangan..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 trans-all">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold trans-all shadow-lg shadow-primary-600/30">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== CONFIRM DIALOG: Hapus ===== */}
      {deleteConfirm && (
        <ConfirmDialog
          title={`Hapus ${deleteConfirm.type}?`}
          message={`Data ${deleteConfirm.type} "${deleteConfirm.contacts?.name}" sebesar Rp ${deleteConfirm.amount.toLocaleString('id-ID')} akan dihapus permanen dan tidak dapat dikembalikan.`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
          type="danger"
          onConfirm={confirmDeleteDebt}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* ===== CONFIRM DIALOG: Tandai Lunas ===== */}
      {lunasConfirm && (
        <ConfirmDialog
          title={`Tandai ${lunasConfirm.type} Lunas?`}
          message={`${lunasConfirm.type} "${lunasConfirm.contacts?.name}" sebesar Rp ${lunasConfirm.amount.toLocaleString('id-ID')} akan ditandai sebagai LUNAS. Jurnal pelunasan akan dicatat otomatis.`}
          confirmText="Ya, Lunasi"
          cancelText="Batal"
          type="info"
          onConfirm={confirmPayDebt}
          onCancel={() => setLunasConfirm(null)}
        />
      )}

      {/* ===== CONFIRM DIALOG: Batalkan Lunas ===== */}
      {batalLunasConfirm && (
        <ConfirmDialog
          title="Batalkan Pelunasan?"
          message={`Status ${batalLunasConfirm.type} "${batalLunasConfirm.contacts?.name}" akan dikembalikan ke "Belum Lunas".`}
          confirmText="Ya, Batalkan"
          cancelText="Tidak"
          type="warning"
          onConfirm={confirmBatalLunas}
          onCancel={() => setBatalLunasConfirm(null)}
        />
      )}
    </div>
  );
}
