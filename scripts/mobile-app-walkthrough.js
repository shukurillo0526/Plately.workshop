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
  console.log('Launching browser for Mobile Walkthrough (iPhone 14 Pro)...');
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

  page.on('console', (msg) => console.log('APP LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('APP ERROR:', err.message));

  console.log('Navigating to https://app.theplately.com...');
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('Waiting for Flutter web bootstrap (8s)...');
  await sleep(8000);

  // 1. Auth Screen
  await saveScreen(page, 'mobile_01_auth_screen.png', 'Mobile Welcome & Auth Screen');

  console.log('Clicking Email at (196, 380)...');
  await page.mouse.click(196, 380);
  await sleep(400);
  await page.keyboard.type('demo@plately.app', { delay: 40 });
  await sleep(400);

  console.log('Clicking Password at (196, 430)...');
  await page.mouse.click(196, 430);
  await sleep(400);
  await page.keyboard.type('12345678', { delay: 40 });
  await sleep(600);

  await saveScreen(page, 'mobile_02_auth_filled.png', 'Mobile Auth Credentials Filled');

  console.log('Submitting credentials via Enter key...');
  await page.keyboard.press('Enter');
  await sleep(1000);

  // Also click Continue button just in case
  console.log('Clicking Continue button at (196, 580)...');
  await page.mouse.click(196, 580);

  console.log('Waiting 12 seconds for Supabase authentication & AppShell rendering...');
  await sleep(12000);

  await saveScreen(page, 'mobile_03_appshell_loaded.png', 'Mobile AppShell After Login');

  await browser.close();
}

main().catch(console.error);
