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

- `/` generic. `/ria`, `/insurance`, `/agencies` render the same page
  from one niche file each. `/agencies` copy is sample until William
  writes it.
- Nav never links across niches. Footer says Wren Automation only.
- `?f=<firm>` swaps a hero word. Later pass.

## Content model

All copy lives in content files, never in components. William edits
prose without touching code.

- `src/content/niches/<slug>.yaml` — hue, title, h1, lede, case-study
  order, targets heading/intro/list, form hidden value.
- `src/content/case-studies/<slug>.yaml` — client, kind, before, now,
  pipe lead, steps (name, text, you), impact (fig, count, suffix,
  label), stack.
- `src/content/site/site.yaml` — proof strip, how it works, questions,
  about, facts, form copy, thanks line, footer.
- Schemas in `src/content.config.ts` are strict: a stray key fails the
  build. `**bold**` is the only markup, in lede and ask_intro.

## Stack

- Astro, static output, content collections with zod schemas.
- GSAP + ScrollTrigger, one library. Vanilla script islands, no React.
- Cloudflare Pages. One Pages Function `POST /api/lead`: honeypot,
  Turnstile check if the secret is set, D1 row (ts, email, phone, note,
  niche, page, ip, ua), email to William via Resend if the key is set.
  Answers JSON to fetch, a 303 back to `?sent=1#ask` to a plain form.
- Cloudflare Web Analytics.

## Design

- Direction from impeccable + design-taste-frontend at build time.
- Manrope, hairline traces, warm paper (`#faf7f2` light, `#161311`
  dark). Never pure white.
- One accent per niche, set in the niche file: rust `#a83b12` for `/ria`
  and the root, green `#206b4e` for `/insurance`, red `#b2232b` for
  `/agencies`. Dark-mode values lighten each. The accent lands only
  where a person acts (filled pipeline nodes, buttons, the mailto) or a
  result lands (figures, eyebrow labels). Traces, rules and text stay
  grey. Nothing else is coloured.
- Light default, dark toggle. Preference stored in localStorage,
  system preference as the first default.
- Mobile first. Base CSS is the phone layout; one breakpoint (840px)
  adds the desktop grid. Figures sit beside their labels on a phone,
  the pipeline runs vertically with the trace in the left gutter, the
  CTA is full width, inputs are 16px so iOS does not zoom.
- Motion: presentation-grade. Builds under 600ms, one idea per screen,
  counters, scrub only inside pinned case studies. Never hijack scroll.
  `prefers-reduced-motion` honoured. Page reads fully with JS off.

## Build order

1. ~~Scaffold Astro + content collections + schemas.~~ done 2026-09-14
2. ~~Sections, static, light + dark, mobile first.~~ done
3. ~~GSAP motion layer.~~ done
4. ~~Lead function + D1 + Turnstile.~~ done, tested locally
5. Deploy to Pages (README). William: photo, real figures, `/agencies`
   copy, Turnstile and Resend keys.

## Decision log

- 2026-09-14 — Credibility page, not a lead source. VSL deferred.
- 2026-09-14 — Astro over Next: zero JS default, one form, no adapter.
- 2026-09-14 — GSAP alone. Motion/anime.js would be a second scheduler.
- 2026-09-14 — Form over calendar link, per the email SOP. Phone
  optional; a cold-call template follows if people give it.
- 2026-09-14 — One site with `/[niche]` routes, no cross-links.
- 2026-09-14 — Copy in content files so William can edit prose.
- 2026-09-14 — Light default, dark toggle.
- 2026-09-14 — Warm paper over white. White read as SaaS; cream reads
  as a document, which matches "I read your filing".
- 2026-09-14 — Accent per niche, not one brand accent. Rust for RIAs
  (warm, rare in finance, does not pattern-match to a vendor; copper is
  what traces are made of). Green for insurance. Red for agencies.
  Blue rejected: it is every custodian and fintech vendor.
- 2026-09-14 — Colour has a rule: it marks the human touch and the
  result. Filled node = a person does this. So it is never decoration.
- 2026-09-14 — YAML over markdown for content. Every field is short and
  structured; frontmatter would be all of the file. Block style only:
  flow mappings split on commas inside prose.
- 2026-09-14 — Trace bands generated at build time, not in the browser,
  so the page reads with JS off. Case pipelines still draw client side;
  they need the layout.
- 2026-09-14 — Form works without JS (POST, 303 back) and with it
  (fetch). Honeypot always; Turnstile only when a key exists, so a
  missing key never blocks a lead.
- 2026-09-14 — Resend for the notification email. D1 is the record; the
  email is a courtesy and can fail silently.
