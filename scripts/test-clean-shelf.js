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

  // Pre-set localStorage so tutorials are dismissed cleanly
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('flutter.tutorial_home_walkthrough', 'true');
    localStorage.setItem('flutter.tutorial_first_recipe_view', 'true');
    localStorage.setItem('flutter.tutorial_first_scan', 'true');
    localStorage.setItem('flutter.tutorial_skipped', 'true');
    localStorage.setItem('flutter.onboarding_complete', 'true');
  });

  page.on('console', (msg) => console.log('APP LOG:', msg.text()));

  console.log('Navigating to app.theplately.com with pre-set preferences...');
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2' });
  await sleep(7000);

  // Login
  console.log('Logging in as demo@plately.app...');
  await page.mouse.click(196, 380);
  await sleep(300);
  await page.keyboard.type('demo@plately.app', { delay: 30 });
  await sleep(300);

  await page.mouse.click(196, 430);
  await sleep(300);
  await page.keyboard.type('12345678', { delay: 30 });
  await sleep(400);

  await page.keyboard.press('Enter');
  await page.mouse.click(196, 580);
  await sleep(10000);

  // Capture clean Living Shelf
  await saveScreen(page, 'mobile_03_living_shelf_clean.png', 'Clean Living Shelf (No Tutorial)');

  await browser.close();
}

main().catch(console.error);
