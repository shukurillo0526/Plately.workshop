const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MARKETING_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\marketing';
const BASE_URL = 'https://theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Capture Marketing] ${description} -> ${filename}...`);
  const targetPath = path.join(MARKETING_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function main() {
  console.log('=== STARTING EXHAUSTIVE MARKETING PLATFORM AUDIT ===');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() });
  });
  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', text: err.message });
  });

  try {
    // 1. Home - Hero
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await captureScreen(page, 'mkt_01_home_hero.png', 'Home Hero & Interactive Diner App');

    // 2. Switch hero simulator to Workshop Kitchen OS
    console.log('Switching hero simulator to Restaurant Workshop OS...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const wsBtn = btns.find((b) => b.innerText.includes('Restaurant Workshop OS'));
      if (wsBtn) wsBtn.click();
    });
    await sleep(1500);
    await captureScreen(page, 'mkt_02_home_workshop_simulator.png', 'Home Hero: Workshop OS KDS Simulator');

    // 3. Scroll to Ecosystem section
    console.log('Scrolling to Ecosystem story section...');
    await page.evaluate(() => {
      const el = document.getElementById('ecosystem-story');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_03_home_ecosystem.png', 'Home: Two Sides One Engine');

    // 4. Scroll to Mobile Showroom
    console.log('Scrolling to Mobile Showroom section...');
    await page.evaluate(() => {
      const el = document.getElementById('mobile-experience');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_04_home_mobile_showroom.png', 'Home: Mobile Consumer App Showroom');

    // 5. Scroll to Key Benefits
    console.log('Scrolling to Key Benefits...');
    await page.evaluate(() => {
      const el = document.getElementById('key-benefits');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_05_home_key_benefits.png', 'Home: Household Benefits Grid');

    // 6. Scroll to Savings Calculator
    console.log('Scrolling to Savings Calculator...');
    await page.evaluate(() => {
      const el = document.getElementById('savings-calculator');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_06_home_calculator.png', 'Home: Waste Savings Calculator');

    // 7. Scroll to Testimonials
    console.log('Scrolling to Testimonials...');
    await page.evaluate(() => {
      const el = document.getElementById('trust-testimonials');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_07_home_testimonials.png', 'Home: Trust & Testimonials');

    // Helper to click navbar buttons
    async function navigateNav(pageName) {
      console.log(`Navigating to ${pageName}...`);
      await page.evaluate((name) => {
        const btns = Array.from(document.querySelectorAll('header nav button'));
        const btn = btns.find((b) => b.innerText.toLowerCase().includes(name.toLowerCase()));
        if (btn) btn.click();
      }, pageName);
      await sleep(2500);
    }

    // 8. Features Page
    await navigateNav('features');
    await captureScreen(page, 'mkt_08_features_cook.png', 'Features: Cook Mode Tab');

    // Features - Scan tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const scanBtn = btns.find((b) => b.innerText.includes('Scan & Digitize'));
      if (scanBtn) scanBtn.click();
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_09_features_scan.png', 'Features: Scan & Digitize Tab');

    // Features - Living Shelf tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const shelfBtn = btns.find((b) => b.innerText.includes('Living Shelf'));
      if (shelfBtn) shelfBtn.click();
    });
    await sleep(1200);
    await captureScreen(page, 'mkt_10_features_shelf.png', 'Features: Dynamic Living Shelf Tab');

    // 9. Solutions Page
    await navigateNav('solutions');
    await captureScreen(page, 'mkt_11_solutions.png', 'Solutions: Use Cases Page');

    // 10. How It Works
    await navigateNav('how it works');
    await captureScreen(page, 'mkt_12_how_it_works.png', 'How It Works: Closed-Loop Food Flow');

    // 11. Ecosystem Page
    await navigateNav('roadmap');
    await captureScreen(page, 'mkt_13_ecosystem.png', 'Ecosystem Architecture & Strategic Roadmap');

    // 12. Pricing Page
    await navigateNav('pricing');
    await captureScreen(page, 'mkt_14_pricing.png', 'Pricing Plans: Diners & Restaurants');

    // 13. Founder Story (About)
    await navigateNav('story');
    await captureScreen(page, 'mkt_15_about_story.png', 'About Us & Founder Mission');

    // 14. FAQ Page
    await navigateNav('faq');
    await captureScreen(page, 'mkt_16_faq.png', 'FAQ Knowledge Base');

    // 15. Workshop B2B Product Page
    console.log('Navigating to Workshop B2B product page...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('header button'));
      const wsBtn = btns.find((b) => b.innerText.includes('Workshop B2B') || b.innerText.includes('Restaurant OS'));
      if (wsBtn) wsBtn.click();
    });
    await sleep(2500);
    await captureScreen(page, 'mkt_17_workshop_page.png', 'Workshop B2B OS Product Page');

    console.log('=== MARKETING AUDIT COMPLETE ===');
    console.log(`Recorded errors: ${errors.length}`);
    fs.writeFileSync(
      path.join(MARKETING_DIR, 'marketing-audit-log.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), errors, screens: 17 }, null, 2)
    );
  } catch (err) {
    console.error('Fatal error during Marketing audit:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
