# Curavest Logo Pack

A complete, vector-based brand asset kit traced directly from your original logo files.

## What's inside

```
SVG/
  Icon/                     - mark only (the hexagon "CU" symbol)
  Wordmark-Horizontal/      - icon + "CURAVEST" side by side
  Wordmark-Stacked/         - icon above "CURAVEST" (your original layout)
PNG/
  Transparent/              - high-res PNGs of everything above, transparent background
  On-White/                 - color version pre-flattened onto a white background
  On-Dark/                  - dark-bg version pre-flattened onto a dark navy background
Favicon/
  favicon.ico               - multi-size (16/32/48) browser tab icon
  favicon-16x16.png
  favicon-32x32.png
  apple-touch-icon.png      - 180x180, iOS home screen icon
  android-chrome-192x192.png
  android-chrome-512x512.png
  site.webmanifest
  safari-pinned-tab.svg     - monochrome mask icon for Safari pinned tabs
```

## Color modes, and when to use each

Every layout (Icon / Horizontal / Stacked) comes in four versions:

| Suffix         | Rings | Mark  | Use on...                              |
|----------------|-------|-------|-----------------------------------------|
| `-color`       | Blue  | Charcoal | Light / white backgrounds            |
| `-color-darkbg`| Blue  | White | Dark backgrounds                       |
| `-white`       | White | White | Photos, colored backgrounds, dark mode UI (single color) |
| `-dark`        | Charcoal | Charcoal | Light backgrounds, single-color print/engraving |

All SVGs have transparent backgrounds by default — the "On-White" and "On-Dark" PNGs are just convenience exports for places that need a flattened image (email signatures, social profile photos, etc).

## Brand colors

- **Curavest Blue** — `#007DFE`
- **Curavest Charcoal** — `#373C42`
- **White** — `#FFFFFF`
- Dark background reference — `#1E2228` (used behind the "dark mode" PNG exports)

## Typography

The wordmark lettering is traced directly from your uploaded artwork (not re-set in a font), so the letterforms, weight, and spacing match your original exactly. All text is vector paths — no font installation needed, and nothing will reflow if opened in Illustrator, Figma, or Inkscape.

## Using the favicon files

Drop the contents of `Favicon/` into your site's root (or `/public`) folder and add this to your HTML `<head>`:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#007DFE">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#007DFE">
```

## A note on this pack

The icon and wordmark shapes here are traced directly from your uploaded files (not redrawn from scratch), so the hexagon geometry, the "C" opening, the "U" letterform, and the "CURAVEST" lettering all match your originals. The one intentionally simplified asset is the 16x16 favicon — at that size the full triple-layer hexagon blurs into a smudge in a browser tab, so it uses a bolder, single-ring version of the same mark purely for legibility. Everything 32px and up uses the full, faithful mark.
