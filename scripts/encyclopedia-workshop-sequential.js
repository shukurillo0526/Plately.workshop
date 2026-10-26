const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\encyclopedia\\workshop';
const BASE_URL = 'https://workshop.theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Workshop Encyclopedia] ${description} -> ${filename}...`);
  const targetPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function safeStep(title, fn) {
  try {
    console.log(`\n========================================`);
    console.log(`>>> EXECUTING: ${title}`);
    console.log(`========================================`);
    await fn();
    console.log(`>>> FINISHED: ${title}`);
  } catch (err) {
    console.error(`>>> ERROR in ${title}:`, err.message);
  }
}

async function main() {
  console.log('=== STARTING WORKSHOP ENCYCLOPEDIA AUDIT ===');
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
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  const logEntries = [];

  // ========================================================
  // 1. AUTHENTICATION & LOGIN FLOW
  // ========================================================
  await safeStep('1. Auth & Login Flow', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await captureScreen(page, '01a_auth_login_clean.png', 'Workshop Login Screen (Clean State)');

    // Attempt empty submit to inspect validation UX
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await sleep(600);
      await captureScreen(page, '01b_auth_validation_state.png', 'Workshop Login (HTML5 & Form Validation)');
    }

    // Type credentials
    await page.type('input[type="email"]', 'demo@plately.app', { delay: 20 });
    await page.type('input[placeholder="Enter your password"]', '12345678', { delay: 20 });
    await sleep(600);
    await captureScreen(page, '01c_auth_credentials_filled.png', 'Workshop Login (Credentials Populated)');

    // Submit
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
    }
    await sleep(2500);

    // Signup page check
    const signupPage = await browser.newPage();
    await signupPage.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await captureScreen(signupPage, '01d_auth_signup_page.png', 'Workshop Partner Registration / Signup Portal');
    await signupPage.close();
  });

  // ========================================================
  // 2. DASHBOARD / COMMAND CENTER
  // ========================================================
  await safeStep('2. Dashboard / Command Center', async () => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '02a_dashboard_command_center.png', 'Command Center: Full Executive Overview');

    // Metrics Ribbon Zoom
    const metricsRibbon = await page.$('div.grid:has(> div:has-text("Revenue"))');
    if (metricsRibbon) {
      await captureScreen(page, '02b_dashboard_metrics_ribbon.png', 'Command Center: Financial & Operational KPI Cards');
    }

    // Reservations Widget
    await page.evaluate(() => window.scrollBy(0, 400));
    await sleep(800);
    await captureScreen(page, '02c_dashboard_reservations_widget.png', 'Command Center: Today Reservations Stream');

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(500);
  });

  // ========================================================
  // 3. KITCHEN DISPLAY SYSTEM (KDS)
  // ========================================================
  await safeStep('3. Kitchen Display System (KDS)', async () => {
    await page.goto(`${BASE_URL}/kds`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '03a_kds_board_full.png', 'KDS: 4-Column Real-time Production Board');

    // Sound toggle
    const soundBtn = await page.$('button[title*="Sound alerts"]');
    if (soundBtn) {
      await soundBtn.click();
      await sleep(500);
      await captureScreen(page, '03b_kds_sound_alert_active.png', 'KDS: Sound Alert Status Active (Chime Enabled)');
    }

    // Auto-accept toggle
    const autoAcceptLabel = await page.$('label[for="auto-accept"]');
    if (autoAcceptLabel) {
      await autoAcceptLabel.click();
      await sleep(500);
      await captureScreen(page, '03c_kds_auto_accept_active.png', 'KDS: Auto-Accept Incoming Tickets Active');
    }

    // Bump first ticket
    const bumpBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && (b.textContent.includes('Start Cooking') || b.textContent.includes('Preparing') || b.textContent.includes('Bump'))) || null;
    });
    if (bumpBtn && bumpBtn.asElement()) {
      await bumpBtn.asElement().click();
      await sleep(1500);
      await captureScreen(page, '03d_kds_ticket_bumped_preparing.png', 'KDS: Ticket Bumped to Preparing Cooking Station');
    }

    // Print Receipt Modal
    const printBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.title && b.title.includes('Print') || b.querySelector('svg.lucide-printer')) || null;
    });
    if (printBtn && printBtn.asElement()) {
      await printBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '03e_kds_thermal_print_modal.png', 'KDS: Thermal Receipt Print Preview Modal');
      await page.keyboard.press('Escape');
      await sleep(500);
    }
  });

  // ========================================================
  // 4. MENU MANAGEMENT
  // ========================================================
  await safeStep('4. Menu Management & Categories', async () => {
    await page.goto(`${BASE_URL}/menu`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '04a_menu_all_items.png', 'Menu: All Catalog Items');

    // Category Tabs: Mains, Soups, Salads
    const categories = ['Main', 'Soups', 'Salads', 'Desserts', 'Drinks'];
    for (const cat of categories) {
      const catBtn = await page.evaluateHandle((c) => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.includes(c)) || null;
      }, cat);
      if (catBtn && catBtn.asElement()) {
        await catBtn.asElement().click();
        await sleep(800);
        await captureScreen(page, `04b_menu_cat_${cat.toLowerCase()}.png`, `Menu Category: ${cat}`);
      }
    }

    // Search filter
    const searchInput = await page.$('input[placeholder*="Search dishes"]');
    if (searchInput) {
      await searchInput.type('Osh');
      await sleep(800);
      await captureScreen(page, '04c_menu_search_osh.png', 'Menu: Live Search Filter for "Osh"');
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Search dishes"]');
        if (input) input.value = '';
      });
      await sleep(400);
    }

    // Add Dish Modal
    const addDishBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Add Dish')) || null;
    });
    if (addDishBtn && addDishBtn.asElement()) {
      await addDishBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '04d_menu_add_dish_modal_empty.png', 'Menu: Add Dish Modal (Form Fields)');

      const nameInput = await page.$('input[placeholder*="dish name" i], input[name="name"], div[role="dialog"] input');
      if (nameInput) await nameInput.type('Khorezmian Tukhum Barak');

      const priceInput = await page.$('input[type="number"], input[name="price"]');
      if (priceInput) await priceInput.type('42000');

      await sleep(600);
      await captureScreen(page, '04e_menu_add_dish_modal_filled.png', 'Menu: Add Dish Modal (Populated with Khorezmian Specialty)');
      await page.keyboard.press('Escape');
      await sleep(500);
    }
  });

  // ========================================================
  // 5. ORDERS PIPELINE
  // ========================================================
  await safeStep('5. Orders Pipeline & Status Filters', async () => {
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '05a_orders_all_history.png', 'Orders Pipeline: All Historical & Active Orders');

    const statuses = ['confirmed', 'preparing', 'ready', 'dispatched', 'completed'];
    for (const st of statuses) {
      const stBtn = await page.evaluateHandle((s) => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.trim().toLowerCase() === s) || null;
      }, st);
      if (stBtn && stBtn.asElement()) {
        await stBtn.asElement().click();
        await sleep(800);
        await captureScreen(page, `05b_orders_filter_${st}.png`, `Orders Filtered by Status: ${st.toUpperCase()}`);
      }
    }
  });

  // ========================================================
  // 6. RESERVATIONS & 2D FLOOR PLAN
  // ========================================================
  await safeStep('6. Reservations & 2D Floor Plan', async () => {
    await page.goto(`${BASE_URL}/reservations`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '06a_reservations_floorplan_view.png', 'Reservations: 2D Table Architecture Floor Plan');

    // Click on a table
    const tableEl = await page.$('div:has(> span:has-text("T-")), div[data-table]');
    if (tableEl) {
      await tableEl.click();
      await sleep(800);
      await captureScreen(page, '06b_reservations_table_popover.png', 'Reservations: Table Detail & Occupancy Popover');
    }

    // New Reservation Modal
    const newResBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && (b.textContent.includes('New Reservation') || b.textContent.includes('Book Table'))) || null;
    });
    if (newResBtn && newResBtn.asElement()) {
      await newResBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '06c_reservations_booking_modal.png', 'Reservations: Table Booking Dialog with Party & Time');
      await page.keyboard.press('Escape');
      await sleep(500);
    }
  });

  // ========================================================
  // 7. AI WEBSITE STUDIO
  // ========================================================
  await safeStep('7. AI Website Studio & Viewports', async () => {
    await page.goto(`${BASE_URL}/website`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '07a_website_studio_desktop.png', 'Website Studio: Split Canvas Desktop Viewport');

    // Switch to Tablet preview
    const tabletBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.querySelector('svg.lucide-tablet') || (b.title && b.title.includes('Tablet'))) || null;
    });
    if (tabletBtn && tabletBtn.asElement()) {
      await tabletBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '07b_website_studio_tablet.png', 'Website Studio: Tablet Responsive Viewport');
    }

    // Switch to Mobile preview
    const mobileBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.querySelector('svg.lucide-smartphone') || (b.title && b.title.includes('Mobile'))) || null;
    });
    if (mobileBtn && mobileBtn.asElement()) {
      await mobileBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '07c_website_studio_mobile.png', 'Website Studio: Mobile Smartphone Viewport');
    }

    // AI Command Bar
    const aiPrompt = await page.$('input[placeholder*="Ask AI" i], textarea[placeholder*="Ask AI" i], input[placeholder*="command" i]');
    if (aiPrompt) {
      await aiPrompt.type('Switch accent to Samarkand Turquoise with festive Ramadan banner');
      await sleep(600);
      await captureScreen(page, '07d_website_studio_ai_prompt.png', 'Website Studio: Generative AI Command Bar');
    }
  });

  // ========================================================
  // 8. NOOR 3PL DISPATCH RADAR
  // ========================================================
  await safeStep('8. Noor 3PL Dispatch Radar', async () => {
    await page.goto(`${BASE_URL}/dispatch`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '08a_dispatch_radar_couriers.png', 'Dispatch Radar: Courier Fleet Proximity & Status');

    // Distance input test (3km vs 15km)
    const distInput = await page.$('input[type="number"], input[type="range"]');
    if (distInput) {
      await distInput.click({ clickCount: 3 });
      await distInput.type('14.2');
      await sleep(800);
      await captureScreen(page, '08b_dispatch_fee_14km.png', 'Dispatch Radar: Dynamic Noor Fee Calculated for 14.2 km');
    }
  });

  // ========================================================
  // 9. CUSTOMERS CRM
  // ========================================================
  await safeStep('9. Customers CRM', async () => {
    await page.goto(`${BASE_URL}/customers`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '09a_customers_crm_directory.png', 'Customers CRM: Guest Directory & Spending Summary');

    const customerRow = await page.$('tbody tr, div[role="row"]');
    if (customerRow) {
      await customerRow.click();
      await sleep(1000);
      await captureScreen(page, '09b_customers_crm_drawer.png', 'Customers CRM: Guest Lifetime Profile Drawer');
    }
  });

  // ========================================================
  // 10. MARKETING & PROMOTIONS
  // ========================================================
  await safeStep('10. Marketing Campaigns', async () => {
    await page.goto(`${BASE_URL}/marketing`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '10a_marketing_campaigns_list.png', 'Marketing: Active Promotional Discounts & Codes');

    const createPromoBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && (b.textContent.includes('New Promo') || b.textContent.includes('Create Campaign') || b.textContent.includes('Add Promo'))) || null;
    });
    if (createPromoBtn && createPromoBtn.asElement()) {
      await createPromoBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '10b_marketing_create_promo_modal.png', 'Marketing: Create Promo Code Dialog');
      await page.keyboard.press('Escape');
      await sleep(500);
    }
  });

  // ========================================================
  // 11. ANALYTICS & FINANCIALS
  // ========================================================
  await safeStep('11. Analytics & Financials', async () => {
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '11a_analytics_financial_overview.png', 'Analytics: Financial Metrics, Gross Margins & Trends');

    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(800);
    await captureScreen(page, '11b_analytics_charts_heatmap.png', 'Analytics: Hourly Sales Heatmap and Top Selling Dishes');
  });

  // ========================================================
  // 12. AI VOICE CALL ORDERING
  // ========================================================
  await safeStep('12. AI Voice Calls', async () => {
    await page.goto(`${BASE_URL}/voice`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '12a_voice_calls_overview.png', 'Voice Calls: AI Telephony Order Agent Logs');

    const callLogItem = await page.$('div:has(> svg.lucide-phone), div[role="button"]:has(span)');
    if (callLogItem) {
      await callLogItem.click();
      await sleep(1000);
      await captureScreen(page, '12b_voice_call_transcript_waveform.png', 'Voice Calls: Call Transcript and Audio Waveform');
    }
  });

  // ========================================================
  // 13. AUTONOMOUS KITCHEN SHIFT AGENTS
  // ========================================================
  await safeStep('13. Autonomous Shift Agents', async () => {
    await page.goto(`${BASE_URL}/agents`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '13a_agents_shift_briefings.png', 'AI Agents: Autonomous Kitchen Shift Briefings & Food Margin Proposals');
  });

  // ========================================================
  // 14. SETTINGS & MULTI-TENANT DOMAINS
  // ========================================================
  await safeStep('14. Settings & Domains', async () => {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '14a_settings_general.png', 'Settings: Restaurant Metadata & Operating Parameters');

    // Domains tab
    const domainsTabBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      return btns.find((b) => b.textContent && b.textContent.includes('Domains')) || null;
    });
    if (domainsTabBtn && domainsTabBtn.asElement()) {
      await domainsTabBtn.asElement().click();
      await sleep(1000);
      await captureScreen(page, '14b_settings_domains_cname_table.png', 'Settings: Multi-tenant Custom Domains & DNS CNAME Verification');
    }
  });

  // ========================================================
  // 15. BRANCH ONBOARDING WIZARD
  // ========================================================
  await safeStep('15. Branch Onboarding Wizard', async () => {
    await page.goto(`${BASE_URL}/onboarding`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2500);
    await captureScreen(page, '15a_onboarding_wizard_step1.png', 'Onboarding Wizard: Branch Setup, Location & Tax Profile');
  });

  // ========================================================
  // 16. PUBLIC STOREFRONT
  // ========================================================
  await safeStep('16. Public Storefront', async () => {
    await page.goto(`${BASE_URL}/store/kamolon-osh-markazi`, { waitUntil: 'networkidle2', timeout: 35000 });
    await sleep(3000);
    await captureScreen(page, '16a_storefront_hero_catalog.png', 'Public Storefront: Kamolon Osh Markazi Header & Dish Menu');

    // Click dish
    const dishCard = await page.$('div.group:has(h3), div.cursor-pointer:has(h3)');
    if (dishCard) {
      await dishCard.click();
      await sleep(1000);
      await captureScreen(page, '16b_storefront_dish_modifiers.png', 'Public Storefront: Dish Customization Modal with Add-ons');

      // Add to cart
      const addBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && (b.textContent.includes('Add to Cart') || b.textContent.includes('Savatga'))) || null;
      });
      if (addBtn && addBtn.asElement()) {
        await addBtn.asElement().click();
        await sleep(1000);
      }
    }

    // Open Cart
    const cartBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.querySelector('svg.lucide-shopping-bag') || b.textContent.includes('Cart') || b.textContent.includes('Savat')) || null;
    });
    if (cartBtn && cartBtn.asElement()) {
      await cartBtn.asElement().click();
      await sleep(1200);
      await captureScreen(page, '16c_storefront_cart_drawer.png', 'Public Storefront: Slide-out Cart Drawer with Itemized Subtotal');
    }
  });

  console.log('=== WORKSHOP ENCYCLOPEDIA AUDIT COMPLETED ===');
  await browser.close();
}

main().catch(console.error);
