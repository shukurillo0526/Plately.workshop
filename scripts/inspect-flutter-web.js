const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots';
const WEB_PREVIEWS_DIR = 'd:\\dev\projects\\Plately\\Plately.web\\public\\previews';

async function inspectFlutterWeb() {
  console.log('Launching browser with iPhone 14 Pro emulation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  
  // Mobile viewport (iPhone 14 Pro)
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

  page.on('console', msg => console.log('FLUTTER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('FLUTTER ERROR:', err.message));

  console.log('Navigating to https://app.theplately.com...');
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 60000 });

  console.log('Waiting 10 seconds for Flutter engine & CanvasKit to bootstrap...');
  await new Promise(r => setTimeout(r, 10000));

  const initialShot = path.join(ARTIFACT_DIR, 'mobile_app_bootstrap.png');
  await page.screenshot({ path: initialShot });
  console.log(`Saved initial bootstrap screenshot to ${initialShot}`);

  const html = await page.evaluate(() => document.body.innerHTML);
  console.log('HTML length:', html.length);
  console.log('Input count in DOM:', (html.match(/<input/g) || []).length);

  await browser.close();
}

inspectFlutterWeb().catch(console.error);
