import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, Store, LogOut, Menu, X, Moon, Sun, ChevronLeft, ChevronRight, KeyRound, BarChart3, Archive, Users, BookOpen, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import type { ToastType } from '../components/Toast';

export default function MainLayout() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { userName: authUserName, canAccess } = useAuth();
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Digital', address: 'Pulodarat, Jepara' });
  const [userName, setUserName] = useState('Admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; subtitle?: string } | null>(null);

  useEffect(() => {
    // Ambil info toko
    supabase.from('settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (data) setStoreInfo({ name: data.store_name, address: data.store_address });
    });
  }, []);

  // Sync userName from AuthContext
  useEffect(() => {
    if (authUserName) setUserName(authUserName);
  }, [authUserName]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showProfileMenu]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'Password tidak cocok', type: 'error', subtitle: 'Pastikan password baru dan konfirmasi sama.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setToast({ message: 'Password terlalu pendek', type: 'error', subtitle: 'Minimal 6 karakter.' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setToast({ message: 'Password berhasil diubah! 🔑', type: 'success', subtitle: 'Gunakan password baru Anda saat login berikutnya.' });
      setShowChangePassword(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Error mengubah password:', error);
      setToast({ message: 'Gagal mengubah password', type: 'error', subtitle: error?.message || 'Terjadi kesalahan sistem.' });
    }
    setSavingPassword(false);
  };

  const allNavItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/kasir', icon: <ShoppingCart size={20} />, label: 'Kasir (POS)' },
    { path: '/stok', icon: <Package size={20} />, label: 'Stok Barang' },
    { path: '/hutang-piutang', icon: <FileText size={20} />, label: 'Hutang Piutang' },
    { path: '/akuntansi', icon: <FileText size={20} />, label: 'Akuntansi' },
    { path: '/laporan-transaksi', icon: <BarChart3 size={20} />, label: 'Laporan Transaksi' },
    { path: '/buku-kas', icon: <BookOpen size={20} />, label: 'Buku Kas' },
    { path: '/inventaris', icon: <Archive size={20} />, label: 'Inventaris & Arsip' },
    { path: '/struktur-organisasi', icon: <Users size={20} />, label: 'Struktur Organisasi' },
    { path: '/panduan', icon: <HelpCircle size={20} />, label: 'Pusat Bantuan' },
    { path: '/pengaturan', icon: <Settings size={20} />, label: 'Pengaturan' },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => canAccess(item.path));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          subtitle={toast.subtitle}
          onClose={() => setToast(null)}
        />
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden trans-all"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 
        flex flex-col shadow-xl md:shadow-sm print:hidden trans-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${!isMobileMenuOpen && isSidebarCollapsed ? 'md:w-20' : 'md:w-72'}
      `}>
        <div className="p-5 flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 min-w-[40px] bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-primary shrink-0">
              <Store size={20} />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0 md:opacity-0' : 'w-48 opacity-100'}`}>
              <h1 className="font-bold text-lg leading-tight text-primary-900 dark:text-primary-300 truncate" title={storeInfo.name}>{storeInfo.name}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate" title={storeInfo.address}>{storeInfo.address}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden absolute right-4 top-5 w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
          >
            <X size={18} />
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-4 top-7 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300 shadow-sm z-50 transition-transform"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-xl trans-all transition-all duration-300 ${
                  isSidebarCollapsed ? 'md:gap-0 md:w-12 md:h-12 md:p-0 md:justify-center md:mx-auto gap-3 px-4 py-3.5 mx-0' : 'gap-3 px-4 py-3.5 mx-0'
                } ${
                  isActive 
                    ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                }`
              }
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0 md:opacity-0' : 'w-48 opacity-100'}`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={handleLogout} 
            className={`flex items-center rounded-xl trans-all text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 font-bold transition-all duration-300 ${
              isSidebarCollapsed ? 'md:gap-0 md:w-12 md:h-12 md:p-0 md:justify-center md:mx-auto gap-3 px-4 py-3.5 mx-0 w-full text-left' : 'gap-3 px-4 py-3.5 mx-0 w-full text-left'
            }`}
            title={isSidebarCollapsed ? 'Keluar Sistem' : undefined}
          >
            <div className="shrink-0"><LogOut size={20} /></div>
            <span className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'md:w-0 md:opacity-0' : 'w-48 opacity-100'}`}>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-8 shadow-sm z-10 print:hidden justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 trans-all shrink-0"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight">Sistem BUMDes</h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative flex items-center w-16 h-[34px] rounded-full p-1 transition-colors duration-500 ease-in-out border shadow-inner ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'
              }`}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              <div className="absolute inset-0 flex justify-between items-center px-2 z-0 pointer-events-none">
                <Sun size={14} className={`transform transition-all duration-500 ${isDark ? 'opacity-40 scale-100 text-amber-400/50' : 'opacity-0 scale-50'}`} />
                <Moon size={14} className={`transform transition-all duration-500 ${isDark ? 'opacity-0 scale-50' : 'opacity-40 scale-100 text-blue-500'}`} />
              </div>
              <div 
                className={`relative w-[26px] h-[26px] rounded-full bg-white shadow-md flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-10 ${
                  isDark ? 'translate-x-[28px] rotate-0' : 'translate-x-0 -rotate-90'
                }`}
              >
                {isDark ? (
                  <Moon size={14} className="text-slate-800" />
                ) : (
                  <Sun size={14} className="text-amber-500" />
                )}
              </div>
            </button>

            {/* Profile Area with Dropdown */}
            <div className="relative" id="profile-menu-container">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-2 py-1.5 trans-all"
              >
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:block">{userName}</span>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center font-black text-sm border-2 border-white dark:border-slate-800 shadow-md uppercase">
                  {userName.charAt(0)}
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-14 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sedang login</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowChangePassword(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 trans-all"
                  >
                    <KeyRound size={16} className="text-primary-600" />
                    Ubah Password Saya
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 trans-all"
                  >
                    <LogOut size={16} />
                    Keluar Sistem
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0">
          <Outlet />
        </div>
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in-up">
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <KeyRound size={22} className="text-primary-600" /> Ubah Password Saya
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Masukkan password baru untuk akun <b>{userName}</b>
              </p>
            </div>
            
            <form onSubmit={handleChangeMyPassword} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password Baru</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 input-field border-2 rounded-xl focus:border-primary-500 font-semibold text-sm sm:text-base" 
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Konfirmasi Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 input-field border-2 rounded-xl focus:border-primary-500 font-semibold text-sm sm:text-base" 
                  placeholder="Ketik ulang password baru"
                />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-rose-500 mt-1.5 font-semibold">⚠️ Password tidak cocok</p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowChangePassword(false); setPasswordForm({ newPassword: '', confirmPassword: '' }); }}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 trans-all text-sm sm:text-base"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={savingPassword || (passwordForm.confirmPassword !== '' && passwordForm.newPassword !== passwordForm.confirmPassword)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 trans-all disabled:opacity-50 text-sm sm:text-base"
                >
                  {savingPassword ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
