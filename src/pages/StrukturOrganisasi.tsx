import { useEffect, useState } from 'react';
import { Users, Phone, Mail, ChevronDown, ChevronUp, Building2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  position: string;
  phone: string;
  photo_url: string;
  nik?: string;
  last_education?: string;
}

// Hierarchy levels for org chart ordering
const ROLE_ORDER: Record<string, number> = {
  'Musyawarah Desa (MUSDES)': 1,
  'Penasihat': 2,
  'Pengawas': 3,
  'Direktur BUMDes': 4,
  'Sekretaris': 5,
  'Bendahara': 5,
  'Manager Unit Usaha': 6,
  'Karyawan': 7,
};

const ROLE_COLORS: Record<string, string> = {
  'Musyawarah Desa (MUSDES)': 'from-indigo-600 to-indigo-800',
  'Penasihat': 'from-sky-500 to-sky-700',
  'Pengawas': 'from-violet-500 to-violet-700',
  'Direktur BUMDes': 'from-primary-600 to-primary-800',
  'Sekretaris': 'from-blue-500 to-blue-700',
  'Bendahara': 'from-emerald-500 to-emerald-700',
  'Manager Unit Usaha': 'from-amber-500 to-amber-700',
  'Karyawan': 'from-teal-500 to-teal-700',
};

