import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LaporanTransaksi from '../pages/LaporanTransaksi';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />,
  Line: () => <div data-testid="mock-line-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
  Pie: () => <div data-testid="mock-pie-chart" />,
}));

describe('Laporan Transaksi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-LAP-001: Harus merender halaman laporan', async () => {
    render(
      <BrowserRouter>
        <LaporanTransaksi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mingguan')).toBeInTheDocument();
      expect(screen.getByText('Bulanan')).toBeInTheDocument();
      expect(screen.getByText('Total Pendapatan')).toBeInTheDocument();
    });
  });
});
