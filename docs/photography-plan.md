# Photography — sourcing and placement record

Real photography per the brand guidelines (high-contrast, unfiltered, genuinely on-brand photography —
explicitly not stock "handshake" photos) is live on every main page, plus a real photograph of Euan
Pallister, Curavest's fractional CTO consultant, on About. The set was re-sourced in full from an earlier,
more literally industrial round (factories, warehouses, blueprints) to instead reflect the consultancy's
actual work: office environments, dashboards, and the systems used to manage the day-to-day operation of a
business. The same high-contrast, premium, considered treatment carries over — most images remain
people-free, and none use generic "handshake" stock-photo staging. This document is a record of what was
used and why, kept for future maintainers who need to swap, add, or re-source an image.

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
| `/services/fractional-cto/who-we-work-with/` | Between the "strong fit" section and the sector list (sector icons stay as they are — see README's note on deliberately not using a per-sector image-card grid) | `who-we-work-with-band.jpg` | No |
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

All are free-to-use under the Unsplash License and confirmed on inspection to carry no visible third-party
logos or branding, and no off-topic content (each candidate was opened and visually inspected before
download — several early candidates were rejected on this basis: a stock-trading terminal, a social-media
content-calendar photo credited to a UGC-display vendor, a military fleet-command board visible in a
"data screens" search result, a screenshot naming a specific third-party analytics product, and a photo
whose subject was a branded 3D-printer). Each photo was downloaded directly from its Unsplash page (clicking
the real "Download free" button), which satisfies Unsplash's API guideline of registering a
`download_location` hit per use.

**Homepage — `home-band.jpg`**
"An empty room with white walls and a black door" — Andrea De Santis (@andreadesantis83).
https://unsplash.com/photos/an-empty-room-with-white-walls-and-a-black-door-q8fe785r5nU

**Homepage (detail section) — `home-detail-band.jpg`**
"Turned on monitoring screen" — a data-reporting dashboard on a laptop screen (clicks, impressions, CTR,
average position) — Stephen Dawson (@dawson2406).
https://unsplash.com/photos/turned-on-monitoring-screen-qwtCeJ5cLYs

**Services hub — `services-band.jpg`**
"Hallway between glass-panel doors" — a bright office corridor with glass partitions — Nastuh Abootalebi
(@sunday_digital).
https://unsplash.com/photos/hallway-between-glass-panel-doors-yWwob8kwOCk

**Fractional CTO — `fractional-cto-band.jpg`**
A spacious, empty boardroom with a concrete ceiling and a long wooden table — Nastuh Abootalebi
(@sunday_digital).
https://unsplash.com/photos/photo-of-dining-table-and-chairs-inside-room-eHD8Y1Znfpk

**How It Works — `how-it-works-band.jpg`**
"White dry erase board" — a soft-focus whiteboard carrying a hand-written planning diagram — Paul Hanaoka
(@plhnk).
https://unsplash.com/photos/white-dry-erase-board-eWw2BKvKX_0

A first candidate for this slot was rejected after navigating to it: it turned out to be a photo of a
"Twitter / TikTok / Instagram / Facebook" social-media content-calendar whiteboard, credited to a
UGC-display vendor's own Unsplash account — both an off-topic mismatch and a third-party-brand risk.

**Who We Work With — `who-we-work-with-band.jpg`**
"Modern office interior with meeting area and workstations" — a warm, wood-panelled office with a meeting
nook and workstations visible through a glass partition — Caroline Badran (@___atmos).
https://unsplash.com/photos/modern-office-interior-with-meeting-area-and-workstations-xaGFrbbJuAo

A first candidate for this slot — "people reviewing documents in workspace" — was rejected on sight: a
close-up of four people gathered around a table, which is exactly the generic "handshake"-style stock photo
the brand guidelines warn against.

**AI Integration Services — `ai-integration-band.jpg`**
"Close-up of server cooling fans in a vibrant data centre" — Winston Chen (@winstonchen).
https://unsplash.com/photos/close-up-of-server-cooling-fans-in-a-vibrant-data-center-iZe21DzHnUg

Several other candidates were considered and rejected for this slot: a stock-trading terminal (off-topic —
this page is about applying AI to operational processes, not finance), a "rows of data on illuminated
screens" result that turned out to be a photograph of a military fleet command board, and a repeat of the
previous round's own control-room photograph (same photographer, same image).

**Track Record — `track-record-band.jpg`**
"Graphs of performance analytics on a laptop screen" — a dark-mode analytics dashboard on a laptop showing
load-time, bounce-rate and session charts, photographed on a desk beside a plant — Luke Chesser
(@lukechesser).
https://unsplash.com/photos/graphs-of-performance-analytics-on-a-laptop-screen-JKUTrJ4vK00

Two candidates were rejected for this slot after closer inspection. The first pick, "Close-up photo of
monitor displaying graph" by Nicholas Cappello, was only caught after it was already in place: on a full
rebuild and visual QA pass it turned out to be an unmistakable stock-trading terminal — a red "sell"-style
panel, a ticker table with order columns, and candlestick-style lines — which is exactly the finance-terminal
look the AI Integration slot's own rejection criteria warn against, and a mismatch for a page about
production and delivery case studies rather than financial markets. It was swapped for the current image.
A second candidate, a Google Search Console-style analytics dashboard, was rejected up front: the interface
is specific and recognisable enough to read as an implied endorsement of that product.

**About — `about-band.jpg`**
"Hallway leading to a bright office with artwork" — a bright, minimal corridor opening onto a small
workspace — FlippingBook (@flippingbook).
https://unsplash.com/photos/hallway-leading-to-a-bright-office-with-artwork-EzsI8ddW6qc

A candidate showing hands typing on a keyboard was rejected: the keyboard's distinctive design reads as an
unmistakable Apple product, which carries the same unintended-endorsement risk as a visible logo.

## Consultant photograph — `euan-pallister.jpg`

Not stock photography: a headshot of Euan Pallister, Curavest's fractional CTO consultant, supplied directly
by the client for use on the About page. Cropped to a 640×640 square (`width={640} height={640}` on the
`astro:assets` `Image` component — native size, no upscaling) and displayed at a fixed max-width alongside a
plain-text caption ("Euan Pallister — Fractional CTO, Curavest"). Euan is a consultant to Curavest, not its
founder, and the site's copy, alt text and caption are written accordingly — no biographical claims beyond
what was supplied. Alt text and caption use only the name/role already established in the site's own copy
and `personSchema()`.
