# EUFO TECH — Website

Landing page for **[eufotech.ca](https://eufotech.ca)** — an IT, Web & AI consultancy.

A single-screen static site: the animated EUFO TECH logo on a dark background with an
ambient ring of softly-blurred gold panels, a contact email, and the
**IT · Web · AI Consulting** tagline.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The live landing page (served by Vercel). Self-contained — logo, styles, and animation are inline. |
| `eufotech-logo-animated.html` | The original standalone animated-logo file (kept for reference). |

## Local preview

It's a static file — open `index.html` in any browser. No build step, no dependencies.

## Deployment

Hosted on **Vercel**, connected to this GitHub repo. Every push to `main` auto-deploys.
Custom domain: `eufotech.ca` (with `www` redirecting to the apex).

## Editing

Everything is inline in `index.html`:
- **Contact email** — search for `eufotechltd@gmail.com`.
- **Tagline** — the `<p class="tag">` line.
- **Background panels** — the small script that builds `#orbit` (count, size, blur, speed).
