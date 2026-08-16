import { useEffect, useState, useRef } from 'react';
import { User, Phone, Mail, Save, Briefcase, GraduationCap, Camera, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

export default function Profil() {
  const { userEmail } = useAuth();
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    nik: '',
    last_education: '',
    position: '',
    photo_url: '',
    role: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userEmail) return;
      
      setLoading(true);
      const { data } = await supabase
        .from('bumdes_users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          nik: data.nik || '',
          last_education: data.last_education || '',
          position: data.position || '',
          photo_url: data.photo_url || '',
          role: data.role || ''
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userEmail]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // If email changed, update in auth
      if (profile.email !== userEmail) {
        const { error: authError } = await supabase.auth.updateUser({ email: profile.email });
        if (authError) throw authError;
        setToast({ 
          message: 'Email berhasil diubah!', 
          type: 'warning', 
          subtitle: 'Silakan cek kotak masuk email baru (dan email lama) Anda untuk verifikasi. Anda akan otomatis keluar setelah verifikasi.' 
        });
      }

      // Update in bumdes_users
      const { error: dbError } = await supabase
        .from('bumdes_users')
        .update({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          nik: profile.nik,
          last_education: profile.last_education,
          position: profile.position
        })
        .eq('email', userEmail);

      if (dbError) throw dbError;

      if (profile.email === userEmail) {
        setToast({ message: 'Profil berhasil diperbarui!', type: 'success', subtitle: 'Informasi akun Anda telah tersimpan.' });
      }
      
      // Reload page after a delay so that AuthContext updates with new data
      setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
      console.error(error);
      setToast({ message: 'Gagal menyimpan profil', type: 'error', subtitle: error?.message || 'Terjadi kesalahan sistem.' });
    }
    
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: 'File terlalu besar', type: 'error', subtitle: 'Ukuran maksimal foto adalah 2MB.' });
        return;
      }

      setUploadingAvatar(true);
      
      // Clean up email for filename
      const safeEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const fileExt = file.name.split('.').pop();
      const fileName = `${safeEmail}_${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update the user's profile with the new photo URL
      const { error: dbError } = await supabase
        .from('bumdes_users')
        .update({ photo_url: publicUrl })
        .eq('email', userEmail);
        
      if (dbError) throw dbError;

      setProfile({ ...profile, photo_url: publicUrl });
      setToast({ message: 'Foto berhasil diunggah!', type: 'success' });
      
      setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
      console.error(error);
      setToast({ message: 'Gagal mengunggah foto', type: 'error', subtitle: error?.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setUploadingAvatar(false);
    }
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

      <div className="flex-1 card rounded-2xl shadow-sm overflow-hidden flex flex-col relative z-0">
        {loading && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm z-20 flex items-center justify-center font-bold text-primary-600">Memuat profil...</div>}

        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-8 rounded-3xl overflow-hidden border border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-primary-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 shadow-sm flex flex-col md:flex-row items-center md:items-center gap-6 p-6 md:p-8 relative">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary-400/10 dark:bg-primary-500/10 blur-3xl rounded-full pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-400/10 dark:bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
              
              {/* Avatar Section */}
              <div className="relative group shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={64} className="text-slate-300 dark:text-slate-600" />
                  )}
                  
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold animate-pulse">Mengunggah...</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ubah Foto Profil"
                  >
                    <Camera size={32} className="text-white" />
                  </button>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                />
              </div>

              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-serif font-black text-slate-800 dark:text-slate-100 mb-2">{profile.name || 'Pengguna'}</h2>
                <div className="inline-block px-4 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-primary-100 dark:border-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full text-sm font-black mb-4 shadow-sm uppercase tracking-wide">
                  {profile.role || 'Admin'}
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  Perbarui informasi profil dan detail kontak Anda di bawah ini. Pastikan data yang dimasukkan akurat dan valid.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <User size={18} className="text-primary-600" /> Informasi Dasar
                </h3>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input type="text" required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                    placeholder="Contoh: Ahmad Fathul Kholis"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input type="email" required value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  />
                </div>
                {profile.email !== userEmail && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1 font-medium">
                    <AlertCircle size={14} /> Jika diubah, Anda harus memverifikasi email baru.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nomor Telepon / WA</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                    placeholder="0812xxxx"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pendidikan Terakhir</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap size={18} />
                  </div>
                  <select value={profile.last_education} onChange={(e) => setProfile({ ...profile, last_education: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  >
                    <option value="">Pilih Pendidikan</option>
                    <option value="SD">SD Sederajat</option>
                    <option value="SMP">SMP Sederajat</option>
                    <option value="SMA">SMA Sederajat</option>
                    <option value="D3">Diploma (D3)</option>
                    <option value="S1">Sarjana (S1)</option>
                    <option value="S2">Magister (S2)</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 mt-4">
                <h3 className="text-lg font-serif font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Briefcase size={18} className="text-primary-600" /> Informasi Pekerjaan
                </h3>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">NIK (KTP)</label>
                <input type="text" value={profile.nik} onChange={(e) => setProfile({ ...profile, nik: e.target.value })}
                  className="w-full px-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  placeholder="3320xxxxxxxxxxxx"
                  maxLength={16}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Posisi / Jabatan Spesifik</label>
                <input type="text" value={profile.position} onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="w-full px-4 py-3 input-field border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                  placeholder="Contoh: Staff Keuangan"
                />
                <p className="text-xs text-slate-500 mt-1">Jabatan spesifik di unit BUMDes (berbeda dengan Role Akses Sistem).</p>
              </div>

              <div className="md:col-span-2 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary-600/30 active:scale-95"
                >
                  <Save size={18} />
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
