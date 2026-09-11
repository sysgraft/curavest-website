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
- **Cloudflare Pages** for hosting, with one Pages Function (`functions/api/contact.ts`) handling the
  contact form's server-side send. Everything else is prebuilt static HTML/CSS/assets.

## Project structure

```
src/
  components/   Reusable UI: Header, Footer, PageHero, ServiceCard, CaseStudy, ContactForm, FaqAccordion…
  layouts/       BaseLayout.astro — <head>, header/footer shell, skip link
  lib/          Site data (nav, contact details), FAQ content, schema.org JSON-LD helpers
  pages/        One file/folder per route (see Sitemap below)
  styles/       tokens.css (design tokens) + global.css (reset, type, components)
  assets/brand/ Source SVGs for the Curavest mark
public/
  icons/, favicon.ico, site.webmanifest   Generated favicon/app-icon set
  images/og/default.png                   Default social share image
  _headers                                Cloudflare Pages security headers
functions/api/contact.ts   Cloudflare Pages Function backing the contact form
scripts/                   Build-time tooling (icon/OG generation, link + a11y QA) — not shipped
```

## Sitemap

| Path | Page |
| --- | --- |
| `/` | Home |
| `/services/` | Services hub |
| `/services/fractional-cto/` | Fractional CTO Services |
| `/services/fractional-cto/how-it-works/` | How It Works (Diagnose · Engineer · Prove) |
| `/services/fractional-cto/who-i-work-with/` | Who I Work With |
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

The "Start a Conversation" form posts to `/api/contact`, a Cloudflare Pages Function
(`functions/api/contact.ts`). It validates input server-side and sends the message via
[Resend](https://resend.com). **This repository intentionally contains no credentials** — until it's
configured, the endpoint responds with a clear, honest 503 and the form's UI tells the visitor to email
directly instead. It never silently pretends to succeed.

To wire it up for real delivery:

1. Create a free [Resend](https://resend.com) account and verify a sending domain (e.g. `curavest.co.uk`,
   or a subdomain like `mail.curavest.co.uk`).
2. Generate an API key with sending access.
3. In the Cloudflare Pages project settings → **Environment variables**, add:
   - `RESEND_API_KEY` — the key from step 2 (mark as a secret).
   - `CONTACT_TO_EMAIL` — optional, defaults to `euan.pallister@curavest.co.uk`.
   - `CONTACT_FROM_EMAIL` — optional, e.g. `"Curavest Website <noreply@curavest.co.uk>"`. Must be on the
     verified domain from step 1, otherwise Resend will reject the send.
4. Redeploy. See `.env.example` for the same reference locally.

Until configured, nothing needs to change in code — the isolation is deliberate (see the comment block at
the top of `functions/api/contact.ts`).

## Deploying to Cloudflare Pages

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `/` (repo root)
- Framework preset: Astro (or "None" — the static output needs no special handling)

Connect the GitHub repository directly in the Cloudflare Pages dashboard for automatic deploys on push to
`main`, or deploy manually with `npx wrangler pages deploy dist`. `wrangler.toml` at the repo root already
points `pages_build_output_dir` at `dist`.

No environment variables are required for the site itself to build and serve; only the contact form
function needs the variables above, and only once you want it to actually send email.

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
  warehouses, blueprints — explicitly not stock "handshake" photos). This build's sandbox has no network
  access to stock-photo CDNs, so real photography could not be sourced or verified as appropriately licensed
  here regardless — and generic stock wouldn't match the guidelines' intent even if it were reachable. The
  site currently uses an original SVG diagram system in its place (the schematic hero graphic, the
  Diagnose·Engineer·Prove stage diagram, and — on "Who I Work With" — a larger, sector-specific schematic
  illustration per industry: `src/components/SectorIllustration.astro`, one distinct motif per sector rather
  than a repeated icon, each closing on the same accent-filled node used by the hero's CONSTRAINT/RESULT
  markers). Swapping in real photography of the business, its work, or its sectors — once available — is the
  one guideline requirement not yet implemented; the guidelines' "Industry Grid" card component (`docs` §3)
  is specified with a top-half image slot ready for it.

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

- **Real photography is the one open item.** See "Imagery" above — this sandbox cannot reach stock-photo
  CDNs, and generic stock wouldn't match the guidelines' brief anyway ("unfiltered images of industrial
  environments... avoid stock 'handshake' photos"). Drop real photos into `src/assets/` and wire them into
  the guidelines' "Industry Grid" card component and the homepage/hero when available.
- **The guidelines' component patterns not yet fully built out:** the Digital Playbook (§3) specifies an
  "Industry Grid" card (3-column, top-half image, 4px Primary Blue accent bar, uppercase title, "Read More"
  link with arrow) for sector/service listings. The accent-bar/uppercase/typography parts of this are
  implementable now; the image half is blocked on real photography per above.
- **Legal name / structured data:** `Curavest Ltd` and `Euan Pallister` are used in `Organization`/`Person`
  schema and the footer/legal copy, based on the supplied contact details and SEO implementation notes. No
  company registration details were supplied, so none are shown.
