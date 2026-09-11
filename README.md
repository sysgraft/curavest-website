# Curavest website

Production source for [curavest.co.uk](https://curavest.co.uk) — the marketing site for Curavest's
fractional CTO and related services.

## Stack

- **[Astro](https://astro.build)** (static output) — content-first, ships zero client JS by default,
  first-class support for the multi-page, mostly-static structure this site needs.
- Hand-written CSS with design tokens (`src/styles/tokens.css`) — no CSS framework. Fonts are
  [IBM Plex Sans / IBM Plex Mono](https://fontsource.org), self-hosted via `@fontsource/*` (no third-party
  font requests at runtime).
- A small amount of vanilla TypeScript for the header's mobile menu / dropdown and the contact form's
  progressive enhancement (client-side validation + fetch submission). Both degrade gracefully without JS.
- **Cloudflare Workers (with static assets)** for hosting — a single Worker (`worker/index.ts`) serves the
  prebuilt `dist/` output for every route and handles one API route itself, `/api/contact`, for the contact
  form's server-side send. Everything else is prebuilt static HTML/CSS/assets, so this is effectively a
  static site with one small serverless endpoint, not a server-rendered app.

## Project structure

```
src/
  components/   Reusable UI: Header, Footer, PageHero, SplitSection, ServiceCard, CaseStudy, ContactForm, FaqAccordion…
  layouts/       BaseLayout.astro — <head>, header/footer shell, skip link
  lib/          Site data (nav, contact details), FAQ content, schema.org JSON-LD helpers
  pages/        One file/folder per route (see Sitemap below)
  styles/       tokens.css (design tokens) + global.css (reset, type, components)
  assets/brand/ Source SVGs for the Curavest mark
public/
  icons/, favicon.ico, site.webmanifest   Generated favicon/app-icon set
  images/og/default.png                   Default social share image
  _headers                                Security headers, applied to the Worker's static-asset responses
worker/index.ts   Cloudflare Worker entry point — serves dist/ via the ASSETS binding, plus /api/contact
scripts/          Build-time tooling (icon/OG generation, link + a11y QA) — not shipped
```

## Sitemap

| Path | Page |
| --- | --- |
| `/` | Home |
| `/services/` | Services hub |
| `/services/fractional-cto/` | Fractional CTO Services |
| `/services/fractional-cto/how-it-works/` | How It Works (Diagnose · Engineer · Prove) |
| `/services/fractional-cto/who-i-work-with/` | Who I Work With |
| `/services/ai-integration/` | AI Integration Services |
| `/track-record/` | Track Record (case studies) |
| `/about/` | About Curavest |
| `/start-a-conversation/` | Contact + FAQ |
| `/privacy/` | Privacy Policy |

## Local development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-checks (astro check) then builds to dist/
npm run preview   # serve the built dist/ locally
```

Node 20+ is recommended.

## Contact form setup (required before the form can send mail)

The "Start a Conversation" form posts to `/api/contact`, handled directly by the Worker
(`worker/index.ts`) — everything else in that file just proxies to the static assets. It validates input
server-side and sends the message via [Resend](https://resend.com). **This repository intentionally
contains no credentials** — until it's configured, the endpoint responds with a clear, honest 503 and the
form's UI tells the visitor to email directly instead. It never silently pretends to succeed.

To wire it up for real delivery:

1. Create a free [Resend](https://resend.com) account and verify a sending domain (e.g. `curavest.co.uk`,
   or a subdomain like `mail.curavest.co.uk`).
2. Generate an API key with sending access.
3. In the Cloudflare dashboard → Workers & Pages → curavest-website → **Settings → Variables and Secrets**
   — make sure you're adding these as **Runtime** variables (the ones the deployed Worker reads), not
   **Build** ones (those only exist while `npm run build` / the deploy command are running):
   - `RESEND_API_KEY` — the key from step 2 (mark as a secret).
   - `CONTACT_TO_EMAIL` — optional, defaults to `euan.pallister@curavest.co.uk`.
   - `CONTACT_FROM_EMAIL` — optional, e.g. `"Curavest Website <noreply@curavest.co.uk>"`. Must be on the
     verified domain from step 1, otherwise Resend will reject the send.
4. Redeploy. See `.env.example` for the same reference locally.

Until configured, nothing needs to change in code — the isolation is deliberate (see the comment block at
the top of `worker/index.ts`).

## Deploying to Cloudflare

This deploys as a **Cloudflare Worker with static assets**, not a classic Cloudflare Pages project — that
distinction matters because the two use different `wrangler` subcommands and different dashboard URLs
(`workers/services/view/...` vs `pages/view/...`); using the wrong one fails with either a missing
entry-point error or a Pages-API authentication error.

- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy` (not `wrangler pages deploy` — there is no Pages project here)
- **Root directory:** `/` (repo root)

`wrangler.toml` at the repo root already points `main` at `worker/index.ts` and `[assets] directory` at
`dist`, so a manual deploy is just:

```bash
npm run build
npx wrangler deploy
```

Connect the GitHub repository in the Cloudflare dashboard (Workers & Pages → Create → Import a repository)
for automatic deploys on push to `main` — set the Build command and Deploy command exactly as above in that
project's Settings → Builds.

No **Build**-time environment variables are required for the site itself to build and deploy; only the
contact form needs the **Runtime** variables above, and only once you want it to actually send email — see
"Contact form setup".

## Design system

Implements **Curavest Ltd. Brand Guidelines & Digital Playbook v1.0** directly — this is not an inferred
or invented system.

- **Colour, type and spacing tokens:** `src/styles/tokens.css`.
- **Palette:** Primary Blue `#0056b3`, Secondary Dark `#2c2c2c`, Light BG `#f8f9fa`, Accent BG `#eef4fb`,
  per the guidelines' colour table. The logo file itself keeps its own traced brand blue (`#007DFE`, from
  `Curavest-Logo-Pack`) — that's a fact about the artwork, not a site colour — every other blue on the site
  is the guidelines' Primary Blue. `--color-petrol-strong`/`--color-petrol-bright` are AA-contrast-safe
  variants of Primary Blue for hover states and use on the dark Secondary Dark background respectively.
- **Type:** Inter throughout (guidelines §2), self-hosted via `@fontsource/inter` rather than loaded from
  Google Fonts at runtime — same visual result, no third-party font request. Headings are bold with tight
  tracking (-0.02em); buttons/uppercase labels are semi-bold with 0.5px letter-spacing — both exact values
  from the guidelines.
- **Shape:** 0px border-radius everywhere (`--radius-sm`/`--radius-md`) — guidelines: "Sharp corners for an
  industrial feel."
- **Buttons:** Primary = solid Primary Blue with white text, hover darkens + lifts. Secondary = transparent
  with a Primary Blue border, hover fills Primary Blue. The homepage hero specifically reverses this
  (`.home-hero .btn-primary`) to a white button with dark text, per the guidelines' Hero Banner component
  spec ("CTA: White button with dark text (high contrast reverse)").
- **Logo:** the real `Curavest-Logo-Pack` SVGs, referenced from `public/brand/` via `src/components/Logo.astro`
  (colour wordmark on light backgrounds, white wordmark on the dark header/footer/hero). Favicons, the
  webmanifest, and the Safari pinned-tab mask icon all come from the same pack (`public/icons/`,
  `public/favicon.ico`, `public/site.webmanifest`). The full original pack is archived at
  `src/assets/brand/logo-pack/` for reference.
- **Imagery:** the guidelines call for high-contrast, unfiltered industrial photography (factories,
  warehouses, blueprints — explicitly not stock "handshake" photos). Real, licensed photography is live on
  every main page — homepage (two placements), Services hub, Fractional CTO Services, How It Works, Who I
  Work With, AI Integration Services, Track Record and About — each as a single full-bleed band via
  `src/components/PhotoBand.astro` (built on `astro:assets`: responsive, optimised WebP variants generated at
  build time, self-hosted with no runtime CDN dependency), used sparingly as a visual rest-point between
  prose sections rather than a repeated card grid. The About page additionally carries a real founder
  photograph (Euan Pallister, supplied by the client) alongside the "Start with the work, not the org chart"
  copy. Source JPEGs live in `src/assets/photography/`; sourcing notes, placements and photographer credit
  for each are recorded in `docs/photography-plan.md`.

  The site also keeps the original SVG diagram system it used before photography was sourced: the homepage
  hero's schematic graphic, the Diagnose·Engineer·Prove / Understand·Create·Implement stage diagrams, and —
  on "Who I Work With" — a larger, sector-specific schematic illustration per industry
  (`src/components/SectorIllustration.astro`, one distinct motif per sector rather than a repeated icon, each
  closing on the same accent-filled node used by the hero's CONSTRAINT/RESULT markers). `SchematicGraphic.astro`
  takes `labeled` and `onPaper` props so the same motif can also run, unlabelled and recoloured for a white
  background, as a faint watermark in the right-hand dead space of every interior page's `PageHero` (opt in
  via `<PageHero graphic>`, hidden below ~1200px) and full-size as the visual half of two homepage
  `SplitSection` blocks. These are complementary to the photography, not a placeholder for it — they
  illustrate abstract process/sector concepts that a photograph can't.
- **`SplitSection.astro`:** a reusable two-column layout (prose column + a named `visual` slot, `reverse` to
  flip sides, `visualStyle="frame"` for a bordered/padded photo or `"bleed"` for an edge-to-edge SVG motif).
  Used to pair copy with a photo or schematic graphic instead of leaving a wide viewport's second column
  empty — collapses to one column below ~1024px. `ServiceCard.astro` similarly gained a `@media (min-width:
  64rem)` mode that renders the 2–3 item service lists as a bordered card grid on wide screens instead of a
  stacked list, while staying the original single-column "dossier row" on mobile.

## Accessibility & SEO

- Semantic landmarks, one `<h1>` per page, logical heading order, visible focus rings, a skip-to-content
  link, and an accessible (keyboard- and screen-reader-operable) navigation dropdown and mobile menu that
  don't depend on hover.
- Per-page canonical URLs, Open Graph/Twitter metadata, and JSON-LD (`Organization`, `Person`,
  `ProfessionalService`, `WebSite`, `BreadcrumbList`, `FAQPage` on the FAQ section, `ContactPage`).
- `sitemap.xml` is generated automatically at build time (`@astrojs/sitemap`); `robots.txt` is static in
  `public/`.
- `scripts/qa.mjs` runs an automated pass (Playwright + axe-core) across every route at five viewport
  widths, checking for horizontal overflow, console errors and WCAG 2.1/2.2 AA violations.
  `scripts/check-site.mjs` checks the built HTML for broken internal links, missing image alt text, and
  placeholder content. Neither is part of the production build, and **Playwright/axe-core are deliberately
  not in `package.json`** — they're heavy native-browser dependencies with their own install-time download
  step, which has no reason to run on every `npm install` (including in CI/Cloudflare, where it can fail a
  build that doesn't even need it). Install them once, locally, when you need to run these scripts:

  ```bash
  npm install --no-save playwright @axe-core/playwright
  npm run build
  npx astro preview --port 4321 &
  node scripts/check-site.mjs
  node scripts/qa.mjs
  ```

## Notes for future maintainers

- **Real photography is shipped.** See "Imagery" above and `docs/photography-plan.md` for sourcing notes,
  placements, and photographer credit for every image, plus the founder photograph on the About page. This
  build sandbox itself has no network access to any external image host (confirmed: `images.unsplash.com`,
  `raw.githubusercontent.com` and `upload.wikimedia.org` all refuse the connection under its egress policy,
  and the same restriction was independently confirmed from the device-linked machine's own shell) — the
  images were sourced by driving a real browser session directly (not a restricted shell), which is not
  subject to that policy.
- **Deliberate deviation from the guidelines' literal "Industry Grid" card spec.** The Digital Playbook (§3)
  specifies a 3-column card (top-half image, 4px Primary Blue accent bar, uppercase title, "Read More" link)
  for sector/service listings. This site instead uses full-width dossier rows for service and sector lists
  (`ServiceCard.astro`, the sector list on "Who I Work With") and, for photography, single full-bleed bands
  between sections (`PhotoBand.astro`) rather than one image per card. This is a considered choice, not an
  oversight: source-of-truth priority 6 (established UX/accessibility/SEO best practice) and this project's
  explicit instruction to avoid "stock-template layouts" and "cookie-cutter" card grids outrank the literal
  component spec here, and a repeated 3-up image-card grid across five sectors risked exactly that.
- **Legal name / structured data:** `Curavest Ltd` and `Euan Pallister` are used in `Organization`/`Person`
  schema and the footer/legal copy, based on the supplied contact details and SEO implementation notes. No
  company registration details were supplied, so none are shown.
