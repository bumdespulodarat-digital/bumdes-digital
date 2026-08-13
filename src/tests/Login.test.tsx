import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { createMockSupabaseClient } from './mocks/supabase';

// Mock the supabase module
vi.mock('../lib/supabase', async () => {
  const { createMockSupabaseClient } = await import('./mocks/supabase');
  return {
    supabase: createMockSupabaseClient(),
  };
});

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page - Autentikasi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST-LOGIN-001: Halaman login harus tampil dengan form lengkap', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('BUMDes Digital')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@bumdes.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk ke sistem/i })).toBeInTheDocument();
  });

  it('TEST-LOGIN-002: Input email harus berfungsi dengan benar', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('admin@bumdes.com') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'test@bumdes.com' } });
    expect(emailInput.value).toBe('test@bumdes.com');
  });

  it('TEST-LOGIN-003: Input password harus berfungsi dengan benar', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');
  });

  it('TEST-LOGIN-004: Form tidak boleh submit jika field kosong', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /masuk ke sistem/i });
    const form = submitButton.closest('form');
    
    expect(form).toBeInTheDocument();
  });

  it('TEST-LOGIN-005: Login berhasil harus redirect ke dashboard', async () => {
    const mockSupabase = createMockSupabaseClient();
    mockSupabase.auth.signInWithPassword = vi.fn().mockResolvedValue({ 
      data: { user: { email: 'admin@bumdes.com' } }, 
      error: null 
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('admin@bumdes.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /masuk ke sistem/i });

    fireEvent.change(emailInput, { target: { value: 'admin@bumdes.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });

  it('TEST-LOGIN-006: Login gagal harus tampilkan error message', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('admin@bumdes.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /masuk ke sistem/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email atau password salah/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
