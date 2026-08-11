import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Inventaris from '../pages/Inventaris';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Inventaris & Arsip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-INV-001: Harus merender tab Inventaris Barang dan isinya', async () => {
    render(
      <BrowserRouter>
        <Inventaris />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Inventaris Barang')).toBeInTheDocument();
      expect(screen.getByText('Komputer Kantor')).toBeInTheDocument();
    });
  });
});
