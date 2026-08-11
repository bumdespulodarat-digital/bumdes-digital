import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BukuKas from '../pages/BukuKas';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('BukuKas - Pengelolaan Kas BUMDes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-KAS-001: Harus merender tabel Buku Kas dengan benar', async () => {
    render(
      <BrowserRouter>
        <BukuKas />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Saldo Awal')).toBeInTheDocument();
      expect(screen.getByText('Beli Kertas')).toBeInTheDocument();
    });

    const saldoAkhir = screen.getAllByText(/Rp 4\.950\.000/i);
    expect(saldoAkhir.length).toBeGreaterThan(0);
  });

  it('TEST-KAS-002: Harus menampilkan modal Tambah Entri saat tombol ditekan', async () => {
    render(
      <BrowserRouter>
        <BukuKas />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Saldo Awal')).toBeInTheDocument();
    });

    const addBtn = screen.getByText(/Tambah Entri/i);
    fireEvent.click(addBtn);

    expect(screen.getByText('Tambah Entri Kas')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Keterangan')).toBeInTheDocument();
    expect(screen.getByText('Upload Bukti Transaksi')).toBeInTheDocument();
  });
});
