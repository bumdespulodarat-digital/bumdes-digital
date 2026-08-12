import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Stok from './pages/Stok';
import Akuntansi from './pages/Akuntansi';
import HutangPiutang from './pages/HutangPiutang';
import Pengaturan from './pages/Pengaturan';
import Inventaris from './pages/Inventaris';
import LaporanTransaksi from './pages/LaporanTransaksi';
import StrukturOrganisasi from './pages/StrukturOrganisasi';
import BukuKas from './pages/BukuKas';
import PublicDashboard from './pages/PublicDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/public-dashboard" element={<PublicDashboard />} />
            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="kasir" element={<Pos />} />
              <Route path="stok" element={<Stok />} />
              <Route path="hutang-piutang" element={<HutangPiutang />} />
              <Route path="akuntansi" element={<Akuntansi />} />
              <Route path="pengaturan" element={<Pengaturan />} />
              <Route path="inventaris" element={<Inventaris />} />
              <Route path="laporan-transaksi" element={<LaporanTransaksi />} />
              <Route path="struktur-organisasi" element={<StrukturOrganisasi />} />
              <Route path="buku-kas" element={<BukuKas />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
