import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Profil from '../pages/Profil';
import { AuthProvider } from '../contexts/AuthContext';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Profil - Halaman Profil Saya', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithAuth = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Profil />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('TEST-PROFIL-001: Profil harus merender form dengan benar', async () => {
    renderWithAuth();

    await waitFor(() => {
      // Tunggu loading selesai
      expect(screen.queryByText(/Memuat profil/i)).not.toBeInTheDocument();
    });

    // Cek field Informasi Dasar
    expect(screen.getByText(/Informasi Dasar/i)).toBeInTheDocument();
    expect(screen.getByText(/Nama Lengkap/i)).toBeInTheDocument();
    expect(screen.getByText(/Email/i)).toBeInTheDocument();
    
    // Cek field Informasi Pekerjaan
    expect(screen.getByText(/Informasi Pekerjaan/i)).toBeInTheDocument();
    expect(screen.getByText(/NIK/i)).toBeInTheDocument();
    expect(screen.getByText(/Posisi/i)).toBeInTheDocument();
  });

  it('TEST-PROFIL-002: Form harus memuat data user dari mock', async () => {
    renderWithAuth();

    // Pastikan data dimuat
    await waitFor(() => {
      // Mock supabase mengembalikan user u1 dengan nama 'Admin Utama'
      expect(screen.getByDisplayValue('Admin Utama')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@bumdes.com')).toBeInTheDocument();
    });
  });

  it('TEST-PROFIL-003: Pengguna bisa mengubah nama dan menyimpannya', async () => {
    const user = userEvent.setup();
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Admin Utama')).toBeInTheDocument();
    });

    const nameInput = screen.getByDisplayValue('Admin Utama');
    await user.clear(nameInput);
    await user.type(nameInput, 'Admin Baru');

    const saveButton = screen.getByRole('button', { name: /Simpan Profil/i });
    await user.click(saveButton);

    // Pastikan notifikasi berhasil muncul
    await waitFor(() => {
      expect(screen.getByText(/Profil berhasil diperbarui/i)).toBeInTheDocument();
    });
  });
});
