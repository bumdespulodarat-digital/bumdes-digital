import { useEffect, useState } from 'react';
import { Store, MapPin, Phone, Save, Users, UserPlus, Trash2, KeyRound } from 'lucide-react';
import { supabase, supabaseAdmin } from '../lib/supabase';
import Toast, { ConfirmDialog } from '../components/Toast';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

export default function Pengaturan() {
  const { userRole } = useAuth();
  const canManageUsers = ['Admin', 'Direktur BUMDes'].includes(userRole);

  const [settings, setSettings] = useState({
    id: '',
    store_name: '',
    store_address: '',
    store_contact: ''
  });
  
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: '', role: 'Karyawan', email: '', password: '' });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'toko' | 'pengurus'>('toko');
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; name: string; email: string } | null>(null);
  const [editPasswordModal, setEditPasswordModal] = useState<{ isOpen: boolean; email: string; name: string } | null>(null);
  const [editPasswordValue, setEditPasswordValue] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: storeData } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    if (storeData) setSettings(storeData);

    const { data: userData } = await supabase.from('bumdes_users').select('*').order('created_at');
    if (userData) setUsers(userData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveToko = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    if (settings.id) {
      await supabase.from('settings').update({
        store_name: settings.store_name,
        store_address: settings.store_address,
        store_contact: settings.store_contact
      }).eq('id', settings.id);
    } else {
      const { data } = await supabase.from('settings').insert({
        store_name: settings.store_name,
        store_address: settings.store_address,
        store_contact: settings.store_contact
      }).select().single();
      if (data) setSettings(data);
    }
    
    setSaving(false);
    setToast({ message: 'Pengaturan Toko berhasil disimpan!', type: 'success', subtitle: 'Perubahan akan ditampilkan pada struk dan laporan.' });
    setTimeout(() => window.location.reload(), 2000);
  };

  const handleTambahPengurus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!supabaseAdmin) {
        setToast({ message: 'Kunci Admin tidak ditemukan', type: 'error', subtitle: 'Fitur ini membutuhkan VITE_SUPABASE_SERVICE_ROLE_KEY di .env.local' });
        setSaving(false);
        return;
      }

      // WARNING: Menggunakan Service Role Key di frontend sangat tidak disarankan untuk aplikasi produksi nyata.
      // Ini hanya digunakan untuk kemudahan demo presentasi KKN tanpa backend.
      const { error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      });

      if (signUpError) {
        setToast({ message: 'Gagal menambah pengurus', type: 'error', subtitle: signUpError.message });
        setSaving(false);
        return;
      }

      await supabase.from('bumdes_users').insert({
        name: newUser.name,
        role: newUser.role,
        email: newUser.email
      });
      setNewUser({ name: '', role: 'Karyawan', email: '', password: '' });
      fetchData();
      setToast({ message: `${newUser.name} berhasil ditambahkan!`, type: 'success', subtitle: `Akun ${newUser.email} (${newUser.role}) sudah aktif dan siap digunakan.` });
    } catch (error: any) {
      console.error(error);
      setToast({ message: 'Terjadi kesalahan sistem', type: 'error', subtitle: 'Silakan coba lagi atau hubungi administrator.' });
    }
    setSaving(false);
  };

  const handleHapusPengurus = async (id: string, name: string, email: string) => {
    setConfirmDialog({ id, name, email });
  };

  const confirmHapusPengurus = async () => {
    if (!confirmDialog) return;
    const { id, name, email } = confirmDialog;
    setConfirmDialog(null);
    setSaving(true);
    try {
      // 1. Hapus dari tabel bumdes_users
      const { error: dbError } = await supabase.from('bumdes_users').delete().eq('id', id);
      if (dbError) throw dbError;

      // 2. Hapus dari Supabase Auth
      if (supabaseAdmin) {
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          console.error('Gagal mengambil daftar auth users:', listError);
        } else {
          const authUser = authUsers?.users?.find((u: any) => u.email === email);
          if (authUser) {
            const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUser.id);
            if (deleteAuthError) {
              console.error('Gagal menghapus dari Supabase Auth:', deleteAuthError);
              setToast({ message: `${name} dihapus dari database`, type: 'warning', subtitle: `Tapi gagal menghapus dari Auth: ${deleteAuthError.message}. Hapus manual di Supabase Dashboard.` });
              setSaving(false);
              fetchData();
              return;
            }
          }
        }
      } else {
        console.warn('supabaseAdmin tidak tersedia (VITE_SUPABASE_SERVICE_ROLE_KEY belum diset)');
        // Tetap lanjut — tapi beri peringatan
        setToast({ message: `${name} dihapus dari database`, type: 'warning', subtitle: 'Kunci Service Role belum diset di Vercel, jadi akun Auth belum terhapus. Tambahkan VITE_SUPABASE_SERVICE_ROLE_KEY di Vercel Settings.' });
        setSaving(false);
        fetchData();
        return;
      }

      fetchData();
      setToast({ message: `${name} berhasil dihapus sepenuhnya`, type: 'success', subtitle: `Akun ${email} telah dihapus dari database dan Supabase Auth.` });
    } catch (error: any) {
      console.error('Error menghapus pengurus:', error);
      setToast({ message: 'Gagal menghapus pengurus', type: 'error', subtitle: error?.message || 'Terjadi kesalahan, silakan coba lagi.' });
    }
    setSaving(false);
  };

  const handleUbahPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPasswordModal) return;
    setSaving(true);
    
    try {
      if (!supabaseAdmin) {
        setToast({ message: 'Kunci Admin tidak ditemukan', type: 'error', subtitle: 'Fitur ini membutuhkan VITE_SUPABASE_SERVICE_ROLE_KEY di .env.local' });
        setSaving(false);
        return;
      }

      // Cari user di Auth
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;
      
      const authUser = authUsers?.users?.find((u: any) => u.email === editPasswordModal.email);
      if (!authUser) {
        setToast({ message: 'Gagal mengubah password', type: 'error', subtitle: 'Pengguna tidak ditemukan di Auth Supabase.' });
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: editPasswordValue
      });

      if (updateError) throw updateError;

      setToast({ message: `Password ${editPasswordModal.name} berhasil diubah!`, type: 'success', subtitle: 'Pengguna sekarang dapat login dengan password baru.' });
      setEditPasswordModal(null);
      setEditPasswordValue('');
    } catch (error: any) {
      console.error('Error mengubah password:', error);
      setToast({ message: 'Gagal mengubah password', type: 'error', subtitle: error?.message || 'Terjadi kesalahan sistem.' });
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col xl:h-[calc(100vh-130px)] space-y-4">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          subtitle={toast.subtitle}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap snap-x no-scrollbar gap-2 card rounded-2xl shadow-sm p-4 z-10 relative">
        <button
          onClick={() => setActiveTab('toko')}
          className={`snap-start shrink-0 flex justify-center items-center gap-2 py-2.5 px-6 rounded-xl font-bold transition-all ${activeTab === 'toko'
              ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
        >
          <Store size={18} /> Profil Usaha
        </button>
        {canManageUsers && (
          <button
            onClick={() => setActiveTab('pengurus')}
            className={`snap-start shrink-0 flex justify-center items-center gap-2 py-2.5 px-6 rounded-xl font-bold transition-all ${activeTab === 'pengurus'
                ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <Users size={18} /> Manajemen Pengurus
          </button>
        )}
      </div>

      <div className="flex-1 card rounded-2xl shadow-sm overflow-hidden flex flex-col relative z-0">
        {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat data...</div>}

        {activeTab === 'toko' && (
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-2xl mb-8">
              <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">Pengaturan Profil Usaha</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Informasi ini akan ditampilkan pada kop Struk Kasir dan Laporan PDF/Excel.</p>
            </div>

            <form onSubmit={handleSaveToko} className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Toko / Usaha BUMDes</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Store size={18} />
                  </div>
                  <input type="text" required value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alamat Lengkap</label>
                <div className="relative">
                  <div className="absolute top-3.5 left-0 pl-4 flex pointer-events-none text-slate-400">
                    <MapPin size={18} />
                  </div>
                  <textarea required rows={3} value={settings.store_address} onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">No Telepon / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input type="text" required value={settings.store_contact} onChange={(e) => setSettings({ ...settings, store_contact: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary-600/30 active:scale-95"
                >
                  <Save size={18} />
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'pengurus' && (
          <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-2">Daftar Akun Pengurus</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Manajemen akses multi-user untuk para pengurus BUMDes.</p>
                
                <div className="space-y-3">
                  {users.length === 0 && <p className="text-slate-500 italic">Belum ada data pengurus.</p>}
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center font-black text-base sm:text-lg uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{u.name}</h4>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">{u.email} &bull; <span className="font-semibold text-primary-600 dark:text-primary-400">{u.role}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditPasswordModal({ isOpen: true, email: u.email, name: u.name })} className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 trans-all" title="Ubah Password">
                          <KeyRound size={18} />
                        </button>
                        <button onClick={() => handleHapusPengurus(u.id, u.name, u.email)} className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 trans-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 sticky top-0">
                  <h3 className="font-serif font-extrabold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <UserPlus size={18} className="text-primary-600" /> Tambah Akun Baru
                  </h3>
                  <form onSubmit={handleTambahPengurus} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
                      <input required type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-4 py-2.5 input-field border rounded-xl focus:border-primary-500 font-semibold text-sm" placeholder="Contoh: Budi Santoso" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email / Username</label>
                      <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2.5 input-field border rounded-xl focus:border-primary-500 font-semibold text-sm" placeholder="budi@bumdes.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Kata Sandi (Password)</label>
                      <input required type="password" minLength={6} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-2.5 input-field border rounded-xl focus:border-primary-500 font-semibold text-sm" placeholder="Minimal 6 karakter" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Jabatan</label>
                      <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-2.5 input-field border rounded-xl focus:border-primary-500 font-semibold text-sm">
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
                    <div className="pt-2">
                      <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-md shadow-primary-600/20">
                        {saving ? 'Menyimpan...' : 'Tambahkan Akun'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Edit Password Modal */}
      {editPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-serif font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <KeyRound size={22} className="text-primary-600" /> Ubah Password
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Ubah password untuk <b>{editPasswordModal.name}</b>
              </p>
            </div>
            
            <form onSubmit={handleUbahPassword} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={editPasswordValue}
                  onChange={(e) => setEditPasswordValue(e.target.value)}
                  className="w-full px-4 py-3 input-field border-2 rounded-xl focus:border-primary-500 font-semibold" 
                  placeholder="Minimal 6 karakter"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setEditPasswordModal(null); setEditPasswordValue(''); }}
                  className="flex-1 py-3 px-4 min-h-[44px] rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 trans-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-3 px-4 min-h-[44px] rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 trans-all disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title="Hapus Pengurus?"
          message={`Akun "${confirmDialog.name}" (${confirmDialog.email}) akan dihapus permanen dari sistem dan tidak dapat dikembalikan.`}
          confirmText="Ya, Hapus"
          cancelText="Batal"
          type="danger"
          onConfirm={confirmHapusPengurus}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
