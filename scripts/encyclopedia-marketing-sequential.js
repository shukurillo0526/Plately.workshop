const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\encyclopedia\\marketing';
const BASE_URL = 'https://theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[MKT Encyclopedia] ${description} -> ${filename}...`);
  const targetPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function safeStep(title, fn) {
  try {
    console.log(`\n========================================`);
    console.log(`>>> [MKT] EXECUTING: ${title}`);
    console.log(`========================================`);
    await fn();
    console.log(`>>> [MKT] FINISHED: ${title}`);
  } catch (err) {
    console.error(`>>> [MKT] ERROR in ${title}:`, err.message);
  }
}

async function main() {
  console.log('=== STARTING COMMERCIAL MARKETING ENCYCLOPEDIA AUDIT ===');
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

  // 1. HOME PAGE DEEP WALKTHROUGH
  await safeStep('1. Home Page & Modules', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '01a_home_hero_viewport.png', 'Marketing Hero Section with Dynamic CTA');

    // Scroll to Diner Simulator
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(1000);
    await captureScreen(page, '01b_home_diner_simulator.png', 'Interactive Diner App Simulator');

    // Scroll to KDS Simulator
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(1000);
    await captureScreen(page, '01c_home_kds_simulator.png', 'Interactive Workshop KDS Bump Simulator');

    // Scroll to Two Sides Engine
    await page.evaluate(() => window.scrollBy(0, 600));
    await sleep(1000);
    await captureScreen(page, '01d_home_two_sides_engine.png', 'Two Sides, One Engine Architecture Visualizer');

    // Scroll to iPhone Showroom
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2, h3, div')).find(e => e.textContent && e.textContent.includes('Plately in Your Pocket'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await sleep(2000);
    await captureScreen(page, '01e_home_showroom_screen0.png', 'Showroom: Screen 0 (Cook Explore)');

    // Step through showroom screens
    for (let i = 1; i <= 9; i++) {
      const clicked = await page.evaluate((targetIndex) => {
        const dots = document.querySelectorAll('button[aria-label*="Screen"], div:has(> button.rounded-full) button');
        if (dots.length > targetIndex) {
          dots[targetIndex].click();
          return true;
        }
        return false;
      }, i);
      if (clicked) {
        await sleep(1000);
        await captureScreen(page, `01_showroom_screen_${i}.png`, `Showroom: Screen ${i}`);
      }
    }

    // Scroll to Calculator
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h2, h3, div')).find(e => e.textContent && e.textContent.includes('Calculate Your Waste Savings'));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await sleep(2000);
    await captureScreen(page, '01o_home_calculator_initial.png', 'Waste Calculator Initial State (Family of 4)');

    // Move sliders
    const sliders = await page.$$('input[type="range"]');
    if (sliders.length >= 2) {
      await sliders[0].evaluate((el) => { el.value = '6'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await sleep(400);
      await sliders[1].evaluate((el) => { el.value = '320'; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await sleep(800);
      await captureScreen(page, '01p_home_calculator_recalculated.png', 'Waste Calculator Recalculated for Family of 6 @ $320/wk');
    }

    // Scroll to Testimonials
    await page.evaluate(() => window.scrollBy(0, 800));
    await sleep(1000);
    await captureScreen(page, '01q_home_testimonials.png', 'Customer and Restaurant Partner Testimonials');

    // Scroll to Footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    await captureScreen(page, '01r_home_footer.png', 'Marketing Footer, Language and Legal Links');
  });

  // 2. SUBPAGES SEQUENTIAL AUDIT
  const pages = [
    { route: '/features', file: '02a_features_hub.png', desc: 'Features Deep Dive Hub' },
    { route: '/solutions', file: '03a_solutions_page.png', desc: 'Solutions for Diners and Kitchens' },
    { route: '/how-it-works', file: '04a_how_it_works.png', desc: 'Closed Loop Workflow' },
    { route: '/ecosystem', file: '05a_ecosystem_architecture.png', desc: 'Enterprise Architecture & IoT Roadmap' },
    { route: '/pricing', file: '06a_pricing_matrix.png', desc: 'Tiered Pricing Matrix' },
    { route: '/about', file: '07a_about_founders.png', desc: 'Founders Mission & Sustainable Vision' },
    { route: '/faq', file: '08a_faq_knowledgebase.png', desc: 'FAQ Accordion Knowledge Base' },
    { route: '/workshop', file: '09a_workshop_sales.png', desc: 'Workshop B2B SaaS Sales Landing Page' },
  ];

  for (const p of pages) {
    await safeStep(`Subpage: ${p.route}`, async () => {
      await page.goto(`${BASE_URL}${p.route}`, { waitUntil: 'networkidle2', timeout: 30000 });
      await sleep(2000);
      await captureScreen(page, p.file, p.desc);
    });
  }

  console.log('=== COMMERCIAL MARKETING ENCYCLOPEDIA AUDIT COMPLETED ===');
  await browser.close();
}

main().catch(console.error);
