// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Curavest — static marketing site, built for Cloudflare Pages deployment.
export default defineConfig({
  site: 'https://curavest.co.uk',
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
