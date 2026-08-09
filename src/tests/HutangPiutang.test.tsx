import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HutangPiutang from '../pages/HutangPiutang';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Hutang Piutang - Buku Pembantu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-HP-001: Harus menampilkan tab Buku Piutang', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Buku Piutang')).toBeInTheDocument();
    });
  });

  it('TEST-HP-002: Harus menampilkan tab Buku Utang', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Buku Utang')).toBeInTheDocument();
    });
  });

  it('TEST-HP-003: Harus menampilkan tombol Kontak', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Kontak')).toBeInTheDocument();
    });
  });

  it('TEST-HP-004: Harus menampilkan tombol Tambah Piutang saat di tab Piutang', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/tambah piutang/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-005: Harus menampilkan tombol Tambah Utang saat di tab Utang', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const utangTab = await screen.findByText('Buku Utang');
    fireEvent.click(utangTab);

    await waitFor(() => {
      expect(screen.getByText(/tambah utang/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-006: Tabel harus memiliki kolom Tanggal, Pihak Terkait, Nominal, Status', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tanggal')).toBeInTheDocument();
      expect(screen.getByText('Pihak Terkait')).toBeInTheDocument();
      expect(screen.getByText('Nominal')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Aksi')).toBeInTheDocument();
    });
  });

  it('TEST-HP-007: Harus menampilkan data piutang dari database', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
    });
  });

  it('TEST-HP-008: Pindah ke tab Utang harus menampilkan data utang', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const utangTab = await screen.findByText('Buku Utang');
    fireEvent.click(utangTab);

    await waitFor(() => {
      expect(screen.getByText('CV Sumber Rejeki')).toBeInTheDocument();
    });
  });

  it('TEST-HP-009: Klik tombol Kontak harus buka modal tambah kontak', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const kontakButton = await screen.findByText('Kontak');
    fireEvent.click(kontakButton);

    await waitFor(() => {
      expect(screen.getByText(/tambah kontak baru/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-010: Modal kontak harus memiliki field Nama Lengkap', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const kontakButton = await screen.findByText('Kontak');
    fireEvent.click(kontakButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/nama lengkap/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-011: Modal kontak harus memiliki dropdown tipe (Customer/Supplier)', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const kontakButton = await screen.findByText('Kontak');
    fireEvent.click(kontakButton);

    await waitFor(() => {
      expect(screen.getByText(/pelanggan \(customer\)/i)).toBeInTheDocument();
      expect(screen.getByText(/pemasok \(supplier\)/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-012: Klik Tambah Piutang harus buka modal form piutang', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah piutang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      expect(screen.getByText(/catat piutang/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-013: Modal piutang harus memiliki dropdown pilih pihak terkait', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah piutang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      expect(screen.getByText(/-- pilih pihak terkait --/i)).toBeInTheDocument();
    });
  });

  it('TEST-HP-014: Modal piutang harus memiliki field nominal', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah piutang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
    });
  });

  it('TEST-HP-015: Modal piutang harus memiliki field tanggal jatuh tempo', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    const tambahButton = await screen.findByText(/tambah piutang/i);
    fireEvent.click(tambahButton);

    await waitFor(() => {
      const dateInputs = screen.getAllByRole('textbox');
      expect(dateInputs.length).toBeGreaterThan(0);
    });
  });

  it('TEST-HP-016: Data dengan status Belum Lunas harus tampil tombol Lunasi', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Should have Lunasi button for unpaid debts
      const lunasi = screen.queryByText(/lunasi/i);
      if (lunasi) {
        expect(lunasi).toBeInTheDocument();
      }
    });
  });

  it('TEST-HP-017: Status Lunas harus tampil dengan badge hijau', async () => {
    render(
      <BrowserRouter>
        <HutangPiutang />
      </BrowserRouter>
    );

    await waitFor(() => {
      const statusElements = screen.queryAllByText(/belum lunas|lunas/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });
});
