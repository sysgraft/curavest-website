import { chromium } from 'playwright';

const routes = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const route of routes) {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await context.newPage();
  await page.goto('http://localhost:4321' + route, { waitUntil: 'networkidle' });
  const offenders = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const results = [];
    document.querySelectorAll('body *').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth + 1 || rect.width > docWidth + 1) {
        results.push({
          tag: el.tagName,
          cls: el.className && typeof el.className === 'string' ? el.className.slice(0, 80) : '',
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        });
      }
    });
    return results.slice(0, 15);
  });
  console.log(`\n=== ${route} ===`);
  console.log(offenders);
  await context.close();
}

await browser.close();
