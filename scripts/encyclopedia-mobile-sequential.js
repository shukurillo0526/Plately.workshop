const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\encyclopedia\\mobile';
const BASE_URL = 'https://app.theplately.com';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Mobile Encyclopedia] ${description} -> ${filename}...`);
  const targetPath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function safeStep(title, fn) {
  try {
    console.log(`\n========================================`);
    console.log(`>>> [MOBILE] EXECUTING: ${title}`);
    console.log(`========================================`);
    await fn();
    console.log(`>>> [MOBILE] FINISHED: ${title}`);
  } catch (err) {
    console.error(`>>> [MOBILE] ERROR in ${title}:`, err.message);
  }
}

async function main() {
  console.log('=== STARTING CONSUMER MOBILE APP ENCYCLOPEDIA AUDIT ===');
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

  // Pre-seed tutorial completion
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('flutter.tutorial_home_walkthrough', 'true');
    localStorage.setItem('flutter.tutorial_first_recipe_view', 'true');
    localStorage.setItem('flutter.tutorial_first_scan', 'true');
    localStorage.setItem('flutter.tutorial_skipped', 'true');
    localStorage.setItem('flutter.onboarding_complete', 'true');
  });

  // 1. BOOTSTRAP & LOGIN
  await safeStep('1. Mobile Splash & Auth', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(7000);
    await captureScreen(page, '01a_mobile_splash_porcelain.png', 'Mobile: Dark Porcelain Welcome Screen');

    // Type credentials
    await page.mouse.click(196, 380);
    await sleep(200);
    await page.keyboard.type('demo@plately.app', { delay: 20 });
    await sleep(200);

    await page.mouse.click(196, 430);
    await sleep(200);
    await page.keyboard.type('12345678', { delay: 20 });
    await sleep(300);
    await captureScreen(page, '01b_mobile_credentials_typed.png', 'Mobile: Login Form with Entered Credentials');

    await page.keyboard.press('Enter');
    await page.mouse.click(196, 580);
    await sleep(10000);
    await captureScreen(page, '01c_mobile_appshell_loaded.png', 'Mobile: Cook Mode AppShell Loaded');
  });

  // 2. COOK MODE MATCHER TIERS
  await safeStep('2. Cook Mode Matcher Tiers', async () => {
    await captureScreen(page, '02a_cook_explore_tier.png', 'Cook Mode: What to Cook Explore Carousel');

    // Perfect Match 100%
    await page.mouse.click(185, 210);
    await sleep(2000);
    await captureScreen(page, '02b_cook_perfect_match_100.png', 'Cook Tier 1: 100% Perfect Match (Zero Missing Ingredients)');

    // For You
    await page.mouse.click(240, 210);
    await sleep(2000);
    await captureScreen(page, '02c_cook_for_you_dietary.png', 'Cook Tier 2: For You (Personalized Dietary Match)');

    // Use It Up
    await page.mouse.click(300, 210);
    await sleep(2000);
    await captureScreen(page, '02d_cook_use_it_up_expiring.png', 'Cook Tier 3: Use It Up (Urgent Spoilage Prevention)');

    // Return to Explore
    await page.mouse.click(120, 210);
    await sleep(1500);

    // Recipe Detail Modal
    await page.mouse.click(200, 420);
    await sleep(3500);
    await captureScreen(page, '02e_recipe_detail_overview.png', 'Recipe Detail: Hero Image & Fulfillment Status');

    // Scroll down to steps
    await page.mouse.move(200, 650);
    await page.mouse.down();
    await page.mouse.move(200, 250, { steps: 10 });
    await page.mouse.up();
    await sleep(1500);
    await captureScreen(page, '02f_recipe_detail_cooking_steps.png', 'Recipe Detail: Step-by-Step Cooking Steps & Live Timer');

    // Back to Cook
    await page.mouse.click(30, 45);
    await sleep(2000);
  });

  // 3. LIVING SHELF (3 Zones & Add Ingredient)
  await safeStep('3. Living Shelf Zones & Add Ingredient', async () => {
    await page.mouse.click(325, 810);
    await sleep(3000);
    await captureScreen(page, '03a_shelf_fridge_cards.png', 'Living Shelf: Fridge Zone 3D Cards & Expiry Countdown Banner');

    // Freezer
    await page.mouse.click(196, 150);
    await sleep(2000);
    await captureScreen(page, '03b_shelf_freezer_zone.png', 'Living Shelf: Freezer Frozen Storage Zone');

    // Pantry
    await page.mouse.click(300, 150);
    await sleep(2000);
    await captureScreen(page, '03c_shelf_pantry_zone.png', 'Living Shelf: Pantry Grains, Spices & Dry Goods Zone');

    // Return to Fridge
    await page.mouse.click(90, 150);
    await sleep(1500);

    // Open Add Ingredient FAB
    await page.mouse.click(345, 740);
    await sleep(2500);
    await captureScreen(page, '03d_shelf_add_ingredient_sheet.png', 'Living Shelf: Slide-up Add Ingredient Bottom Sheet');

    // Close
    await page.mouse.click(196, 200);
    await sleep(1500);
  });

  // 4. MULTIMODAL SCANNER
  await safeStep('4. Multimodal Scanner Viewfinders', async () => {
    await page.mouse.click(196, 810);
    await sleep(3000);

    // Receipt OCR
    await page.mouse.click(100, 110);
    await sleep(1500);
    await captureScreen(page, '04a_scanner_receipt_ocr.png', 'Multimodal Scanner: Supermarket Grocery Receipt OCR Viewfinder');

    // Food Plate Macros
    await page.mouse.click(196, 110);
    await sleep(1500);
    await captureScreen(page, '04b_scanner_plate_macros.png', 'Multimodal Scanner: Plate Photo Macro Vision Viewfinder');

    // Barcode
    await page.mouse.click(290, 110);
    await sleep(1500);
    await captureScreen(page, '04c_scanner_optical_barcode.png', 'Multimodal Scanner: Optical Barcode EAN-13 Viewfinder');

    // Scan Calories
    await page.mouse.click(280, 55);
    await sleep(1500);
    await captureScreen(page, '04d_scanner_calories_breakdown.png', 'Multimodal Scanner: Direct Calorie & Macronutrient Scanner');

    // Return to Cook
    await page.mouse.click(70, 810);
    await sleep(1500);
  });

  // 5. ORDER MODE & STOREFRONT
  await safeStep('5. Order Mode Discovery', async () => {
    await page.mouse.click(250, 45);
    await sleep(3000);
    await captureScreen(page, '05a_order_restaurants_discovery.png', 'Order Mode: Tashkent & Chilanzar Restaurant Discovery');

    // Open Kamolon
    await page.mouse.click(200, 320);
    await sleep(3500);
    await captureScreen(page, '05b_order_kamolon_storefront.png', 'Restaurant Storefront: Digital Menu & Categories');

    await page.mouse.click(30, 45);
    await sleep(2000);
  });

  // 6. CULINARY VIDEO REELS
  await safeStep('6. Culinary Video Reels Feed', async () => {
    await page.mouse.click(200, 810);
    await sleep(3000);
    await captureScreen(page, '06a_culinary_video_reels.png', 'Short-form Culinary Reels Stream with Floating Order Button');
  });

  // 7. COMMUNITY EXPLORE
  await safeStep('7. Community Explore Feed', async () => {
    await page.mouse.click(130, 810);
    await sleep(3000);
    await captureScreen(page, '07a_community_explore_feed.png', 'Community Explore Feed with Trending Recipes');
  });

  // 8. MASTER CHEF PROFILE & BADGES
  await safeStep('8. Master Chef Profile & Badges', async () => {
    await page.mouse.click(340, 810);
    await sleep(3000);
    await captureScreen(page, '08a_profile_chef_xp_level.png', 'Master Chef Profile, Level Progress & Waste Savings Metrics');

    // Scroll down to Badges
    await page.mouse.move(200, 600);
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 10 });
    await page.mouse.up();
    await sleep(1500);
    await captureScreen(page, '08b_profile_badges_gallery.png', 'Badges & Achievements Collection Gallery');
  });

  console.log('=== CONSUMER MOBILE APP ENCYCLOPEDIA AUDIT COMPLETED ===');
  await browser.close();
}

main().catch(console.error);
