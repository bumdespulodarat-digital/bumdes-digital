import { useEffect, useState } from 'react';
import { Users, Plus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  contacts?: Contact;
}

export default function HutangPiutang() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'Piutang' | 'Utang'>('Piutang');

  // Modals
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const [contactForm, setContactForm] = useState({ name: '', type: 'Customer', phone: '' });
  const [debtForm, setDebtForm] = useState({ contact_id: '', type: 'Piutang', amount: '', due_date: '', notes: '' });

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

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('contacts').insert([contactForm]);
    setContactForm({ name: '', type: 'Customer', phone: '' });
    setShowContactModal(false);
    fetchData();
  };

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const amount = Number(debtForm.amount);
    
    // Insert debt
    const { data: newDebt } = await supabase.from('debts').insert([{
      contact_id: debtForm.contact_id,
      type: debtForm.type,
      amount,
      due_date: debtForm.due_date || null,
      notes: debtForm.notes,
      status: 'Belum Lunas'
    }]).select('id').single();

    if (newDebt) {
      // Create journal
      // If Piutang (Receivable): Debit Piutang, Credit Pendapatan/Kas(if loan) -> We assume Piutang Usaha
      // If Utang (Payable): Debit Kas/Beban, Credit Utang Usaha -> We assume Utang Usaha
      
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
          // Kas keluar (dipinjamkan) / Penjualan kredit
          // Asumsi sederhana: Uang kas keluar untuk piutang
          await supabase.from('journals').insert([
            { transaction_id: trx.id, account_id: piutangId, debit: amount, credit: 0, description: `Piutang baru: ${debtForm.notes}` },
            { transaction_id: trx.id, account_id: kasId, debit: 0, credit: amount, description: `Piutang baru: ${debtForm.notes}` }
          ]);
        } else {
          // Terima uang dari utang
          await supabase.from('journals').insert([
            { transaction_id: trx.id, account_id: kasId, debit: amount, credit: 0, description: `Utang baru: ${debtForm.notes}` },
            { transaction_id: trx.id, account_id: utangId, debit: 0, credit: amount, description: `Utang baru: ${debtForm.notes}` }
          ]);
        }
      }
    }

    setDebtForm({ contact_id: '', type: 'Piutang', amount: '', due_date: '', notes: '' });
    setShowDebtModal(false);
    fetchData();
  };

  const handlePayDebt = async (debt: Debt) => {
    if (!confirm(`Tandai ${debt.type} sebesar Rp ${debt.amount.toLocaleString()} LUNAS?`)) return;
    setLoading(true);

    await supabase.from('debts').update({ status: 'Lunas' }).eq('id', debt.id);

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
        // Terima pelunasan piutang (Kas masuk, Piutang berkurang)
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: kasId, debit: debt.amount, credit: 0, description: `Pelunasan Piutang: ${debt.contacts?.name}` },
          { transaction_id: trx.id, account_id: piutangId, debit: 0, credit: debt.amount, description: `Pelunasan Piutang: ${debt.contacts?.name}` }
        ]);
      } else {
        // Bayar utang (Utang berkurang, Kas keluar)
        await supabase.from('journals').insert([
          { transaction_id: trx.id, account_id: utangId, debit: debt.amount, credit: 0, description: `Pelunasan Utang: ${debt.contacts?.name}` },
          { transaction_id: trx.id, account_id: kasId, debit: 0, credit: debt.amount, description: `Pelunasan Utang: ${debt.contacts?.name}` }
        ]);
      }
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
        {loading && <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center font-bold text-primary-600">Memuat...</div>}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
            <tr><th className="p-4">Tanggal</th><th className="p-4">Pihak Terkait</th><th className="p-4">Jatuh Tempo</th><th className="p-4">Keterangan</th><th className="p-4 text-right">Nominal</th><th className="p-4 text-center">Status</th><th className="p-4 text-right">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDebts.length === 0 && <tr><td colSpan={7} className="text-center p-8 text-slate-400">Tidak ada data.</td></tr>}
            {filteredDebts.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                <td className="p-4">{new Date(d.due_date || '').toLocaleDateString('id-ID')}</td>
                <td className="p-4 font-bold">{d.contacts?.name}</td>
                <td className="p-4">{d.due_date ? new Date(d.due_date).toLocaleDateString('id-ID') : '-'}</td>
                <td className="p-4">{d.notes}</td>
                <td className="p-4 text-right font-bold text-slate-800">Rp {d.amount.toLocaleString()}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${d.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
                </td>
                <td className="p-4 text-right">
                  {d.status !== 'Lunas' && (
                    <button onClick={() => handlePayDebt(d)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white trans-all"><CheckCircle size={14} className="inline mr-1" /> Lunasi</button>
                  )}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Tambah Kontak Baru</h3>
            <form onSubmit={handleAddContact} className="space-y-4">
              <input required type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Nama Lengkap" />
              <select value={contactForm.type} onChange={e => setContactForm({...contactForm, type: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl">
                <option value="Customer">Pelanggan (Customer)</option>
                <option value="Supplier">Pemasok (Supplier)</option>
                <option value="Lainnya">Lainnya</option>
              </select>
              <input type="text" value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="No HP (Opsional)" />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowContactModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl">Batal</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {showDebtModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Catat {debtForm.type}</h3>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <select required value={debtForm.contact_id} onChange={e => setDebtForm({...debtForm, contact_id: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl">
                <option value="">-- Pilih Pihak Terkait --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input required type="number" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Nominal Rp" />
              <input type="date" value={debtForm.due_date} onChange={e => setDebtForm({...debtForm, due_date: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" />
              <textarea required value={debtForm.notes} onChange={e => setDebtForm({...debtForm, notes: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Keterangan..." />
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowDebtModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl">Batal</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
