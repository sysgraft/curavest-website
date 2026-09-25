// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Curavest — static marketing site. Deploys as a Cloudflare Worker with static
// assets; www.curavest.co.uk is also served by the curavest-website Pages
// project (see README "Deploying to Cloudflare").
export default defineConfig({
  // Must match SITE.url in src/lib/site.ts — www is the main address.
  site: 'https://www.curavest.co.uk',
  trailingSlash: 'always',
  output: 'static',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
