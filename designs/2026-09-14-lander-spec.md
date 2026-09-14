# Wren Automation lander

*Spec, 2026-09-14. Living doc. Decisions at the bottom.*

## Job

A post-email credibility page. The visitor got a cold email, googled
William or clicked "More at <link>". They arrive with one sentence in
their head and three doubts in order: who is this, is it real, what
happens if I reply. The page answers those in that order, then asks once.

Not a standalone lead source. No SEO work, no VSL in v1.

## Page order

1. **Hero.** Continues the email. Name, one-line claim in the niche's
   words, one-line honest bio. Soft CTA scrolls to the form. Proof
   strip: three numbers from the case studies, counting up.
2. **The pain.** The family first, then one example (same rule as the
   email SOP). Three short cards, then the concrete story.
3. **Case studies.** The core. Each pinned, three beats: the mess
   before, what we built, the numbers after. Stack in one line. Quote
   if there is one.
4. **How it works.** Call, free audit, small first build. Objections
   inline: no price, no lock-in, you keep the code.
5. **About.** Photo, two sentences, the "I read your filing" callback.
6. **The ask.** Form: email, phone (optional), "what eats your week".
   Button copy matches the email CTA. Thanks line under it.
7. **Footer.** Wren Automation, mailto. No links to other niches.

## Niches

- `/` generic. `/ria`, `/insurance` render the same page from one niche
  file each.
- Nav never links across niches. Footer says Wren Automation only.
- `?f=<firm>` swaps a hero word. Later pass.

## Content model

All copy lives in content files, never in components. William edits
prose without touching code.

- `src/content/niches/<slug>.md` — hero claim, bio line, pain cards,
  pain example, case-study order, form hidden value.
- `src/content/case-studies/<slug>.md` — title, niches, client, before
  (bullets), built (bullets), after (metrics: label, value, unit),
  stack, quote, quote_by.
- `src/content/site.md` — about, how-it-works steps, form copy, thanks
  line, footer.

## Stack

- Astro, static output, content collections with zod schemas.
- GSAP + ScrollTrigger, one library. Vanilla script islands, no React.
- Cloudflare Pages. One Pages Function `POST /api/lead`: Turnstile
  check, D1 row (email, phone, note, niche, source, ts), email to
  William.
- Cloudflare Web Analytics.

## Design

- Direction from impeccable + design-taste-frontend at build time.
- Light default, dark toggle. Preference stored in localStorage,
  system preference as the first default.
- Motion: presentation-grade. Builds under 600ms, one idea per screen,
  counters, scrub only inside pinned case studies. Never hijack scroll.
  `prefers-reduced-motion` honoured. Page reads fully with JS off.

## Build order

1. Scaffold Astro + content collections + schemas. Placeholder copy.
2. Sections, static, light + dark, responsive.
3. GSAP motion layer.
4. Lead function + D1 + Turnstile.
5. Deploy to Pages. William drops real case-study details, copy pass.

## Decision log

- 2026-09-14 — Credibility page, not a lead source. VSL deferred.
- 2026-09-14 — Astro over Next: zero JS default, one form, no adapter.
- 2026-09-14 — GSAP alone. Motion/anime.js would be a second scheduler.
- 2026-09-14 — Form over calendar link, per the email SOP. Phone
  optional; a cold-call template follows if people give it.
- 2026-09-14 — One site with `/[niche]` routes, no cross-links.
- 2026-09-14 — Copy in content files so William can edit prose.
- 2026-09-14 — Light default, dark toggle.
