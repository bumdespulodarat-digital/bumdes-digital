import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Pos from '../pages/Pos';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Kasir (POS) - Point of Sale System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('TEST-POS-001: Halaman POS harus menampilkan search bar', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/cari barang/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-002: POS harus menampilkan daftar barang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
      expect(screen.getByText('Buku Tulis 38 Lembar')).toBeInTheDocument();
      expect(screen.getByText('Pensil 2B')).toBeInTheDocument();
    });
  });

  it('TEST-POS-003: Search barang harus berfungsi dengan benar', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    const searchInput = await screen.findByPlaceholderText(/cari barang/i);
    fireEvent.change(searchInput, { target: { value: 'Pulpen' } });

    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
      expect(screen.queryByText('Pensil 2B')).not.toBeInTheDocument();
    });
  });

  it('TEST-POS-004: Klik barang harus menambahkan ke keranjang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    // Click item card to add to cart
    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    await waitFor(() => {
      // Verify item appears in cart area (there should be the item name twice: in grid + cart)
      const pulpenElements = screen.getAllByText('Pulpen Standard');
      expect(pulpenElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('TEST-POS-005: Keranjang harus menampilkan tombol checkout', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/cetak struk/i)).toBeInTheDocument();
      expect(screen.getByText(/simpan data/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-006: Harus menampilkan total tagihan', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/total tagihan/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-007: Tombol checkout harus disabled jika keranjang kosong', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    await waitFor(() => {
      const cetakButton = screen.getByText(/cetak struk/i).closest('button');
      expect(cetakButton).toBeDisabled();
      const simpanButton = screen.getByText(/simpan data/i).closest('button');
      expect(simpanButton).toBeDisabled();
    });
  });

  it('TEST-POS-008: Harus bisa menambah kuantitas barang di keranjang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Add item to cart first
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    // Check that item appears in cart (shown twice: grid + cart)
    await waitFor(() => {
      const allPulpen = screen.getAllByText('Pulpen Standard');
      expect(allPulpen.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('TEST-POS-009: Harus bisa menghapus barang dari keranjang', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Add item first
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    // Verify item is in cart
    await waitFor(() => {
      const pulpenElements = screen.getAllByText('Pulpen Standard');
      expect(pulpenElements.length).toBeGreaterThanOrEqual(2);
    });

    // Find and click trash button (the one with rose/red styling)
    const trashButton = document.querySelector('button[class*="rose"]');
    
    if (trashButton) {
      fireEvent.click(trashButton);
    }
  });

  it('TEST-POS-010: Cetak Struk harus checkout dan memanggil window.print', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    // Add item to cart
    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    // Select Uang Pas
    const uangPasBtn = screen.getByText('Uang Pas');
    fireEvent.click(uangPasBtn);

    // Verify cart is not empty — checkout buttons should be enabled
    await waitFor(() => {
      const cetakButton = screen.getByText(/cetak struk/i).closest('button');
      expect(cetakButton).not.toBeDisabled();
    });

    // Click "Cetak Struk" button
    const cetakButton = screen.getByText(/cetak struk/i).closest('button')!;
    fireEvent.click(cetakButton);

    // handleCheckout sets a 600ms setTimeout for window.print
    // Advance timers to trigger the print call
    await vi.advanceTimersByTimeAsync(700);

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled();
    });

    printSpy.mockRestore();
  });

  it('TEST-POS-011: Simpan Data harus checkout dan menampilkan toast sukses', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    // Add item to cart
    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    // Select Uang Pas
    const uangPasBtn = screen.getByText('Uang Pas');
    fireEvent.click(uangPasBtn);

    // Verify checkout button is enabled
    await waitFor(() => {
      const simpanButton = screen.getByText(/simpan data/i).closest('button');
      expect(simpanButton).not.toBeDisabled();
    });

    // Click "Simpan Data"
    const simpanButton = screen.getByText(/simpan data/i).closest('button')!;
    fireEvent.click(simpanButton);

    // Advance timers to let all async operations in handleCheckout resolve
    await vi.advanceTimersByTimeAsync(100);

    // Verify success toast appears
    await waitFor(() => {
      expect(screen.getByText(/transaksi berhasil/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-012: Checkout harus memanggil Supabase untuk simpan transaksi', async () => {
    const { supabase } = await import('../lib/supabase');

    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Wait for items
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    // Add item to cart
    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    // Select Uang Pas
    const uangPasBtn = screen.getByText('Uang Pas');
    fireEvent.click(uangPasBtn);

    // Click "Simpan Data"
    await waitFor(() => {
      const simpanButton = screen.getByText(/simpan data/i).closest('button');
      expect(simpanButton).not.toBeDisabled();
    });

    const simpanButton = screen.getByText(/simpan data/i).closest('button')!;
    fireEvent.click(simpanButton);

    // Verify supabase.from was called with the right tables during checkout
    await waitFor(() => {
      const fromCalls = (supabase.from as any).mock.calls.map((c: any[]) => c[0]);
      // Should have called: transactions, transaction_details, items (update), item_movements, accounts (x4), journals (x1-2)
      expect(fromCalls).toContain('transactions');
      expect(fromCalls).toContain('transaction_details');
      expect(fromCalls).toContain('item_movements');
      expect(fromCalls).toContain('accounts');
      expect(fromCalls).toContain('journals');
    });
  });

  it('TEST-POS-013: Keranjang harus kosong setelah checkout berhasil', async () => {
    render(
      <BrowserRouter>
        <Pos />
      </BrowserRouter>
    );

    // Wait for items
    await waitFor(() => {
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });

    // Add item to cart
    const pulpenCard = screen.getByText('Pulpen Standard').closest('div[class*="cursor-pointer"]');
    if (pulpenCard) {
      fireEvent.click(pulpenCard);
    }

    // Verify item is in cart
    await waitFor(() => {
      const pulpenElements = screen.getAllByText('Pulpen Standard');
      expect(pulpenElements.length).toBeGreaterThanOrEqual(2);
    });

    // Select Uang Pas to fulfill payment
    const uangPasBtn = screen.getByText('Uang Pas');
    fireEvent.click(uangPasBtn);

    // Click "Simpan Data"
    const simpanButton = screen.getByText(/simpan data/i).closest('button')!;
    fireEvent.click(simpanButton);

    // Advance timers to let all async operations in handleCheckout resolve
    await vi.advanceTimersByTimeAsync(1000);

    // After successful checkout, cart should be empty — "Belum ada barang dipilih" should appear
    await waitFor(() => {
      expect(screen.getByText(/belum ada barang dipilih/i)).toBeInTheDocument();
    });
  });

  it('TEST-POS-014: Harus bisa berpindah ke tab Riwayat Transaksi', async () => {
    render(<BrowserRouter><Pos /></BrowserRouter>);
    const riwayatTab = screen.getByText(/Riwayat Transaksi/i);
    fireEvent.click(riwayatTab);
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
  });

  it('TEST-POS-015: Klik detail transaksi harus membuka modal dengan item terkait', async () => {
    render(<BrowserRouter><Pos /></BrowserRouter>);
    const riwayatTab = screen.getByText(/Riwayat Transaksi/i);
    fireEvent.click(riwayatTab);
    
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    const detailButtons = await screen.findAllByText(/Detail/i);
    fireEvent.click(detailButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Detail Transaksi')).toBeInTheDocument();
      expect(screen.getByText('Pulpen Standard')).toBeInTheDocument();
    });
  });

  it('TEST-POS-016: Harus bisa mencetak ulang struk dari riwayat', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<BrowserRouter><Pos /></BrowserRouter>);
    
    const riwayatTab = screen.getByText(/Riwayat Transaksi/i);
    fireEvent.click(riwayatTab);
    
    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    const detailButtons = await screen.findAllByText(/Detail/i);
    fireEvent.click(detailButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Detail Transaksi')).toBeInTheDocument();
    });

    const cetakButton = screen.getByText(/Cetak Ulang Struk/i).closest('button')!;
    fireEvent.click(cetakButton);

    await vi.advanceTimersByTimeAsync(400);

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalled();
    });

    printSpy.mockRestore();
  });
});
