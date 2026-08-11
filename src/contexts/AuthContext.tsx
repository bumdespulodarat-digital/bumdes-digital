import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'Admin' | 'Direktur BUMDes' | 'Bendahara' | 'Akuntan' | 'Sekretaris' | 'Karyawan' | 'Pengawas';

// Roles that have full access
const FULL_ACCESS_ROLES: UserRole[] = ['Admin', 'Direktur BUMDes', 'Bendahara', 'Akuntan', 'Sekretaris'];

interface AuthContextType {
  userEmail: string;
  userName: string;
  userRole: UserRole;
  isLoading: boolean;
  hasFullAccess: boolean;
  isKaryawan: boolean;
  isPengawas: boolean;
  canAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  userEmail: '',
  userName: 'Admin',
  userRole: 'Admin',
  isLoading: true,
  hasFullAccess: true,
  isKaryawan: false,
  isPengawas: false,
  canAccess: () => true,
});

// Define page access per role
const KARYAWAN_PAGES = ['/', '/kasir', '/stok'];
const PENGAWAS_PAGES = ['/', '/akuntansi', '/laporan-transaksi', '/buku-kas'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('Admin');
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) {
          const email = authData.user.email;
          setUserEmail(email);

          // Look up in bumdes_users
          const { data: userData } = await supabase
            .from('bumdes_users')
            .select('name, role')
            .eq('email', email)
            .maybeSingle();

          if (userData) {
            setUserName(userData.name);
            setUserRole(userData.role as UserRole);
          } else {
            const namePart = email.split('@')[0];
            setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
            setUserRole('Admin');
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
      setIsLoading(false);
    };

    fetchUserInfo();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserInfo();
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasFullAccess = FULL_ACCESS_ROLES.includes(userRole);
  const isKaryawan = userRole === 'Karyawan';
  const isPengawas = userRole === 'Pengawas';

  const canAccess = (page: string): boolean => {
    if (hasFullAccess) return true;
    if (isKaryawan) return KARYAWAN_PAGES.includes(page);
    if (isPengawas) return PENGAWAS_PAGES.includes(page);
    return true;
  };

  return (
    <AuthContext.Provider value={{ userEmail, userName, userRole, isLoading, hasFullAccess, isKaryawan, isPengawas, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
