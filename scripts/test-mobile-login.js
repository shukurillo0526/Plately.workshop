const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots';

async function testMobileLogin() {
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

  console.log('Navigating to app.theplately.com...');
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 60000 });
  console.log('Waiting for Flutter web to load...');
  await new Promise(r => setTimeout(r, 8000));

  console.log('Clicking Email field at (200, 428)...');
  await page.mouse.click(200, 428);
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.type('demo@plately.app', { delay: 50 });
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking Password field at (200, 508)...');
  await page.mouse.click(200, 508);
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.type('12345678', { delay: 50 });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_login_filled.png') });
  console.log('Saved filled form screenshot.');

  console.log('Clicking Continue button at (200, 665)...');
  await page.mouse.click(200, 665);

  console.log('Waiting 8 seconds for auth and AppShell to load...');
  await new Promise(r => setTimeout(r, 8000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_after_login.png') });
  console.log('Saved after login screenshot.');

  await browser.close();
}

testMobileLogin().catch(console.error);
