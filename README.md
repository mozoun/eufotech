# EUFO TECH — Website

Landing page for **[eufotech.ca](https://eufotech.ca)**.

A single-page static site featuring an animated EUFO TECH logo (canvas particle ring +
waving halftone emblem + wordmark) with About, Services, and Contact sections.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The live landing page (this is what Vercel serves). Fully self-contained — logo, styles, and animation are inline. |
| `eufotech-logo-animated.html` | The original standalone animated-logo file (kept for reference). |

## Local preview

It's a static file — just open `index.html` in any browser. No build step, no dependencies.

## Deployment

Hosted on **Vercel**, connected to this GitHub repo. Every push to `main` triggers an
automatic redeploy. Custom domain: `eufotech.ca`.

## Editing the copy

All text lives directly in `index.html`:
- **Tagline** — in the `<p class="tagline">` block inside the hero.
- **About / Services / Contact** — in their respective `<section class="block">` blocks.
- **Contact email** — search for `hello@eufotech.ca`.
