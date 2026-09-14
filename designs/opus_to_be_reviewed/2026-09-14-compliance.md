# Compliance pass (2026-09-14, Opus)

Closes the last `to_fix.md` line. Everything is content or head tags;
no behaviour changed.

## What landed

- `Foot.astro`: one footer for the lander and 404. `© year · Wren
  Automation · city · fine`. When `PUBLIC_CF_ANALYTICS` is set it
  appends `fine_analytics` so the privacy line stays true.
- `site.yaml` `fine`: where the form data goes, what it is used for,
  delete on request, no cookies.
- `sitemap.xml` endpoint + `Sitemap:` line in robots.txt.
- Head: og:type/site_name/url, twitter:card, apple-touch-icon,
  theme-color for both schemes. 404 is `noindex`.
- `_headers`: Permissions-Policy added. No CSP (Turnstile, fonts, and
  future pixels would each need an allowlist entry).
- Dev: gsap pre-bundled so a stale Vite cache can't silently stop
  `motion.ts` (that was the "toggle dead, lines missing" report).

## Where to attack

1. "No cookies" is a promise in the footer. Any pixel (Meta, LinkedIn,
   Google Ads) breaks it on day one and needs consent under Quebec Law
   25 / PIPEDA guidance. Plan the `/privacy` page and a consent gate
   before the first pixel, not after.
2. Cloudflare Web Analytics clause is only appended at build time. If
   the token is added in the Pages dashboard without a rebuild, the
   beacon still won't load (it's a build-time env), so the line stays
   honest — but that's easy to forget.
3. The footer says data is deleted on request; nothing enforces it.
   A `wrangler d1 execute ... DELETE WHERE email=?` one-liner in the
   README would make it a two-minute job.
4. Sitemap has no `lastmod`. Fine for four URLs; Google ignores it
   without a reliable value anyway.
5. Ontario business-name registration (operating as "Wren Automation"
   rather than under his own name) is a legal-identity question, not a
   site one. Not verified either way.
