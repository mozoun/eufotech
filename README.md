# EUFO TECH — Website

Site for **[eufotech.ca](https://eufotech.ca)** — an IT, Web & AI consultancy.

A multi-page static site (no build step) with a dark background, gold accent color, and a
scroll-linked animated wave background (Three.js particle grid).

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Homepage — hero, short service teasers, CTA. |
| `services.html` | Full services grid — Web Development, AI Chatbots, Network Solutions. |
| `about.html` | Company mission / why EUFO TECH. |
| `contact.html` | Email + "Schedule a Call" (Calendly). |

All four pages share the same header, nav, and footer markup.

## Shared assets

| File | Purpose |
| --- | --- |
| `styles.css` | All styling — CSS variables (colors, fonts), layout, animations. Edit colors here (`:root` at the top). |
| `script.js` | Year auto-fill, the Three.js wave background, and scroll fade-in effects for cards/text. |

Three.js is loaded from a CDN (`cdnjs.cloudflare.com`, r128) via a `<script>` tag in each page's `<head>`/body — it's not bundled locally.

## Design

- **Colors:** dark background (`#09090F` family) with a gold accent (`#D4AF37`), defined as CSS variables in `styles.css`.
- **Background animation:** `#dotWaves` container holds a WebGL canvas rendering ~2,500 gold particles arranged in a grid. As the page scrolls, the camera drifts, creating a "gliding over a sea" effect. Respects `prefers-reduced-motion` (falls back to a static background).
- **Logo:** currently a CSS-only placeholder icon (bordered square + dot) — no logo image file is wired in yet.

## Local preview

Static files — open `index.html` directly in a browser, or serve the folder locally, e.g.:

```bash
python -m http.server 8099
```

then visit `http://localhost:8099/`.

## Deployment

Hosted on **Vercel**, connected to `github.com/mozoun/eufotech`. Every push to `main` auto-deploys to `eufotech.ca`. (A future move from Vercel to Namecheap hosting is planned but not yet done.)

## Other files in this repo

- `eufotech-logo-animated.html` — a standalone animated-logo demo from an earlier gold single-screen design (not currently embedded anywhere; kept for reference/possible logo material).
- `files.zip`, `*.mp4`, `*.jpg` — marketing assets, not used by the live site.
