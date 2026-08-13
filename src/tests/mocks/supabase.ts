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
  { id: 't1', invoice_number: 'INV-001', type: 'Penjualan', total_amount: 50000, notes: 'Penjualan Kasir', payment_method: 'Tunai', amount_paid: 50000, change_amount: 0, cashier_name: 'Admin Utama', created_at: '2026-08-01T10:00:00' },
];

export const mockTransactionDetails = [
  { id: 'td1', transaction_id: 't1', item_id: '1', qty: 1, unit_price: 50000, subtotal: 50000, items: mockItems[0] },
];

export const mockMovements = [
  { id: 'm1', created_at: '2026-07-01T08:00:00', type: 'IN', qty: 100, description: 'Saldo Awal Stok', item_id: '1' },
  { id: 'm2', created_at: '2026-08-01T10:00:00', type: 'OUT', qty: 5, description: 'Penjualan Kasir - Nota INV-001', item_id: '1' },
];

export const mockCashBook = [
  { id: 'cb1', date: '2026-08-01', description: 'Saldo Awal', category: 'Umum', debit: 5000000, credit: 0, source: 'Manual', created_by: 'Admin', created_at: '2026-08-01T08:00:00' },
  { id: 'cb2', date: '2026-08-05', description: 'Beli Kertas', category: 'Biaya Operasional', debit: 0, credit: 50000, source: 'Manual', created_by: 'Admin', created_at: '2026-08-05T09:00:00' },
];

export const mockInventoryItems = [
  { id: 'inv1', name: 'Komputer Kantor', category: 'Elektronik', qty: 2, condition: 'Baik', location: 'Ruang Admin', acquisition_date: '2025-01-01', acquisition_cost: 10000000, notes: '', created_at: '2025-01-01T00:00:00' }
];

// Table data lookup
const tableData: Record<string, any> = {
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
  transaction_details: [...mockTransactionDetails],
  cash_book: [...mockCashBook],
  inventory_items: [...mockInventoryItems],
};

/**
 * Creates a chainable query builder mock that properly supports all chains:
 * - select().order()          → resolves to { data: array }
 * - select().eq().single()    → resolves to { data: single item }
 * - select().limit().maybeSingle() → resolves to { data: single item | null }
 * - insert().select().single() → resolves to { data: { id: 'new-uuid' } }
 * - insert() (array)          → resolves to { data: [], error: null }
 * - update().eq()              → resolves to { data: null, error: null }
 * - delete().eq()              → resolves to { data: null, error: null }
 */
function createQueryBuilder(table: string, operation: 'select' | 'insert' | 'update' | 'delete') {
  // Track state across the chain
  let _isInsert = operation === 'insert';
  let _isUpdate = operation === 'update';
  let _isDelete = operation === 'delete';
  let _selectAfterInsert = false;
  let _eqField: string | null = null;
  let _eqValue: any = null;

  const getData = () => tableData[table] || [];

  const getFilteredSingle = () => {
    const data = getData();
    // For settings (non-array), return as-is
    if (!Array.isArray(data)) return data;
    // If we have an eq filter, find matching item
    if (_eqField && _eqValue !== null) {
      return data.find((item: any) => item[_eqField!] === _eqValue) || data[0] || null;
    }
    return data[0] || null;
  };

  // The chainable builder object
  const builder: any = {
    select: vi.fn(() => {
      if (_isInsert) {
        _selectAfterInsert = true;
      }
      return builder;
    }),
    insert: vi.fn(() => {
      _isInsert = true;
      return builder;
    }),
    update: vi.fn(() => {
      _isUpdate = true;
      return builder;
    }),
    delete: vi.fn(() => {
      _isDelete = true;
      return builder;
    }),
    eq: vi.fn((field: string, value: any) => {
      _eqField = field;
      _eqValue = value;
      return builder;
    }),
    neq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    in: vi.fn(() => builder),
    like: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    
    // Terminal methods — these resolve the promise
    single: vi.fn(() => {
      if (_isInsert && _selectAfterInsert) {
        // insert().select().single() → return a new record with id
        return Promise.resolve({ data: { id: 'new-trx-uuid' }, error: null });
      }
      // select().eq().single() → find matching record
      return Promise.resolve({ data: getFilteredSingle(), error: null });
    }),

    maybeSingle: vi.fn(() => {
      if (!Array.isArray(getData())) {
        return Promise.resolve({ data: getData(), error: null });
      }
      return Promise.resolve({ data: getFilteredSingle(), error: null });
    }),

    // Promise-like behavior for chains that end without terminal methods
    // e.g. await supabase.from('items').update({...}).eq('id', x)
    then: vi.fn((resolve: any) => {
      if (_isInsert && !_selectAfterInsert) {
        // Plain insert (no .select()) → resolves with data
        return resolve({ data: null, error: null });
      }
      if (_isUpdate || _isDelete) {
        return resolve({ data: null, error: null });
      }
      // Normal select → resolves with table data array
      const data = getData();
      return resolve({ data: Array.isArray(data) ? data : [data], error: null });
    }),
  };

  return builder;
}

// Mock Supabase Client
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn((table: string) => {
    // Each from() call creates a fresh builder
    return {
      select: vi.fn((..._args: any[]) => createQueryBuilder(table, 'select')),
      insert: vi.fn((..._args: any[]) => createQueryBuilder(table, 'insert')),
      update: vi.fn((..._args: any[]) => createQueryBuilder(table, 'update')),
      delete: vi.fn((..._args: any[]) => createQueryBuilder(table, 'delete')),
    };
  });

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
      updateUser: vi.fn().mockResolvedValue({ data: { user: { email: 'admin@bumdes.com' } }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [{ id: 'auth-1', email: 'admin@bumdes.com' }] }, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-auth' } }, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1' } }, error: null }),
      }
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://mock.supabase.co/storage/v1/object/public/avatars/test.jpg' } })
      }))
    }
  };
};
