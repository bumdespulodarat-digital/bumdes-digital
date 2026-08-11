-- =================================================================================
-- MIGRASI DATABASE BUMDES DIGITAL — 8 FITUR BARU
-- Jalankan SQL ini di Supabase SQL Editor
-- =================================================================================

-- ===== FASE 1: Transaksi Custom =====
-- Buat item_id nullable dan tambah kolom custom_item_name
ALTER TABLE transaction_details ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE transaction_details ADD COLUMN IF NOT EXISTS custom_item_name text;

-- ===== FASE 5: Pajak Fleksibel per Barang =====
ALTER TABLE items ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE transaction_details ADD COLUMN IF NOT EXISTS tax_rate numeric DEFAULT 0;
ALTER TABLE transaction_details ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;

-- ===== FASE 4: Inventaris, Surat, Notulen, Dokumentasi =====

-- Inventaris Barang
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Peralatan',
  qty integer NOT NULL DEFAULT 1,
  condition text NOT NULL DEFAULT 'Baik',
  location text DEFAULT '',
  acquisition_date date DEFAULT CURRENT_DATE,
  acquisition_cost bigint DEFAULT 0,
  notes text DEFAULT '',
  photo_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Inventaris Surat
CREATE TABLE IF NOT EXISTS letters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  letter_number text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'Masuk',
  subject text NOT NULL,
  sender_receiver text DEFAULT '',
  notes text DEFAULT '',
  file_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Notulen Rapat
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  agenda text DEFAULT '',
  attendees text DEFAULT '',
  decisions text DEFAULT '',
  notulist text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Dokumentasi Kegiatan
CREATE TABLE IF NOT EXISTS activity_docs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text DEFAULT '',
  location text DEFAULT '',
  photo_urls jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- ===== FASE 7: Struktur Organisasi =====
ALTER TABLE bumdes_users ADD COLUMN IF NOT EXISTS position text DEFAULT '';
ALTER TABLE bumdes_users ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE bumdes_users ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '';

-- ===== FASE 8: Buku Kas =====
CREATE TABLE IF NOT EXISTS cash_book (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  category text DEFAULT 'Umum',
  debit numeric DEFAULT 0,
  credit numeric DEFAULT 0,
  balance numeric DEFAULT 0,
  source text DEFAULT 'Manual',
  reference_id uuid,
  created_by text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===== RLS Policies =====
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_book ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on inventory_items" ON inventory_items FOR ALL USING (true);
CREATE POLICY "Allow public all access on letters" ON letters FOR ALL USING (true);
CREATE POLICY "Allow public all access on meeting_minutes" ON meeting_minutes FOR ALL USING (true);
CREATE POLICY "Allow public all access on activity_docs" ON activity_docs FOR ALL USING (true);
CREATE POLICY "Allow public all access on cash_book" ON cash_book FOR ALL USING (true);

-- ===== FASE 9: Performance Optimization (Indexes) =====
-- Menambahkan index agar query laporan (filter berdasarkan tanggal) berjalan secepat kilat
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_book_date ON cash_book(date);
CREATE INDEX IF NOT EXISTS idx_item_movements_created_at ON item_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals(created_at);

-- ===== FASE 10: Validasi Ketat Saldo Minus (Accounting Rules) =====
-- Mencegah kasir/sistem memasukkan pengeluaran yang membuat saldo kas BUMDes menjadi minus.
CREATE OR REPLACE FUNCTION check_cash_balance() RETURNS trigger AS $$
DECLARE
   current_balance numeric;
BEGIN
   -- Hitung total saldo kas saat ini
   SELECT COALESCE(SUM(debit - credit), 0) INTO current_balance FROM cash_book;
   
   -- Jika ada transaksi baru (INSERT) dan saldo akhir menjadi minus
   IF TG_OP = 'INSERT' THEN
      IF (current_balance + NEW.debit - NEW.credit) < 0 THEN
         RAISE EXCEPTION 'TRANSAKSI DITOLAK: Saldo kas BUMDes tidak mencukupi untuk pengeluaran ini.';
      END IF;
   END IF;
   
   -- Jika transaksi diedit (UPDATE), hitung ulang saldonya
   IF TG_OP = 'UPDATE' THEN
      IF (current_balance - (OLD.debit - OLD.credit) + (NEW.debit - NEW.credit)) < 0 THEN
         RAISE EXCEPTION 'TRANSAKSI DITOLAK: Perubahan ini akan menyebabkan saldo kas BUMDes menjadi minus.';
      END IF;
   END IF;
   
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hapus trigger lama jika ada agar bisa direplace
DROP TRIGGER IF EXISTS ensure_positive_balance ON cash_book;

-- Pasang trigger ke tabel cash_book
CREATE TRIGGER ensure_positive_balance
BEFORE INSERT OR UPDATE ON cash_book
FOR EACH ROW
EXECUTE FUNCTION check_cash_balance();
