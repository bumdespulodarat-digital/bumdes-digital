import { useEffect, useState } from 'react';
import { Users, Phone, Mail, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  position: string;
  phone: string;
  photo_url: string;
}

// Hierarchy levels for org chart ordering
const ROLE_ORDER: Record<string, number> = {
  'Direktur BUMDes': 1,
  'Sekretaris': 2,
  'Bendahara': 3,
  'Akuntan': 4,
  'Admin': 5,
  'Pengawas': 6,
  'Karyawan': 7,
};

const ROLE_COLORS: Record<string, string> = {
  'Direktur BUMDes': 'from-primary-600 to-primary-800',
  'Sekretaris': 'from-blue-500 to-blue-700',
  'Bendahara': 'from-emerald-500 to-emerald-700',
  'Akuntan': 'from-amber-500 to-amber-700',
  'Admin': 'from-slate-500 to-slate-700',
  'Pengawas': 'from-violet-500 to-violet-700',
  'Karyawan': 'from-teal-500 to-teal-700',
};

export default function StrukturOrganisasi() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Noto Mulyo', address: 'Pulodarat, Jepara' });
  const [showOrgChart, setShowOrgChart] = useState(true);

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
  const pimpinan = sortedMembers.filter(m => ['Direktur BUMDes'].includes(m.role));
  const manajemen = sortedMembers.filter(m => ['Sekretaris', 'Bendahara', 'Akuntan'].includes(m.role));
  const pengawas = sortedMembers.filter(m => m.role === 'Pengawas');
  const operasional = sortedMembers.filter(m => ['Admin', 'Karyawan'].includes(m.role));

  const MemberCard = ({ member, size = 'normal' }: { member: Member; size?: 'large' | 'normal' | 'small' }) => {
    const gradient = ROLE_COLORS[member.role] || 'from-slate-500 to-slate-700';
    const isLarge = size === 'large';
    const isSmall = size === 'small';

    return (
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 trans-all overflow-hidden group ${isLarge ? 'max-w-xs' : isSmall ? 'max-w-[200px]' : 'max-w-[240px]'}`}>
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
        </div>
      </div>
    );
  };

  if (loading) {
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
        <div className="card rounded-2xl shadow-sm p-6 sm:p-8 overflow-x-auto border dark:border-slate-800">
          <div className="min-w-[600px] flex flex-col items-center gap-6">
            {/* Level 1: Direktur */}
            {pimpinan.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="flex gap-4 justify-center">
                  {pimpinan.map(m => <MemberCard key={m.id} member={m} size="large" />)}
                </div>
                {(manajemen.length > 0 || pengawas.length > 0 || operasional.length > 0) && (
                  <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600" />
                )}
              </div>
            )}

            {/* Level 2: Pengawas (side) + Manajemen */}
            {(manajemen.length > 0 || pengawas.length > 0) && (
              <div className="flex flex-col items-center">
                <div className="flex items-start gap-8 justify-center">
                  {pengawas.length > 0 && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pengawas</div>
                      {pengawas.map(m => <MemberCard key={m.id} member={m} size="small" />)}
                    </div>
                  )}
                  {manajemen.length > 0 && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-4 justify-center flex-wrap">
                        {manajemen.map(m => <MemberCard key={m.id} member={m} />)}
                      </div>
                    </div>
                  )}
                </div>
                {operasional.length > 0 && <div className="w-0.5 h-8 bg-slate-300 dark:bg-slate-600 mt-4" />}
              </div>
            )}

            {/* Level 3: Operasional / Karyawan */}
            {operasional.length > 0 && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Staff & Karyawan</div>
                <div className="flex gap-4 justify-center flex-wrap">
                  {operasional.map(m => <MemberCard key={m.id} member={m} size="small" />)}
                </div>
              </div>
            )}
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
                <th className="p-4 rounded-tl-xl">Nama</th>
                <th className="p-4">Jabatan / Role</th>
                <th className="p-4">Email</th>
                <th className="p-4 rounded-tr-xl">Telepon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {sortedMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 trans-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${ROLE_COLORS[m.role] || 'from-slate-500 to-slate-700'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{m.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${ROLE_COLORS[m.role] || 'from-slate-500 to-slate-700'} text-white`}>
                      {m.position || m.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">{m.email}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">{m.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
