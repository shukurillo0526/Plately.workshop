const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots';
const WEB_PREVIEWS_DIR = 'd:\\dev\\projects\\Plately\\Plately.web\\public\\previews';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveScreen(page, name, desc) {
  console.log(`[Mobile Capture] ${desc} -> ${name}...`);
  const artifactPath = path.join(ARTIFACT_DIR, name);
  const webPath = path.join(WEB_PREVIEWS_DIR, name);

  await page.screenshot({ path: artifactPath });
  fs.copyFileSync(artifactPath, webPath);
  console.log(`  Saved to ${artifactPath} and ${webPath}`);
}

async function main() {
  console.log('Launching browser for complete Mobile Walkthrough...');
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

  // Pre-seed completed walkthrough in localStorage so view is pristine
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('flutter.tutorial_home_walkthrough', 'true');
    localStorage.setItem('flutter.tutorial_first_recipe_view', 'true');
    localStorage.setItem('flutter.tutorial_first_scan', 'true');
    localStorage.setItem('flutter.tutorial_skipped', 'true');
    localStorage.setItem('flutter.onboarding_complete', 'true');
  });

  page.on('console', (msg) => {
    const text = msg.text();
    if (!text.includes('Failed to load resource')) {
      console.log('APP LOG:', text);
    }
  });

  console.log('1. Navigating to app.theplately.com...');
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(7000);

  // 1. Mobile Auth Screen
  await saveScreen(page, 'mobile_01_welcome_auth.png', 'Mobile Welcome & Auth Screen');

  console.log('2. Entering demo credentials...');
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

  // 2. Cook Recipes Tab
  await saveScreen(page, 'mobile_02_cook_recipes.png', 'Cook Mode: What to Cook Recipes');

  // 3. Navigate to Living Shelf (click Shelf tab at 325, 810)
  console.log('4. Navigating to Shelf tab at (325, 810)...');
  await page.mouse.click(325, 810);
  await sleep(3000);
  await saveScreen(page, 'mobile_03_living_shelf.png', 'Cook Mode: Living Shelf Pantry & Fridge');

  // 4. Tap "Add Ingredient" button or FAB at center/bottom
  console.log('5. Clicking Add Ingredient button at (196, 765)...');
  await page.mouse.click(196, 765);
  await sleep(3000);
  await saveScreen(page, 'mobile_04_add_ingredient_sheet.png', 'Living Shelf: Add Ingredient Sheet');

  // Dismiss sheet by tapping top background
  console.log('6. Dismissing sheet...');
  await page.mouse.click(196, 120);
  await sleep(1500);

  // 5. Navigate to Scan tab at (196, 810)
  console.log('7. Navigating to Scan tab at (196, 810)...');
  await page.mouse.click(196, 810);
  await sleep(3000);
  await saveScreen(page, 'mobile_05_scan_camera.png', 'Cook Mode: AI Food & Barcode Scanner');

  // 6. Switch to ORDER Mode (tap Order pill at 200, 35)
  console.log('8. Switching to ORDER mode at (200, 35)...');
  await page.mouse.click(200, 35);
  await sleep(4000);
  await saveScreen(page, 'mobile_06_order_restaurants.png', 'Order Mode: Restaurants & Dining Discovery');

  // 7. Click on Kamolon restaurant card if visible or center area (200, 350)
  console.log('9. Clicking on restaurant card at (200, 350)...');
  await page.mouse.click(200, 350);
  await sleep(4000);
  await saveScreen(page, 'mobile_07_kamolon_restaurant_detail.png', 'Restaurant Detail & Menu Ordering');

  // Navigate back by tapping top-left back arrow at (30, 45)
  console.log('10. Navigating back...');
  await page.mouse.click(30, 45);
  await sleep(2000);

  // 8. Order Feeds tab at (196, 810)
  console.log('11. Navigating to Feeds tab at (196, 810)...');
  await page.mouse.click(196, 810);
  await sleep(3500);
  await saveScreen(page, 'mobile_08_order_social_feeds.png', 'Order Mode: Live Video Food Feeds');

  // 9. Explore tab at (325, 810)
  console.log('12. Navigating to Explore tab at (325, 810)...');
  await page.mouse.click(325, 810);
  await sleep(3500);
  await saveScreen(page, 'mobile_09_explore_community.png', 'Order Mode: Community & Trending Spots');

  // 10. Open User Profile at top-right (365, 35)
  console.log('13. Opening Profile at (365, 35)...');
  await page.mouse.click(365, 35);
  await sleep(3500);
  await saveScreen(page, 'mobile_10_user_profile.png', 'Consumer User Profile & Preferences');

  console.log('\nAll 10 mobile screenshots captured successfully!');
  await browser.close();
}

main().catch(console.error);
