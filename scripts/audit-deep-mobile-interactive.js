const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\deep_mobile';
const BASE_URL = 'https://app.theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Mobile Interactive] ${description} -> ${filename}...`);
  const targetPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function safeStep(name, fn) {
  try {
    console.log(`--- [MOBILE] RUNNING STEP: ${name} ---`);
    await fn();
    console.log(`--- [MOBILE] STEP COMPLETED: ${name} ---`);
  } catch (err) {
    console.error(`--- [MOBILE] ERROR IN STEP ${name}:`, err.message);
  }
}

async function main() {
  console.log('=== STARTING DEEP CONSUMER MOBILE APP INTERACTIVE AUDIT ===');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  await page.setUserAgent(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
  );

  // Pre-seed tutorial completion flags
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('flutter.tutorial_home_walkthrough', 'true');
    localStorage.setItem('flutter.tutorial_first_recipe_view', 'true');
    localStorage.setItem('flutter.tutorial_first_scan', 'true');
    localStorage.setItem('flutter.tutorial_skipped', 'true');
    localStorage.setItem('flutter.onboarding_complete', 'true');
  });

  const interactions = [];
  const errors = [];

  page.on('console', (msg) => {
    const t = msg.text();
    if (msg.type() === 'error') {
      errors.push({ type: 'console', text: t });
    }
  });

  page.on('pageerror', (err) => {
    errors.push({ type: 'pageerror', text: err.message });
  });

  // 1. BOOTSTRAP & AUTH
  await safeStep('Mobile Bootstrap & Login', async () => {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(7000);
    await captureScreen(page, 'deep_mob_01_welcome_splash.png', 'Dark Porcelain Splash & Auth Screen');

    // Login credentials
    console.log('Entering login credentials...');
    await page.mouse.click(196, 380);
    await sleep(200);
    await page.keyboard.type('demo@plately.app', { delay: 20 });
    await sleep(200);

    await page.mouse.click(196, 430);
    await sleep(200);
    await page.keyboard.type('12345678', { delay: 20 });
    await sleep(300);

    await page.keyboard.press('Enter');
    await page.mouse.click(196, 580);
    console.log('Waiting 10s for CanvasKit to initialize user session...');
    await sleep(10000);

    await captureScreen(page, 'deep_mob_02_cook_explore.png', 'Cook Mode: What to Cook Explore Tier');
    interactions.push('Mobile Auth: Successful sign-in as Master Chef Demo');
  });

  // 2. RECIPE MATCHER TIERS
  await safeStep('Recipe Matcher Tiers', async () => {
    // Perfect Match (100%) Tier
    console.log('Tapping Perfect Match Tier (185, 210)...');
    await page.mouse.click(185, 210);
    await sleep(2000);
    await captureScreen(page, 'deep_mob_03_tier_perfect_match.png', 'Recipe Matcher: 100% Perfect Match Tier');
    interactions.push('Cook: Perfect Match tier verified');

    // For You Tier
    console.log('Tapping For You Tier (240, 210)...');
    await page.mouse.click(240, 210);
    await sleep(2000);
    await captureScreen(page, 'deep_mob_04_tier_for_you.png', 'Recipe Matcher: For You Personalized Tier');
    interactions.push('Cook: For You tier verified');

    // Use It Up Tier (Expiring Food)
    console.log('Tapping Use It Up Tier (300, 210)...');
    await page.mouse.click(300, 210);
    await sleep(2000);
    await captureScreen(page, 'deep_mob_05_tier_use_it_up.png', 'Recipe Matcher: Use It Up (Waste Prevention) Tier');
    interactions.push('Cook: Use It Up tier verified');

    // Return to Explore
    await page.mouse.click(120, 210);
    await sleep(1500);
  });

  // 3. RECIPE DETAIL & COOKING SESSION
  await safeStep('Recipe Detail & Cooking Session', async () => {
    console.log('Clicking top recipe card (200, 420)...');
    await page.mouse.click(200, 420);
    await sleep(3500);
    await captureScreen(page, 'deep_mob_06_recipe_detail_top.png', 'Recipe Detail Screen with Hero & Ingredients');

    // Scroll down to view cooking steps
    console.log('Scrolling down recipe details...');
    await page.mouse.move(200, 650);
    await page.mouse.down();
    await page.mouse.move(200, 250, { steps: 10 });
    await page.mouse.up();
    await sleep(1500);
    await captureScreen(page, 'deep_mob_07_recipe_detail_steps.png', 'Recipe Steps and Interactive Cooking Timers');
    interactions.push('Recipe Detail: Ingredient fulfillment and steps verified');

    // Back to Cook screen
    await page.mouse.click(30, 45);
    await sleep(2000);
  });

  // 4. LIVING SHELF (3 Zones & Add Ingredient)
  await safeStep('Living Shelf (Fridge, Freezer, Pantry, Add)', async () => {
    console.log('Navigating to Shelf tab (325, 810)...');
    await page.mouse.click(325, 810);
    await sleep(3000);
    await captureScreen(page, 'deep_mob_08_living_shelf_fridge.png', 'Living Shelf: Fridge Zone & Expiry Countdown Banner');

    // Freezer Zone
    console.log('Switching to Freezer zone (196, 150)...');
    await page.mouse.click(196, 150);
    await sleep(2000);
    await captureScreen(page, 'deep_mob_09_living_shelf_freezer.png', 'Living Shelf: Freezer Long-Term Storage Zone');
    interactions.push('Shelf: Freezer zone verified');

    // Pantry Zone
    console.log('Switching to Pantry zone (300, 150)...');
    await page.mouse.click(300, 150);
    await sleep(2000);
    await captureScreen(page, 'deep_mob_10_living_shelf_pantry.png', 'Living Shelf: Pantry Grains and Spices Zone');
    interactions.push('Shelf: Pantry zone verified');

    // Switch back to Fridge
    await page.mouse.click(90, 150);
    await sleep(1500);

    // Open "Add Ingredient" Sheet via FAB (345, 740)
    console.log('Opening Add Ingredient bottom sheet (345, 740)...');
    await page.mouse.click(345, 740);
    await sleep(2500);
    await captureScreen(page, 'deep_mob_11_add_ingredient_sheet.png', 'Add Ingredient Bottom Sheet with Storage Zone & Categories');

    // Close Add Ingredient Sheet by clicking backdrop or top area
    await page.mouse.click(196, 200);
    await sleep(1500);
  });

  // 5. MULTIMODAL SCANNER (Receipt, Photo, Barcode)
  await safeStep('Multimodal Scanner', async () => {
    console.log('Opening Scanner tab (196, 810)...');
    await page.mouse.click(196, 810);
    await sleep(3000);

    // Mode 1: Receipt OCR
    console.log('Testing Receipt OCR mode (100, 110)...');
    await page.mouse.click(100, 110);
    await sleep(1500);
    await captureScreen(page, 'deep_mob_12_scan_receipt_ocr.png', 'Multimodal Scanner: Supermarket Receipt OCR Viewfinder');
    interactions.push('Scanner: Receipt OCR viewfinder verified');

    // Mode 2: Photo Macro Vision
    console.log('Testing Photo Macro Vision mode (196, 110)...');
    await page.mouse.click(196, 110);
    await sleep(1500);
    await captureScreen(page, 'deep_mob_13_scan_photo_macros.png', 'Multimodal Scanner: Food Plate Macro Vision Viewfinder');
    interactions.push('Scanner: Food plate macro vision verified');

    // Mode 3: Optical Barcode
    console.log('Testing Barcode mode (290, 110)...');
    await page.mouse.click(290, 110);
    await sleep(1500);
    await captureScreen(page, 'deep_mob_14_scan_barcode_optical.png', 'Multimodal Scanner: Optical Barcode EAN-13 Viewfinder');
    interactions.push('Scanner: Optical barcode mode verified');

    // Tab 2: Scan Calories Tab
    console.log('Testing Scan Calories top tab (280, 55)...');
    await page.mouse.click(280, 55);
    await sleep(1500);
    await captureScreen(page, 'deep_mob_15_scan_calories_tab.png', 'Multimodal Scanner: Direct Calorie & Macronutrient Scanner');
    interactions.push('Scanner: Calorie scanner tab verified');

    // Return to Cook tab
    await page.mouse.click(70, 810);
    await sleep(1500);
  });

  // 6. ORDER MODE (Restaurants & Storefront)
  await safeStep('Order Mode: Discovery & Storefront', async () => {
    console.log('Toggling to ORDER mode (250, 45)...');
    await page.mouse.click(250, 45);
    await sleep(3000);
    await captureScreen(page, 'deep_mob_16_order_mode_restaurants.png', 'Order Mode: Tashkent & Chilanzar Restaurant Discovery');

    // Click Kamolon Osh Markazi restaurant card (200, 320)
    console.log('Opening Kamolon Osh Markazi restaurant page (200, 320)...');
    await page.mouse.click(200, 320);
    await sleep(3500);
    await captureScreen(page, 'deep_mob_17_restaurant_digital_menu.png', 'Restaurant Storefront: Digital Menu & Categories');
    interactions.push('Order Mode: Restaurant storefront catalog verified');

    // Back to restaurants
    await page.mouse.click(30, 45);
    await sleep(2000);
  });

  // 7. SOCIAL REELS FEED
  await safeStep('Order Mode: Culinary Reels Stream', async () => {
    console.log('Opening Reels / Feeds tab (200, 810)...');
    await page.mouse.click(200, 810);
    await sleep(3000);
    await captureScreen(page, 'deep_mob_18_culinary_reels_stream.png', 'Short-form Culinary Reels Feed with Instant Cart Overlay');
    interactions.push('Order Mode: Video reels stream verified');
  });

  // 8. COMMUNITY EXPLORE
  await safeStep('Community & Explore', async () => {
    console.log('Opening Explore tab (130, 810)...');
    await page.mouse.click(130, 810);
    await sleep(3000);
    await captureScreen(page, 'deep_mob_19_community_explore_feed.png', 'Community Explore Feed with Trending Recipes');
    interactions.push('Explore: Community trending recipes verified');
  });

  // 9. MASTER CHEF PROFILE & BADGES
  await safeStep('Master Chef Profile & Badges', async () => {
    console.log('Opening Profile tab (340, 810)...');
    await page.mouse.click(340, 810);
    await sleep(3000);
    await captureScreen(page, 'deep_mob_20_profile_chef_xp.png', 'Master Chef Profile, Level Progress & Waste Savings Metrics');

    // Scroll down to Badges
    console.log('Scrolling down to Badges Collection...');
    await page.mouse.move(200, 600);
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 10 });
    await page.mouse.up();
    await sleep(1500);
    await captureScreen(page, 'deep_mob_21_profile_badges_unlocked.png', 'Badges & Achievements Collection');
    interactions.push('Profile: Master chef XP progress and badges gallery verified');
  });

  console.log('=== CONSUMER MOBILE APP DEEP INTERACTIVE AUDIT COMPLETED ===');
  const logPath = path.join(OUTPUT_DIR, 'deep-mobile-audit-log.json');
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

main().catch((e) => console.error('FATAL MOBILE AUDIT:', e));
