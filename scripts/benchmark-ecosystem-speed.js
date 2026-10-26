const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const https = require('https');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = 'C:\\Users\\Shukurillokh\\.gemini\\antigravity\\brain\\c0b559bf-600a-43b0-978c-25322e865b0e\\benchmarks';

function pingHttps(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          latencyMs: Date.now() - start,
          contentLength: data.length,
        });
      });
    });
    req.on('error', (e) => {
      resolve({
        url,
        status: 0,
        latencyMs: Date.now() - start,
        error: e.message,
      });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 408,
        latencyMs: Date.now() - start,
        error: 'Timeout',
      });
    });
  });
}

// Noor 3PL Pricing Formula Benchmark
function benchmarkNoorPricing(iterations = 10000) {
  const start = process.hrtime.bigint();
  let totalFee = 0;
  for (let i = 0; i < iterations; i++) {
    const distanceKm = 1 + (i % 20) * 0.75;
    let fee = 15000;
    if (distanceKm > 3) {
      fee += Math.ceil(distanceKm - 3) * 3000;
    }
    totalFee += fee;
  }
  const end = process.hrtime.bigint();
  const timeNs = Number(end - start);
  return {
    iterations,
    totalTimeMs: (timeNs / 1e6).toFixed(3),
    opsPerSec: Math.round((iterations / (timeNs / 1e9))),
  };
}

// Recipe Matcher Scoring Algorithm Benchmark
function benchmarkRecipeMatcher(recipeCount = 100, inventoryCount = 40, iterations = 1000) {
  const mockInventory = new Set(Array.from({ length: inventoryCount }, (_, i) => `item_${i}`));
  const mockRecipes = Array.from({ length: recipeCount }, (_, r) => ({
    id: `recipe_${r}`,
    ingredients: Array.from({ length: 6 + (r % 6) }, (_, j) => `item_${(r * 2 + j) % 60}`),
  }));

  const start = process.hrtime.bigint();
  let totalMatches = 0;
  for (let it = 0; it < iterations; it++) {
    for (const recipe of mockRecipes) {
      let matched = 0;
      for (const ing of recipe.ingredients) {
        if (mockInventory.has(ing)) matched++;
      }
      const score = (matched / recipe.ingredients.length) * 100;
      if (score >= 80) totalMatches++;
    }
  }
  const end = process.hrtime.bigint();
  const timeNs = Number(end - start);
  return {
    recipeCount,
    inventoryCount,
    iterations,
    evaluations: recipeCount * iterations,
    totalTimeMs: (timeNs / 1e6).toFixed(3),
    evalsPerSec: Math.round((recipeCount * iterations) / (timeNs / 1e9)),
  };
}

async function main() {
  console.log('=== STARTING ECOSYSTEM PERFORMANCE & SPEED BENCHMARK ===');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. BACKEND API LATENCY BENCHMARKS
  console.log('Testing Backend API Latency across endpoints...');
  const endpoints = [
    'https://workshop.theplately.com/api/health',
    'https://workshop.theplately.com/api/branches/public',
    'https://workshop.theplately.com/api/website/config?slug=kamolon-osh-markazi',
    'https://workshop.theplately.com/api/domains/verify?domain=order.kamolonosh.uz',
    'https://workshop.theplately.com/store/kamolon-osh-markazi',
    'https://workshop.theplately.com/login',
    'https://theplately.com',
    'https://app.theplately.com',
  ];

  const apiResults = [];
  for (const ep of endpoints) {
    const res = await pingHttps(ep);
    console.log(`  [HTTP ${res.status}] ${res.latencyMs}ms -> ${ep}`);
    apiResults.push(res);
  }

  // 2. ALGORITHMIC EFFICIENCY BENCHMARKS
  console.log('Benchmarking Algorithms (Noor Fee & Recipe Matcher)...');
  const noorBench = benchmarkNoorPricing(50000);
  console.log(`  Noor Fee Engine: ${noorBench.opsPerSec.toLocaleString()} ops/sec (${noorBench.totalTimeMs} ms for 50k ops)`);

  const matcherBench = benchmarkRecipeMatcher(100, 40, 2000);
  console.log(`  Recipe Matcher: ${matcherBench.evalsPerSec.toLocaleString()} recipe evaluations/sec (${matcherBench.totalTimeMs} ms for 200k evals)`);

  // 3. FRONTEND NAVIGATION & WEB VITALS VIA PUPPETEER
  console.log('Measuring Core Web Vitals via Headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const webVitals = {};

  // Marketing site speed
  try {
    const startMkt = Date.now();
    await page.goto('https://theplately.com', { waitUntil: 'networkidle2', timeout: 30000 });
    const durationMkt = Date.now() - startMkt;

    const metricsMkt = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      return {
        dnsMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcpMs: Math.round(nav.connectEnd - nav.connectStart),
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domInteractiveMs: Math.round(nav.domInteractive - nav.startTime),
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        windowLoadMs: Math.round(nav.loadEventEnd - nav.startTime),
        fcpMs: Math.round(fcp),
      };
    });
    metricsMkt.wallClockLoadMs = durationMkt;
    webVitals['theplately.com'] = metricsMkt;
    console.log('  Marketing Web Vitals:', metricsMkt);
  } catch (err) {
    webVitals['theplately.com'] = { error: err.message };
  }

  // Workshop OS speed
  try {
    const startWs = Date.now();
    await page.goto('https://workshop.theplately.com/login', { waitUntil: 'networkidle2', timeout: 30000 });
    const durationWs = Date.now() - startWs;

    const metricsWs = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      return {
        dnsMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcpMs: Math.round(nav.connectEnd - nav.connectStart),
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domInteractiveMs: Math.round(nav.domInteractive - nav.startTime),
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        windowLoadMs: Math.round(nav.loadEventEnd - nav.startTime),
        fcpMs: Math.round(fcp),
      };
    });
    metricsWs.wallClockLoadMs = durationWs;
    webVitals['workshop.theplately.com'] = metricsWs;
    console.log('  Workshop OS Web Vitals:', metricsWs);
  } catch (err) {
    webVitals['workshop.theplately.com'] = { error: err.message };
  }

  // Consumer Mobile Web App speed
  try {
    const startApp = Date.now();
    await page.goto('https://app.theplately.com', { waitUntil: 'networkidle2', timeout: 45000 });
    const durationApp = Date.now() - startApp;

    const metricsApp = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      return {
        dnsMs: Math.round(nav.domainLookupEnd - nav.domainLookupStart),
        tcpMs: Math.round(nav.connectEnd - nav.connectStart),
        ttfbMs: Math.round(nav.responseStart - nav.requestStart),
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        windowLoadMs: Math.round(nav.loadEventEnd - nav.startTime),
      };
    });
    metricsApp.canvasKitBootstrapMs = durationApp;
    webVitals['app.theplately.com'] = metricsApp;
    console.log('  Consumer App Web Vitals:', metricsApp);
  } catch (err) {
    webVitals['app.theplately.com'] = { error: err.message };
  }

  await browser.close();

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    apiEndpoints: apiResults,
    algorithmBenchmarks: {
      noorCourierPricing: noorBench,
      recipeMatcherScoring: matcherBench,
    },
    webVitals,
  };

  const reportPath = path.join(OUTPUT_DIR, 'speed-benchmark-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`=== BENCHMARK COMPLETED: Saved to ${reportPath} ===`);
}

main().catch(console.error);
