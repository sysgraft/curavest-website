# Curavest Website — World-Class Audit Plan (2026)

**Status:** Plan for review — no audits have been executed yet.
**Scope:** `curavest.co.uk` (11-page Astro static site on Cloudflare Workers, Supabase Edge Function
contact-form backend, Brevo transactional email).
**Prepared:** 2026-09-14

This is the test specification, not the results. Once you've reviewed and okayed it (or told me to cut/add
categories), I'll work through it and hand back a findings report per category, with every issue rated by
severity and either fixed directly (where it's mine to fix) or flagged with exactly what's needed from you.

---

## 0. How to read this document

**Structure.** Thirteen audit categories. Each has: what "world-class" means for that category, the
exhaustive list of specific checks, exactly which tool runs each check, and what (if anything) is out of
reach without further access from you.

**Severity scale** used in the eventual findings report:
- **Critical** — broken functionality, lost revenue/leads, legal exposure, security hole.
- **High** — materially hurts conversion, rankings, or accessibility for a real segment of users.
- **Medium** — a genuine defect or missed best practice, limited impact.
- **Low** — polish; correct but could be better.
- **Note** — not a defect, an observation or recommendation for later.

**A ground rule for this whole exercise:** no invented findings. Every item below either gets a pass, a
specific documented failure, or an honest "couldn't verify — needs X." That's the same standard this project
has held to throughout (no fabricated stats, no claimed testing that didn't happen).

---

## 1. Tooling inventory — verified, not assumed

Before writing the checklist below, I actually tested what's reachable from where, rather than assuming. The
results materially shape which tool runs which check:

| Environment | Reaches the live internet? | Verified this session | Use for |
|---|---|---|---|
| **This sandbox's shell (Bash)** | **No** — org egress policy allowlists only npm/PyPI/crates registries and Anthropic's own API; direct `curl` to `curavest.co.uk`, Google/SSL Labs/W3C/etc. all get a proxy `403 connect_rejected`. | Confirmed: `curl curavest.co.uk` → policy-rejected; `curl googleapis.com`, `api.ssllabs.com`, `securityheaders.com`, `validator.w3.org` → all policy-rejected. | Everything that only needs the **source code** or a **local dev server** — static analysis, `astro build`/`astro check`, `npm audit`, image inspection, HTML/schema linting against local output, and Lighthouse/axe/pa11y run against `localhost:4321` (an `astro dev` server started in this sandbox). |
| **WebFetch tool** | **Yes** — separate infrastructure from the sandbox shell. | Confirmed: fetched `curavest.co.uk/robots.txt` and `curavest-website.tictakt-app.workers.dev/robots.txt` successfully (got real content back, including a 404 on the stale domain). | Reading live page content/markup, robots.txt/sitemap.xml content, meta tags, structured data presence, on-page text — anywhere I need to see what a real visitor's browser would actually receive from production. |
| **WebSearch tool** | Yes. | Used already this session for 2026 landscape research. | GEO/AEO citation checks (does Curavest actually get surfaced by AI answers), competitive checks, verifying current standards (WCAG version, Core Web Vitals thresholds, etc.) rather than relying on training data. |
| **Linked device's real browser** (`Claude_Browser` tools, when your computer is linked) | Yes — full internet, already used this session and previous rounds against both live domains. | Confirmed working in earlier rounds (live-site screenshots, network-request inspection, form submission testing). | Visual QA at real viewport sizes, reading actual HTTP response headers (`read_network_requests`), running JS-rendered third-party tools that need a real browser (PageSpeed Insights UI, WAVE, Rich Results Test, Schema Markup Validator, Security Headers, SSL Labs) by navigating to them directly. |
| **`device_bash`** (shell on your Windows machine) | **No** — same org-level restriction; confirmed in earlier rounds blocked from `github.com` and `registry.npmjs.org`. Also can't mount this specific repo folder. | Confirmed (this session and prior). | Not usable for external audit tooling. Only relevant to this project for the file-sync workaround already in use for git delivery. |

**CLIs confirmed installed/runnable in this sandbox right now:** `astro check`, `@axe-core/playwright`
(already used in `scripts/qa.mjs`), Playwright + Chromium, `npx lighthouse` (v13.4.1, confirmed runs),
`npx pa11y` (v10.0.0, confirmed runs), `npm audit`, `curl`/`openssl` (local/registry use only, per above),
Node's built-in `dns` module (works for **local** resolution only — the sandbox's own DNS lookups for
arbitrary internet domains are equally policy-gated, confirmed via a timed-out `resolveTxt('google.com')`
test).

**Net effect on the plan below:** every check is tagged with exactly which of these five lanes runs it. Nothing
is marked "CLI" unless I've confirmed it actually works in this sandbox.

---

## 2. Performance & Core Web Vitals

**World-class bar (2026, verified against current Google guidance):** LCP < 2.5s, INP < 200ms, CLS < 0.1 —
the three official Core Web Vitals, unchanged since INP replaced FID in March 2024. TTFB and FCP remain
useful diagnostics, not official Vitals.

| # | Check | Tool |
|---|---|---|
| 2.1 | Lighthouse performance run (mobile + desktop presets) against local `astro dev` build for all 11 routes | `npx lighthouse` (Bash, local server) |
| 2.2 | Lighthouse run against the **live** URLs (`curavest-website.tictakt-app.workers.dev`, and `curavest.co.uk` once repointed) to catch CDN/edge-specific regressions local build can't show | Linked device browser, navigating to `pagespeed.web.dev` and entering the live URL (renders real Lighthouse against the live site) |
| 2.3 | JS bundle size audit — total shipped JS per page, any unused/duplicate dependencies | Bash: inspect `dist/_astro/*.js` output sizes after `astro build` |
| 2.4 | CSS payload audit — unused CSS, render-blocking stylesheets | Bash: Lighthouse "unused CSS" audit + manual inspection of `dist/_astro/*.css` |
| 2.5 | Image weight audit — format (WebP/AVIF vs JPEG/PNG), responsive `srcset` correctness, oversized variants (this class of bug has bitten this project before — the `PhotoBand` `width` regression) | Bash: inspect every generated image variant in `dist/`, flag anything disproportionately large for its container |
| 2.6 | Font loading — `font-display` strategy, self-hosted vs external, preload of critical fonts | Bash: read `@fontsource/inter` usage + built HTML `<link>` tags |
| 2.7 | Render-blocking resources on above-the-fold content | `npx lighthouse` render-blocking-resources audit |
| 2.8 | Layout shift sources — anything without reserved dimensions (images, embeds, web fonts causing FOIT/FOUT-driven reflow) | Lighthouse CLS diagnostics + manual Playwright scroll-and-measure pass |
| 2.9 | Caching headers / `Cache-Control` on static assets served by the Worker | Linked device browser `read_network_requests` against the live site |
| 2.10 | Time-to-first-byte at the edge (Cloudflare Worker cold start, if any) | Linked device browser network timing, live site |
| 2.11 | Field data (real-user CWV), if any exists yet given current traffic volume | WebFetch: check whether the site has any CrUX report data at all (likely "insufficient data" given traffic — will report honestly rather than claim a result) |

**Not runnable without more access:** WebPageTest.org and GTmetrix give richer waterfall detail than
Lighthouse alone, but both are reachable via the linked browser same as PageSpeed Insights, so no real gap
here — just extra time cost, which I'll use if 2.1–2.2 surface something ambiguous.

---

## 3. Technical SEO

| # | Check | Tool |
|---|---|---|
| 3.1 | `robots.txt` correctness — exists, allows the right paths, references the sitemap | WebFetch, live URL (already spot-checked: current build serves a correct one; `curavest.co.uk`'s stale deployment 404s — known issue) |
| 3.2 | `sitemap.xml`/`sitemap-index.xml` — valid, complete, matches actual routes, no orphaned or removed URLs | WebFetch + Bash cross-check against `dist/` routes |
| 3.3 | Canonical tags — present, correct, self-referencing, no conflicting signals | Bash: grep built HTML for `<link rel="canonical">` across all 11 pages |
| 3.4 | Title tag uniqueness and length (this project has already fixed one doubled-title bug — re-verify it hasn't regressed) | Bash: extract `<title>` from every built page |
| 3.5 | Meta description uniqueness, length, presence on every page | Bash: extract from built HTML |
| 3.6 | Heading hierarchy (single H1, logical H2/H3 nesting, no skipped levels) | Bash: parse built HTML per page |
| 3.7 | URL structure — descriptive, consistent trailing-slash convention, no parameter cruft | Bash: review `src/pages/` route structure |
| 3.8 | Internal linking — every page reachable within a few clicks, no orphans, anchor text descriptive (not "click here") | Existing `scripts/check-site.mjs` (already does link integrity) extended to check anchor text quality |
| 3.9 | Redirect audit — any redirect chains, any missing redirects from old URLs (e.g. the old `/services/fractional-cto/who-i-work-with/`, renamed this project) | Linked device browser: request old known URLs, confirm 301 vs 404 |
| 3.10 | Structured data validity — every JSON-LD block parses, uses correct schema.org types, matches on-page content | Linked device browser → Google's Rich Results Test and Schema Markup Validator, live URLs |
| 3.11 | Mobile-first indexing parity — confirm mobile-rendered content matches desktop (it should, this is a responsive site, but verify no `display:none`-hidden content that Google would discount) | Playwright, both viewport sizes, diff visible text |
| 3.12 | `hreflang` — not applicable (single-language UK site); document as N/A rather than silently skipping | — |
| 3.13 | Pagination/duplicate-content risk — not applicable (no blog/paginated listings currently); note as N/A | — |
| 3.14 | Favicon and site icons — full set (standard favicon, apple-touch-icon, manifest icons) present and correctly referenced | Bash: check `public/` and built `<head>` |
| 3.15 | Language declaration (`<html lang="en-GB">`) correct sitewide | Bash: grep built HTML |

---

## 4. AI Search Visibility — GEO / AEO

This is the genuinely new category since the last audit cycle. It's not yet a mature discipline with fixed
pass/fail thresholds the way Core Web Vitals is, so this section is framed as diagnostic + directional, and
I'll say so plainly in the findings rather than pretend it's as measurable as section 2.

| # | Check | Tool |
|---|---|---|
| 4.1 | AI-crawler access in `robots.txt` — confirm GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Bytespider are not blanket-blocked (current file allows all UAs, which is correct — verify it stays that way) | WebFetch |
| 4.2 | Server-rendered content parity — diff the raw HTML `curl`/WebFetch receives against what Playwright sees after JS execution; AI crawlers generally don't execute JS the way Googlebot increasingly does, so anything JS-injected-only is invisible to them | WebFetch (raw) vs Playwright (rendered), diffed |
| 4.3 | Structured data completeness for AI extraction — every page has complete, interlinked JSON-LD (Organization, Service, Person, BreadcrumbList, FAQPage where applicable, WebSite) | Bash: audit `src/lib/schema.ts` coverage against page inventory |
| 4.4 | Content extractability — does each page answer its core question in clear, direct prose near the top (not buried under marketing preamble), with genuine FAQ-formatted Q&A where present | Manual content review against built pages |
| 4.5 | E-E-A-T signals — author/consultant bio and credentials visible, real contact details, physical business presence, no unattributed claims | Manual review, cross-checked against `market-and-business-context.md` and brand guidelines already in the project |
| 4.6 | `llms.txt` — evaluate and make a documented decision either way. Current evidence (researched this session): Google has said it doesn't use it for ranking, no AI provider has confirmed using third-party `llms.txt` as a citation factor. Recommendation will be "low-cost, unproven — optional," not "required," so as not to overstate it | WebSearch (already researched; will re-confirm at execution time in case guidance has moved) |
| 4.7 | Actual AI citation test — query ChatGPT-class, Claude, Perplexity and Google AI Overviews with realistic prospect queries ("fractional CTO UK operational business", "AI integration consultant manufacturing UK", etc.) and record whether/how Curavest surfaces, honestly reporting "not yet appearing" if that's the result rather than padding it | WebSearch + direct query where the tool allows it; documented as a baseline, not a one-time pass/fail, since this is inherently something that improves over months as the site accrues authority |
| 4.8 | Bot traffic visibility — whether there's any current logging/analytics on non-human traffic to gauge AI-crawler activity | Cross-reference with section 11 (Analytics) findings — likely "not currently instrumented," which is itself a finding |

---

## 5. Accessibility (WCAG 2.2 AA)

**Current standard, verified this session:** WCAG 2.2 (Oct 2023) remains the operative W3C Recommendation;
WCAG 3.0 is still an early-stage draft with no completion date. 2.2 AA is also the de facto legal bar for UK/EU
exposure (EU Accessibility Act in force since June 2025) and US ADA litigation trends.

| # | Check | Tool |
|---|---|---|
| 5.1 | Automated axe-core scan, every route × every breakpoint already defined in `scripts/qa.mjs` (5 viewports × 10 routes) | Bash: `@axe-core/playwright`, extends existing script |
| 5.2 | `pa11y` run as a second, independently-implemented automated checker to cross-validate axe's findings (different rule engines catch different things) | Bash: `npx pa11y`, local server |
| 5.3 | Colour contrast — every text/background pairing against WCAG AA thresholds (4.5:1 normal text, 3:1 large text/UI components) | Automated (axe/pa11y contrast rules) + manual spot-check against actual brand tokens |
| 5.4 | Keyboard navigation — full tab-order walk of every page, confirm nothing is a mouse-only trap, logical tab order, no keyboard focus loss on menu open/close | Playwright keyboard-simulation script |
| 5.5 | Visible focus states on every interactive element (links, buttons, form fields, the mobile menu toggle) | Playwright, screenshot focus rings at each stop |
| 5.6 | Form labelling — every input has a programmatically associated label, error messages linked via `aria-describedby`, required fields properly marked | Bash: parse `ContactForm.astro` output + automated axe form rules |
| 5.7 | Landmark regions — correct use of `<header>`, `<nav>`, `<main>`, `<footer>`, one `<main>` per page | Bash: parse built HTML |
| 5.8 | Alt text quality — not just "present" (already enforced by `check-site.mjs`) but *meaningful*: no filename-derived or generic ("image", "photo") text, decorative images correctly using empty `alt=""` | Manual review of every image's alt attribute against its actual content |
| 5.9 | Reduced-motion support — any animation respects `prefers-reduced-motion` | Bash: grep CSS/JS for animation + media query |
| 5.10 | Zoom/reflow at 200% (WCAG 1.4.4/1.4.10) — no loss of content or function, no horizontal scroll | Playwright: set 200% zoom equivalent viewport, check for overflow |
| 5.11 | Screen-reader semantic read-through — not a full manual VoiceOver/NVDA pass (no screen reader available in this sandbox), but a structural read-order check via the accessibility tree | Playwright `accessibility.snapshot()` |
| 5.12 | Touch target sizing — minimum 24×24px (WCAG 2.5.8), ideally 44×44px, on every tappable element at mobile widths | Playwright: measure bounding boxes of interactive elements at 375/390px |
| 5.13 | ARIA usage audit — confirm no ARIA is compensating for broken HTML semantics (this project's stated principle already), no redundant or conflicting roles | Manual code review |

**Gap to flag honestly:** no actual screen-reader (NVDA/VoiceOver/JAWS) pass is possible from either
environment available to me — the accessibility-tree check (5.11) catches structural issues but isn't a full
substitute. I'll say this plainly in the findings rather than imply full screen-reader coverage.

---

## 6. Conversion Rate Optimization / UX

This category is the most judgment-driven and least tool-automatable — flagged honestly rather than dressed
up as more mechanical than it is.

| # | Check | Tool |
|---|---|---|
| 6.1 | Heuristic evaluation against Nielsen's 10 usability heuristics, page by page | Manual review (Playwright screenshots as the working surface) |
| 6.2 | CTA audit — every page has one clear primary action, consistent label/placement/styling, no competing CTAs | Manual + Bash grep for CTA component usage across pages |
| 6.3 | Above-the-fold value proposition clarity per page (does a visitor understand what Curavest does and who it's for within the first screen, without scrolling, at both desktop and mobile) | Playwright screenshot review, both viewports |
| 6.4 | Objection-handling completeness — for each service page, are the likely objections (cost silence, "why fractional", credibility with no case studies yet) addressed before the CTA | Manual content review against `curavest-website-copy-services-hub.md` and `market-and-business-context.md` |
| 6.5 | Form friction audit — field count, required vs optional marking, inline validation quality, error recovery, autocomplete attributes | Bash: parse `ContactForm.astro` + Playwright live-interaction test |
| 6.6 | Trust-signal audit — testimonials/certifications/case studies (project instructions are explicit: none exist yet and none may be fabricated), so this audit will document *what trust signals currently exist* (track record page, About page credentials) and flag the absence honestly rather than recommend inventing any | Manual review |
| 6.7 | Navigation clarity — can a visitor find any given page within 2 clicks from anywhere; mega-menu/dropdown usability at both desktop and mobile | Playwright click-path testing |
| 6.8 | Readability scoring (Flesch-Kincaid or similar) per page, checked against the brand's intended tone (plain, anti-hype — should score well without being dumbed down) | Bash script: extract body text, run a readability formula |
| 6.9 | Scannability — paragraph length, use of subheadings/whitespace, whether long pages support skimming | Manual review |
| 6.10 | Mobile conversion path — full walkthrough of the contact form specifically on a real mobile viewport, since that's the site's single conversion point | Playwright + linked device browser (real submission test, as already done for the CORS fix) |
| 6.11 | Analytics/testing infrastructure gap check — confirm whether any A/B testing or session-recording tooling exists to *support* CRO work going forward (currently: no) | Cross-reference section 11 |

---

## 7. Content Quality

| # | Check | Tool |
|---|---|---|
| 7.1 | Live-site vs source-of-truth copy diff — confirm every page's live content matches `curavest-website-copy-services-hub.md` (the authoritative copy doc), flagging any drift | WebFetch (live) vs Bash (source `.astro` files) |
| 7.2 | Tone/voice consistency against the brand guidelines doc, including the "we not I" and "consultant not founder" corrections already made — re-verify no regression | Manual review, cross-checked against `Brand Guidelines and Playbook.html` |
| 7.3 | No fabricated claims, stats, testimonials, or credentials anywhere on the site (standing project rule — re-audit as a check, not just a one-time build rule) | Manual review, every page |
| 7.4 | Internal terminology consistency (service names, e.g. "Fractional CTO Services" vs "Fractional CTO", used identically everywhere) | Bash grep across all pages |
| 7.5 | Date/freshness — nothing implies currency it doesn't have (no "as of [old date]" staleness) | Manual review |
| 7.6 | FAQ completeness and accuracy against actual likely visitor questions | Manual review against `market-and-business-context.md` |
| 7.7 | Duplicate/near-duplicate content across pages (some overlap between hub and service pages is expected — checking it's *intentional* overlap, not accidental copy-paste drift) | Bash text-similarity check across built pages |

---

## 8. Security

Directly relevant given this session's own CORS-allowlist bug — this category gets extra weight.

| # | Check | Tool |
|---|---|---|
| 8.1 | HTTPS/TLS — valid cert, correct chain, no mixed content, HSTS present | Linked device browser (SSL Labs via navigation) + `read_network_requests` for mixed-content check |
| 8.2 | Security headers — `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors` | Linked device browser: navigate to securityheaders.com against the live URL, plus direct header inspection via `read_network_requests` |
| 8.3 | **CORS configuration audit on the Supabase Edge Function** — re-verify the allowlist regex fixed this session is exhaustive and correctly scoped (not overly permissive either — confirm it still rejects spoofed origins), and check for any *other* endpoints with the same class of bug | Bash: re-run the targeted regex test suite used to verify the CORS fix; extend to any other origin-checking code in the repo |
| 8.4 | Dependency vulnerability scan | Bash: `npm audit` against `package.json` |
| 8.5 | Secrets exposure check — no API keys, service-role keys, or credentials committed to the repo or shipped in client-side bundles | Bash: grep repo history and built `dist/` output for known secret patterns; confirm only the public anon key appears client-side |
| 8.6 | Form abuse protection — honeypot field present and effective (already implemented), rate limiting on the Edge Function, no obvious mass-submission vector | Bash: review Edge Function code; Playwright: attempt rapid repeat submissions against a test row (cleaned up after) |
| 8.7 | Error handling — no stack traces or internal implementation detail leaked in error responses | Playwright: trigger validation/server errors, inspect response bodies |
| 8.8 | Admin/debug endpoint exposure — confirm no `/admin`, `/.env`, `/.git`, source maps, or other sensitive paths are served in production | Linked device browser: request known sensitive paths against the live URL |
| 8.9 | Supabase RLS policy re-verification — confirm `curavest_contact_submissions` still has no anon/authenticated access (already verified once via `get_advisors`; re-check for drift) | `mcp__Supabase__get_advisors` |
| 8.10 | Clickjacking protection (`frame-ancestors`/`X-Frame-Options`) | Same as 8.2 |
| 8.11 | Subresource integrity — any third-party script tags (fonts, analytics) should use SRI where applicable | Bash: grep built HTML for external `<script src>` |

---

## 9. Privacy & Compliance

| # | Check | Tool |
|---|---|---|
| 9.1 | Cookie/consent mechanism — what's actually loading that requires consent (currently: minimal/no third-party trackers, per this project's build — verify that's still true) | Linked device browser `read_network_requests`, live site, checking for any tracking cookies set |
| 9.2 | Privacy policy accuracy — does `/privacy/` correctly describe what's actually collected (contact form data → Supabase, no analytics currently) | Manual cross-check: policy text vs actual data flows found in 9.1 and section 11 |
| 9.3 | UK GDPR lawful basis — contact form data collection has a clear basis (consent/legitimate interest) documented in the privacy policy | Manual review |
| 9.4 | Data retention — any stated or actual retention period for `curavest_contact_submissions` rows | Manual review of policy vs actual DB behaviour (no auto-deletion currently exists — will flag as a gap if the policy claims otherwise) |
| 9.5 | Accessibility legal exposure cross-reference — tie section 5's findings to EAA/ADA risk explicitly, since that's now a live compliance question, not just a UX nicety | Synthesis of section 5 findings |
| 9.6 | Third-party data processor disclosure — Supabase and Brevo should be named/describable as processors in the privacy policy once email is live | Manual review |

---

## 10. Responsive / Cross-Device QA

| # | Check | Tool |
|---|---|---|
| 10.1 | Breakpoint sweep at 320, 360, 390, 414, 768, 1024, 1280, 1440, 1920px — no horizontal overflow, no broken stacking | Extends existing `scripts/qa.mjs` viewport matrix |
| 10.2 | Tablet portrait *and* landscape orientation | Playwright, both orientations at 768/1024 |
| 10.3 | Touch target sizing at mobile widths (cross-referenced with 5.12) | Playwright bounding-box measurement |
| 10.4 | Mobile navigation — hamburger menu open/close, focus trap while open, closes on route change | Playwright interaction script |
| 10.5 | Print stylesheet — does the site produce a sane printed page, or at minimum not an obviously broken one (nice-to-have for a B2B consultancy site whose visitors may print a service page) | Bash: check for `@media print` rules, manual review |
| 10.6 | `prefers-color-scheme`/dark mode — confirm the site's stance is deliberate (fixed light brand palette) rather than an accidental half-implementation | Bash: check CSS for any partial dark-mode rules |
| 10.7 | Real-device caveat — this plan uses Chromium emulation (Playwright) and the linked device's actual Chrome browser, not a BrowserStack-style farm covering Safari/iOS quirks or older Android WebViews; flagged as a known gap rather than silently assumed covered | — |

---

## 11. Brand & Visual Consistency

| # | Check | Tool |
|---|---|---|
| 11.1 | Design-token adherence — colours, type scale, spacing scale actually match `Brand Guidelines and Playbook.html`, not just "look close" | Bash: diff `src/styles/tokens.css` values against the brand doc's specified values |
| 11.2 | Component consistency — buttons, cards, form fields render identically wherever they're reused | Playwright visual screenshots, cross-page comparison |
| 11.3 | Logo usage — correct version, clear space, no distortion, correct usage in the email templates too | Manual review across site + the two email templates |
| 11.4 | Photography style consistency — office/dashboard theme (round 3) held consistently, no leftover industrial-themed images anywhere | Manual review, every `PhotoBand` instance |
| 11.5 | Iconography consistency — one icon style/weight throughout, no mixed sets | Manual review |
| 11.6 | Sharp-corner/no-gratuitous-rounding rule (stated brand principle) held everywhere, including newer components like `SplitSection` | Bash: grep CSS for `border-radius` usage, verify against the brand's stated exceptions |

---

## 12. Analytics & Measurement

| # | Check | Tool |
|---|---|---|
| 12.1 | Confirm what analytics (if any) is currently installed and firing | Linked device browser `read_network_requests`, live site — will report honestly if none is present, which is the likely current state |
| 12.2 | If analytics exists: goal/conversion event definitions (form submission tracked as a real event, not just a pageview) | Depends on 12.1's finding |
| 12.3 | Console/JS error monitoring — any current mechanism to know when something breaks in production, or is this purely reactive (as this session's CORS bug was — found only because you tested it yourself) | Manual review + honest gap flag |
| 12.4 | Core Web Vitals field-data collection (real-user monitoring), separate from the lab data in section 2 | Cross-reference 2.11 |
| 12.5 | Recommendation-only item (not a "check" against something existing): given 12.1–12.3 are likely to surface real gaps, the findings report will include a concrete, scoped recommendation for minimal, privacy-respecting analytics (e.g. Cloudflare Web Analytics, which requires no cookie consent banner) rather than leaving this as an open-ended "you should add analytics" | — |

---

## 13. Link Integrity & Asset Health

Largely already covered by this project's existing `scripts/check-site.mjs`; this section extends it rather
than duplicating it.

| # | Check | Tool |
|---|---|---|
| 13.1 | Internal link integrity (already automated) — re-run as part of this audit for a current baseline | Existing `scripts/check-site.mjs` |
| 13.2 | External link validity — do `sysgraft.com`, `ico.org.uk`, and any other external links actually resolve (not just correctly hostnamed, which is all the current script checks) | WebFetch or linked browser, each external URL |
| 13.3 | `target="_blank"` links carry `rel="noopener noreferrer"` | Bash: grep built HTML |
| 13.4 | Redirect chain depth — any internal link going through more than one hop | Linked device browser, network trace |
| 13.5 | Image 404 check against the live deployment specifically (distinct from the build-time check, which only proves images exist in `dist/`, not that they're actually served correctly at the edge — this is exactly the class of bug that caused the email-logo 404) | WebFetch/linked browser: request every image URL against the live domain directly |
| 13.6 | Sitemap-to-actual-routes reconciliation (cross-referenced with 3.2) | Bash |

---

## 14. Email / Transactional Deliverability

| # | Check | Tool |
|---|---|---|
| 14.1 | SPF/DKIM/DMARC records for `curavest.co.uk` — presence and correctness once Brevo sender verification is complete | Needs DNS lookup capability this sandbox doesn't have for arbitrary domains (confirmed this session) — **needs either your input (paste `dig`/`nslookup` output, or Cloudflare DNS dashboard access) or the linked browser via a DNS-lookup web tool** |
| 14.2 | Brevo sender/domain verification status | Needs your Brevo dashboard access — already flagged as an outstanding step in the project's contact-form work |
| 14.3 | Email HTML rendering across clients — this project already did a Playwright-based visual check of both templates at desktop/mobile widths; a fuller pass would test actual Outlook/Gmail/Apple Mail rendering quirks, which needs a service like Litmus/Email on Acid (no account available) — will note as a scoped-out gap, not silently skip it | Playwright (already done, will re-verify current templates) + documented gap for full client-matrix testing |
| 14.4 | Spam-score check on the actual template HTML | Needs a mail-tester-style service — reachable via linked browser if you want this run |
| 14.5 | End-to-end send test once `BREVO_API_KEY` is actually set | Blocked until you set the secret — already documented in the project's contact-form status doc as an outstanding step |

---

## 15. What's blocked on you, specifically

Collected in one place so nothing gets lost in the detail above:

1. **DNS records (14.1)** — this sandbox can't resolve arbitrary external DNS. Either point me at your
   Cloudflare DNS dashboard access, or I'll do this check through the linked browser instead (slower, works
   fine, no action needed from you if that's acceptable).
2. **Brevo dashboard status (14.2, 14.5)** — already a known open item from the contact-form work.
3. **Google Search Console / Analytics account access** — if either exists for this domain, connecting me
   would upgrade several "lab data only" checks (2.11, 12.1–12.4) to real field data. Not required — I'll
   report honestly on lab data alone if you'd rather not set this up now.
4. **Full email-client rendering matrix and spam-score tooling (14.3–14.4)** — genuinely paid/account-gated
   services. Skippable without loss of core functionality; flagged for completeness only.

Everything else in this plan runs without further input from you.

---

## 16. Execution sequence

Run in this order — each phase's output de-risks or informs the next, and it front-loads everything fully
automatable before the more judgment-heavy categories:

1. **Phase 1 — Automated technical baseline** (sections 2, 3, 5, 13): Lighthouse, axe, pa11y, link/schema
   checks. Fully scriptable, no manual judgment calls, run against both local build and live URLs.
2. **Phase 2 — Security & compliance** (sections 8, 9): highest-consequence category if something's wrong;
   done early given this session's own CORS finding as a reminder of what's at stake.
3. **Phase 3 — AI/AEO/GEO** (section 4): newest category, worth doing while the rest of the technical
   picture is fresh, since several checks (4.2, 4.3) reuse Phase 1's output.
4. **Phase 4 — Content, brand, CRO/UX** (sections 6, 7, 11): the manual-judgment categories, done once the
   mechanical issues from Phases 1–3 are known (a page's CRO problems are easier to assess once you're not
   also distracted by a broken heading hierarchy on it).
5. **Phase 5 — Analytics & email deliverability** (sections 12, 14): last, since several items here are
   gated on section 15's open questions anyway.

Each phase ends in a findings update, not a single report at the very end — so you see issues as they're
found rather than waiting on the full sweep.

---

**Next step:** tell me to go, or tell me what to cut/add/reweight first.
