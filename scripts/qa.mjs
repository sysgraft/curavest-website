import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:4321';
const ROUTES = [
  '/',
  '/services/',
  '/services/fractional-cto/',
  '/services/fractional-cto/how-it-works/',
  '/services/fractional-cto/who-we-work-with/',
  '/track-record/',
  '/about/',
  '/start-a-conversation/',
  '/privacy/',
  '/this-page-does-not-exist/',
];

const VIEWPORTS = [
  { name: 'mobile-sm', width: 360, height: 780 },
  { name: 'mobile-lg', width: 430, height: 900 },
  { name: 'tablet', width: 834, height: 1100 },
  { name: 'laptop', width: 1280, height: 900 },
  { name: 'desktop', width: 1600, height: 1000 },
];

mkdirSync('/tmp/qa-shots', { recursive: true });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let totalIssues = 0;
let totalA11yViolations = 0;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    const response = await page.goto(BASE + route, { waitUntil: 'networkidle' });
    const status = response ? response.status() : 0;

    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      return { docWidth, winWidth, overflowing: docWidth > winWidth + 1 };
    });

    if (route !== '/this-page-does-not-exist/' && status >= 400) {
      console.error(`[ERROR] ${route} @ ${vp.name}: HTTP ${status}`);
      totalIssues++;
    }
    if (route === '/this-page-does-not-exist/' && status !== 404) {
      console.error(`[ERROR] 404 route returned status ${status}, expected 404`);
      totalIssues++;
    }
    if (overflow.overflowing) {
      console.error(
        `[ERROR] ${route} @ ${vp.name}: horizontal overflow (doc ${overflow.docWidth}px > viewport ${overflow.winWidth}px)`
      );
      totalIssues++;
    }
    if (consoleErrors.length > 0 && route !== '/this-page-does-not-exist/') {
      console.error(`[ERROR] ${route} @ ${vp.name}: console errors:`, consoleErrors);
      totalIssues++;
    }

    // Only run one axe pass per route (desktop) to keep things fast, plus one mobile pass.
    if (vp.name === 'desktop' || vp.name === 'mobile-sm') {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      if (results.violations.length > 0) {
        totalA11yViolations += results.violations.length;
        console.error(`[A11Y] ${route} @ ${vp.name}: ${results.violations.length} violation(s)`);
        for (const v of results.violations) {
          console.error(`   - ${v.id} (${v.impact}): ${v.help} [${v.nodes.length} node(s)]`);
          for (const node of v.nodes.slice(0, 3)) {
            console.error(`       target: ${node.target.join(' ')}`);
          }
        }
      }
    }

    const safeRoute = route.replace(/\//g, '_') || '_home';
    await page.screenshot({ path: `/tmp/qa-shots/${safeRoute}__${vp.name}.png`, fullPage: true });

    await context.close();
  }
  console.log(`Checked ${route}`);
}

await browser.close();
console.log(`\nDone. ${totalIssues} structural issue(s), ${totalA11yViolations} accessibility violation(s).`);
process.exit(totalIssues > 0 || totalA11yViolations > 0 ? 1 : 0);
