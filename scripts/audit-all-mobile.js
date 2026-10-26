const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MOBILE_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots\\mobile';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureScreen(page, filename, description) {
  console.log(`[Capture Mobile] ${description} -> ${filename}...`);
  const targetPath = path.join(MOBILE_DIR, filename);
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log(`  Saved: ${targetPath}`);
}

async function main() {
  console.log('=== STARTING DEEP CONSUMER MOBILE APP AUDIT ===');
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

  // Pre-seed completed walkthrough in localStorage before Flutter scripts execute
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('flutter.tutorial_home_walkthrough', 'true');
    localStorage.setItem('flutter.tutorial_first_recipe_view', 'true');
    localStorage.setItem('flutter.tutorial_first_scan', 'true');
    localStorage.setItem('flutter.tutorial_skipped', 'true');
    localStorage.setItem('flutter.onboarding_complete', 'true');
  });

  const errors = [];
  page.on('console', (msg) => {
    const t = msg.text();
    if (!t.includes('Failed to load resource')) {
      console.log('  [FLUTTER LOG]', t);
    }
    if (msg.type() === 'error') errors.push({ type: 'console', text: t });
  });

  try {
    console.log('1. Navigating to app.theplately.com...');
    await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(7000);

    // 1. Mobile Auth Screen
    await captureScreen(page, 'mob_01_welcome_auth.png', 'Dark Porcelain Plate Splash / Auth');

    // 2. Perform Login via coordinates
    console.log('2. Entering credentials (demo@plately.app / 12345678)...');
    await page.mouse.click(196, 380);
    await sleep(200);
    await page.keyboard.type('demo@plately.app', { delay: 25 });
    await sleep(200);

    await page.mouse.click(196, 430);
    await sleep(200);
    await page.keyboard.type('12345678', { delay: 25 });
    await sleep(300);

    await page.keyboard.press('Enter');
    await page.mouse.click(196, 580);
    console.log('3. Waiting for authentication and AppShell to render (10s)...');
    await sleep(10000);

    // 2. Cook Mode: What to Cook? (Explore tier)
    await captureScreen(page, 'mob_02_cook_explore.png', 'Cook Mode: What to Cook (Explore Tier)');

    // 3. Cook Mode: Perfect Match tier (tap at ~185, 210)
    console.log('Switching to Perfect Match tier...');
    await page.mouse.click(185, 210);
    await sleep(2000);
    await captureScreen(page, 'mob_03_cook_perfect_match.png', 'Cook Mode: Perfect Match Tier');

    // 4. Cook Mode: For You tier (tap at ~240, 210)
    console.log('Switching to For You tier...');
    await page.mouse.click(240, 210);
    await sleep(2000);
    await captureScreen(page, 'mob_04_cook_for_you.png', 'Cook Mode: For You Tier');

    // 5. Cook Mode: Use It Up tier (tap at ~300, 210)
    console.log('Switching to Use It Up tier...');
    await page.mouse.click(300, 210);
    await sleep(2000);
    await captureScreen(page, 'mob_05_cook_use_it_up.png', 'Cook Mode: Use It Up Tier (Expiring Food)');

    // Switch back to Explore tier
    await page.mouse.click(120, 210);
    await sleep(1500);

    // 6. Recipe Details: Click first recipe card at (200, 420)
    console.log('Clicking on recipe card to inspect Recipe Details...');
    await page.mouse.click(200, 420);
    await sleep(3500);
    await captureScreen(page, 'mob_06_recipe_detail.png', 'Recipe Detail Screen & Ingredients');

    // Back to cook screen (back button at top left 30, 45)
    await page.mouse.click(30, 45);
    await sleep(2000);

    // 7. Living Shelf (Bottom right tab at 325, 810)
    console.log('Navigating to Shelf tab at (325, 810)...');
    await page.mouse.click(325, 810);
    await sleep(3000);
    await captureScreen(page, 'mob_07_living_shelf_fridge.png', 'Living Shelf: Fridge Zone & Expiry Alert');

    // 8. Living Shelf Freezer tab (tap at 196, 150)
    console.log('Switching to Freezer zone...');
    await page.mouse.click(196, 150);
    await sleep(2000);
    await captureScreen(page, 'mob_08_living_shelf_freezer.png', 'Living Shelf: Freezer Zone');

    // 9. Living Shelf Pantry tab (tap at 300, 150)
    console.log('Switching to Pantry zone...');
    await page.mouse.click(300, 150);
    await sleep(2000);
    await captureScreen(page, 'mob_09_living_shelf_pantry.png', 'Living Shelf: Pantry Zone');

    // Back to Fridge
    await page.mouse.click(90, 150);
    await sleep(1500);

    // 10. Open Add Ingredient sheet (button at 196, 765)
    console.log('Opening Add Ingredient bottom sheet...');
    await page.mouse.click(196, 765);
    await sleep(3000);
    await captureScreen(page, 'mob_10_add_ingredient_sheet.png', 'Add Ingredient Bottom Sheet');

    // Dismiss sheet
    await page.mouse.click(196, 120);
    await sleep(1500);

    // 11. Navigate to AI Scanner tab at (196, 810)
    console.log('Navigating to AI Scanner tab at (196, 810)...');
    await page.mouse.click(196, 810);
    await sleep(3000);
    await captureScreen(page, 'mob_11_scan_receipt.png', 'AI Scanner: Receipt OCR Mode');

    // 12. Switch to Photo Mode (tap at 196, 730)
    console.log('Switching to Photo Vision mode...');
    await page.mouse.click(196, 730);
    await sleep(2000);
    await captureScreen(page, 'mob_12_scan_photo.png', 'AI Scanner: Photo Plate Vision Mode');

    // 13. Switch to Barcode Mode (tap at 290, 730)
    console.log('Switching to Barcode Lookup mode...');
    await page.mouse.click(290, 730);
    await sleep(2000);
    await captureScreen(page, 'mob_13_scan_barcode.png', 'AI Scanner: Barcode Lookup Mode');

    // 14. Switch to ORDER Mode (tap top mode pill at 200, 35)
    console.log('Switching App Shell to ORDER mode...');
    await page.mouse.click(200, 35);
    await sleep(4000);
    await captureScreen(page, 'mob_14_order_restaurants.png', 'Order Mode: Tashkent Restaurants List');

    // 15. Click Kamolon Osh Markazi restaurant card at (200, 350)
    console.log('Clicking on Kamolon Osh Markazi card...');
    await page.mouse.click(200, 350);
    await sleep(4000);
    await captureScreen(page, 'mob_15_restaurant_detail.png', 'Kamolon Osh Markazi Storefront Menu');

    // Navigate back to Order Home
    await page.mouse.click(30, 45);
    await sleep(2000);

    // 16. Navigate to Video Food Reels (center tab at 196, 810)
    console.log('Navigating to Video Food Reels at (196, 810)...');
    await page.mouse.click(196, 810);
    await sleep(3500);
    await captureScreen(page, 'mob_16_order_feeds.png', 'Video Food Reels Stream');

    // 17. Navigate to Community Explore (right tab at 325, 810)
    console.log('Navigating to Community Explore at (325, 810)...');
    await page.mouse.click(325, 810);
    await sleep(3500);
    await captureScreen(page, 'mob_17_explore_community.png', 'Community Explore & Trending Dishes');

    // 18. Open User Profile (top right icon at 365, 35)
    console.log('Opening User Profile at (365, 35)...');
    await page.mouse.click(365, 35);
    await sleep(3500);
    await captureScreen(page, 'mob_18_profile_stats.png', 'User Profile: Demo Master Chef & Impact');

    // 19. Scroll down to inspect Badges & Achievements
    console.log('Scrolling profile down to inspect achievements...');
    await page.mouse.wheel({ deltaY: 350 });
    await sleep(1500);
    await captureScreen(page, 'mob_19_profile_badges.png', 'Profile Badges & Achievements Collection');

    console.log('=== DEEP CONSUMER MOBILE APP AUDIT COMPLETE ===');
    console.log(`Total screens captured: 19`);
    fs.writeFileSync(
      path.join(MOBILE_DIR, 'mobile-deep-audit-log.json'),
      JSON.stringify({ timestamp: new Date().toISOString(), screens: 19, errors }, null, 2)
    );
  } catch (err) {
    console.error('Fatal error during Mobile audit:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