export default function StrukturOrganisasi() {
  const { userRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Noto Mulyo', address: 'Pulodarat, Jepara' });
  const [showOrgChart, setShowOrgChart] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<Member>>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('bumdes_users').select('*').order('created_at');
    if (data) setMembers(data as Member[]);

    const { data: store } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (store) setStoreInfo({ name: store.store_name, address: store.store_address });
    setLoading(false);
  };

  // Sort members by hierarchy
  const sortedMembers = [...members].sort((a, b) => (ROLE_ORDER[a.role] || 99) - (ROLE_ORDER[b.role] || 99));

  // Group for org chart
  const musdes = sortedMembers.filter(m => ['Musyawarah Desa (MUSDES)', 'MUSDES'].includes(m.role));
  const penasihat = sortedMembers.filter(m => m.role === 'Penasihat');
  const pengawas = sortedMembers.filter(m => m.role === 'Pengawas');
  const direktur = sortedMembers.filter(m => ['Direktur BUMDes', 'Direktur'].includes(m.role));
  const sekretaris = sortedMembers.filter(m => m.role === 'Sekretaris');
  const bendahara = sortedMembers.filter(m => m.role === 'Bendahara');
  const manager = sortedMembers.filter(m => ['Manager Unit Usaha', 'Manager'].includes(m.role));
  const karyawan = sortedMembers.filter(m => ['Karyawan', 'Admin', 'Akuntan'].includes(m.role));

  const MemberCard = ({ member, size = 'normal' }: { member: Member; size?: 'large' | 'normal' | 'small' }) => {
    const gradient = ROLE_COLORS[member.role] || 'from-slate-500 to-slate-700';
    const isLarge = size === 'large';
    const isSmall = size === 'small';

    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 trans-all overflow-hidden group w-full ${isLarge ? 'sm:max-w-xs' : isSmall ? 'sm:max-w-[200px]' : 'sm:max-w-[240px]'}`}>
        {/* Color bar */}
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />
        <div className={`${isLarge ? 'p-6' : 'p-4'} text-center`}>
          {/* Avatar */}
          <div className={`${isLarge ? 'w-20 h-20' : isSmall ? 'w-12 h-12' : 'w-16 h-16'} mx-auto rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black ${isLarge ? 'text-3xl' : isSmall ? 'text-lg' : 'text-2xl'} shadow-lg mb-3 ring-4 ring-white dark:ring-slate-800`}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          <h3 className={`font-bold text-slate-800 dark:text-slate-100 ${isLarge ? 'text-lg' : 'text-sm'} leading-tight mb-0.5`}>{member.name}</h3>
          <p className={`text-xs font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
            {member.position || member.role}
          </p>
          {member.phone && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
              <Phone size={10} /> {member.phone}
            </p>
          )}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            <Mail size={10} className="inline mr-1" />{member.email}
          </p>
          {(member.nik || member.last_education) && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              {member.nik && <p className="text-[10px] text-slate-500 font-medium">NIK: {member.nik}</p>}
              {member.last_education && <p className="text-[10px] text-slate-500 font-medium">Pend: {member.last_education}</p>}
            </div>
          )}
          {(userRole === 'Admin' || userRole === 'Direktur BUMDes') && (
            <button onClick={() => { setEditData(member); setShowEditModal(true); }} className="mt-3 px-3 py-1.5 bg-slate-50 border dark:border-slate-700 dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 trans-all w-full text-slate-700 dark:text-slate-200">
              Edit Profil
            </button>
          )}
        </div>
      </div>
    );
  };

  const EmptyCard = ({ role, size = 'normal' }: { role: string; size?: 'large' | 'normal' | 'small' }) => {
    const isLarge = size === 'large';
    const isSmall = size === 'small';

    return (
      <div className={`bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex items-center justify-center text-center p-4 w-full ${isLarge ? 'sm:max-w-xs h-[180px]' : isSmall ? 'sm:max-w-[200px] h-[120px]' : 'sm:max-w-[240px] h-[150px]'}`}>
        <div>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{role}</p>
          <p className="text-slate-400 dark:text-slate-500 text-[10px]">(Belum ada)</p>
        </div>
      </div>
    );
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('bumdes_users').update({
        name: editData.name,
        role: editData.role,
        position: editData.position,
        nik: editData.nik,
        last_education: editData.last_education,
      }).eq('id', editData.id);
      
      if (error) throw error;
      setToast({ message: 'Profil berhasil diperbarui', type: 'success' });
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Gagal memperbarui profil', type: 'error' });
    }
    setLoading(false);
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)] text-slate-500 font-bold">
        Memuat data struktur organisasi...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="card rounded-2xl shadow-sm p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-950/30 dark:to-blue-950/20" />
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-primary-900 dark:text-primary-200 mb-1">Struktur Organisasi</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">{storeInfo.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{storeInfo.address}</p>
        </div>
      </div>

      {/* Org Chart Toggle */}
      <button
        onClick={() => setShowOrgChart(!showOrgChart)}
        className="card rounded-2xl shadow-sm p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 trans-all"
      >
        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users size={18} className="text-primary-600" /> Bagan Organisasi
        </span>
        {showOrgChart ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {/* Org Chart */}
      {showOrgChart && (
        <div className="card rounded-2xl shadow-sm p-4 sm:p-8 overflow-x-auto border dark:border-slate-800">
          <div className="w-full sm:min-w-[600px] flex flex-col items-center gap-6">
            {/* Level 1: MUSDES */}
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Musyawarah Desa</div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full items-center">
                {musdes.length > 0 ? musdes.map(m => <MemberCard key={m.id} member={m} size="large" />) : <EmptyCard role="MUSDES" size="large" />}
              </div>
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-4" />
            </div>

            {/* Level 2: PENASIHAT */}
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penasihat</div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full items-center">
                 {penasihat.length > 0 ? penasihat.map(m => <MemberCard key={m.id} member={m} size="large" />) : <EmptyCard role="Penasihat" size="large" />}
              </div>
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-4" />
            </div>

            {/* Level 3: PENGAWAS */}
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pengawas</div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full items-center">
                 {pengawas.length > 0 ? pengawas.map(m => <MemberCard key={m.id} member={m} size="large" />) : <EmptyCard role="Pengawas" size="large" />}
              </div>
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-4" />
            </div>

            {/* Level 4: DIREKTUR */}
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Direktur</div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full items-center">
                {direktur.length > 0 ? direktur.map(m => <MemberCard key={m.id} member={m} size="large" />) : <EmptyCard role="Direktur" size="large" />}
              </div>
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-4" />
            </div>

            {/* Level 4: SEKRETARIS & BENDAHARA */}
            <div className="flex flex-col items-center w-full relative">
              {/* Horizontal Branch Line connecting the two */}
              <div className="absolute top-0 w-1/2 sm:w-[320px] h-0.5 bg-slate-300 dark:bg-slate-600" />
              
              <div className="flex gap-8 sm:gap-16 justify-center w-full items-start pt-4 relative">
                {/* Vertical drops from horizontal line */}
                <div className="absolute top-0 left-[25%] sm:left-[calc(50%-160px)] w-0.5 h-4 bg-slate-300 dark:bg-slate-600" />
                <div className="absolute top-0 right-[25%] sm:right-[calc(50%-160px)] w-0.5 h-4 bg-slate-300 dark:bg-slate-600" />
                
                <div className="flex flex-col items-center flex-1 sm:flex-none sm:w-[240px]">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sekretaris</div>
                   {sekretaris.length > 0 ? sekretaris.map(m => <MemberCard key={m.id} member={m} />) : <EmptyCard role="Sekretaris" />}
                </div>
                <div className="flex flex-col items-center flex-1 sm:flex-none sm:w-[240px]">
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bendahara</div>
                   {bendahara.length > 0 ? bendahara.map(m => <MemberCard key={m.id} member={m} />) : <EmptyCard role="Bendahara" />}
                </div>
              </div>
              
              {/* The vertical line going down to the next level (Manager) from the center */}
              <div className="absolute top-0 w-0.5 h-[calc(100%+1rem)] bg-slate-300 dark:bg-slate-600 -z-10" />
            </div>

            {/* Level 5: MANAGER UNIT USAHA */}
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Manager Unit Usaha</div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center w-full items-center">
                {manager.length > 0 ? manager.map(m => <MemberCard key={m.id} member={m} />) : <EmptyCard role="Manager" />}
              </div>
              <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-4" />
            </div>

            {/* Level 6: KARYAWAN */}
            <div className="flex flex-col items-center w-full">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Karyawan</div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap w-full">
                {karyawan.length > 0 ? karyawan.map(m => <MemberCard key={m.id} member={m} size="small" />) : <EmptyCard role="Karyawan" size="small" />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member List Table */}
      <div className="card rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Daftar Pengurus & Karyawan</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{members.length} orang terdaftar di sistem</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 font-bold uppercase text-xs dark:text-slate-300">
              <tr>
                <th className="p-4 rounded-tl-xl whitespace-nowrap">Nama</th>
                <th className="p-4 whitespace-nowrap">Jabatan / Role</th>
                <th className="p-4 whitespace-nowrap">Email</th>
                <th className="p-4 rounded-tr-xl whitespace-nowrap">Telepon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {sortedMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROLE_COLORS[m.role] || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">{m.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${ROLE_COLORS[m.role] || 'from-slate-500 to-slate-700'} text-white whitespace-nowrap inline-block`}>
                      {m.position || m.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">{m.email}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">{m.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b dark:border-slate-800">
              <h3 className="text-xl font-bold dark:text-slate-100">Edit Profil Pengurus</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveMember} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input required type="text" value={editData.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Jabatan Spesifik</label>
                <input type="text" value={editData.position || ''} onChange={e => setEditData({...editData, position: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Contoh: Kepala Unit Usaha Air Bersih" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Peran Akses (Role)</label>
                <select required value={editData.role || ''} onChange={e => setEditData({...editData, role: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl">
                  <option value="Musyawarah Desa (MUSDES)">Musyawarah Desa (MUSDES)</option>
                  <option value="Penasihat">Penasihat</option>
                  <option value="Pengawas">Pengawas</option>
                  <option value="Direktur BUMDes">Direktur BUMDes</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Manager Unit Usaha">Manager Unit Usaha</option>
                  <option value="Karyawan">Karyawan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">NIK</label>
                  <input type="text" value={editData.nik || ''} onChange={e => setEditData({...editData, nik: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="16 Digit" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Pendidikan</label>
                  <input type="text" value={editData.last_education || ''} onChange={e => setEditData({...editData, last_education: e.target.value})} className="w-full p-3 border dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl" placeholder="Cth: S1 Ekonomi" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          subtitle={toast.subtitle}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
