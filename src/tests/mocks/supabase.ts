import { vi } from 'vitest';

// Mock data
export const mockItems = [
  { id: '1', sku: 'ATK001', name: 'Pulpen Standard', category: 'ATK', price: 5000, cost_price: 3000, stock: 100 },
  { id: '2', sku: 'ATK002', name: 'Buku Tulis 38 Lembar', category: 'ATK', price: 8000, cost_price: 5000, stock: 50 },
  { id: '3', sku: 'ATK003', name: 'Pensil 2B', category: 'ATK', price: 3000, cost_price: 2000, stock: 75 },
];

export const mockAccounts = [
  { id: 'acc1', code: '1.1.01.01', name: 'Kas Tunai', type: 'Asset' },
  { id: 'acc2', code: '4.2.01.91', name: 'Pendapatan Penjualan Barang Dagangan', type: 'Revenue' },
  { id: 'acc3', code: '5.1.01.01', name: 'Harga Pokok Penjualan', type: 'Expense' },
  { id: 'acc4', code: '1.1.05.01', name: 'Persediaan Barang Dagangan', type: 'Asset' },
  { id: 'acc5', code: '1.1.03.01', name: 'Piutang Usaha', type: 'Asset' },
  { id: 'acc6', code: '2.1.01.01', name: 'Utang Usaha', type: 'Liability' },
  { id: 'acc7', code: '3.1.01.01', name: 'Modal Awal', type: 'Equity' },
];

export const mockJournals = [
  { 
    id: 'j1', 
    created_at: '2026-08-01T10:00:00', 
    description: 'Penjualan INV-001', 
    debit: 50000, 
    credit: 0, 
    account_id: 'acc1',
    accounts: mockAccounts[0]
  },
  { 
    id: 'j2', 
    created_at: '2026-08-01T10:00:00', 
    description: 'Penjualan INV-001', 
    debit: 0, 
    credit: 50000, 
    account_id: 'acc2',
    accounts: mockAccounts[1]
  },
];

export const mockContacts = [
  { id: 'c1', name: 'Budi Santoso', type: 'Customer', phone: '081234567890' },
  { id: 'c2', name: 'CV Sumber Rejeki', type: 'Supplier', phone: '081298765432' },
];

export const mockDebts = [
  { 
    id: 'd1', 
    contact_id: 'c1', 
    type: 'Piutang', 
    amount: 500000, 
    due_date: '2026-09-01', 
    status: 'Belum Lunas', 
    notes: 'Pinjaman modal usaha',
    contacts: mockContacts[0]
  },
  { 
    id: 'd2', 
    contact_id: 'c2', 
    type: 'Utang', 
    amount: 1000000, 
    due_date: '2026-08-15', 
    status: 'Belum Lunas', 
    notes: 'Pembelian stok barang',
    contacts: mockContacts[1]
  },
];

export const mockFixedAssets = [
  { id: 'fa1', name: 'Kendaraan Operasional', category: 'Kendaraan', acquisition_date: '2025-01-15', acquisition_cost: 50000000, notes: 'Motor untuk operasional' },
  { id: 'fa2', name: 'Komputer Kasir', category: 'Elektronik', acquisition_date: '2025-06-01', acquisition_cost: 8000000, notes: 'PC untuk kasir' },
];

export const mockSettings = {
  id: 's1',
  store_name: 'BUMDes Noto Mulyo',
  store_address: 'Desa Pulodarat, Kec. Pecangaan, Kab. Jepara',
  store_contact: '081234567890'
};

export const mockUsers = [
  { id: 'u1', name: 'Admin Utama', role: 'Direktur BUMDes', email: 'admin@bumdes.com', created_at: '2025-01-01' },
  { id: 'u2', name: 'Bendahara', role: 'Bendahara', email: 'bendahara@bumdes.com', created_at: '2025-01-01' },
];

export const mockTransactions = [
  { id: 't1', invoice_number: 'INV-001', type: 'Penjualan', total_amount: 50000, notes: 'Penjualan Kasir', created_at: '2026-08-01' },
];

export const mockMovements = [
  { id: 'm1', created_at: '2026-07-01T08:00:00', type: 'IN', qty: 100, description: 'Saldo Awal Stok', item_id: '1' },
  { id: 'm2', created_at: '2026-08-01T10:00:00', type: 'OUT', qty: 5, description: 'Penjualan Kasir - Nota INV-001', item_id: '1' },
];

// Mock Supabase Client
export const createMockSupabaseClient = () => {
  const mockFrom = (table: string) => {
    const data: any = {
      items: [...mockItems],
      accounts: [...mockAccounts],
      journals: [...mockJournals],
      contacts: [...mockContacts],
      debts: [...mockDebts],
      fixed_assets: [...mockFixedAssets],
      settings: mockSettings,
      bumdes_users: [...mockUsers],
      transactions: [...mockTransactions],
      item_movements: [...mockMovements],
      transaction_details: [],
    };

    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: data[table] === mockSettings ? data[table] : data[table]?.[0], error: null }),
      then: vi.fn((callback) => callback({ data: data[table] || [], error: null })),
    };
  };

  return {
    from: mockFrom,
    auth: {
      signInWithPassword: vi.fn((credentials) => {
        // Return error for wrong credentials
        if (credentials.email === 'wrong@email.com' || credentials.password === 'wrongpass') {
          return Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Invalid login credentials' } 
          });
        }
        // Return success for correct credentials
        return Promise.resolve({ 
          data: { user: { email: credentials.email }, session: {} }, 
          error: null 
        });
      }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: 'admin@bumdes.com' } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: 'auth-1', email: 'admin@bumdes.com' }] }, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-auth' } }, error: null }),
      }
    },
  };
};
