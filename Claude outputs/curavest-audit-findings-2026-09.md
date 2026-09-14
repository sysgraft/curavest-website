# Curavest Website — Audit Findings (2026-09-14)

**Target:** `https://curavest-website.tictakt-app.workers.dev/` (the current live build — `curavest.co.uk` itself
is still pointed at a stale deployment, a separately-tracked issue).
**Scope:** Phases 1–3 of the audit plan run to full depth (performance, technical SEO, accessibility, link/asset
integrity, security, AI search visibility); Phases 4–5 (content/brand/CRO, analytics/email) covered at the level
the automated and code-level tooling available here supports. Everything below is from an actual tool run against
either the live site or a fresh local production build (`npm run build` + `astro preview`) — nothing is inferred
or assumed. Three small, unambiguous defects were fixed directly during this pass, per the project's standing
rule to fix rather than just report what's safely fixable; everything else is reported for review.

---

## Scorecard

| Category | Result |
|---|---|
| Lighthouse — Performance (desktop) | 100 on all 10 routes |
| Lighthouse — Performance (mobile) | 83–99; 2 routes below 95 (see CLS finding) |
| Lighthouse — Accessibility | 100 on 9/10 routes, 98 on `/services/` (see heading-order finding) |
| Lighthouse — SEO | 100 on all 10 routes |
| Lighthouse — Best Practices | 100 on all 10 routes |
| axe-core (5 viewports × 11 routes) | 0 violations |
| pa11y / HTML_CodeSniffer (11 routes) | 1 flag raised, investigated, confirmed a false positive |
| Internal links / missing images / placeholder content | 0 issues (11 pages) |
| Console errors / horizontal overflow | 0 (5 viewports × 11 routes) |
| npm audit | 0 vulnerabilities |
| Secrets in source or build output | 0 found |
| Structured data | Valid JSON on every page, 0 parse errors |

---

## Fixed during this audit

These were unambiguous, low-risk, and squarely code fixes — applied directly rather than just logged, per this
project's working rules. All three are in the working tree now, ready to go out with the next deploy.

1. **Hashed build assets weren't getting long-lived caching.** `public/_headers` had cache rules for `/assets/*`
   and `/fonts/*`, but Astro's actual hashed build output (every font, script, and stylesheet) is emitted under
   `/_astro/*` — confirmed by checking the live site's response headers directly: every font file was coming back
   `Cache-Control: public, max-age=0, must-revalidate`, the same non-caching policy as the HTML document itself,
   forcing a revalidation round-trip on every repeat visit for files that are safe to cache for a year (the
   filename hash changes whenever the content does). Added a `/_astro/*` rule matching the existing policy.
2. **The project's own QA script had a coverage gap.** `scripts/qa.mjs` (axe-core + overflow + console-error
   checks across 5 viewports × routes) was missing `/services/ai-integration/` from its route list — the page
   existed and was live, just never actually checked by this tooling. Added it; re-run confirmed clean.
3. **`package.json` didn't declare its own QA dependencies.** `playwright`, `@axe-core/playwright`, and `pa11y`
   were present in `node_modules` from a prior ad-hoc install, but not listed in `package.json` — a clean
   `npm install` (which is what actually happened at the start of this audit) silently removed them, breaking
   `scripts/qa.mjs` until they were reinstalled properly. Added all three as `devDependencies` so the QA tooling
   is reproducible from a clean checkout.

---

## Findings — need a decision or a deploy

### High

