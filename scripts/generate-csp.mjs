// Post-build step: computes a real, hash-based Content-Security-Policy for
// every built page and appends it to dist/_headers.
//
// Why hash-based rather than 'unsafe-inline': the site ships a handful of
// genuinely inline <script>/<style> blocks per page (JSON-LD structured
// data, and a couple of small component styles Astro inlines rather than
// extracting) — content that differs page to page. Cloudflare's static
// Worker serves dist/_headers as-is with no per-request templating, so a
// nonce-based CSP isn't available here; the alternative to hashing every
// inline block is 'unsafe-inline', which defeats most of what a CSP is
// for. Hashing is more work but a real script-src/style-src allowlist.
//
// This runs on every build (wired into `npm run build`), so the hashes are
// always freshly computed from whatever actually got built — there is
// nothing to hand-maintain when a page's JSON-LD or styles change.
//
// Found missing entirely during the Sept 2026 audit (no CSP header of any
// kind was present on the live site).

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, appendFileSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');
const HEADERS_FILE = path.join(DIST, '_headers');

// The contact form (src/components/ContactForm.astro) posts directly to
// this Supabase Edge Function from the browser — see src/lib/site.ts.
const SUPABASE_ORIGIN = 'https://aoadptvrfuietytyfccp.supabase.co';

// Cloudflare Web Analytics (cookie-free, no consent banner needed). When it's
// switched on for the Pages project that serves www.curavest.co.uk, Cloudflare
// injects its beacon script at the edge; the script loads from the first
// origin and reports to the second. Without these two entries the CSP would
// silently block it and the dashboard would show no visits.
const CF_ANALYTICS_SCRIPT = 'https://static.cloudflareinsights.com';
const CF_ANALYTICS_REPORT = 'https://cloudflareinsights.com';

function sha256Base64(text) {
  return createHash('sha256').update(text, 'utf-8').digest('base64');
}

function findHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...findHtmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

// Map a dist/**/index.html (or dist/404.html) file path to the URL path
// Cloudflare's _headers file should match it on.
function toRoutePath(file) {
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  if (rel === '404.html') return '/404.html';
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/index\.html$/, '');
}

function extractInlineBlocks(html, tagName) {
  // Matches <script ...>...</script> / <style ...>...</style> where the
  // opening tag has no src attribute (an inline block, not an external
  // resource) — src-bearing tags don't need a hash, 'self' already covers
  // them since every asset is same-origin.
  const re = new RegExp(`<${tagName}((?:\\s+[^>]*)?)>([\\s\\S]*?)</${tagName}>`, 'g');
  const blocks = [];
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    const content = m[2];
    if (content.trim().length === 0) continue;
    blocks.push(content);
  }
  return blocks;
}

function decodeHtmlEntities(text) {
  // The value CSP hashes is the attribute value *after* HTML parsing, not
  // the raw source bytes — so a value containing an entity (e.g. an "&" in
  // a background-image url) must be decoded first or the hash won't match
  // what the browser actually computes. Only the handful of entities Astro
  // itself would ever emit inside an attribute are handled.
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractInlineStyleAttrs(html) {
  // ComparisonBar.astro (and similar components) render server-computed,
  // per-instance values as a literal style="..." attribute (e.g.
  // style="width:66.66666666666666%") — there's no static <style> block
  // that could contain these since the value differs per case study/page.
  // CSP hashes for <style> *elements* don't cover style *attributes*; the
  // platform's mechanism for that is 'unsafe-hashes' plus a hash of each
  // attribute's exact value, which is what this collects.
  const re = /\sstyle="([^"]*)"/g;
  const values = [];
  let m;
  while ((m = re.exec(html))) {
    values.push(decodeHtmlEntities(m[1]));
  }
  return values;
}

const files = findHtmlFiles(DIST);
let headerBlock = '\n';

for (const file of files) {
  const html = readFileSync(file, 'utf-8');
  const routePath = toRoutePath(file);

  const scriptHashes = [...new Set(extractInlineBlocks(html, 'script').map((c) => `'sha256-${sha256Base64(c)}'`))];
  const styleHashes = [...new Set(extractInlineBlocks(html, 'style').map((c) => `'sha256-${sha256Base64(c)}'`))];
  const styleAttrHashes = [
    ...new Set(extractInlineStyleAttrs(html).map((c) => `'sha256-${sha256Base64(c)}'`)),
  ];

  const scriptSrc = ["'self'", CF_ANALYTICS_SCRIPT, ...scriptHashes].join(' ');
  // 'unsafe-hashes' only relaxes style *attributes* (and event-handler
  // attributes, unused here) matching one of the listed hashes — every
  // other inline style still needs a matching <style>-element hash above.
  // Omitted when a page has no computed inline style attributes at all.
  const styleSrc = [
    "'self'",
    ...(styleAttrHashes.length ? ["'unsafe-hashes'"] : []),
    ...styleHashes,
    ...styleAttrHashes,
  ].join(' ');

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self'",
    "font-src 'self'",
    `connect-src 'self' ${SUPABASE_ORIGIN} ${CF_ANALYTICS_REPORT}`,
    `form-action 'self' ${SUPABASE_ORIGIN}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  headerBlock += `${routePath}\n  Content-Security-Policy: ${csp}\n\n`;
}

appendFileSync(HEADERS_FILE, headerBlock);
console.log(`[generate-csp] wrote per-page CSP rules for ${files.length} page(s) to dist/_headers`);
