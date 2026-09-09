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

- **Colour, type and spacing tokens:** `src/styles/tokens.css`.
- **Palette:** near-black ink (`--color-ink`) and warm paper (`--color-paper`) for high contrast, a single
  cool accent (`--color-petrol`) for interaction (links, primary CTAs, focus), and a warm accent
  (`--color-copper`) reserved for proof-point numerals and small eyebrow labels — kept deliberately narrow
  so the accent stays meaningful rather than decorative.
- **Type:** IBM Plex Sans for headings/body, IBM Plex Mono for eyebrows, stat figures and index numbers —
  a nod to the technical/engineering positioning without resorting to a "generic SaaS" look.
- No stock photography is used. The site's visual system is built from original SVG diagrams (the
  schematic/circuit-style hero graphic, the Diagnose·Engineer·Prove stage diagram, sector icons) drawn to
  match the brand mark's angular, engineered character. This was a deliberate choice, not a placeholder —
  see "Notes for future maintainers" below.

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
  placeholder content. Neither is part of the production build; run them manually when changing markup:

  ```bash
  npm run build
  npx astro preview --port 4321 &
  node scripts/check-site.mjs
  node scripts/qa.mjs
  ```

## Notes for future maintainers

- **No stock photography:** the sandbox this site was built in had no network access to stock-photo CDNs,
  so the site leans entirely on an original SVG/diagram visual language instead of photography. This reads
  as intentional and fits the "industrial/engineering" brand direction well, but if real photography of the
  business, its founder, or client work becomes available later, there's room to introduce it — particularly
  a genuine photo for the About page and Open Graph image — without changing the underlying design system.
- **Supplied brand guidelines file was unusable:** the "Brand Guidelines and Playbook.html" project document
  turned out to be an incomplete browser-saved export of a chat session (an `<iframe>` pointing at a sibling
  `_files/` folder that was never included), not the guidelines document itself. What survived in the visible
  transcript was a clear late-stage direction to model the visual language on **Siemens.com** — industrial,
  grid-based, high-contrast. The colour palette, typography and component system here were built from that
  direction plus general brand-design judgement, not copied from a spec. If a real brand guidelines document
  surfaces later, the design tokens in `src/styles/tokens.css` are the single place to reconcile it against.
- **No logo files were usable** for the same reason (only filenames of a logo pack were visible in the
  transcript, no actual image data). The current mark (a chamfered square with a petrol accent cut, in
  `src/assets/brand/mark.svg`) is original and was designed to be simple enough to read at favicon size. If
  a real logo arrives, replace `src/components/Logo.astro` and the icon set in `scripts/gen-icons.mjs`.
- **Legal name / structured data:** `Curavest Ltd` and `Euan Pallister` are used in `Organization`/`Person`
  schema and the footer/legal copy, based on the supplied contact details and SEO implementation notes. No
  company registration details were supplied, so none are shown.
