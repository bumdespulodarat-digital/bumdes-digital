import { useEffect, useState } from 'react';
import { Archive, FileText, Users, Camera, Plus, Search, Trash2, Edit, X, RefreshCw, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast, { ConfirmDialog } from '../components/Toast';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { exportToPDF, exportToExcel, type BumdesProfile, type ExportTableData } from '../utils/exportUtils';
import { fetchImageAsBase64 } from '../utils/imageUtils';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? pdfFonts;

type TabType = 'barang' | 'surat' | 'notulen' | 'dokumentasi';

// ============ INTERFACES ============
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  qty: number;
  condition: string;
  location: string;
  acquisition_date: string;
  acquisition_cost: number;
  notes: string;
  photo_url: string;
  created_at: string;
}

interface Letter {
  id: string;
  letter_number: string;
  date: string;
  type: string;
  subject: string;
  sender_receiver: string;
  notes: string;
  file_url: string;
  created_at: string;
}

interface MeetingMinute {
  id: string;
  date: string;
  title: string;
  agenda: string;
  attendees: string;
  decisions: string;
  notulist: string;
  notes: string;
  created_at: string;
}

interface ActivityDoc {
  id: string;
  title: string;
  date: string;
  description: string;
  location: string;
  photo_urls: string[];
  created_at: string;
}

