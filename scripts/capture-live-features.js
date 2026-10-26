const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots';
const WEB_PREVIEWS_DIR = 'd:\\dev\\projects\\Plately\\Plately.web\\public\\previews';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveScreenshot(page, filename, description) {
  console.log(`[Capture] ${description} -> ${filename}...`);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const webPath = path.join(WEB_PREVIEWS_DIR, filename);

  await page.screenshot({ path: artifactPath, fullPage: false });
  fs.copyFileSync(artifactPath, webPath);
  console.log(`  Saved to ${artifactPath} and ${webPath}`);
}

async function main() {
  console.log('Launching Chrome via Puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  try {
    // 1. Visit Login Page
    console.log(`Navigating to ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await saveScreenshot(page, '01_workshop_login.png', 'Workshop Login Screen');

    // 2. Perform Login
    console.log('Filling in credentials demo@plately.app / 12345678...');
    await page.type('input[type="email"]', 'demo@plately.app');
    await page.type('input[placeholder="Enter your password"]', '12345678');
    await sleep(500);

    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    ]);

    await sleep(4000);
    console.log(`Current URL after login: ${page.url()}`);
    await saveScreenshot(page, '02_workshop_dashboard.png', 'Merchant Dashboard Overview');

    // 3. Menu Management
    console.log(`Navigating to ${BASE_URL}/menu...`);
    await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '03_workshop_menu.png', 'Menu Catalog & Pricing Management');

    // 4. Orders Management
    console.log(`Navigating to ${BASE_URL}/orders...`);
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '04_workshop_orders.png', 'Live Orders Management');

    // 5. Kitchen Display System (KDS)
    console.log(`Navigating to ${BASE_URL}/kds...`);
    await page.goto(`${BASE_URL}/kds`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '05_workshop_kds.png', 'Kitchen Display System');

    // 6. Reservations
    console.log(`Navigating to ${BASE_URL}/reservations...`);
    await page.goto(`${BASE_URL}/reservations`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '06_workshop_reservations.png', 'Table Booking & Floor Reservations');

    // 7. Website Builder
    console.log(`Navigating to ${BASE_URL}/website...`);
    await page.goto(`${BASE_URL}/website`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '07_workshop_website_builder.png', 'Online Storefront & Website Builder');

    // 8. Settings & Custom Domains
    console.log(`Navigating to ${BASE_URL}/settings...`);
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '08_workshop_settings_domains.png', 'Settings & Custom Domains Panel');

    // 9. Storefront preview (Kamolon)
    console.log(`Navigating to ${BASE_URL}/store/kamolon-b87695...`);
    await page.goto(`${BASE_URL}/store/kamolon-b87695`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '09_storefront_kamolon.png', 'Kamolon Public Online Storefront');

    // 10. ThePlately.com Homepage
    console.log('Navigating to https://theplately.com...');
    await page.goto('https://theplately.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await saveScreenshot(page, '10_theplately_home.png', 'ThePlately Marketing Home');

    // 11. App.ThePlately.com Consumer Web
    console.log('Navigating to https://app.theplately.com...');
    await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(4000);
    await saveScreenshot(page, '11_consumer_app_web.png', 'Consumer App Web Experience');

    console.log('\nAll 11 screenshots captured and saved successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
