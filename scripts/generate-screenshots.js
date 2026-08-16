import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// PENGATURAN KREDENSIAL (UBAH SEBELUM JALAN)
// ==========================================
const TEST_EMAIL = 'direktur.bumdespulodarat@gmail.com'; // <-- Masukkan Email Admin disini
const TEST_PASSWORD = 'bumdes2026'; // <-- Masukkan Password Admin disini
const APP_URL = 'https://bumdes-digital-iota.vercel.app';

const SCREENSHOT_DIR = path.join(__dirname, '..', 'public', 'screenshots');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🤖 Robot otomatis sedang menyiapkan Chrome...');
  
  if (!fs.existsSync(SCREENSHOT_DIR)){
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  
  try {
    // 1. HALAMAN LOGIN
    console.log('📸 Mengunjungi Halaman Login...');
    await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000); // Tunggu animasi selesai
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login.png') });
    console.log('✅ Screenshot Login tersimpan.');

    // LOGIN ACTION
    console.log(`🔑 Mencoba Login sebagai ${TEST_EMAIL}...`);
    // Tunggu input siap
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    
    // Klik tombol Masuk
    await page.click('button[type="submit"]');

    // Tunggu sampai URL berubah menjadi /admin (indikator berhasil)
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Berhasil masuk ke sistem.');
    await delay(3000); // Tunggu animasi loading grafik Dashboard selesai

    // 2. HALAMAN DASHBOARD
    console.log('📸 Mengambil Screenshot Dashboard...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard.png') });
    console.log('✅ Screenshot Dashboard tersimpan.');

    // 3. HALAMAN KASIR (POS)
    console.log('🚗 Menuju halaman Kasir (POS)...');
    await page.goto(`${APP_URL}/admin/kasir`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000); // Tunggu data dimuat
    console.log('📸 Mengambil Screenshot Kasir...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'kasir.png') });
    console.log('✅ Screenshot Kasir tersimpan.');

    // 4. HALAMAN AKUNTANSI
    console.log('🚗 Menuju halaman Akuntansi...');
    await page.goto(`${APP_URL}/admin/akuntansi`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    console.log('📸 Mengambil Screenshot Akuntansi...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'akuntansi.png') });
    console.log('✅ Screenshot Akuntansi tersimpan.');

    // 5. HALAMAN STOK (TAMBAH BARANG)
    console.log('🚗 Menuju halaman Stok...');
    await page.goto(`${APP_URL}/admin/stok`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    console.log('📝 Membuka modal Tambah Barang dan mengisi data...');
    // Klik tombol Tambah Barang (cari tombol yang teksnya mengandung "Tambah Barang")
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('Tambah Barang'));
      if (btn) btn.click();
    });
    await delay(1000); // tunggu modal muncul
    
    // Isi form Tambah Barang dengan data realistis
    // Selectors bedasarkan placeholder: "Kode (SKU)", "Nama Barang", "Stok", "HPP", "Harga Jual"
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const setInputValue = (input, value) => {
        if (!input) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };

      const inputSKU = inputs.find(i => i.placeholder === 'Kode (SKU)');
      const inputName = inputs.find(i => i.placeholder === 'Nama Barang');
      const inputStok = inputs.find(i => i.placeholder === 'Stok');
      const inputHPP = inputs.find(i => i.placeholder === 'HPP');
      const inputHarga = inputs.find(i => i.placeholder === 'Harga Jual');

      if(inputSKU) setInputValue(inputSKU, 'BRG-PUPUK-01');
      if(inputName) setInputValue(inputName, 'Pupuk Urea Non-Subsidi 50Kg');
      if(inputStok) setInputValue(inputStok, '25');
      if(inputHPP) setInputValue(inputHPP, '180000');
      if(inputHarga) setInputValue(inputHarga, '195000');
    });
    
    await delay(1000);
    console.log('📸 Mengambil Screenshot Form Tambah Barang...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'stok-tambah.png') });
    console.log('✅ Screenshot Stok Tambah tersimpan.');

    // 6. HALAMAN HUTANG PIUTANG (TAB PIUTANG)
    console.log('🚗 Menuju halaman Hutang Piutang...');
    await page.goto(`${APP_URL}/admin/hutang-piutang`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000); // tunggu data dimuat. default sudah di tab piutang.
    console.log('📸 Mengambil Screenshot Piutang...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'piutang.png') });
    console.log('✅ Screenshot Piutang tersimpan.');

    console.log('\n🎉 SEMUA TUGAS SELESAI!');
    console.log(`Silakan cek folder: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat robot bekerja:', error);
  } finally {
    await browser.close();
  }
}

run();
