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
- 2026-09-14 — Compliance is a footer line, not a page. The site sets no
  cookies (theme lives in localStorage), collects three fields, and
  stores them in D1 + inbox. PIPEDA wants purpose, storage, and a way to
  delete; one sentence covers it. A `/privacy` page is for when pixels
  arrive.
- 2026-09-14 — Sitemap is a 12-line endpoint, not `@astrojs/sitemap`.
  Four URLs; no dependency.
- 2026-09-14 — Measurement is server side and ours. A `hits` row per
  page view (depth, seconds, CTA, form touch, utm) beats a pixel: no
  cookies, no banner, no ad blocker loss, and the funnel joins to
  `leads` on utm. Pixels wait for paid ads. Cloudflare Web Analytics
  stays as the free second opinion.
- 2026-09-14 — utm is first touch per tab (sessionStorage), so a hop
  from `/` to `/ria` keeps the campaign. Not cross-tab, not cross-day;
  the emails link straight to the niche page anyway.
- 2026-09-14 — Site copy follows the opener-email voice
  (`emails_gen/sops/cold-email-copy.md`, `templates/*/opener.email`):
  short declarative sentences, commas for lists, a colon before an
  example, no dashes, no hedges, exact numbers, student stated plainly.
  "X, not Y" tails removed; they are not in the emails.