export default function Inventaris() {
  const { isPengawas } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('barang');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; table: string; name: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [bumdesProfile, setBumdesProfile] = useState<BumdesProfile>({
    storeName: 'BUMDes',
    storeAddress: '',
    direkturName: '',
    bendaharaName: ''
  });

  // ====== DATA STATES ======
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [meetings, setMeetings] = useState<MeetingMinute[]>([]);
  const [activities, setActivities] = useState<ActivityDoc[]>([]);

  // ====== MODAL STATES ======
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for Inventaris Barang
  const [invForm, setInvForm] = useState({ name: '', category: 'Peralatan', qty: '1', condition: 'Baik', location: '', acquisition_date: new Date().toISOString().split('T')[0], acquisition_cost: '0', notes: '' });
  // Form states for Surat
  const [letterForm, setLetterForm] = useState({ letter_number: '', date: new Date().toISOString().split('T')[0], type: 'Masuk', subject: '', sender_receiver: '', notes: '' });
  // Form states for Notulen
  const [meetingForm, setMeetingForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', agenda: '', attendees: '', decisions: '', notulist: '', notes: '' });
  // Form states for Dokumentasi
  const [activityForm, setActivityForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], description: '', location: '' });

  // ====== FETCH DATA ======
  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'barang') {
      const { data } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false });
      if (data) setInventoryItems(data);
    } else if (activeTab === 'surat') {
      const { data } = await supabase.from('letters').select('*').order('date', { ascending: false });
      if (data) setLetters(data);
    } else if (activeTab === 'notulen') {
      const { data } = await supabase.from('meeting_minutes').select('*').order('date', { ascending: false });
      if (data) setMeetings(data);
    } else if (activeTab === 'dokumentasi') {
      const { data } = await supabase.from('activity_docs').select('*').order('date', { ascending: false });
      if (data) setActivities(data);
    }
    
    // Fetch Profile
    const { data: storeData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (storeData) setBumdesProfile(prev => ({ ...prev, storeName: storeData.store_name, storeAddress: storeData.store_address }));
    const { data: usersData } = await supabase.from('bumdes_users').select('*');
    if (usersData) {
      const d = usersData.find((u: any) => u.role === 'Direktur BUMDes');
      const b = usersData.find((u: any) => u.role === 'Bendahara');
      setBumdesProfile(prev => ({ ...prev, direkturName: d?.name || '', bendaharaName: b?.name || '' }));
    }
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // ====== HANDLERS ======
  const resetForms = () => {
    setInvForm({ name: '', category: 'Peralatan', qty: '1', condition: 'Baik', location: '', acquisition_date: new Date().toISOString().split('T')[0], acquisition_cost: '0', notes: '' });
    setLetterForm({ letter_number: '', date: new Date().toISOString().split('T')[0], type: 'Masuk', subject: '', sender_receiver: '', notes: '' });
    setMeetingForm({ date: new Date().toISOString().split('T')[0], title: '', agenda: '', attendees: '', decisions: '', notulist: '', notes: '' });
    setActivityForm({ title: '', date: new Date().toISOString().split('T')[0], description: '', location: '' });
    setEditingId(null);
  };

  const openAddModal = () => { resetForms(); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === 'barang') {
        const payload = { ...invForm, qty: Number(invForm.qty), acquisition_cost: Number(invForm.acquisition_cost) };
        if (editingId) {
          await supabase.from('inventory_items').update(payload).eq('id', editingId);
        } else {
          await supabase.from('inventory_items').insert(payload);
        }
      } else if (activeTab === 'surat') {
        if (editingId) {
          await supabase.from('letters').update(letterForm).eq('id', editingId);
        } else {
          await supabase.from('letters').insert(letterForm);
        }
      } else if (activeTab === 'notulen') {
        if (editingId) {
          await supabase.from('meeting_minutes').update(meetingForm).eq('id', editingId);
        } else {
          await supabase.from('meeting_minutes').insert(meetingForm);
        }
      } else if (activeTab === 'dokumentasi') {
        if (editingId) {
          await supabase.from('activity_docs').update(activityForm).eq('id', editingId);
        } else {
          await supabase.from('activity_docs').insert(activityForm);
        }
      }
      setToast({ message: `Data berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!`, type: 'success' });
      setShowModal(false);
      resetForms();
      fetchData();
    } catch (err: any) {
      setToast({ message: 'Gagal menyimpan data', type: 'error', subtitle: err?.message });
    }
    setLoading(false);
  };

  const handlePrintNotulen = async (item: MeetingMinute) => {
    const logoBase64 = await fetchImageAsBase64('/logo-bumdes.png');
    
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 120, 40, 60],
      header: (): any => {
        return {
          margin: [40, 20, 40, 0],
          stack: [
            {
              columns: [
                ...(logoBase64 ? [{
                  image: logoBase64,
                  width: 60,
                  margin: [0, 0, 15, 0]
                }] : []),
                {
                  stack: [
                    { text: bumdesProfile.storeName || 'BUMDes Noto Mulyo', style: 'headerTitle', alignment: 'center' },
                    { text: bumdesProfile.storeAddress || 'Desa Polodarat, Kec. Pecan', style: 'headerSubtitle', alignment: 'center' },
                  ],
                  margin: [0, 10, 0, 0]
                }
              ],
              alignment: 'center'
            },
            { canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 2 }, { type: 'line', x1: 0, y1: 13, x2: 515, y2: 13, lineWidth: 0.5 }] },
            { text: 'NOTULEN RAPAT', style: 'title', alignment: 'center', margin: [0, 15, 0, 15] }
          ]
        };
      },
      content: [
        {
          columns: [
            { width: 100, text: 'Judul Rapat', bold: true },
            { width: 'auto', text: `: ${item.title}` }
          ],
          margin: [0, 0, 0, 5]
        },
        {
          columns: [
            { width: 100, text: 'Tanggal', bold: true },
            { width: 'auto', text: `: ${new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` }
          ],
          margin: [0, 0, 0, 5]
        },
        {
          columns: [
            { width: 100, text: 'Notulis', bold: true },
            { width: 'auto', text: `: ${item.notulist || '-'}` }
          ],
          margin: [0, 0, 0, 15]
        },
        { text: 'Agenda Rapat:', style: 'sectionHeader' },
        { text: item.agenda || '-', margin: [0, 0, 0, 15] },
        { text: 'Peserta:', style: 'sectionHeader' },
        { text: item.attendees || '-', margin: [0, 0, 0, 15] },
        { text: 'Keputusan / Hasil Rapat:', style: 'sectionHeader' },
        { text: item.decisions || '-', margin: [0, 0, 0, 20] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              alignment: 'center',
              stack: [
                { text: `Mengetahui,\nDirektur BUMDes`, margin: [0, 0, 0, 50] },
                { text: bumdesProfile.direkturName, bold: true, decoration: 'underline' }
              ]
            }
          ]
        }
      ],
      styles: {
        header: { fontSize: 16, bold: true, alignment: 'center' },
        subheader: { fontSize: 12, alignment: 'center', margin: [0, 0, 0, 20] },
        title: { fontSize: 14, bold: true, alignment: 'center', margin: [0, 0, 0, 20], decoration: 'underline' },
        sectionHeader: { fontSize: 12, bold: true, margin: [0, 0, 0, 5] }
      },
      defaultStyle: { fontSize: 11 }
    };
    pdfMake.createPdf(docDefinition).download(`Notulen_${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    await supabase.from(deleteConfirm.table).delete().eq('id', deleteConfirm.id);
    setToast({ message: `${deleteConfirm.name} berhasil dihapus`, type: 'success' });
    setDeleteConfirm(null);
    fetchData();
    setLoading(false);
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingId(item.id);
    setInvForm({ name: item.name, category: item.category, qty: item.qty.toString(), condition: item.condition, location: item.location, acquisition_date: item.acquisition_date, acquisition_cost: item.acquisition_cost.toString(), notes: item.notes });
    setShowModal(true);
  };

  const handleEditLetter = (item: Letter) => {
    setEditingId(item.id);
    setLetterForm({ letter_number: item.letter_number, date: item.date, type: item.type, subject: item.subject, sender_receiver: item.sender_receiver, notes: item.notes });
    setShowModal(true);
  };

  const handleEditMeeting = (item: MeetingMinute) => {
    setEditingId(item.id);
    setMeetingForm({ date: item.date, title: item.title, agenda: item.agenda, attendees: item.attendees, decisions: item.decisions, notulist: item.notulist, notes: item.notes });
    setShowModal(true);
  };

  const handleEditActivity = (item: ActivityDoc) => {
    setEditingId(item.id);
    setActivityForm({ title: item.title, date: item.date, description: item.description, location: item.location });
    setShowModal(true);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      if (activeTab === 'barang') {
        const exportData: ExportTableData = {
          title: 'DATA INVENTARIS ASET',
          headers: ['No', 'Nama Barang', 'Kategori', 'Jumlah', 'Kondisi', 'Lokasi', 'Nilai (Rp)'],
          rows: inventoryItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item, i) => [
            i + 1,
            item.name,
            item.category,
            item.qty,
            item.condition,
            item.location || '-',
            item.acquisition_cost
          ]),
          totalRow: ['', '', '', '', '', 'TOTAL NILAI', inventoryItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).reduce((acc, curr) => acc + curr.acquisition_cost, 0)]
        };
        if (format === 'pdf') await exportToPDF(exportData, bumdesProfile);
        else await exportToExcel([exportData], bumdesProfile);
      } else if (activeTab === 'surat') {
        const exportData: ExportTableData = {
          title: 'DATA INVENTARIS SURAT',
          headers: ['No', 'No. Surat', 'Tanggal', 'Jenis', 'Perihal', 'Pengirim/Tujuan', 'Keterangan'],
          rows: letters.filter(l => l.subject.toLowerCase().includes(search.toLowerCase()) || l.letter_number.toLowerCase().includes(search.toLowerCase())).map((item, i) => [
            i + 1,
            item.letter_number,
            new Date(item.date).toLocaleDateString('id-ID'),
            item.type,
            item.subject,
            item.sender_receiver || '-',
            item.notes || '-'
          ])
        };
        if (format === 'pdf') await exportToPDF(exportData, bumdesProfile);
        else await exportToExcel([exportData], bumdesProfile);
      }
    } catch (err: any) {
      setToast({ message: 'Gagal mengekspor data', type: 'error', subtitle: err?.message });
    }
    setIsExporting(false);
  };

  // ====== TAB CONFIG ======
  const tabs = [
    { key: 'barang' as TabType, icon: <Archive size={16} />, label: 'Inventaris Barang' },
    { key: 'surat' as TabType, icon: <FileText size={16} />, label: 'Inventaris Surat' },
    { key: 'notulen' as TabType, icon: <Users size={16} />, label: 'Notulen Rapat' },
    { key: 'dokumentasi' as TabType, icon: <Camera size={16} />, label: 'Dokumentasi' },
  ];

  const getFormTitle = () => {
    const prefix = editingId ? 'Edit' : 'Tambah';
    if (activeTab === 'barang') return `${prefix} Inventaris Barang`;
    if (activeTab === 'surat') return `${prefix} Surat`;
    if (activeTab === 'notulen') return `${prefix} Notulen Rapat`;
    return `${prefix} Dokumentasi Kegiatan`;
  };

  return (
    <div className="flex flex-col xl:h-[calc(100vh-130px)] space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} subtitle={toast.subtitle} onClose={() => setToast(null)} />}

      {/* Tab Navigation */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center card rounded-2xl shadow-sm p-4 z-10">
        <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full xl:w-auto snap-x">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-bold text-sm trans-all snap-start shrink-0 ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-700 dark:text-primary-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ').pop()}</span>
            </button>
          ))}
        </div>
        {!isPengawas && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={fetchData} className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-bold border dark:border-slate-700">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={openAddModal} className="flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary-600/30">
              <Plus size={16} /> Tambah
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 card rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden flex flex-col relative bg-white dark:bg-slate-900">
        {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat data...</div>}

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari data..." className="w-full pl-10 pr-4 py-2.5 border dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-semibold bg-white dark:bg-slate-900 dark:text-slate-100" />
          </div>
          {(activeTab === 'barang' || activeTab === 'surat') && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => handleExport('pdf')} disabled={isExporting || (activeTab === 'barang' && inventoryItems.length === 0) || (activeTab === 'surat' && letters.length === 0)} className="flex-1 sm:flex-none min-h-[44px] flex justify-center items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
                <Download size={14} /> PDF
              </button>
              <button onClick={() => handleExport('excel')} disabled={isExporting || (activeTab === 'barang' && inventoryItems.length === 0) || (activeTab === 'surat' && letters.length === 0)} className="flex-1 sm:flex-none min-h-[44px] flex justify-center items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg disabled:opacity-50">
                <Download size={14} /> Excel
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {/* ====== TAB: INVENTARIS BARANG ====== */}
          {activeTab === 'barang' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                  <tr>
                    <th className="p-4 rounded-tl-xl">Nama Barang</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4 text-center">Jumlah</th>
                    <th className="p-4">Kondisi</th>
                    <th className="p-4">Lokasi</th>
                    <th className="p-4 text-right">Nilai (Rp)</th>
                    {!isPengawas && <th className="p-4 text-center rounded-tr-xl">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {inventoryItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada data inventaris barang.</td></tr>
                  )}
                  {inventoryItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all even:bg-slate-50/50 dark:even:bg-slate-800/30">
                      <td className="p-4 font-bold dark:text-slate-100">{item.name}</td>
                      <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 dark:text-slate-300">{item.category}</span></td>
                      <td className="p-4 text-center font-black dark:text-slate-100">{item.qty}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.condition === 'Baik' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : item.condition === 'Rusak Ringan' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                          {item.condition}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{item.location || '-'}</td>
                      <td className="p-4 text-right font-bold text-primary-600 dark:text-primary-400">Rp {item.acquisition_cost.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-center space-x-2">
                        {!isPengawas && (
                          <>
                            <button onClick={() => handleEditInventory(item)} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white trans-all"><Edit size={16} /></button>
                            <button onClick={() => setDeleteConfirm({ id: item.id, table: 'inventory_items', name: item.name })} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white trans-all"><Trash2 size={16} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ====== TAB: INVENTARIS SURAT ====== */}
          {activeTab === 'surat' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
                  <tr>
                    <th className="p-4 rounded-tl-xl">No. Surat</th>
                    <th className="p-4">Tanggal</th>
                    <th className="p-4">Jenis</th>
                    <th className="p-4">Perihal</th>
                    <th className="p-4">Pengirim/Tujuan</th>
                    {!isPengawas && <th className="p-4 text-center rounded-tr-xl">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
                  {letters.filter(l => l.subject.toLowerCase().includes(search.toLowerCase()) || l.letter_number.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada data surat.</td></tr>
                  )}
                  {letters.filter(l => l.subject.toLowerCase().includes(search.toLowerCase()) || l.letter_number.toLowerCase().includes(search.toLowerCase())).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all even:bg-slate-50/50 dark:even:bg-slate-800/30">
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{item.letter_number}</td>
                      <td className="p-4 dark:text-slate-300">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.type === 'Masuk' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold dark:text-slate-100">{item.subject}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{item.sender_receiver || '-'}</td>
                      <td className="p-4 text-center space-x-2">
                        {!isPengawas && (
                          <>
                            <button onClick={() => handleEditLetter(item)} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white trans-all"><Edit size={16} /></button>
                            <button onClick={() => setDeleteConfirm({ id: item.id, table: 'letters', name: item.subject })} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white trans-all"><Trash2 size={16} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ====== TAB: NOTULEN RAPAT ====== */}
          {activeTab === 'notulen' && (
            <div className="space-y-4">
              {meetings.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada data notulen rapat.</div>
              )}
              {meetings.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).map(item => (
                <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary-300 dark:hover:border-primary-700 trans-all">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-slate-800 dark:text-slate-100 text-lg">{item.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} {item.notulist && `• Notulis: ${item.notulist}`}</p>
                    </div>
                    {!isPengawas && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handlePrintNotulen(item)} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white trans-all" title="Cetak PDF"><FileText size={16} /></button>
                        <button onClick={() => handleEditMeeting(item)} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white trans-all"><Edit size={16} /></button>
                        <button onClick={() => setDeleteConfirm({ id: item.id, table: 'meeting_minutes', name: item.title })} className="p-2 w-10 h-10 inline-flex items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white trans-all"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                  {item.agenda && <div className="mb-2"><span className="text-xs font-bold text-slate-500 uppercase">Agenda:</span><p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line">{item.agenda}</p></div>}
                  {item.attendees && <div className="mb-2"><span className="text-xs font-bold text-slate-500 uppercase">Peserta:</span><p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{item.attendees}</p></div>}
                  {item.decisions && <div className="p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-200 dark:border-primary-800"><span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">Keputusan:</span><p className="text-sm text-primary-800 dark:text-primary-200 mt-1 whitespace-pre-line font-medium">{item.decisions}</p></div>}
                </div>
              ))}
            </div>
          )}

          {/* ====== TAB: DOKUMENTASI KEGIATAN ====== */}
          {activeTab === 'dokumentasi' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activities.filter(a => a.title.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 font-medium">Belum ada dokumentasi kegiatan.</div>
              )}
              {activities.filter(a => a.title.toLowerCase().includes(search.toLowerCase())).map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 trans-all group">
                  <div className="h-40 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center">
                    <Camera size={48} className="text-primary-400 dark:text-primary-600 opacity-40" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif font-bold text-slate-800 dark:text-slate-100 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{new Date(item.date).toLocaleDateString('id-ID')} {item.location && `• ${item.location}`}</p>
                    {item.description && <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{item.description}</p>}
                    {!isPengawas && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button onClick={() => handleEditActivity(item)} className="flex-1 py-2 min-h-[44px] rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-600 hover:text-white trans-all">Edit</button>
                        <button onClick={() => setDeleteConfirm({ id: item.id, table: 'activity_docs', name: item.title })} className="flex-1 py-2 min-h-[44px] rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-600 hover:text-white trans-all">Hapus</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ====== ADD/EDIT MODAL ====== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800 shrink-0">
              <h3 className="text-xl font-serif font-bold dark:text-slate-100">{getFormTitle()}</h3>
              <button onClick={() => { setShowModal(false); resetForms(); }} className="text-slate-400 hover:text-slate-600 p-2 w-11 h-11 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {activeTab === 'barang' && (
                <>
                  <input required type="text" value={invForm.name} onChange={e => setInvForm({...invForm, name: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Nama Barang" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select value={invForm.category} onChange={e => setInvForm({...invForm, category: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                      <option value="Peralatan">Peralatan</option>
                      <option value="Meubelair">Meubelair</option>
                      <option value="Kendaraan">Kendaraan</option>
                      <option value="Bangunan">Bangunan</option>
                      <option value="Elektronik">Elektronik</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <select value={invForm.condition} onChange={e => setInvForm({...invForm, condition: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                      <option value="Baik">Baik</option>
                      <option value="Rusak Ringan">Rusak Ringan</option>
                      <option value="Rusak Berat">Rusak Berat</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required type="number" min="1" value={invForm.qty} onChange={e => setInvForm({...invForm, qty: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Jumlah" />
                    <input type="text" value={invForm.location} onChange={e => setInvForm({...invForm, location: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Lokasi" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="date" value={invForm.acquisition_date} onChange={e => setInvForm({...invForm, acquisition_date: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" />
                    <input type="number" min="0" value={invForm.acquisition_cost} onChange={e => setInvForm({...invForm, acquisition_cost: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Nilai Perolehan" />
                  </div>
                  <textarea value={invForm.notes} onChange={e => setInvForm({...invForm, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Catatan (opsional)" />
                </>
              )}
              {activeTab === 'surat' && (
                <>
                  <input required type="text" value={letterForm.letter_number} onChange={e => setLetterForm({...letterForm, letter_number: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Nomor Surat" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required type="date" value={letterForm.date} onChange={e => setLetterForm({...letterForm, date: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" />
                    <select value={letterForm.type} onChange={e => setLetterForm({...letterForm, type: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2">
                      <option value="Masuk">Surat Masuk</option>
                      <option value="Keluar">Surat Keluar</option>
                    </select>
                  </div>
                  <input required type="text" value={letterForm.subject} onChange={e => setLetterForm({...letterForm, subject: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Perihal" />
                  <input type="text" value={letterForm.sender_receiver} onChange={e => setLetterForm({...letterForm, sender_receiver: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Pengirim / Tujuan" />
                  <textarea value={letterForm.notes} onChange={e => setLetterForm({...letterForm, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Catatan (opsional)" />
                </>
              )}
              {activeTab === 'notulen' && (
                <>
                  <input required type="text" value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Judul Rapat" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={meetingForm.date} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" />
                    <input type="text" value={meetingForm.notulist} onChange={e => setMeetingForm({...meetingForm, notulist: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Notulis" />
                  </div>
                  <textarea required value={meetingForm.agenda} onChange={e => setMeetingForm({...meetingForm, agenda: e.target.value})} rows={3} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Agenda Rapat" />
                  <textarea value={meetingForm.attendees} onChange={e => setMeetingForm({...meetingForm, attendees: e.target.value})} rows={2} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Peserta (pisahkan dengan koma)" />
                  <textarea value={meetingForm.decisions} onChange={e => setMeetingForm({...meetingForm, decisions: e.target.value})} rows={3} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Hasil Keputusan Rapat" />
                  <textarea value={meetingForm.notes} onChange={e => setMeetingForm({...meetingForm, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Catatan Tambahan" />
                </>
              )}
              {activeTab === 'dokumentasi' && (
                <>
                  <input required type="text" value={activityForm.title} onChange={e => setActivityForm({...activityForm, title: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Judul Kegiatan" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={activityForm.date} onChange={e => setActivityForm({...activityForm, date: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" />
                    <input type="text" value={activityForm.location} onChange={e => setActivityForm({...activityForm, location: e.target.value})} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Lokasi" />
                  </div>
                  <textarea value={activityForm.description} onChange={e => setActivityForm({...activityForm, description: e.target.value})} rows={4} className="w-full px-3 py-2 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2" placeholder="Deskripsi Kegiatan" />
                </>
              )}
              <div className="pt-4 flex justify-end gap-3 border-t dark:border-slate-800 mt-2">
                <button type="button" onClick={() => { setShowModal(false); resetForms(); }} className="px-4 py-2 min-h-[44px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-5 py-2 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Hapus Data?"
          message={`"${deleteConfirm.name}" akan dihapus permanen dan tidak dapat dikembalikan.`}
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
