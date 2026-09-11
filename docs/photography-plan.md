# Photography — sourcing and placement record

Real photography per the brand guidelines ("high-contrast, unfiltered industrial photography — factories,
warehouses, blueprints; explicitly not stock 'handshake' photos") is now live on every main page, plus a
real founder photograph on About. This document is a record of what was used and why, kept for future
maintainers who need to swap, add, or re-source an image.

`src/components/PhotoBand.astro` renders each image full-bleed, responsive, and optimised via `astro:assets`
(no third-party CDN dependency at runtime — the source JPEGs live in `src/assets/photography/` and Astro
generates optimised WebP variants at build time).

## How to change or add one

1. Choose a licensed, on-brand image and save it as `src/assets/photography/<name>.jpg`.
2. In the target page, `import` the image and use `<PhotoBand image={...} alt="..." />` at the desired
   insertion point.
3. Rebuild (`npm run build`) and visually check at mobile + desktop widths — check composition, cropping
   (21:9 desktop, 4:5 mobile — see `PhotoBand.astro`), and that no third-party logos/branding are visible.

## Placement (as implemented)

| Page | Insertion point | Filename | Priority (eager load)? |
| --- | --- | --- | --- |
| `/` (homepage) | As the visual half of the "Built for businesses where the detail matters" `SplitSection` | `home-detail-band.jpg` | No |
| `/` (homepage) | Between that section and the "From bottleneck to double the output" proof panel | `home-band.jpg` | No |
| `/services/` | Directly under `PageHero`, before the service list | `services-band.jpg` | No |
| `/services/fractional-cto/` | Directly under `PageHero`, before the numbered overview list | `fractional-cto-band.jpg` | No |
| `/services/fractional-cto/how-it-works/` | Directly under `PageHero`, before the Diagnose·Engineer·Prove list | `how-it-works-band.jpg` | No |
| `/services/fractional-cto/who-i-work-with/` | Between the "strong fit" section and the sector list (sector icons stay as they are — see README's note on deliberately not using a per-sector image-card grid) | `who-i-work-with-band.jpg` | No |
| `/services/ai-integration/` | Directly under `PageHero`, before the Understand·Create·Implement list | `ai-integration-band.jpg` | No |
| `/track-record/` | Directly under `PageHero`, before the case-study list | `track-record-band.jpg` | No |
| `/about/` | Directly under `PageHero`, before the "Start with the work, not the org chart" section | `about-band.jpg` | No |
| `/about/` | As the visual half of the "Start with the work, not the org chart" `SplitSection`, in place of a `PhotoBand` | `euan-pallister.jpg` | No |

None of these sit directly under a hero at the very top of the page (every hero on the site is a dark text
panel, not photographic), so none use `priority` — all use the component's default lazy loading. Confirmed
via Playwright (stepped scroll + network-request assertions) that each image genuinely loads for a scrolling
visitor.

Every interior page's `PageHero` also carries a faint, unlabelled `SchematicGraphic` in its right-hand dead
space (`<PageHero graphic>`, hidden below ~1200px) — see the README's "Imagery" section — which is a
lightweight SVG, not a raster photo, so it isn't listed in the table above.

## Images used (Unsplash, downloaded and visually confirmed)

All are free-to-use under the Unsplash License, people-free, and confirmed on inspection to carry no visible
third-party logos or branding.

**Homepage — `home-band.jpg`**
"Vast, empty industrial hall with skylights and concrete floor" — Peter Herrmann (@tama66), 6390×4251.
https://unsplash.com/photos/vast-empty-industrial-hall-with-skylights-and-concrete-floor-ObYNcuJgrXI

**Who I Work With — `who-i-work-with-band.jpg`**
"Vast industrial interior with concrete columns and machinery" — Sou Jest (@soujest), 5568×3712.
https://unsplash.com/photos/vast-industrial-interior-with-concrete-columns-and-machinery-Z8knBZVRDiE

**Fractional CTO — `fractional-cto-band.jpg`**
"Industrial buildings under a stormy sky" — Sergej (@skstrannik), 6000×4000.
https://unsplash.com/photos/industrial-buildings-under-a-stormy-sky-vwK1lkWzaRU

**Services hub — `services-band.jpg`**
"Gray pipes mounted on concrete wall arrangement" — Mykyta Martynenko (@prostotakphoto), 5184×3456.
https://unsplash.com/photos/gray-pipes-mounted-on-concrete-wall-arrangement-6TIMIpsYOws

**About — `about-band.jpg`**
Close-up of a 3D-printer nozzle extruding orange plastic, with a blue accent light — Osman Talha Dikyar
(@osmantalha), 6240×4160.
https://unsplash.com/photos/a-close-up-of-a-machine-with-a-blue-light-on-it-NMCABEhN0RE

A second candidate for this slot — "3D printers creating blue plastic cylinders on wooden workbench" by Minku
Kang — was rejected after visual inspection because the printer's "Ender" (Creality) branding was legible in
the shot, which would read as an unintended third-party product endorsement on a client site.

**Homepage (detail section) — `home-detail-band.jpg`**
Metal rod being precision-machined on a lathe, cutting tool actively shaping it — Sven Daniel (@sven_daniel),
6000×4000.

**AI Integration Services — `ai-integration-band.jpg`**
Large industrial control room lined with analogue control panels, dials and switches — Frantisek Duris
(@modry_dinosaurus), 6854×4569.

**How It Works — `how-it-works-band.jpg`**
Architectural blueprints on a table with drafting pencils, a metal ruler and a storage tube — Lucas Kepner
(@lucaskphoto), 7111×4785.

**Track Record — `track-record-band.jpg`**
Rows of warehouse shelving stacked with plain cardboard boxes, viewed down the aisle — CHUTTERSNAP
(@chuttersnap), 6048×4024.

Each photo was downloaded directly from its Unsplash page (clicking the real "Download free" button), which
satisfies Unsplash's API guideline of registering a `download_location` hit per use.

## Founder photograph — `euan-pallister.jpg`

Not stock photography: a headshot of Euan Pallister, Curavest's founder, supplied directly by the client for
use on the About page. Cropped to a 640×640 square (`width={640} height={640}` on the `astro:assets` `Image`
component — native size, no upscaling) and displayed at a fixed max-width alongside a plain-text caption
("Euan Pallister — Founder, Curavest"). Alt text and caption use only the name/role already established in
the site's own copy and `personSchema()` — no biographical claims beyond what was supplied.
