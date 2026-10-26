const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSHOP_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\workshop';
const BASE_URL = 'https://workshop.theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Capture Workshop] ${description} -> ${filename}...`);
  const targetPath = path.join(WORKSHOP_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function main() {
  console.log('=== STARTING EXHAUSTIVE WORKSHOP OS AUDIT ===');
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
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`  [BROWSER ERROR] ${msg.text()}`);
      errors.push({ type: 'console', text: msg.text() });
    }
  });

  page.on('pageerror', (err) => {
    console.log(`  [PAGE ERROR] ${err.message}`);
    errors.push({ type: 'pageerror', text: err.message });
  });

  try {
    // 1. Login
    console.log(`Navigating to ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await captureScreen(page, 'ws_01_login.png', 'Workshop Login Screen');

    await page.type('input[type="email"]', 'demo@plately.app');
    await page.type('input[placeholder="Enter your password"]', '12345678');
    await sleep(500);
    await page.click('button[type="submit"]');
    console.log('Submitted login credentials. Waiting for dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);

    // 2. Dashboard
    console.log('Checking Dashboard...');
    await captureScreen(page, 'ws_02_dashboard.png', 'Dashboard Command Center');

    // 3. Menu Management
    console.log('Navigating to /menu...');
    await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_03_menu_all.png', 'Menu All Items');

    // Try clicking a menu category tab if present
    try {
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const catBtn = btns.find((b) => b.innerText.includes('Main') || b.innerText.includes('Appetizer') || b.innerText.includes('Salads') || b.innerText.includes('Drinks'));
        if (catBtn) catBtn.click();
      });
      await sleep(1000);
      await captureScreen(page, 'ws_03b_menu_filtered.png', 'Menu Filtered Category');
    } catch (e) {
      console.log('  Menu category toggle skipped:', e.message);
    }

    // 4. Orders
    console.log('Navigating to /orders...');
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_04_orders_active.png', 'Orders Stream');

    // 5. Kitchen Display System (KDS)
    console.log('Navigating to /kds...');
    await page.goto(`${BASE_URL}/kds`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_05_kds_board.png', 'Realtime Kitchen Display System');

    // 6. Reservations & Floor Plan
    console.log('Navigating to /reservations...');
    await page.goto(`${BASE_URL}/reservations`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_06_reservations_floorplan.png', 'Floor Plan & Reservations');

    // 7. Website Studio
    console.log('Navigating to /website...');
    await page.goto(`${BASE_URL}/website`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3500);
    await captureScreen(page, 'ws_07_website_studio.png', 'AI Website Studio Canvas');

    // 8. Dispatch & Noor Logistics
    console.log('Navigating to /dispatch...');
    await page.goto(`${BASE_URL}/dispatch`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_08_dispatch_radar.png', 'Dispatch Radar & Courier Fleet');

    // 9. Customers CRM
    console.log('Navigating to /customers...');
    await page.goto(`${BASE_URL}/customers`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_09_customers_crm.png', 'Customer CRM & Guest History');

    // 10. Analytics
    console.log('Navigating to /analytics...');
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_10_analytics_dashboard.png', 'Financials & Sales Analytics');

    // 11. Marketing
    console.log('Navigating to /marketing...');
    await page.goto(`${BASE_URL}/marketing`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_11_marketing_campaigns.png', 'Marketing & Promotions');

    // 12. Voice Assistant
    console.log('Navigating to /voice...');
    await page.goto(`${BASE_URL}/voice`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_12_voice_agent.png', 'Voice Orders & AI Agent');

    // 13. Autonomous Kitchen Agents
    console.log('Navigating to /agents...');
    await page.goto(`${BASE_URL}/agents`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_13_autonomous_agents.png', 'Autonomous Shift Briefing Agents');

    // 14. Settings
    console.log('Navigating to /settings...');
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_14_settings_general.png', 'Restaurant General Settings');

    // Scroll down to check domain verification in settings
    try {
      await page.evaluate(() => {
        window.scrollBy(0, 600);
      });
      await sleep(1000);
      await captureScreen(page, 'ws_14b_settings_domains.png', 'Domains & DNS Settings');
    } catch (e) {
      console.log('  Settings scroll skipped:', e.message);
    }

    // 15. Onboarding Wizard
    console.log('Navigating to /onboarding...');
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'ws_15_onboarding_wizard.png', 'Branch Onboarding Wizard');

    // 16. Storefront (Kamolon Osh Markazi)
    console.log(`Navigating to ${BASE_URL}/store/kamolon-osh-markazi...`);
    await page.goto(`${BASE_URL}/store/kamolon-osh-markazi`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await captureScreen(page, 'ws_16_storefront_kamolon.png', 'Public Storefront Hero');

    // Scroll down storefront to view menu
    await page.evaluate(() => window.scrollBy(0, 800));
    await sleep(1000);
    await captureScreen(page, 'ws_16b_storefront_menu.png', 'Storefront Online Menu');

    console.log('=== WORKSHOP OS AUDIT COMPLETE ===');
    console.log(`Total captured: 18 screens.`);
    console.log(`Recorded errors: ${errors.length}`);
    fs.writeFileSync(
      path.join(WORKSHOP_DIR, 'workshop-audit-log.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), errors, screens: 18 }, null, 2)
    );
  } catch (err) {
    console.error('Fatal error during Workshop audit:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
