const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSHOP_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\encyclopedia\\workshop';
const MOBILE_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\encyclopedia\\mobile';
const MARKETING_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\encyclopedia\\marketing';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filepath, description) {
  console.log(`[Capture] ${description} -> ${path.basename(filepath)}...`);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  Saved: ${filepath}`);
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
  console.log('=== STARTING DEEP MICRO-INTERACTION CAPTURE ===');
  [WORKSHOP_DIR, MOBILE_DIR, MARKETING_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();

  // ----------------------------------------------------
  // WORKSHOP OS DEEP INTERACTIONS
  // ----------------------------------------------------
  await safeStep('Workshop Login', async () => {
    await page.goto('https://workshop.theplately.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    // Fill credentials
    const emailInput = await page.$('input[type="email"]');
    const passInput = await page.$('input[type="password"]');
    if (emailInput && passInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('demo@plately.app', { delay: 30 });
      await passInput.click({ clickCount: 3 });
      await passInput.type('12345678', { delay: 30 });
      await sleep(500);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await sleep(2500);
    }
  });

  // Workshop Menu Categories & Modals
  await safeStep('Workshop Menu Categories & Edit Modal', async () => {
    await page.goto('https://workshop.theplately.com/menu', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Soup Category
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const soupBtn = btns.find(b => b.textContent && b.textContent.includes('Soup'));
      if (soupBtn) soupBtn.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(WORKSHOP_DIR, '04f_menu_cat_soups.png'), 'Menu - Soup Category');

    // Bread Category
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const breadBtn = btns.find(b => b.textContent && b.textContent.includes('Bread'));
      if (breadBtn) breadBtn.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(WORKSHOP_DIR, '04h_menu_cat_bread.png'), 'Menu - Bread Category');

    // Drink Category
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const drinkBtn = btns.find(b => b.textContent && b.textContent.includes('Drink'));
      if (drinkBtn) drinkBtn.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(WORKSHOP_DIR, '04i_menu_cat_drinks.png'), 'Menu - Drink Category');

    // Reset to All
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allBtn = btns.find(b => b.textContent && b.textContent.trim() === 'All');
      if (allBtn) allBtn.click();
    });
    await sleep(800);

    // Edit Item Modal (Click first Edit button)
    await page.evaluate(() => {
      const editBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Edit'));
      if (editBtns.length > 0) editBtns[0].click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '04j_menu_edit_dish_modal.png'), 'Menu - Edit Dish Modal');
    // Close modal
    await page.keyboard.press('Escape');
    await sleep(500);
  });

  // Workshop Orders Search & Sort
  await safeStep('Workshop Orders Search & Sorting', async () => {
    await page.goto('https://workshop.theplately.com/orders', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    const searchInput = await page.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.type('Alisher', { delay: 50 });
      await sleep(1000);
      await captureScreen(page, path.join(WORKSHOP_DIR, '05c_orders_search_active.png'), 'Orders - Filtered Search for Alisher');
      await searchInput.click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await sleep(500);
    }

    // Sort by Total
    await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('th, button'));
      const totalHeader = headers.find(h => h.textContent && h.textContent.includes('Total'));
      if (totalHeader) totalHeader.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(WORKSHOP_DIR, '05d_orders_sort_total.png'), 'Orders - Sorted by Total Amount');
  });

  // Workshop Reservations List View & Add Modal
  await safeStep('Workshop Reservations List View & Add Modal', async () => {
    await page.goto('https://workshop.theplately.com/reservations', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Switch to List View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const listBtn = btns.find(b => b.textContent && (b.textContent.includes('List') || b.textContent.includes('Table')));
      if (listBtn) listBtn.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '06b_reservations_list_view.png'), 'Reservations - List View Mode');

    // Click Add Reservation Button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && b.textContent.includes('Reservation') && (b.textContent.includes('Add') || b.textContent.includes('New') || b.textContent.includes('+')));
      if (addBtn) addBtn.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '06c_reservations_add_modal.png'), 'Reservations - Add Reservation Modal');
    await page.keyboard.press('Escape');
    await sleep(500);
  });

  // Workshop Voice AI Scenarios
  await safeStep('Workshop Voice AI Order Simulation', async () => {
    await page.goto('https://workshop.theplately.com/voice', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Click Scenario 2 (Lamb Shashlik out of stock escalation)
    await page.evaluate(() => {
      const scenarioBtns = Array.from(document.querySelectorAll('button, div[role="button"]')).filter(el => el.textContent && el.textContent.includes('Shashlik'));
      if (scenarioBtns.length > 0) scenarioBtns[0].click();
    });
    await sleep(1200);
    await captureScreen(page, path.join(WORKSHOP_DIR, '12c_voice_ai_scenario_escalation.png'), 'Voice AI - Out of Stock Escalation Scenario');

    // Click Process / Simulate button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const procBtn = btns.find(b => b.textContent && (b.textContent.includes('Process') || b.textContent.includes('Simulate') || b.textContent.includes('Analyze')));
      if (procBtn) procBtn.click();
    });
    await sleep(1500);
    await captureScreen(page, path.join(WORKSHOP_DIR, '12d_voice_ai_scenario_custom.png'), 'Voice AI - Parsed Order Draft & Escalation');
  });

  // Workshop Autonomous Agents Tabs
  await safeStep('Workshop Autonomous Agents Roles', async () => {
    await page.goto('https://workshop.theplately.com/agents', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Marketing Agent Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const mkt = btns.find(b => b.textContent && b.textContent.includes('Marketing'));
      if (mkt) mkt.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '13b_agents_role_marketing.png'), 'Agents - Marketing Autonomous Agent');

    // Dispatch Agent Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const dsp = btns.find(b => b.textContent && b.textContent.includes('Dispatch'));
      if (dsp) dsp.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '13c_agents_role_dispatch.png'), 'Agents - Dispatch Autonomous Agent');
  });

  // Workshop Settings Tabs & Modals
  await safeStep('Workshop Settings Tabs (Branches, Staff, Billing)', async () => {
    await page.goto('https://workshop.theplately.com/settings', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Branches Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const b = btns.find(el => el.textContent && el.textContent.includes('Branches'));
      if (b) b.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '14c_settings_branches_tab.png'), 'Settings - Branches Multi-Location');

    // Open Add Branch Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && b.textContent.includes('Add Branch'));
      if (addBtn) addBtn.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(WORKSHOP_DIR, '14f_settings_add_branch_modal.png'), 'Settings - Add Branch Dialog');
    await page.keyboard.press('Escape');
    await sleep(500);

    // Staff Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const s = btns.find(el => el.textContent && el.textContent.includes('Staff'));
      if (s) s.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '14d_settings_staff_tab.png'), 'Settings - Staff & Role Permissions');

    // Open Invite Staff Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const invBtn = btns.find(b => b.textContent && b.textContent.includes('Invite Staff'));
      if (invBtn) invBtn.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(WORKSHOP_DIR, '14g_settings_invite_staff_modal.png'), 'Settings - Invite Staff Dialog');
    await page.keyboard.press('Escape');
    await sleep(500);

    // Billing Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const b = btns.find(el => el.textContent && el.textContent.includes('Billing'));
      if (b) b.click();
    });
    await sleep(1000);
    await captureScreen(page, path.join(WORKSHOP_DIR, '14e_settings_billing_tiers.png'), 'Settings - Subscription Tiers & Billing');
  });

  // Workshop Public Storefront Checkout flow
  await safeStep('Workshop Public Storefront Item Customization & Drawer', async () => {
    await page.goto('https://workshop.theplately.com/store/kamolon-osh-markazi', { waitUntil: 'networkidle2', timeout: 25000 });
    await sleep(2500);

    // Click first dish to open modifier dialog
    await page.evaluate(() => {
      const dishCards = Array.from(document.querySelectorAll('div, button')).filter(el => el.textContent && el.textContent.includes('Osh') && el.textContent.includes('UZS'));
      if (dishCards.length > 0) dishCards[0].click();
    });
    await sleep(1200);
    await captureScreen(page, path.join(WORKSHOP_DIR, '16d_storefront_modifier_selection.png'), 'Storefront - Dish Modifier Customization Modal');

    // Click Add to Cart inside modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && (b.textContent.includes('Add to Cart') || b.textContent.includes('Savatchaga')));
      if (addBtn) addBtn.click();
    });
    await sleep(1200);

    // Open Cart Drawer
    await page.evaluate(() => {
      const cartBtn = document.querySelector('header button, div button');
      const allBtns = Array.from(document.querySelectorAll('button'));
      const c = allBtns.find(b => b.textContent && (b.textContent.includes('Cart') || b.textContent.includes('Savatcha') || b.querySelector('svg')));
      if (c) c.click();
    });
    await sleep(1200);
    await captureScreen(page, path.join(WORKSHOP_DIR, '16e_storefront_cart_review.png'), 'Storefront - Slide-Out Cart Review');
  });

  // ----------------------------------------------------
  // MARKETING DEEP INTERACTIONS
  // ----------------------------------------------------
  await safeStep('Marketing Deep Solutions & Pricing Toggles', async () => {
    // Solutions Page
    await page.goto('https://theplately.com/solutions', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Tab 2: Ghost Kitchens
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const ghost = tabs.find(t => t.textContent && t.textContent.includes('Ghost'));
      if (ghost) ghost.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(MARKETING_DIR, '03b_solutions_ghost_kitchens.png'), 'Solutions - Ghost Kitchens Framework');

    // Tab 3: Multi-Chain
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const chains = tabs.find(t => t.textContent && (t.textContent.includes('Franchise') || t.textContent.includes('Multi-Chain') || t.textContent.includes('Enterprise')));
      if (chains) chains.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(MARKETING_DIR, '03c_solutions_franchises.png'), 'Solutions - Multi-Chain Enterprise');

    // Pricing Page: Annual Toggle
    await page.goto('https://theplately.com/pricing', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await page.evaluate(() => {
      const toggle = Array.from(document.querySelectorAll('button, input[type="checkbox"]')).find(el => el.textContent && (el.textContent.includes('Annual') || el.textContent.includes('Yearly')));
      if (toggle) toggle.click();
    });
    await sleep(800);
    await captureScreen(page, path.join(MARKETING_DIR, '06b_pricing_annual_discount.png'), 'Pricing - Annual Billing 20% Discount');

    // FAQ Accordion Expand All
    await page.goto('https://theplately.com/faq', { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await page.evaluate(() => {
      const questions = Array.from(document.querySelectorAll('button[aria-expanded="false"], div[role="button"]'));
      questions.forEach(q => q.click());
    });
    await sleep(1000);
    await captureScreen(page, path.join(MARKETING_DIR, '08b_faq_all_accordions_open.png'), 'FAQ - All Knowledgebase Accordions Expanded');
  });

  await browser.close();
  console.log('\n=== COMPLETED DEEP MICRO-INTERACTION CAPTURE ===');
}

main().catch(console.error);
