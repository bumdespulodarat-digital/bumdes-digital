-- =================================================================================
-- SKEMA DATABASE BUMDES DIGITAL (NOTO MULYO)
-- Silakan copy dan jalankan seluruh kode ini di menu "SQL Editor" Supabase Anda.
-- =================================================================================

-- 1. Tabel Chart of Accounts (COA) / Bagan Akun
CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL, -- Contoh: '1.1.01'
  name text NOT NULL,        -- Contoh: 'Kas'
  type text NOT NULL,        -- 'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
  balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Master Barang / Stok
CREATE TABLE IF NOT EXISTS items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  cost_price numeric NOT NULL DEFAULT 0, -- Harga beli (HPP)
  stock integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Header Transaksi (Kasir & Umum)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number text UNIQUE NOT NULL,
  type text NOT NULL, -- 'Penjualan', 'Pembelian', 'Biaya'
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by text,
  payment_method text DEFAULT 'Tunai',       -- 'Tunai', 'QRIS', 'Transfer Bank'
  amount_paid numeric DEFAULT 0,             -- Jumlah uang yang dibayarkan pelanggan
  change_amount numeric DEFAULT 0,           -- Kembalian (amount_paid - total_amount)
  cashier_name text,                         -- Nama kasir/petugas yang login
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Detail Transaksi (Barang yang dibeli/dijual)
CREATE TABLE IF NOT EXISTS transaction_details (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE RESTRICT,
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Jurnal Umum (Akuntansi)
CREATE TABLE IF NOT EXISTS journals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT,
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabel Pengaturan (Settings)
CREATE TABLE IF NOT EXISTS settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'BUMDes Noto Mulyo',
  store_address text NOT NULL DEFAULT 'Pulodarat, Jepara',
  store_contact text DEFAULT '081234567890',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Aset Tetap (Fixed Assets)
CREATE TABLE IF NOT EXISTS fixed_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Peralatan',
  acquisition_date date NOT NULL DEFAULT CURRENT_DATE,
  acquisition_cost bigint NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Manajemen Pengurus (bumdes_users)
CREATE TABLE IF NOT EXISTS bumdes_users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'Admin',
    email text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- Mengaktifkan RLS (Row Level Security) agar database aman
-- =================================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bumdes_users ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- Membuat Policy agar frontend bisa membaca dan menulis data (Untuk sementara: Public Access)
-- =================================================================================
CREATE POLICY "Allow public all access on accounts" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow public all access on items" ON items FOR ALL USING (true);
CREATE POLICY "Allow public all access on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow public all access on transaction_details" ON transaction_details FOR ALL USING (true);
CREATE POLICY "Allow public all access on journals" ON journals FOR ALL USING (true);
CREATE POLICY "Allow public all access on settings" ON settings FOR ALL USING (true);
CREATE POLICY "Allow public all access on fixed_assets" ON fixed_assets FOR ALL USING (true);
CREATE POLICY "Allow public all access on bumdes_users" ON bumdes_users FOR ALL USING (true);

-- =================================================================================
-- Seeding Data Awal (Opsional)
-- =================================================================================

-- Insert data bawaan pengaturan jika masih kosong
INSERT INTO settings (store_name, store_address, store_contact) 
VALUES ('BUMDes Noto Mulyo', 'Desa Pulodarat, Kec. Pecangaan, Jepara', '0812-3456-7890');

-- Insert beberapa data awal Aset Tetap berdasarkan hasil observasi lapangan
INSERT INTO fixed_assets (name, category, acquisition_cost, notes) VALUES
  ('Mesin Fotokopi', 'Peralatan', 5000000, 'Aset toko BUMDes'),
  ('Etalase Toko', 'Peralatan', 3000000, 'Etalase display barang dagangan'),
  ('Laptop Operasional', 'Peralatan', 7000000, 'Laptop untuk operasional toko'),
  ('Printer', 'Peralatan', 2000000, 'Printer baru untuk toko'),
  ('Pembangunan Tempat Parkir', 'Bangunan', 100000000, 'Lahan parkir di sebelah pabrik (belum beroperasi)');

-- Insert data pengurus BUMDes
INSERT INTO bumdes_users (name, role, email) VALUES
    ('Mas Anjid', 'Direktur BUMDes', 'direktur@bumdes.com'),
    ('Mbak Nurul', 'Bendahara', 'bendahara@bumdes.com'),
    ('Admin Pusat', 'Admin Sistem', 'admin@bumdes.com');

-- =================================================================================
-- 9. Tabel Kontak (Pihak Ketiga) untuk Piutang/Utang
-- =================================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL, -- 'Customer', 'Supplier', 'Lainnya'
  phone text,
  address text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- 10. Tabel Hutang & Piutang (Debts)
-- =================================================================================
CREATE TABLE IF NOT EXISTS debts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'Piutang' (Receivable), 'Utang' (Payable)
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  status text NOT NULL DEFAULT 'Belum Lunas', -- 'Belum Lunas', 'Lunas Sebagian', 'Lunas'
  notes text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL, -- Opsional terkait ke transaksi
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================================
-- 11. Tabel Riwayat Pergerakan Stok (Buku Pembantu Persediaan)
-- =================================================================================
CREATE TABLE IF NOT EXISTS item_movements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'IN', 'OUT'
  qty integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  description text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on contacts" ON contacts FOR ALL USING (true);
CREATE POLICY "Allow public all access on debts" ON debts FOR ALL USING (true);
CREATE POLICY "Allow public all access on item_movements" ON item_movements FOR ALL USING (true);

-- =================================================================================
-- Seeding Akun Sesuai Laporan Excel Noto Mulyo 2025
-- =================================================================================
INSERT INTO accounts (code, name, type) VALUES
  ('1.1.01.01', 'Kas Tunai', 'Asset'),
  ('1.1.01.02', 'Kas di Bank BSI', 'Asset'),
  ('1.1.01.03', 'Kas di Bank Mandiri', 'Asset'),
  ('1.1.01.04', 'Kas di Bank BRI', 'Asset'),
  ('1.1.01.05', 'Kas di Bank BPD', 'Asset'),
  ('1.1.01.98', 'Kas Kecil (Petty Cash)', 'Asset'),
  ('1.1.02.01', 'Deposito <= 3 bulan', 'Asset'),
  ('1.1.02.99', 'Setara Kas Lainnya', 'Asset'),
  ('1.1.03.01', 'Piutang Usaha', 'Asset'),
  ('1.1.03.02', 'Piutang kepada Pegawai', 'Asset'),
  ('1.1.03.99', 'Piutang Lainnya', 'Asset'),
  ('1.1.04.01', 'Penyisihan Piutang Usaha Tak Tertagih', 'Asset'),
  ('1.1.04.02', 'Penyisihan Piutang kepada Pegawai Tak Tertagih', 'Asset'),
  ('1.1.04.99', 'Penyisihan Piutang Lainnya Tak Tertagih', 'Asset'),
  ('1.1.05.01', 'Persediaan Barang Dagangan', 'Asset'),
  ('1.1.05.02', 'Persediaan Bahan Baku', 'Asset'),
  ('1.1.05.03', 'Persediaan Barang Dalam Proses', 'Asset'),
  ('1.1.05.04', 'Persediaan Barang Jadi', 'Asset'),
  ('1.1.06.01', 'Alat Tulis Kantor (ATK)', 'Asset'),
  ('1.1.07.01', 'Sewa Dibayar Dimuka', 'Asset'),
  ('1.1.07.02', 'Asuransi Dibayar Dimuka', 'Asset'),
  ('1.1.07.03', 'PPh 25', 'Asset'),
  ('1.1.07.04', 'PPN Masukan', 'Asset'),
  ('1.1.98.99', 'Aset Lancar Lainnya', 'Asset'),
  ('1.1.99.01', 'RK Unit Wisata', 'Asset'),
  ('1.1.99.02', 'RK Unit Restoran', 'Asset'),
  ('1.1.99.03', 'RK Unit Minimart Desa', 'Asset'),
  ('1.1.99.04', 'RK Unit Gedung Serbaguna', 'Asset'),
  ('1.1.99.05', 'RK Unit Simpan Pinjam', 'Asset'),
  ('1.1.99.06', 'RK Unit Pengelolaan Air Bersih', 'Asset'),
  ('1.1.99.07', 'RK Unit Pengelolaan Sampah', 'Asset'),
  ('1.2.01.01', 'Deposito > 3 bulan', 'Asset'),
  ('1.2.01.99', 'Investasi Lainnya', 'Asset'),
  ('1.3.01.01', 'Tanah', 'Asset'),
  ('1.3.02.01', 'Kendaraan', 'Asset'),
  ('1.3.03.01', 'Peralatan dan Mesin', 'Asset'),
  ('1.3.04.01', 'Meubelair', 'Asset'),
  ('1.3.05.01', 'Gedung dan Bangunan', 'Asset'),
  ('1.3.06.01', 'Konstruksi Dalam Pengerjaan', 'Asset'),
  ('1.3.07.01', 'Akumulasi Penyusutan Kendaraan', 'Asset'),
  ('1.3.07.02', 'Akumulasi Penyusutan Peralatan dan Mesin', 'Asset'),
  ('1.3.07.03', 'Akumulasi Penyusutan Meubelair', 'Asset'),
  ('1.3.07.04', 'Akumulasi Penyusutan Gedung dan Bangunan', 'Asset'),
  ('1.3.99.99', 'Aset Tetap Lainnya', 'Asset'),
  ('1.4.01.01', 'Software', 'Asset'),
  ('1.4.01.02', 'Patent', 'Asset'),
  ('1.4.01.03', 'Trademark', 'Asset'),
  ('1.4.02.01', 'Amortisasi Aset takberwujud', 'Asset'),
  ('1.9.01.01', 'Aset Lain-lain', 'Asset'),
  ('1.9.01.02', 'Akumulasi Penyusutan Aset Lain-lain', 'Asset'),
  ('2.1.01.01', 'Utang Usaha', 'Liability'),
  ('2.1.02.01', 'PPN Keluaran', 'Liability'),
  ('2.1.02.02', 'PPh 21', 'Liability'),
  ('2.1.02.03', 'PPh 23', 'Liability'),
  ('2.1.02.04', 'PPh 29', 'Liability'),
  ('2.1.03.01', 'Utang Gaji dan Tunjangan', 'Liability'),
  ('2.1.03.02', 'Utang Gaji/Upah Karyawan', 'Liability'),
  ('2.1.04.01', 'Utang Listrik', 'Liability'),
  ('2.1.04.02', 'Utang Telepon/Internet', 'Liability'),
  ('2.1.04.93', 'Utang Utilitas Lainnya', 'Liability'),
  ('2.1.05.01', 'Utang kepada Pihak Ketiga Jk. Pendek', 'Liability'),
  ('2.1.05.99', 'Utang kepada Pihak Ketiga Jk. Pendek Lainnya', 'Liability'),
  ('2.1.09.99', 'Utang Jangka Pendek Lainnya', 'Liability'),
  ('2.2.01.01', 'Utang Ke Bank', 'Liability'),
  ('2.2.02.01', 'Utang kepada Pihak Ketiga Jk. Panjang', 'Liability'),
  ('2.2.99.99', 'Utang Jangka Panjang Lainnya', 'Liability'),
  ('3.1.01.01', 'Penyertaan Modal Desa', 'Equity'),
  ('3.1.01.02', 'Penyertaan Modal Desa A', 'Equity'),
  ('3.1.01.03', 'Penyertaan Modal Desa B', 'Equity'),
  ('3.1.01.04', 'Penyertaan Modal Desa C', 'Equity'),
  ('3.1.02.01', 'Penyertaan Modal Masyarakat', 'Equity'),
  ('3.1.02.02', 'Penyertaan Modal Masyarakat Desa A', 'Equity'),
  ('3.1.02.03', 'Penyertaan Modal Masyarakat Desa B', 'Equity'),
  ('3.1.02.04', 'Penyertaan Modal Masyarakat Desa C', 'Equity'),
  ('3.2.01.01', 'Bagi Hasil Penyertaan Modal Desa', 'Equity'),
  ('3.2.01.02', 'Bagi Hasil Penyertaan Modal Desa A', 'Equity'),
  ('3.2.01.03', 'Bagi Hasil Penyertaan Modal Desa B', 'Equity'),
  ('3.2.01.04', 'Bagi Hasil Penyertaan Modal Desa C', 'Equity'),
  ('3.2.02.01', 'Bagi Hasil Penyertaan Modal Masyarakat', 'Equity'),
  ('3.2.02.02', 'Bagi Hasil Penyertaan Modal Masyarakat Desa A', 'Equity'),
  ('3.2.02.03', 'Bagi Hasil Penyertaan Modal Masyarakat Desa B', 'Equity'),
  ('3.2.02.04', 'Bagi Hasil Penyertaan Modal Masyarakat Desa C', 'Equity'),
  ('3.3.01.01', 'Saldo Laba Tidak Dicadangkan', 'Equity'),
  ('3.3.02.01', 'Saldo Laba Dicadangkan untuk Pembelian Aset Tetap', 'Equity'),
  ('3.3.01.02', 'Saldo Laba Dicadangkan untuk Pembayaran Utang Jangka Panjang', 'Equity'),
  ('3.4.01.01', 'Modal Donasi/Sumbangan', 'Equity'),
  ('3.8.01.01', 'RK Pusat', 'Equity'),
  ('3.9.01.01', 'Ikhtisar Laba Rugi', 'Equity'),
  ('4.1.01.01', 'Pendapatan Tiket', 'Revenue'),
  ('4.1.01.02', 'Pendapatan Wahana', 'Revenue'),
  ('4.1.01.03', 'Pendapatan Paket Wisata', 'Revenue'),
  ('4.1.02.01', 'Pendapatan Pengelolaan Air Bersih', 'Revenue'),
  ('4.1.03.01', 'Pendapatan Pengelolaan Sampah', 'Revenue'),
  ('4.1.04.01', 'Pendapatan Sewa Tempat Outbound', 'Revenue'),
  ('4.1.04.02', 'Pendapatan Sewa Tempat untuk Toko/Kios', 'Revenue'),
  ('4.1.04.03', 'Pendapatan Sewa Gedung', 'Revenue'),
  ('4.1.04.04', 'Pendapatan Sewa Mobil', 'Revenue'),
  ('4.1.04.05', 'Pendapatan Sewa Peralatan Gedung', 'Revenue'),
  ('4.1.04.99', 'Pendapatan Sewa Lainnya', 'Revenue'),
  ('4.1.05.01', 'Pendapatan Jasa Pembayaran Listrik', 'Revenue'),
  ('4.1.05.99', 'Pendapatan Jasa INTERNET', 'Revenue'),
  ('4.1.06.01', 'Pendapatan Transportasi', 'Revenue'),
  ('4.1.07.01', 'Pendapatan Parkir Mobil', 'Revenue'),
  ('4.1.07.02', 'Pendapatan Parkir Motor', 'Revenue'),
  ('4.1.08.01', 'Pendapatan Simpan Pinjam', 'Revenue'),
  ('4.1.09.01', 'Pendapatan Pelatihan', 'Revenue'),
  ('4.1.10.01', 'Pendapatan Homestay', 'Revenue'),
  ('4.1.11.01', 'Pendapatan Komisi', 'Revenue'),
  ('4.1.12.01', 'Pendapatan Samsat Budiman', 'Revenue'),
  ('4.2.01.01', 'Pendapatan Penjualan Makanan/Minuman', 'Revenue'),
  ('4.2.01.02', 'Pendapatan Penjualan Pakaian/Kaos/Jaket', 'Revenue'),
  ('4.2.01.03', 'Pendapatan Penjualan Hasil Kerajinan/Suvenir', 'Revenue'),
  ('4.2.01.04', 'Pendapatan Penjualan Buku', 'Revenue'),
  ('4.2.01.05', 'Pendapatan Penjualan Biji Kopi', 'Revenue'),
  ('4.2.01.06', 'Pendapatan Penjualan Bensin', 'Revenue'),
  ('4.2.01.91', 'Pendapatan Penjualan Barang Dagangan', 'Revenue'),
  ('4.2.02.01', 'Retur Penjualan Barang Dagangan', 'Revenue'),
  ('4.2.03.01', 'Diskon Penjualan Barang Dagangan', 'Revenue'),
  ('4.3.01.01', 'Pendapatan Katering', 'Revenue'),
  ('4.3.01.02', 'Pendapatan Restoran', 'Revenue'),
  ('4.3.01.03', 'Pendapatan Kopi', 'Revenue'),
  ('4.3.01.91', 'Pendapatan Penjualan Barang Jadi', 'Revenue'),
  ('4.3.02.01', 'Retur Penjualan Barang Jadi', 'Revenue'),
  ('4.3.03.01', 'Diskon Penjualan Barang Jadi', 'Revenue'),
  ('5.1.01.01', 'Harga Pokok Penjualan Barang Dagangan', 'Expense'),
  ('5.2.01.01', 'Harga Pokok Penjualan Barang Jadi', 'Expense'),
  ('5.3.01.01', 'Harga Pokok Produksi', 'Expense'),
  ('6.1.01.01', 'Beban Gaji dan Tunjangan Bag. Adum', 'Expense'),
  ('6.1.01.02', 'Beban Honor Lembur Bag. Adum', 'Expense'),
  ('6.1.01.03', 'Beban Honor Narasumber', 'Expense'),
  ('6.1.01.04', 'Beban Insentif (Bonus) Bag. Adum', 'Expense'),
  ('6.1.01.05', 'Beban Komisi Bag. Adum', 'Expense'),
  ('6.1.01.06', 'Beban Seragam Pegawai Bag. Adum', 'Expense'),
  ('6.1.01.07', 'Beban Penguatan SDM', 'Expense'),
  ('6.1.01.99', 'Beban Pegawai Bag. Adum Lainnya', 'Expense'),
  ('6.1.02.01', 'Beban Alat Tulis Kantor (ATK)', 'Expense'),
  ('6.1.02.02', 'Beban Foto Copy', 'Expense'),
  ('6.1.02.03', 'Beban Konsumsi Rapat', 'Expense'),
  ('6.1.02.04', 'Beban Cetak dan Dekorasi', 'Expense'),
  ('6.1.02.99', 'Beban Perlengkapan Lainnya', 'Expense'),
  ('6.1.03.01', 'Beban Pemeliharaan dan Perbaikan', 'Expense'),
  ('6.1.04.01', 'Beban Listrik', 'Expense'),
  ('6.1.04.02', 'Beban Telepon/Internet', 'Expense'),
  ('6.1.04.99', 'Beban Utilitas Lainnya', 'Expense'),
  ('6.1.05.01', 'Beban Sewa', 'Expense'),
  ('6.1.05.02', 'Beban Asuransi', 'Expense'),
  ('6.1.06.01', 'Beban Kebersihan', 'Expense'),
  ('6.1.06.02', 'Beban Keamanan', 'Expense'),
  ('6.1.07.01', 'Beban Penyisihan Piutang Tak Tertagih', 'Expense'),
  ('6.1.07.02', 'Beban Penyusutan Kendaraan', 'Expense'),
  ('6.1.07.03', 'Beban Penyusutan Peralatan dan Mesin', 'Expense'),
  ('6.1.07.04', 'Beban Penyusutan Meubelair', 'Expense'),
  ('6.1.07.05', 'Beban Penyusutan Gedung dan Bangunan', 'Expense'),
  ('6.1.07.06', 'Beban Amortisasi Aset takberwujud', 'Expense'),
  ('6.1.99.01', 'Beban Parkir', 'Expense'),
  ('6.1.99.02', 'Beban Audit', 'Expense'),
  ('6.1.99.03', 'Beban Perjalanan Dinas', 'Expense'),
  ('6.1.99.04', 'Beban Transportasi', 'Expense'),
  ('6.1.99.05', 'Beban Jamuan Tamu', 'Expense'),
  ('6.1.99.99', 'Beban Administrasi dan Umum Lainnya', 'Expense'),
  ('6.2.01.01', 'Beban Gaji/Upah Bag. Operasional', 'Expense'),
  ('6.2.01.02', 'Beban Uang Makan Bag. Operasional', 'Expense'),
  ('6.2.02.01', 'Beban Pemeliharaan Wahana', 'Expense'),
  ('6.2.02.02', 'Beban Perbaikan dan Renovasi', 'Expense'),
  ('6.2.03.01', 'Beban Tim SAR', 'Expense'),
  ('6.2.03.02', 'Beban P3K', 'Expense'),
  ('6.2.99.01', 'Beban Komunikasi', 'Expense'),
  ('6.2.99.02', 'Beban Sewa Lokasi', 'Expense'),
  ('6.2.99.03', 'Beban Pakan Ikan', 'Expense'),
  ('6.2.99.99', 'Beban Operasional Lainnya', 'Expense'),
  ('6.3.01.01', 'Beban Gaji/Upah Bag. Pemasaran', 'Expense'),
  ('6.3.01.02', 'Beban Insentif (Bonus) Bag. Pemasaran', 'Expense'),
  ('6.3.01.03', 'Beban Seragam Pegawai Bag. Pemasaran', 'Expense'),
  ('6.3.02.01', 'Beban Iklan', 'Expense'),
  ('6.3.02.02', 'Beban Promosi wartawan', 'Expense'),
  ('6.3.02.03', 'Beban Dana Sosial', 'Expense'),
  ('6.3.99.99', 'Beban Pemasaran Lainnya', 'Expense'),
  ('7.1.01.01', 'Pendapatan Bunga Bank', 'Revenue'),
  ('7.1.01.02', 'Pendapatan Fee Agen BRI LINK', 'Revenue'),
  ('7.1.02.01', 'Pendapatan Dividen', 'Revenue'),
  ('7.1.03.01', 'Pendapatan Denda', 'Revenue'),
  ('7.1.04.01', 'Pendapatan Iklan', 'Revenue'),
  ('7.1.05.01', 'Keuntungan Penjualan Aset Tetap', 'Revenue'),
  ('7.1.99.99', 'Pendapatan Lain-lain lainnya', 'Revenue'),
  ('7.2.01.01', 'Beban Administrasi Bank', 'Expense'),
  ('7.2.02.01', 'Beban Bunga', 'Expense'),
  ('7.2.03.01', 'Beban Denda', 'Expense'),
  ('7.2.04.01', 'Kerugian Penjualan Aset Tetap', 'Expense'),
  ('7.2.99.99', 'Beban Lain-lain lainnya', 'Expense'),
  ('7.3.01.01', 'Beban Pajak Air Permukaan', 'Expense'),
  ('7.3.01.02', 'Beban Pajak Bunga Bank', 'Expense'),
  ('7.3.01.03', 'Beban Pajak Daerah', 'Expense'),
  ('7.3.01.04', 'Beban Pajak Hiburan', 'Expense'),
  ('7.3.01.05', 'Beban Pajak Reklame', 'Expense'),
  ('7.3.01.06', 'Beban PPh 21', 'Expense'),
  ('7.3.01.07', 'Beban PPh 23', 'Expense'),
  ('7.3.01.08', 'Beban PPh 25', 'Expense'),
  ('7.3.01.09', 'Beban PPh 29', 'Expense'),
  ('7.3.01.10', 'Beban PPh Final', 'Expense'),
  ('7.3.01.99', 'Beban Pajak Lainnya', 'Expense');
