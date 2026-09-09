// One-off build tool: rasterises the brand mark SVGs into the favicon /
// touch-icon set using the pre-installed Chromium via Playwright, so the
// output matches real browser SVG rendering exactly.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const markSvg = readFileSync(path.join(root, 'src/assets/brand/mark.svg'), 'utf-8');
const tileSvg = readFileSync(path.join(root, 'src/assets/brand/mark-tile.svg'), 'utf-8');
const outDir = path.join(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

async function render(svg, size, outFile, { padding = 0, background = 'transparent' } = {}) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const inner = size - padding * 2;
  await page.setContent(`
    <html><body style="margin:0;width:${size}px;height:${size}px;background:${background};display:flex;align-items:center;justify-content:center;">
      <div style="width:${inner}px;height:${inner}px;">${svg}</div>
    </body></html>
  `);
  await page.screenshot({ path: outFile, omitBackground: background === 'transparent' });
  await browser.close();
}

const jobs = [
  // transparent mark — browser favicons
  ['favicon-16.png', markSvg, 16, {}],
  ['favicon-32.png', markSvg, 32, {}],
  ['favicon-48.png', markSvg, 48, {}],
  ['icon-192.png', markSvg, 192, {}],
  ['icon-512.png', markSvg, 512, {}],
  // solid tile — apple touch / maskable
  ['apple-touch-icon.png', tileSvg, 180, {}],
  ['icon-maskable-192.png', tileSvg, 192, { padding: 0 }],
  ['icon-maskable-512.png', tileSvg, 512, { padding: 0 }],
];

for (const [file, svg, size, opts] of jobs) {
  await render(svg, size, path.join(outDir, file), opts);
  console.log('rendered', file);
}
console.log('done');
