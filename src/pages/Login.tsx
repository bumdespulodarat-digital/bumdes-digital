import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Store, Lock, Mail, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-96 bg-primary-900 rounded-b-[100px] shadow-2xl"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary-600 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl opacity-30"></div>

      <div className="w-full max-w-[420px] bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-2xl overflow-hidden relative z-10">
        <div className="p-10 text-center relative overflow-hidden bg-white/40 dark:bg-slate-800/40">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-primary transform rotate-3">
            <Store size={40} className="text-white -rotate-3" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary-950 dark:text-primary-200 mb-2 tracking-tight">BUMDes Digital</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">Masuk untuk mengelola operasional desa</p>
        </div>
        
        <div className="p-8 pt-4 bg-white/80 dark:bg-slate-900/60">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl text-sm border border-rose-200 dark:border-rose-800 font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              {error === 'Invalid login credentials' ? 'Email atau Password salah.' : error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Alamat Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 trans-all">
                  <Mail size={18} />
                </div>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 input-field border-2 rounded-xl focus:outline-none focus:ring-0 focus:border-primary-500 trans-all text-sm font-medium"
                  placeholder="admin@bumdes.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary-600 trans-all">
                  <Lock size={18} />
                </div>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 input-field border-2 rounded-xl focus:outline-none focus:ring-0 focus:border-primary-500 trans-all text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full group flex items-center justify-center gap-2 bg-primary-900 text-white font-bold py-4 rounded-xl hover:bg-primary-800 shadow-lg shadow-primary-900/30 trans-all disabled:opacity-70 mt-4 active:scale-[0.98]"
            >
              {loading ? 'Memeriksa Kredensial...' : 'Masuk ke Sistem'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 trans-all" />}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">VERSI 2.0 &bull; DILINDUNGI SISTEM KEAMANAN</p>
          </div>
        </div>
      </div>
    </div>
  );
}
