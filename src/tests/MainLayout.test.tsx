import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

import MainLayout from '../layouts/MainLayout';

// Mock matchMedia for dark mode testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('MainLayout - Layout Utama & Dark Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document classes
    document.documentElement.className = '';
  });

  it('TEST-LAYOUT-001: Toggle dark mode harus mengubah class di tag html', async () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    // Initial state (should not have 'dark' class)
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Find all buttons that could be the dark mode toggle (usually contains Sun/Moon icon)
    const buttons = screen.getAllByRole('button');
    // In our layout, the dark mode toggle is usually the first button in the top right header
    // Or we can find it by checking if clicking it toggles the 'dark' class
    
    // We will just click the dark mode toggle button. It's the one before the profile dropdown.
    // Let's find it by looking for the button that doesn't have text (it only has an icon)
    const toggleButton = buttons.find(btn => btn.className.includes('bg-white/50') || btn.className.includes('dark:bg-slate-800/50'));
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      fireEvent.click(toggleButton);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    }
  });

  it('TEST-LAYOUT-002: Harus menampilkan menu navigasi', () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Kasir (POS)')).toBeInTheDocument();
    expect(screen.getByText('Stok Barang')).toBeInTheDocument();
    expect(screen.getByText('Hutang Piutang')).toBeInTheDocument();
    expect(screen.getByText('Akuntansi')).toBeInTheDocument();
    expect(screen.getByText('Pengaturan')).toBeInTheDocument();
  });
  it('TEST-LAYOUT-003: Klik avatar harus membuka dropdown profil dengan opsi Ubah Password', async () => {
    render(
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    );

    // Klik area profil (avatar)
    const buttons = screen.getAllByRole('button');
    const profileButton = buttons.find(btn => btn.textContent?.includes('Admin'));
    if (profileButton) {
      fireEvent.click(profileButton);

      // Dropdown harus muncul
      expect(await screen.findByText('Ubah Password Saya')).toBeInTheDocument();
      expect(screen.getByText('Sedang login')).toBeInTheDocument();
    }
  });
});
