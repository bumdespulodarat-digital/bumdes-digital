import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Tombol Kembali */}
      <Link to="/" className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white font-medium bg-white/10 hover:bg-white/20 border border-white/10 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl backdrop-blur-md trans-all shadow-lg hover:shadow-xl text-sm sm:text-base">
        <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> 
        <span className="hidden sm:inline">Kembali ke Beranda</span>
        <span className="sm:hidden">Kembali</span>
      </Link>

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-[40vh] sm:h-[45vh] bg-primary-900 rounded-b-[2rem] sm:rounded-b-[4rem] shadow-sm transition-all duration-500 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent"></div>
      </div>

      <div className="w-full max-w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden relative z-10 transition-all duration-500 mt-12 sm:mt-0">
        <div className="p-6 sm:p-8 text-center relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 transform transition-all duration-500 hover:scale-105 drop-shadow-xl flex items-center justify-center">
            <img src="/logo-bumdes.png" alt="Logo BUMDes" className="max-w-full max-h-full object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-1 sm:mb-2 tracking-tight transition-all duration-500">BUMDes Digital</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm">Masuk untuk mengelola operasional desa</p>
        </div>
        
        <div className="p-6 sm:p-8 pt-4 sm:pt-6 bg-white dark:bg-slate-900">
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl text-xs sm:text-sm border border-rose-200 dark:border-rose-800 font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              {error === 'Invalid login credentials' ? 'Email atau Password salah.' : error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">Alamat Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 trans-all">
                  <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 input-field border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 trans-all text-sm font-medium"
                  placeholder="admin@bumdes.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 sm:mb-2">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 trans-all">
                  <Lock className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </div>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 input-field border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 trans-all text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full group flex items-center justify-center gap-2 bg-primary-700 text-white font-semibold py-3 rounded-lg hover:bg-primary-800 shadow-sm trans-all disabled:opacity-70 mt-4 sm:mt-6 active:scale-[0.98] text-sm sm:text-base"
            >
              {loading ? 'Memeriksa...' : 'Masuk ke Sistem'}
              {!loading && <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] group-hover:translate-x-1 trans-all" />}
            </button>
          </form>
          
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500">VERSI 2.0 &bull; DILINDUNGI SISTEM KEAMANAN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
