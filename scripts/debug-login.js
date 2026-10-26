const puppeteer = require('puppeteer-core');

async function inspectPage() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  console.log('Visiting login...');
  await page.goto('https://workshop.theplately.com/login', { waitUntil: 'networkidle2' });

  console.log('Typing credentials...');
  await page.type('input[type="email"]', 'demo@plately.app');
  await page.type('input[placeholder="Enter your password"]', '12345678');
  await page.click('button[type="submit"]');

  await new Promise((r) => setTimeout(r, 6000));
  console.log('Current URL:', page.url());

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body text:\n', bodyText);

  await browser.close();
}

inspectPage().catch(console.error);
