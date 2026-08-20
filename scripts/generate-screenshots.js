import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const EMAIL = process.env.BUMDES_EMAIL;
const PASSWORD = process.env.BUMDES_PASSWORD;
const SCREENSHOT_DIR = path.resolve(__dirname, '../public/screenshots');

async function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function run() {
  console.log('🚀 Memulai proses screenshot otomatis...');

  if (!EMAIL || !PASSWORD) {
    console.error('❌ ERROR: Anda harus menyediakan BUMDES_EMAIL dan BUMDES_PASSWORD sebagai environment variables.');
    console.error('Contoh: set BUMDES_EMAIL=admin@bumdes.com && set BUMDES_PASSWORD=rahasia && node scripts/generate-screenshots.js');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  try {
    // 1. Halaman Login
    console.log(`Buka ${APP_URL}/login ...`);
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });
    await delay(1000); // Tunggu animasi selesai
    console.log('📸 Mengambil screenshot: login.png');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login.png') });

    // Login proses
    console.log('🔑 Melakukan login...');
    await page.type('input[type="email"]', EMAIL);
    await page.type('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Tunggu sampai navigasi ke dashboard sukses (URL berubah atau elemen dashboard muncul)
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await delay(2000); // Tunggu data selesai di-fetch

    // 2. Dashboard
    console.log('📸 Mengambil screenshot: dashboard.png');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'dashboard.png') });

    // 3. Kasir (POS)
    console.log('Buka Kasir...');
    await page.goto(`${APP_URL}/admin/kasir`, { waitUntil: 'networkidle2' });
    await delay(2000);
    console.log('📸 Mengambil screenshot: kasir.png');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'kasir.png') });

    // 4. Tabel Piutang
    console.log('Buka Hutang Piutang...');
    await page.goto(`${APP_URL}/admin/hutang-piutang`, { waitUntil: 'networkidle2' });
    await delay(2000);
    console.log('📸 Mengambil screenshot: piutang.png');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'piutang.png') });

    // 5. Akuntansi
    console.log('Buka Akuntansi...');
    await page.goto(`${APP_URL}/admin/akuntansi`, { waitUntil: 'networkidle2' });
    await delay(2000);
    console.log('📸 Mengambil screenshot: akuntansi.png');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'akuntansi.png') });

    // 6. Form Tambah Stok
    console.log('Buka Stok Barang...');
    await page.goto(`${APP_URL}/admin/stok`, { waitUntil: 'networkidle2' });
    await delay(2000);
    // Mencoba klik tombol "Tambah Barang"
    // Mencoba klik tombol "Tambah Barang"
    try {
      const buttonHandle = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tambah Barang'));
      });
      if (buttonHandle) {
        await buttonHandle.click();
        await delay(1000); // Tunggu modal terbuka
      }
    } catch (e) {
      console.log('Gagal klik tombol Tambah Barang (mungkin class berubah), lanjut screenshot halaman stok biasa.');
    }
    console.log('📸 Mengambil screenshot: stok-tambah.png');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'stok-tambah.png') });

    console.log('✅ Selesai! Semua screenshot telah diperbarui di folder public/screenshots/');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat generate screenshot:', error);
  } finally {
    await browser.close();
  }
}

run();
