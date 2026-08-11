import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StrukturOrganisasi from '../pages/StrukturOrganisasi';

vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

describe('Struktur Organisasi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-ORG-001: Harus merender struktur organisasi BUMDes', async () => {
    render(
      <BrowserRouter>
        <StrukturOrganisasi />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Admin Utama/i).length).toBeGreaterThan(0);
    });
  });
});
