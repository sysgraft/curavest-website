// Generates the default Open Graph / social share image (1200x630) using
// the pre-installed Chromium via Playwright, built from the same design
// tokens as the site so it matches the live brand exactly.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public/images/og');
mkdirSync(outDir, { recursive: true });

const plexSansBold = readFileSync(
  path.join(root, 'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2')
).toString('base64');
const plexSansRegular = readFileSync(
  path.join(root, 'node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2')
).toString('base64');
const plexMono = readFileSync(
  path.join(root, 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')
).toString('base64');

const html = `
<html><body style="margin:0;">
<style>
  @font-face { font-family: 'IBM Plex Sans'; font-weight: 700; src: url(data:font/woff2;base64,${plexSansBold}) format('woff2'); }
  @font-face { font-family: 'IBM Plex Sans'; font-weight: 400; src: url(data:font/woff2;base64,${plexSansRegular}) format('woff2'); }
  @font-face { font-family: 'IBM Plex Mono'; font-weight: 500; src: url(data:font/woff2;base64,${plexMono}) format('woff2'); }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#12161a; position:relative; overflow:hidden; font-family:'IBM Plex Sans',sans-serif; }
  .grid { position:absolute; inset:0; display:grid; grid-template-columns:repeat(12,1fr); padding-inline:64px; }
  .grid span { border-left:1px solid rgba(246,245,241,0.10); height:100%; }
  .grid span:last-child { border-right:1px solid rgba(246,245,241,0.10); }
  .content { position:relative; z-index:1; padding:72px; display:flex; flex-direction:column; justify-content:space-between; height:100%; }
  .logo { display:flex; align-items:center; gap:16px; }
  .logo svg { width:52px; height:52px; }
  .logo span { font-size:34px; font-weight:700; color:#f6f5f1; letter-spacing:-0.01em; }
  .eyebrow { font-family:'IBM Plex Mono',monospace; font-size:20px; letter-spacing:0.09em; text-transform:uppercase; color:#d97a3f; display:flex; align-items:center; gap:14px; }
  .eyebrow::before { content:''; width:32px; height:2px; background:currentColor; }
  h1 { font-size:64px; font-weight:700; color:#f6f5f1; line-height:1.08; letter-spacing:-0.01em; max-width:960px; margin-top:20px; }
  .sub { font-size:26px; color:#a9afb4; margin-top:24px; max-width:820px; line-height:1.5; }
  .accent-node { position:absolute; right:100px; bottom:110px; width:14px; height:14px; background:#14a89c; }
</style>
<div class="grid">
  <span></span><span></span><span></span><span></span><span></span><span></span>
  <span></span><span></span><span></span><span></span><span></span><span></span>
</div>
<div class="content">
  <div class="logo">
    <svg viewBox="0 0 100 100"><path d="M12 12 H62 L88 38 V88 H12 Z" fill="#F6F5F1" /><path d="M62 12 L88 38" stroke="#14A89C" stroke-width="5.5" stroke-linecap="square" /></svg>
    <span>Curavest</span>
  </div>
  <div>
    <p class="eyebrow">Fractional CTO Services</p>
    <h1>Practical support for growing operational businesses</h1>
    <p class="sub">Process leadership, technology decisions and AI used only where it earns its place.</p>
  </div>
</div>
</body></html>
`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(outDir, 'default.png') });
await browser.close();
console.log('OG image written to public/images/og/default.png');
