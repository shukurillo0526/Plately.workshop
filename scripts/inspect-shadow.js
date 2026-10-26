const puppeteer = require('puppeteer-core');

async function inspectShadow() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2 });
  await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  // Click on the email field
  console.log('Clicking (196, 428)...');
  await page.mouse.click(196, 428);
  await new Promise(r => setTimeout(r, 1000));

  const activeElementInfo = await page.evaluate(() => {
    const el = document.activeElement;
    function getShadowInputs(node) {
      let inputs = [];
      if (!node) return inputs;
      if (node.querySelectorAll) {
        inputs.push(...Array.from(node.querySelectorAll('input, textarea')));
      }
      if (node.shadowRoot) {
        inputs.push(...getShadowInputs(node.shadowRoot));
      }
      for (const child of node.children || []) {
        inputs.push(...getShadowInputs(child));
      }
      return inputs;
    }
    const allInputs = getShadowInputs(document.body);
    return {
      activeTag: el ? el.tagName : null,
      activeType: el ? el.type : null,
      activeClass: el ? el.className : null,
      inputCount: allInputs.length,
      inputs: allInputs.map(i => ({ tag: i.tagName, type: i.type, placeholder: i.placeholder, val: i.value }))
    };
  });

  console.log('Active element & shadow inputs:', JSON.stringify(activeElementInfo, null, 2));

  await browser.close();
}

inspectShadow().catch(console.error);
