# Site build, 2026-09-14

Opus built the whole lander from the playground and the spec. Astro 7,
static, four pages from four yaml files, GSAP traces and counters, one
Pages Function for the form. Mobile first, checked at 390px light and
dark and at 1280px. Lead endpoint tested locally against D1: JSON path,
no-JS redirect, bad email, honeypot.

## Where to attack, ranked

1. `functions/api/lead.ts`. No rate limit. A bot that clears the
   honeypot can fill D1. Turnstile closes it once the key is set; until
   then it is open.
2. `src/scripts/motion.ts` `tracePipe`. Ported verbatim from the
   playground with types added. Resize mid-animation and font swap are
   handled; a niche with a one-step pipeline is not (pts[1] undefined).
   No niche has one.
3. Counters under headless virtual time crawl (1 after 3s). Real
   browsers fine. If a screenshot pipeline ever needs them, use
   `?static`.
4. Google Fonts is a third-party request on a page for skeptical
   readers. Self-hosting Manrope is a 10-minute change.
5. `build.format: 'file'` gives `/ria.html`; Pages serves `/ria`. Any
   other host needs its own clean-URL rule.
