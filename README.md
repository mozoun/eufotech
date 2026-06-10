# EUFO TECH — Website

Landing page for **[eufotech.ca](https://eufotech.ca)**.

A single-screen static site: the animated EUFO TECH logo (canvas particle ring +
waving halftone emblem + wordmark) on a dark background.

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

## Editing

Everything (logo image, styles, animation) is inline in `index.html`. The wordmark is an
embedded base64 PNG; the surrounding ring and emblem are drawn on `<canvas>` via the inline
script.