**H1. Real Core Web Vitals failure on mobile: homepage and AI Integration page both measure CLS 0.223** (the
"good" threshold is under 0.1; both are comfortably over it). Desktop is unaffected (CLS 0 on every page) —
this is mobile-only. Root cause, traced through the actual CSS and script: `Header.astro` deliberately ships a
no-JS fallback where the full navigation renders stacked and visible in the header at mobile widths before any
JavaScript runs — a genuinely good resilience choice. But the header's own script tag has no `async`/`defer`
override (Astro compiles it to a deferred `type="module"`, which runs after initial paint), so there's a real
window where the browser paints the tall, no-JS header, then the script runs, adds the `js-enhanced` class, and
the CSS collapses that stacked nav into a hidden off-canvas panel — shrinking the header and shifting everything
below it, including the hero, up the page. That shift is what Lighthouse is measuring. **Recommendation:** either
reserve the collapsed-state height from first paint (e.g. give the mobile nav a fixed max-height/placeholder
before JS runs) or make the enhancement happen before first paint via a small blocking inline script — both are
real code changes worth scoping properly rather than a one-line patch, so left for review rather than applied
blind.

### Medium

**M1. Heading order is invalid on `/services/`.** `ServiceCard.astro` renders an unconditional `<h3>`, and on
this page nothing at `<h2>` precedes it (the flow goes H1 → H3), with a real `<h2>` appearing further down the
page — out of order either way you read it. This is what's behind the `/services/` accessibility score sitting
at 98 instead of 100. Caught by Lighthouse's accessibility audit and confirmed by a direct heading-hierarchy
scan of the built HTML; axe-core did **not** flag it, because `heading-order` isn't part of the
`wcag2a`/`wcag2aa`/`wcag22aa` rule tags the existing QA script scopes axe to — a useful reminder of why this
audit cross-checked with a second and third tool rather than trusting one. Fix is straightforward: either give
the services list section its own `<h2>` before the cards, or make `ServiceCard`'s heading level a prop so the
hub page can use `<h2>` directly.

