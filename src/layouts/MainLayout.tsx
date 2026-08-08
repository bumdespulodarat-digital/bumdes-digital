import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, Store, LogOut, Menu, X, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function MainLayout() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [storeInfo, setStoreInfo] = useState({ name: 'BUMDes Digital', address: 'Pulodarat, Jepara' });
  const [userName, setUserName] = useState('Admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Ambil info toko
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) setStoreInfo({ name: data.store_name, address: data.store_address });
    });
    // Ambil info user yang login
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        const namePart = data.user.email.split('@')[0];
        // Capitalize first letter
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/kasir', icon: <ShoppingCart size={20} />, label: 'Kasir (POS)' },
    { path: '/stok', icon: <Package size={20} />, label: 'Stok Barang' },
    { path: '/hutang-piutang', icon: <FileText size={20} />, label: 'Hutang Piutang' },
    { path: '/akuntansi', icon: <FileText size={20} />, label: 'Akuntansi' },
    { path: '/pengaturan', icon: <Settings size={20} />, label: 'Pengaturan' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      
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
            {/* Dark Mode Toggle (Cool Slider) */}
            <button
              onClick={toggleTheme}
              className={`relative flex items-center w-16 h-[34px] rounded-full p-1 transition-colors duration-500 ease-in-out border shadow-inner ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-200'
              }`}
              title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            >
              {/* Background Icons (Kiri: Matahari redup, Kanan: Bulan redup) */}
              <div className="absolute inset-0 flex justify-between items-center px-2 z-0 pointer-events-none">
                <Sun size={14} className={`transform transition-all duration-500 ${isDark ? 'opacity-40 scale-100 text-amber-400/50' : 'opacity-0 scale-50'}`} />
                <Moon size={14} className={`transform transition-all duration-500 ${isDark ? 'opacity-0 scale-50' : 'opacity-40 scale-100 text-blue-500'}`} />
              </div>

              {/* Sliding Circle */}
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

            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:block">{userName}</span>
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 flex items-center justify-center font-black text-sm border-2 border-white dark:border-slate-800 shadow-md uppercase">
              {userName.charAt(0)}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative z-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
