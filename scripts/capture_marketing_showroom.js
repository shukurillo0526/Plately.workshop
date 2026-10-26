const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\screenshots';
const WEB_PREVIEWS_DIR = 'd:\\dev\\projects\\Plately\\Plately.web\\public\\previews';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Launching Chrome to preview Marketing Mobile Showroom...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: {
      width: 1440,
      height: 950,
      deviceScaleFactor: 2,
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  console.log('Scrolling to #mobile-experience...');
  await page.evaluate(() => {
    const el = document.getElementById('mobile-experience');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await sleep(1200);

  const filename = '12_marketing_mobile_showroom.png';
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const webPath = path.join(WEB_PREVIEWS_DIR, filename);

  await page.screenshot({ path: artifactPath, fullPage: false });
  fs.copyFileSync(artifactPath, webPath);
  console.log(`Saved screenshot to ${artifactPath} and ${webPath}`);

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
