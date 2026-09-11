# Photography plan (not yet implemented)

Real photography per the brand guidelines ("high-contrast, unfiltered industrial photography — factories,
warehouses, blueprints; explicitly not stock 'handshake' photos") is the one guideline requirement not yet
implemented on the live site. See `README.md` → "Imagery" for why: this build environment cannot download
binary files from any external image host, so photos have to be sourced and dropped in from outside this
environment.

`src/components/PhotoBand.astro` is built and ready to receive images (full-bleed, responsive, optimised via
`astro:assets` — no third-party CDN dependency at runtime). This document is the placement plan and a
starting shortlist so that step is fast once images exist.

## How to finish this

1. Choose (or download) five licensed, on-brand images — the shortlist below is a starting point, sourced via
   Unsplash and confirmed by text metadata only (this environment could not visually inspect any of them, so
   eyeball each one for composition and any visible third-party branding/logos before use).
2. Save each as `src/assets/photography/<name>.jpg` (filenames below).
3. In each target page, `import` the image and add `<PhotoBand image={...} alt="..." />` at the marked
   insertion point.
4. Rebuild (`npm run build`) and visually check at mobile + desktop widths.

## Placement plan

| Page | Insertion point | Suggested filename | Priority (eager load)? |
| --- | --- | --- | --- |
| `/` (homepage) | Between the "Built for businesses where the detail matters" section and the "From bottleneck to double the output" proof panel | `home-band.jpg` | No |
| `/services/` | Directly under `PageHero`, before the service list | `services-band.jpg` | No |
| `/services/fractional-cto/` | Directly under `PageHero`, before the numbered overview list | `fractional-cto-band.jpg` | No |
| `/services/fractional-cto/who-i-work-with/` | Between the "strong fit" section and the sector list (sector icons stay as they are — see README's note on deliberately not using a per-sector image-card grid) | `who-i-work-with-band.jpg` | No |
| `/about/` | Between the "Start with the work, not the org chart" section and the fractional CTO panel | `about-band.jpg` | No |

None of these sit directly under a hero at the very top of the page, so none need `priority` — leave the
default lazy loading.

## Starting shortlist (Unsplash, verified via `search_photos` metadata — not visually inspected)

**Homepage — `home-band.jpg`**
"Vast, empty industrial hall with skylights and concrete floor" — Peter Herrmann (@tama66), 6390×4251,
people-free, high-contrast, moody.
https://unsplash.com/photos/vast-empty-industrial-hall-with-skylights-and-concrete-floor-ObYNcuJgrXI

**Who I Work With — `who-i-work-with-band.jpg`**
"Vast industrial interior with concrete columns and machinery" — Sou Jest (@soujest), 5568×3712, people-free.
https://unsplash.com/photos/vast-industrial-interior-with-concrete-columns-and-machinery-Z8knBZVRDiE

**Fractional CTO — `fractional-cto-band.jpg`**
"Industrial buildings under a stormy sky" — Sergej (@skstrannik), 6000×4000, moody, exterior, people-free.
https://unsplash.com/photos/industrial-buildings-under-a-stormy-sky-vwK1lkWzaRU

**Services hub — `services-band.jpg`**
"Gray pipes mounted on concrete wall arrangement" — Mykyta Martynenko (@prostotakphoto), 5184×3456,
people-free, strong graphic texture. (First choice — a warehouse full of metal pipes — could not be
re-confirmed by ID on a second search pass; this was the strongest people-free alternate from the same
search.)
https://unsplash.com/photos/gray-pipes-mounted-on-concrete-wall-arrangement-6TIMIpsYOws

**About — `about-band.jpg`**
No confident match for the original "3D printer/workshop" pick. Two people-free alternates, neither
confirmed free of visible third-party branding (check before use):
- "3D printers creating blue plastic cylinders on wooden workbench" — Minku Kang (@minkus), 6015×4006.
  https://unsplash.com/photos/3d-printers-creating-blue-plastic-cylinders-aCniNTiIFd8
- Close-up of a machine with a blue light — Osman Talha Dikyar (@osmantalha), 6240×4160.
  https://unsplash.com/photos/a-close-up-of-a-machine-with-a-blue-light-on-it-NMCABEhN0RE

If none of these feel right on a proper look, re-run `search_photos` (via the Unsplash MCP tool, if
available) for "industrial warehouse blueprint dark moody", "vast industrial interior concrete columns", or
similar — all five categories above returned strong, genuinely on-brief candidates; these five are simply
the ones that best matched the specific placements above.

Per Unsplash's API guidelines, trigger each photo's `download_location` once it's actually used (this is
registered automatically by Unsplash's own site/apps when downloading via unsplash.com — no action needed if
downloading directly from a photo's page).
