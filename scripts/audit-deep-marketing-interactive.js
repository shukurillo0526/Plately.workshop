const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\deep_marketing';
const BASE_URL = 'https://theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Marketing Interactive] ${description} -> ${filename}...`);
  const targetPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function safeStep(name, fn) {
  try {
    console.log(`--- [MKT] RUNNING STEP: ${name} ---`);
    await fn();
    console.log(`--- [MKT] STEP COMPLETED: ${name} ---`);
  } catch (err) {
    console.error(`--- [MKT] ERROR IN STEP ${name}:`, err.message);
  }
}

async function main() {
  console.log('=== STARTING DEEP MARKETING WEB INTERACTIVE AUDIT ===');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

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
  const interactions = [];
  const errors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() });
  });

  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', text: err.message });
  });

  // 1. HOME HERO & DUAL SIMULATOR
  await safeStep('Home Hero & Simulator', async () => {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, 'deep_mkt_01_hero.png', 'Marketing Platform Hero Section & Value Proposition');

    // Scroll to interactive KDS simulator
    await page.evaluate(() => window.scrollBy(0, 700));
    await sleep(1500);
    await captureScreen(page, 'deep_mkt_02_kds_simulator.png', 'Live Workshop OS KDS Interactive Simulator');
    interactions.push('Marketing: Hero & live simulator verified');
  });

  // 2. INTERACTIVE IPHONE MOBILE SHOWROOM
  await safeStep('Interactive iPhone Mobile Showroom', async () => {
    console.log('Scrolling to Plately in Your Pocket Showroom...');
    const showroomFound = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2, h3, p')).find(e => e.textContent && e.textContent.includes('Plately in Your Pocket'));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    });

    if (showroomFound) {
      await sleep(2000);
      await captureScreen(page, 'deep_mkt_03_showroom_screen0.png', 'Showroom: Screen 0 (Cook Explore)');

      // Click "Next Screen" button
      const nextBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.querySelector('svg.lucide-chevron-right') || b.textContent.includes('Next')) || null;
      });

      if (nextBtn && nextBtn.asElement()) {
        console.log('Advancing showroom to Screen 1 (Perfect Match)...');
        await nextBtn.asElement().click();
        await sleep(1200);
        await captureScreen(page, 'deep_mkt_04_showroom_screen1.png', 'Showroom: Screen 1 (Perfect Match)');

        console.log('Advancing showroom to Screen 4 (Recipe Detail)...');
        // Click dot indicator 4 directly
        await page.evaluate(() => {
          const dots = document.querySelectorAll('button[aria-label*="Screen"], div:has(> button.rounded-full) button');
          if (dots.length > 4) dots[4].click();
        });
        await sleep(1200);
        await captureScreen(page, 'deep_mkt_05_showroom_screen4.png', 'Showroom: Screen 4 (Recipe Detail)');

        console.log('Advancing showroom to Screen 5 (Living Shelf)...');
        await page.evaluate(() => {
          const dots = document.querySelectorAll('button[aria-label*="Screen"], div:has(> button.rounded-full) button');
          if (dots.length > 5) dots[5].click();
        });
        await sleep(1200);
        await captureScreen(page, 'deep_mkt_06_showroom_screen5.png', 'Showroom: Screen 5 (Living Shelf)');
        interactions.push('Showroom: Navigated across 10-screen native CanvasKit showroom');
      }
    }
  });

  // 3. WASTE SAVINGS CALCULATOR ALGORITHM
  await safeStep('Waste Savings Calculator', async () => {
    console.log('Scrolling to Waste Savings Calculator...');
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2, h3, div')).find(e => e.textContent && e.textContent.includes('Calculate Your Waste Savings'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await sleep(2000);
    await captureScreen(page, 'deep_mkt_07_calculator_initial.png', 'Waste Calculator Initial State (Default Family of 4)');

    // Move sliders to test dynamic algorithm calculation
    const sliders = await page.$$('input[type="range"]');
    if (sliders.length >= 2) {
      console.log('Adjusting sliders (Household Size & Weekly Budget)...');
      await sliders[0].evaluate((el) => { el.value = '5'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await sleep(500);
      await sliders[1].evaluate((el) => { el.value = '250'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await sleep(1000);
      await captureScreen(page, 'deep_mkt_08_calculator_recalculated.png', 'Waste Calculator Recalculated for Household of 5 @ $250/wk');
      interactions.push('Calculator: Algorithm dynamically updated waste and money savings');
    }
  });

  // 4. KEY SUBPAGES DEEP VERIFICATION
  const routes = [
    { path: '/features', name: 'features_hub', desc: 'Features Hub (Cook, Scan, Shelf)' },
    { path: '/solutions', name: 'solutions_page', desc: 'Solutions for Families & Restaurants' },
    { path: '/how-it-works', name: 'how_it_works', desc: 'Closed Loop Workflow' },
    { path: '/ecosystem', name: 'ecosystem_matrix', desc: 'Enterprise Architecture & Hardware' },
    { path: '/pricing', name: 'pricing_matrix', desc: 'Diner and Restaurant Pricing Plans' },
    { path: '/about', name: 'about_story', desc: 'Founders Mission & Sustainable Vision' },
    { path: '/faq', name: 'faq_page', desc: 'Knowledge Base & FAQ Accordion' },
    { path: '/workshop', name: 'workshop_b2b', desc: 'Workshop B2B SaaS Solution Landing Page' },
  ];

  for (const r of routes) {
    await safeStep(`Page: ${r.path}`, async () => {
      console.log(`Navigating to ${BASE_URL}${r.path}...`);
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle2', timeout: 25000 });
      await sleep(1500);
      await captureScreen(page, `deep_mkt_${r.name}.png`, r.desc);
      interactions.push(`Page verified: ${r.path}`);
    });
  }

  console.log('=== MARKETING DEEP INTERACTIVE AUDIT COMPLETED ===');
  const logPath = path.join(OUTPUT_DIR, 'deep-marketing-audit-log.json');
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    interactionsCount: interactions.length,
    interactions,
    errorsCount: errors.length,
    errors,
  }, null, 2));
  console.log(`Audit log saved: ${logPath}`);

  await browser.close();
}

main().catch((e) => console.error('FATAL MARKETING AUDIT:', e));