- 2026-09-15, inspo pass (designs/2026-09-14-inspo-notes.md). Took 1, 2, 4 to 9; skipped 3 (prove-it links). CTA says free. Case title is the result, client and year under it. New section 01 "Which column is your week?" (by hand vs once built, per niche, with one line on why the gap exists). Pillars replaced by a three-column table, usually vs with me, same commitments. Audit output named (one page: what first, what it saves, what it costs). FAQ reordered to pre-call questions, two added. Sections numbered 01 to 08. Form: name and questions added, both optional; D1 columns added via `npm run db:alter`.
- 2026-09-15, William's pass. CTA "Get in touch" (top and form heading). Questions field: "Any questions or concerns?". Offer promise names the work (onboarding, emails, reports, invoices); safe text is William's: free audit out of respect for your time, pay by milestone, walk away if the quality isn't there. Hero gets a kicker line (what this is, who for) and the lede carries the payoff, so all three read before scrolling. Section numbers removed (clashed with the 01 02 03 steps). Compare table removed; three principles instead (accountability, scalability, utility). New section: why not a bigger agency, a consultant, or one more hire. Light theme is the default for everyone. Deposit plus retainer framed around milestones: still to design.
- 2026-09-15, landing clarity. h1 is the payoff (a full workday a week back for each person on your team) on every page; the kicker says what and who; the hook (the AUM figure typed four times) opens the lede. Teaser promise names the work the workday comes from. Photo slot kept, invisible until a photo is set. "Thanks for taking the time to read this far" sits above the Get in touch heading; the form small print and the footer thanks line are gone.
- 2026-09-15, phone and hook pass. Hero button is content width and 44px tall on the phone (was full width, 48px); the form's Send stays full width there. The band motif gets a second drawing sized to the phone (420 wide, 40 tries) because the wide one was cropped to a third and read as three dashes. Bands now sit before proves, offer, alt and about as well as after the teaser; sections that follow each other stack tight through `section.s+section.s` instead of inline styles. Case figures moved from the bottom of the card to right under the title, so a scanner gets the number before the story. "Start with the free audit →" links to the form after the cases and after the principles; the form was 8,000px away from the hero button on a phone with nothing in between. The empty column left of About is the photo slot (220px on desktop).
- 2026-09-15, principle cards. The 3px accent bar is now a short accent trace with a filled node, one per card, drawn on scroll like the bands. Card, border and background unchanged.
- 2026-09-15, funnel. `/` gets a "Who I work with" line under the hero button linking to /ria, /insurance, /agencies (`niches` in site.yaml). Niche pages don't show it: a lead emailed to /ria never sees the other industries. Cold-email links keep pointing straight at the niche page with a utm. Outer principle cards get a second accent run on the right so the colour reads across the band.
- 2026-09-15, offer on three vectors (less risky, easier, faster). Less risky is already the strongest claim (free audit, per milestone, walk away, code and data yours); the engineering point is now concrete in Why me (trained engineer, writes the code, holds up after the demo). Easier is now said in the agency row: one person does the call, build, check-ins and email, versus the sale → PM → developer handoff and the follow-ups that go quiet. Faster is not claimed; the Build step says short cycles, something useful running early, each milestone worth it on its own. Alt rows attack each option on the three vectors (hire: onboarding, hand errors, core problem untouched; consultant: a second vendor to manage).
- 2026-09-15, deploy on push. GitHub Actions on `main`: npm ci, check, build, wrangler pages deploy. Chosen over the Pages Git integration so the build config is in the repo and nothing is set by clicking. Secrets on the GitHub repo, D1/Turnstile secret/Discord/Resend stay on the Pages project. `npm run deploy` stays as the manual path.
- 2026-09-15, chooser and intro. `/` is now a chooser: kicker, the payoff h1, one line from William, three cards (one per niche, each in its own colour with the mini band), "Not one of these? Email me". No pitch on it; the click costs a visitor, William takes that for copy that fits the reader. `general.yaml` deleted; cards live under `chooser` in site.yaml and take their colour from the niche file. Two landing intros built behind `?intro=1` (overlay: trace in to the mark, mark, trace out to a filled node, sheet lifts, hero staggers in) and `?intro=2` (in place: one trace draws across the top of the hero while the lines under it come up). Both gated off for ?static, reduced motion, deep links and ?sent. Default off until William picks.
- 2026-09-15, intro pick and toggle. Intro 2 (in place) is the default: it costs nothing in wait, the h1 is on screen inside a second, and a lead from an email lands on the pitch, not on a sheet. William liked the overlay more and worried about conversion; same call. Plays once per page per tab (sessionStorage `wren-intro:<path>`): the chooser draws, then the niche page draws on the click through; back and refresh do not replay. `?intro=1` keeps the overlay reachable for comparison, `?intro=0` turns it off. Theme toggle is an icon (sun in light, moon in dark, hairline strokes to match the traces) instead of the Dark/Light text pill; the words stay as the accessible name.
- 2026-09-15, intro split. William's call after seeing both: overlay (1) on the chooser, in place (2) on the niche pages, each once per page per tab. The in-place trace was not clean on the way in for two reasons, both fixed: the svg was inserted after first paint so the hero jumped down to make room (now an empty `svg.itr` in the markup, shown only while the intro runs and kept after), and the reveal rule hid every child of the hero, the trace included, so it drew invisibly and popped in at the end (the rule now skips `.itr`). Chooser kicker broadened to "Custom automation and software for small businesses".
- 2026-09-15, highlights. `**bold**` now works in the h1 too. In the h1 it is the accent colour ("full workday", the result, which is what the accent marks); in the lede it is ink on the grey. The bolded words are the ones a reader in that industry sees every day: AUM figure, ADV, onboarding, quarterly letters for RIAs; renewals, certificates, loss runs for insurance; proposals, monthly reports, onboarding, the deck rebuilt by hand for agencies. Kept to the hero plus the offer promise; the sides table and the rows already carry their own contrast.
- 2026-09-15, regression. The overlay intro's `.intro` class collided with the `p.intro` under every section heading and hid all of them (display:none) from the moment the intro shipped. Overlay is `.sheet` now. Lesson for this codebase: section-level class names are short and generic (`.intro`, `.s`, `.rows`), so a new global component gets a name that cannot be a section part.
- 2026-09-15, William's three copy rules. Metrics are numbers: already true (17,000 / 6 to 7 hrs / 220; 200 hrs / 7,000 / 5,000), and the audit line stays "what it saves" (the hours wording was reverted). Credibility is specific: the cases carry client, kind and year; nothing added because nothing new is known. The offer uses a minimum with risk reversal rather than a fixed value: the teaser promise is now "a full workday a week back for each person ... if a milestone doesn't give the hours back, you don't pay for it", which implies more is possible and matches the pay-per-milestone terms already on the page. Price ranges wait for the deposit and retainer numbers.
- 2026-09-15, case figure labels. The title and the first figure said the same sentence one line apart ("200 hours of lookups by hand, gone" twice). The number stays in both, since the title is the result and the strip is where a scanner reads; the figure's label now adds what the title did not (two minutes a paper; the hours went to reading directives) instead of repeating it.
- 2026-09-15, case titles say what was built. "6 to 7 hours a week back for the people who did the looking up" read as a result with no subject. Titles now name the job first (automated policy search for federal staff; automated citation tracking and the experiment-file search), then the strip gives the numbers, then the story says why it mattered.
- 2026-09-15, UI vision critique (impeccable critique, single context, no subagents by William's rule; detector on Lander.astro, index.astro, global.css: 0 findings). Verdict: the visual world is right for the ICP and stays (paper and ink, Manrope, one accent per niche, the trace motif, no stock imagery, one real person, no pricing or calendar). The loss is in the first screen: it describes the automation, never shows one; the before/after table is the strongest thing on the page and sits three screens down as static prose; the promise is said twice (h1, then the teaser) before any proof; who William is comes second to last while it is the reader's first question; the ask is at the bottom of ~7,600px desktop, ~9,600px phone. Three first-viewport alternatives in `designs/2026-09-15-ui-vision-playground.html` (A signed letter, B show it running, C one screen), everything below the fold unchanged. Craft-floor notes out of scope for this pass: kickers over the h1 and the 01 02 03 step numbers are impeccable bans. Pick: pending.
- 2026-09-15, hero B built. William's pick after seeing the playground: show it running. The hero is a two-column grid on desktop (copy left, card right; stacked on the phone). The h1 is the mechanism ("Type the AUM figure once. Every document that needs it fills itself."), the lede names the four documents and ends with the payoff bolded, the button, then a line with the photo (William Jin, software engineering at Waterloo, I write the code myself). The card (`Demo.astro`, `demo` in each niche file) types one value, draws a wire down, and fills the documents from it, on a 6s CSS loop; labelled "example figure" or "example client" so it cannot be read as a client's data. Still at rest under reduced motion and ?static. The kicker is gone from niche pages (the h1 now says what this is; impeccable bans kickers over an h1). The chooser keeps its kicker. Teaser under the hero unchanged for now, though its promise now repeats the lede's last sentence; William to decide whether it stays. Insurance and agencies copy is still sample.
- 2026-09-16, copy pass on `/`, `/ria`, `/agencies` (Fable). William's call after the ScoreApp video: no questionnaire; the process and fulfilment get more words, and the page tells the reader "this is most firms, probably yours" with sourced figures. Figures live in the prose, not a new block; each niche file lists them and the source in a comment at the top (Runn and Bennett for agency utilization and realization, Kitces and Schwab for RIA time use, Panko for spreadsheet errors). Nothing renders as a placeholder, since push is deploy. Hero h1 opens on the figure, then the mechanism (type it once), then the payoff. Sides table gets a sixth row (the zap or the nightly CSV that failed silently). The offer steps say what happens on the audit call, what the one page contains, how milestones are paid, and what handover leaves behind. Turnaround dates and deposit terms deliberately not claimed; still William's to set. `/insurance` untouched.
- 2026-09-16, William's second pass (same day). Extreme guarantees out: no "milestone is free", no personal ROI guarantee, "at no charge" softened to "I fix it". Hero h1 smaller (1.45 to 2.25rem, 30ch) and one or two sentences; the chooser h1 is "Custom automations for small firms." alone. Copy humanized: no "read that again", no "X, not Y" tails outside William's own "Nothing to do with" line. Floating audit button (Fable's call on William's "not sure"): fixed bottom right, phone and desktop, appears once the hero button scrolls off, hides while the form is on screen; hidden without JS. Not "top half" by a scroll cutoff, since the form's visibility is the natural cutoff.
- 2026-09-16, paragraphs. Every prose field can hold paragraph breaks (blank line in a `|` block; `paras()` in `lib/text.ts` renders them). Ledes, sides intros, offer steps, principles, alternatives, proves and case stories split into two or three short paragraphs each. William: "big blocks of text are easy to get distracted on, especially on phone." Hero h1s are one line ("Type the client in once. Every tool that needs it follows."). The agencies lede's "Nothing to do with…" tail replaced with "No new platform, no new hire."
- 2026-09-16, `/insurance` brought level with the other two (Fable, William's call). Same shape: one-line hook, three-paragraph lede ending on "inside the AMS and the tools you already pay for", "This is most agencies. It's probably yours." with sourced figures (Vertafore 2024 workforce report: nearly 2,000 respondents, over half report heavier workload and stress, 85% live in the AMS, recommend-the-job fell 85% to 65% in three years; Vertafore Project Impact: up to 45 minutes a day of removable steps in renewals, new business and endorsements; Panko 94%), six rows with the silent carrier download as the sixth, proves split, targets intro with the scarcity line. The vendor-blog "IIABA says 45 to 90 minutes per certificate" claim was checked against the IIABA certificates paper and is not in it, so it is not on the page. Chooser: "Pick your industry" is a heading (1.35rem, ink) instead of a 12px label, and the proof line ends "See the details for yourself below." instead of naming the industry page.
- 2026-09-16, the human cost (William's call). He asked whether the pages should carry fear and stronger copy. Kept: the opportunity cost (the hour that didn't go to a pitch, a referral, or home) and the qualitative cost (the best account manager or operations person does the retyping, it is the work good people quit over, the fifth copy is typed a little worse). Each niche page has it as a third paragraph of the sides intro, after the figures and before "pick the rows"; the ledes end "It gets worse with every client you sign / account you open / account you write"; the chooser lede has one line of it. Dropped: "one automation away from your next scaling jump". A twelve-person shop does not believe a certificate bot is between them and scale, and it is a cousin of the guarantees stripped earlier today. The credible version is "it gets worse with every client", which is already true of retyping.
- 2026-09-16, theme toggle animation (William's call: very simple, easier on the eyes). The sun and moon sit in the same grid cell and cross-fade with a small rotate instead of display:none. On click the root gets `.theming` for 350ms, and while it is there every element transitions background, colour, border, fill and stroke over 300ms. Off on page load so nothing animates in, and off under reduced motion.
