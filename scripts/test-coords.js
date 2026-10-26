const puppeteer = require('puppeteer-core');

async function testCoordinates() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  // Let's test tap at Y = 360, 380, 400, 420, 440, 460
  for (let y of [380, 410, 430, 450, 480, 510]) {
    await page.mouse.click(196, y);
    await new Promise(r => setTimeout(r, 300));
    const active = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, type: el.type, placeholder: el.placeholder } : null;
    });
    console.log(`Click at (196, ${y}) -> active element:`, active);
  }

  await browser.close();
}

testCoordinates().catch(console.error);
