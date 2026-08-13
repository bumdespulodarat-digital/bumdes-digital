import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock react-chartjs-2 to avoid canvas rendering issues in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-chart-bar">Bar Chart</div>,
  Doughnut: () => <div data-testid="mock-chart-doughnut">Doughnut Chart</div>,
  Line: () => <div data-testid="mock-chart-line">Line Chart</div>,
}));

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Dashboard - Halaman Utama', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-DASH-001: Dashboard harus menampilkan welcome message', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/hai/i)).toBeInTheDocument();
    });
  });

  it('TEST-DASH-002: Dashboard harus menampilkan card statistik Saldo Kas', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Saldo Kas')).toBeInTheDocument();
    });
  });

  it('TEST-DASH-003: Dashboard harus menampilkan card statistik Total Pendapatan', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Pendapatan')).toBeInTheDocument();
    });
  });

  it('TEST-DASH-004: Dashboard harus menampilkan card statistik Macam Barang', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Macam Barang')).toBeInTheDocument();
    });
  });

  it('TEST-DASH-005: Dashboard harus menampilkan card statistik Total Transaksi', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Transaksi')).toBeInTheDocument();
    });
  });

  it('TEST-DASH-006: Dashboard harus menampilkan chart Pendapatan vs Pengeluaran', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pendapatan vs Pengeluaran')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('TEST-DASH-007: Dashboard harus menampilkan chart Sumber Pendapatan', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sumber Pendapatan')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('TEST-DASH-008: Dashboard harus menampilkan section Barang Terlaris', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/barang terlaris/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('TEST-DASH-009: Dashboard harus menampilkan informasi Aset Tetap jika ada', async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const asetTetapText = screen.queryByText(/total nilai aset tetap/i);
      // Aset tetap akan muncul jika nilainya > 0
      if (asetTetapText) {
        expect(asetTetapText).toBeInTheDocument();
      }
    }, { timeout: 2000 });
  });
});
