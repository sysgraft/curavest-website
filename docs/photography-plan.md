# Photography — sourcing and placement record

Real photography per the brand guidelines ("high-contrast, unfiltered industrial photography — factories,
warehouses, blueprints; explicitly not stock 'handshake' photos") is now live on all five placements below.
This document is a record of what was used and why, kept for future maintainers who need to swap, add, or
re-source an image.

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
| `/` (homepage) | Between the "Built for businesses where the detail matters" section and the "From bottleneck to double the output" proof panel | `home-band.jpg` | No |
| `/services/` | Directly under `PageHero`, before the service list | `services-band.jpg` | No |
| `/services/fractional-cto/` | Directly under `PageHero`, before the numbered overview list | `fractional-cto-band.jpg` | No |
| `/services/fractional-cto/who-i-work-with/` | Between the "strong fit" section and the sector list (sector icons stay as they are — see README's note on deliberately not using a per-sector image-card grid) | `who-i-work-with-band.jpg` | No |
| `/about/` | Directly under `PageHero`, before the "Start with the work, not the org chart" section | `about-band.jpg` | No |

None of these sit directly under a hero at the very top of the page (the About and Services-family heroes are
dark text panels, not photographic), so none use `priority` — all use the component's default lazy loading.
Confirmed via Playwright (stepped scroll + network-request assertions) that each image genuinely loads for a
scrolling visitor.

## Images used (Unsplash, downloaded and visually confirmed)

All five are free-to-use under the Unsplash License, people-free, and confirmed on inspection to carry no
visible third-party logos or branding.

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

Each photo was downloaded directly from its Unsplash page (clicking the real "Download free" button), which
satisfies Unsplash's API guideline of registering a `download_location` hit per use.