**M2. No Content-Security-Policy header.** Confirmed via direct inspection of the live response headers — CSP
is entirely absent (everything else — `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy` — is present and correct). Not a quick fix: the site is a fully static Cloudflare Worker
with no per-request dynamic response, so a nonce-based CSP isn't available, and the homepage alone ships one
real inline `<script type="module">` (the header's nav-enhancement script) plus four inline
`<script type="application/ld+json">` JSON-LD blocks whose content differs per page — a naive `script-src 'self'`
would break both. The practical path is either moving the header script to an external file (low-risk, worth
doing regardless) paired with per-page SHA-256 hashes for each page's JSON-LD content in `_headers`, or accepting
`'unsafe-inline'` for `script-src` as a pragmatic middle ground. Scoped here for a dedicated follow-up rather
than shipped without testing.

**M3. No rate limiting on the contact-form Edge Function.** The honeypot field is implemented correctly, but
there's no request throttling. Low real risk today (email sending is still disabled pending the Brevo secret),
but becomes a real cost/abuse vector the moment that secret is set — nothing currently stops a script from
submitting the form thousands of times. Needs a decision: application-level throttling inside the function
(track submissions per IP/time-window) is the most portable option, since the endpoint lives on `*.supabase.co`
rather than behind Curavest's own Cloudflare zone, so Cloudflare's rate-limiting rules don't apply to it.

**M4. Structured data completeness is inconsistent across pages.** `/services/fractional-cto/how-it-works/`,
`/services/fractional-cto/who-we-work-with/`, and `/track-record/` carry only `BreadcrumbList` JSON-LD, while
the rest of the site has richer `ProfessionalService`/`Organization`/`Person` schema. Not broken — every block
that exists is valid — but worth closing given how much AI answer engines (the GEO/AEO audit category) lean on
structured data for extraction confidence, and given this site already does schema well elsewhere.

**M5. No analytics or tracking of any kind is installed.** Confirmed by tracing every network request the
homepage makes on load — zero analytics beacons, zero tracking scripts. This isn't a defect so much as an
operational blind spot: there's currently no way to know what's converting, no Core Web Vitals field data, and
no way anyone would have caught the CLS regression above except by running an audit like this one manually.
Recommend a lightweight, cookie-consent-free option — Cloudflare Web Analytics costs nothing extra since the
site is already on Cloudflare, and needs no cookie banner.

### Low

**L1. The old `/services/fractional-cto/who-i-work-with/` URL 404s instead of redirecting.** The page was
correctly renamed to `/who-we-work-with/` in an earlier round, but the old URL returns a plain 404 rather than
a 301. Low real-world impact given the site's age and traffic, but if that URL was ever shared, bookmarked, or
indexed, a redirect would preserve it rather than lose it.

**L2. A few titles and meta descriptions run long enough to risk SERP truncation.** The homepage title (64
chars) and `/who-we-work-with/`'s title (70 chars) exceed Google's soft ~60-char guideline; the AI Integration
page's meta description (204 chars) and three others (172–181 chars) exceed the ~155–160 char soft guideline.
Not an error — Google's actual cutoff is pixel-based and somewhat elastic — but worth tightening for pages
likely to compete on click-through.

### Note

**N1. This Supabase project is shared with an unrelated CRM/agency application**, and the security advisor
scan surfaced real findings that belong entirely to that other app — 11 functions with a mutable search path,
32 `SECURITY DEFINER` functions callable by the `anon`/`authenticated` roles, and leaked-password-protection
disabled. None of these touch Curavest's own objects: `curavest_contact_submissions` was independently
re-confirmed this pass as RLS-enabled with zero policies (service-role-only access, exactly as designed), and
`curavest-contact-form` is the only Curavest Edge Function on the project. Flagging this only because it's
Euan's org and the advisories are real, even though they're out of this website's scope.

**N2. The `sysgraft/curavest-website` GitHub repo surfaced in a plain web search** for the site's own name.
Worth Euan confirming on GitHub's side whether that's intentionally public — this audit found no secrets in the
repo or build output either way (checked directly), so the exposure risk, if any, is limited to implementation
details rather than credentials.

**N3. `curavest.co.uk` (as opposed to the workers.dev URL audited here) does not yet appear in general web
search** for the site's own core positioning phrase. Expected for a very new, low-traffic, not-yet-linked-to
site — recorded as an honest baseline for the AI-visibility work in the original audit plan, not a defect.
`llms.txt` remains absent, consistent with the plan's "optional, unproven, low priority" call on that file.

---

## Confirmed clean — verified, not assumed

- **Accessibility, cross-validated by three independent tools:** Lighthouse's accessibility category, axe-core
  (via Playwright, `wcag2a`/`wcag2aa`/`wcag22aa` tags, 5 viewports × 11 routes), and pa11y/HTML_CodeSniffer
  (WCAG2AA, 11 routes) all ran clean except for the two items above. pa11y's one flag — the header/footer logo
  image missing `alt` text — was investigated against the actual source rather than taken at face value: the
  image correctly has `alt=""` with the accessible name supplied by `aria-label="Curavest — home"` on the
  enclosing link, which is the textbook-correct pattern; pa11y's `H30` rule doesn't account for an ancestor's
  `aria-label`, so this is a confirmed false positive, not a real defect.
- **Zero horizontal overflow and zero console errors**, checked across 5 viewport widths (360–1600px) on all
  11 routes including the 404 page.
- **Zero broken internal links, zero missing images, zero placeholder/TODO content** across all 11 built pages.
- **Every page has a unique title, unique meta description, correct self-referencing canonical pointing at the
  production `curavest.co.uk` domain** (even though this audit ran against the workers.dev origin), correct
  `lang="en-GB"`, and exactly one `<h1>`.
- **Structured data is valid JSON everywhere** (zero parse errors) using real schema.org types.
- **`robots.txt` is correctly permissive for AI crawlers** — a blanket `Allow: /` for all user agents, meaning
  GPTBot, ClaudeBot, PerplexityBot and similar are not blocked. A genuine GEO/AEO strength.
- **Every page's full content is present in the raw, un-rendered server HTML** — verified directly (4,548
  characters of real visible text on the homepage alone with zero JavaScript executed), meaning AI crawlers that
  don't execute JS still see complete content. Another real GEO/AEO strength, not a default assumption.
