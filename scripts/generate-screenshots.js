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
const APP_URL = 'http://localhost:5173';

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
    await page.goto(APP_URL);
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
    await page.goto(`${APP_URL}/admin/kasir`);
    await delay(2000); // Tunggu data dimuat
    console.log('📸 Mengambil Screenshot Kasir...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'kasir.png') });
    console.log('✅ Screenshot Kasir tersimpan.');

    // 4. HALAMAN AKUNTANSI
    console.log('🚗 Menuju halaman Akuntansi...');
    await page.goto(`${APP_URL}/admin/akuntansi`);
    await delay(2000);
    console.log('📸 Mengambil Screenshot Akuntansi...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'akuntansi.png') });
    console.log('✅ Screenshot Akuntansi tersimpan.');

    console.log('\n🎉 SEMUA TUGAS SELESAI!');
    console.log(`Silakan cek folder: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat robot bekerja:', error);
  } finally {
    await browser.close();
  }
}

run();
