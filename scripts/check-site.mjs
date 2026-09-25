// Static validation pass over the built dist/ output: internal link
// integrity, missing images/alt text, placeholder text, and basic
// heading-hierarchy sanity. Run after `astro build`.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'dist');
const htmlFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (entry.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const KNOWN_EXTERNAL_HOSTS = ['sysgraft.com', 'ico.org.uk'];
const PLACEHOLDER_PATTERNS = [/lorem ipsum/i, /\btodo\b/i, /\bfixme\b/i, /\btbd\b/i, /placeholder text/i, /\[insert/i];

// Pages that legitimately *quote* placeholder text as a "before" example
// (the Limak Coffee case study describes the placeholder text it removed
// from the client's site). Only these exact phrases, only on these pages,
// are exempt — anything else still fails the check.
const QUOTED_EXAMPLES = {
  'track-record/limak-coffee/index.html': ['[INSERT RETURN ADDRESS]', 'placeholder text'],
};

let errors = 0;
let warnings = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf-8');
  const relFile = path.relative(root, file);

  // Internal links
  const hrefMatches = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefMatches) {
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (href.startsWith('http')) {
      const host = new URL(href).host.replace(/^www\./, '');
      if (!KNOWN_EXTERNAL_HOSTS.some((h) => host.endsWith(h)) && !href.startsWith('https://curavest.co.uk')) {
        warnings++;
        console.warn(`[warn] ${relFile}: external link to unexpected host: ${href}`);
      }
      continue;
    }
    let targetPath = href.split('#')[0].split('?')[0];
    if (!targetPath) continue;
    let resolved = path.join(root, targetPath);
    if (targetPath.endsWith('/')) resolved = path.join(resolved, 'index.html');
    else if (!path.extname(resolved)) resolved = resolved + '.html';
    if (!existsSync(resolved)) {
      errors++;
      console.error(`[error] ${relFile}: broken internal link -> ${href}`);
    }
  }

  // Images: src + alt
  const imgMatches = [...html.matchAll(/<img\b[^>]*>/g)];
  for (const imgTag of imgMatches.map((m) => m[0])) {
    const srcMatch = imgTag.match(/src="([^"]+)"/);
    if (srcMatch) {
      const src = srcMatch[1];
      if (!src.startsWith('http') && !src.startsWith('data:')) {
        const resolved = path.join(root, src.split('?')[0]);
        if (!existsSync(resolved)) {
          errors++;
          console.error(`[error] ${relFile}: missing image -> ${src}`);
        }
      }
    }
    if (!/alt="/.test(imgTag)) {
      errors++;
      console.error(`[error] ${relFile}: <img> missing alt attribute: ${imgTag.slice(0, 80)}`);
    }
  }

  // Placeholder content
  let scannable = html;
  for (const phrase of QUOTED_EXAMPLES[relFile.replace(/\\/g, '/')] ?? []) {
    scannable = scannable.split(phrase).join('');
  }
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(scannable)) {
      errors++;
      console.error(`[error] ${relFile}: possible placeholder content matching ${pattern}`);
    }
  }

  // Heading hierarchy: exactly one h1
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  if (h1Count !== 1) {
    errors++;
    console.error(`[error] ${relFile}: expected exactly 1 <h1>, found ${h1Count}`);
  }

  // Title + meta description present
  if (!/<title>[^<]+<\/title>/.test(html)) {
    errors++;
    console.error(`[error] ${relFile}: missing <title>`);
  }
  if (!/<meta name="description" content="[^"]+"/.test(html)) {
    errors++;
    console.error(`[error] ${relFile}: missing meta description`);
  }
  // noindex pages (the 404) deliberately carry no canonical — pointing an
  // error page's canonical at a URL is a mixed signal. Everything else must.
  const isNoindex = /<meta name="robots" content="noindex/.test(html);
  if (!isNoindex && !/<link rel="canonical" href="[^"]+"/.test(html)) {
    errors++;
    console.error(`[error] ${relFile}: missing canonical link`);
  }
}

console.log(`\nChecked ${htmlFiles.length} HTML files.`);
console.log(`${errors} error(s), ${warnings} warning(s).`);
if (errors > 0) process.exit(1);