- **`npm audit`: zero vulnerabilities** at any severity.
- **No secrets anywhere** — scanned build output and source for known key/token patterns, found none; `.gitignore`
  correctly excludes `.env`/`.env.production`/`.env.local`.
- **No exposed debug or admin surface** — `.env`, `.git/config`, `.git/HEAD`, `/admin`, `wrangler.toml`,
  `package.json` all correctly 404 on the live site.
- **CORS re-verified end-to-end from the live origin**, independent of last session's work: a real POST request
  matching the actual form's exact shape, from the actual workers.dev origin, succeeds and returns the honest
  503 — and the Supabase dashboard independently confirms `curavest-contact-form` is ACTIVE at version 5, the
  CORS-fixed version. (A quick manual OPTIONS-preflight probe during this pass initially looked like a
  regression — investigated before reporting it, and it turned out to be a false alarm from the probe method
  itself, not a real issue. Noted here so the methodology is transparent.)
- **All declared icon/favicon/manifest assets resolve correctly** (200) on the live site.
- **Sitemap is valid** — 10/10 real routes present, 404 page correctly excluded, canonical `curavest.co.uk`
  domain used throughout.
- **The email logo asset is live and correct** on this build (`/brand/email/curavest-logo.png` → 200) — this
  was the broken-logo bug found last session, confirmed fixed here; it remains broken only on the stale
  `curavest.co.uk` custom domain, which is a separately tracked, already-documented issue (DNS/deployment
  target, not a code defect).
- **Brand colour tokens carry explicit provenance comments** matching the brand guidelines' own labels (Primary
  Blue, Secondary Dark, etc.), including deliberately contrast-adjusted variants for AA compliance on dark
  backgrounds — strong evidence the token system was built carefully from source, not guessed.
- **The "no gratuitous rounding" brand principle holds almost everywhere** — only two non-zero
  `border-radius` declarations exist sitewide (one circular element, one header component), neither reads as a
  violation on inspection.

---

## Not reachable this pass

Consistent with what the original audit plan flagged up front — nothing new here, just confirmed still
outstanding:

1. **DNS records (SPF/DKIM/DMARC)** for `curavest.co.uk` — this sandbox can't resolve arbitrary external DNS.
   Needs either Euan's Cloudflare DNS dashboard access, or a pasted `dig`/`nslookup` result.
2. **HSTS** — not present on the live response; this is typically a Cloudflare zone-level dashboard toggle
   rather than a code change, so it needs Euan's Cloudflare access rather than a repo fix.
3. **Brevo sender/domain verification status** — needs Euan's Brevo dashboard (already an open item from the
   contact-form work).
4. **Full email-client rendering matrix and spam-score tooling** — paid/account-gated services, skippable
   without loss of core functionality.
5. **A genuine screen-reader pass** (NVDA/VoiceOver/JAWS) — neither environment available to this session has
   one; the accessibility-tree structural check substitutes but isn't equivalent, and this report says so
   rather than implying full screen-reader coverage.
6. **Real-user Core Web Vitals (CrUX) field data** — the site almost certainly doesn't have enough traffic yet
   for a CrUX report to exist; connects to the "no analytics installed" finding above (M5) — there's currently
   no way to check this even if it existed.

---

## Recommended next steps, in order

1. Ship the three fixes already made (headers cache rule, QA script route, package.json deps) with the next
   deploy — no review needed, they're config/tooling corrections with no behavioural risk.
2. Decide on the CLS fix approach for H1 (reserve height vs. synchronous pre-paint enhancement) — this is the
   one finding here that a real visitor would actually feel.
3. Quick fix for M1 (heading order on `/services/`) — small, contained, no design risk.
4. Decide on M2 (CSP) and M3 (rate limiting) — both need a real decision, not a blind patch.
5. Everything else (M4, L1, L2, the Notes) can be batched into routine maintenance whenever convenient.
