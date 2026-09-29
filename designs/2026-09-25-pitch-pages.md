# Pitch pages (2026-09-25)

`/` and `/recruiting` rebuilt as pitch pages. `/agencies` stays on the niche design. `/ria` and `/insurance` dropped (301 to `/`).

## What William asked

- Look high-ticket: scroll effects, imagery, less text, a clear offer.
- Replace the broken industry chooser at `/`.
- An application form that finds out what firms struggle with, then a booked call.
- Recruiting first. The buyer is the owner/CEO/MD: more business in, less busywork out.
- Free offer: dead lead reactivation on the client side, 3 firms, 30 days, for a case study, introductions and real numbers. Candidate reactivation is a paid extension.
- Offers tracked first class, not in page copy.

## How it fits together

- Offer registry in wren (`packages/offers`) is the truth. `pnpm offers:export` writes `src/data/offers.json`; wren's gates fail on drift.
- `src/lib/pitch.ts` loads a pitch yaml with its offer and fails the build when: the offer isn't live, `offer.page` isn't the pitch path, ladder names don't match `offer.next`, `deal` is on a paid offer, `ask` lacks the copy the offer's form needs, or a `{token}` has no value.
- `src/lib/offers.ts` holds the fit rule and answer checks, ported from wren. The page and `/api/apply` use the same code.
- `/api/apply` checks the offer is live, the email, the answers and Turnstile, then writes an `applications` row with answers as JSON, `fit` and the contact (phone optional, added 2026-09-27), and pings Discord and email. It returns JSON to the script, or 303s to `#applied-fit|nofit|error` with JS off.
- A fit applicant gets the Cal.com calendar in the page when `offer.booking` is set, otherwise a thank-you. `/api/apply` tags the link (`functions/_shared/booking.ts`); `src/scripts/cal.ts` mounts it with Cal's `embed.js`. Those are the only two files that know the vendor.

## Decisions

- D1. Pitch pages get their own layout and route (`[...slug].astro`); niche pages keep theirs (`[niche].astro`). Astro bundles CSS per route, so one route with both layouts mixed the stylesheets.
- D2. Answers stored as JSON keyed by question id, not columns. Questions change per offer; the table doesn't.
- D3. Fit is computed on the server from the offer rule, stored, and told to the applicant. Not-fit applicants are still saved and read.
- D4. Scarcity copy comes from `offer.slots`/`offer.days`, with the reason on the page (one engineer).
- D5. ~~Dark only, rust accent.~~ Replaced by D8.
- D7. Cal.com's official inline embed, not a bare iframe. Its `?embed=true` page stays blank until `embed.js` talks to it from the parent.
- D6. Imagery is code for now: the dormant-list dot field (the console went with D8). Generated imagery can replace it without layout changes.
- D8 (2026-09-26). Full overhaul after "doesn't look high ticket". Light only, set as an annual report: 12-column grid, hairline rules, Archivo, square corners, one rust. Kept only the rust, the bird mark and scroll motion. No eyebrows, cards or console. The form is a rust panel in the first screen: beside the headline on desktop, right under the lede on phone, question 1 visible without scrolling. A `close` section repeats the call at the end. System in DESIGN.md.
- D9 (2026-09-26). Still not high ticket enough. Type and color reworked, layout kept: Newsreader serif for headings (italic punch, no grey two-tone) with Hanken Grotesk for text; bond paper and warm ink; the form panel and closing screen are ink, not rust. Rust darkened to oxide and cut to small marks (woken dots, steps rule, tags). Portraits greyscale. Step timing moved beside the step name so nothing sits above a heading.
- D10 (2026-09-26). Mostly black and white: white screen, black text reads most premium. No dark blocks; the form panel and closing screen are white, set off by one black rule. Buttons black, hover rust. Rust (#C24E1C) only for small marks: woken dots, steps rule, selected dot, slot dots, errors. Fields are underlines.
- D11 (2026-09-27). Font cleaner, less stylized: Geist for everything, headings 500 with tight tracking, no italics anywhere. Replaces Newsreader + Hanken Grotesk.
- D12 (2026-09-27). Too much text; readers skim headings and pictures. Font to General Sans (Geist read basic). Pictures carry the story: an example thread with faces in the first screen (replaces the facts table), a photo per half, a code-drawn diagram under every step (call, rows, flow, bars), William's portrait on the closing screen, the ATS list as a ticker. No stock photos: each slot holds its file and prompt in the yaml; the file goes in `src/assets/img/`, a hatched tile shows until then. Motion as a slideshow, never pinned or click-through: diagrams are whole on first view and only assemble on entry.
- D13 (2026-09-27). Brand disconnect: the pfp and banners are a cream bird on rust, the page was black on white with a brighter rust. Rust and cream now sampled from the pfp (#A83B12, #FAF7F2) and used in set places so the page stays white: the stamp (the pfp as the logo), rust buttons (hover ink), the guarantee as a rust seal, and a rust back cover (closing screen plus footer, ending on the banner's lockup). Marks elsewhere. Favicon is the pfp. Also fixed: with motion off the ticker didn't wrap and phones zoomed out to fit it.
- D14 (2026-09-28). The offer is AI integration from the ground up, and the copy sells the process, not the call. Four stages: Figure out (SOPs, weeks 1–2), Fix (weeks 2–4), Connect (one clean CRM, weeks 3–7, the longest because the data is the work), Put AI to work (from week 6, then monthly on the retainer). Upfront fee covers the first three; the retainer starts when AI runs. A `build` section draws them: an 8-week chart in the sticky heading (bars light as you read each stage) and a diagram per stage, incl. a new `merge` diagram (sources wired into one CRM). `/` leads with it in place of the call-first steps; `/recruiting` shows it after the pilot, replacing the offer-name ladder. The free pilot stays for the first firms (proof first). Pilot build days 1–10 so the new domain warms before sends; numbers at day 30, a check at day 60 for late job orders. ICP: owner-led firms of 10–50 people (recruiting: 10–50 recruiters, ~$2–15M fees). No prices on the page.
- D15 (2026-09-28). William's face shows once as a portrait, in About. The closing screen's portrait is gone (the ask stands alone). The small byline face in the first screen and his tile in the call diagram stay.
- D16 (2026-09-29). /recruiting header locked for the paid reactivation offer (no free pilot). h1: "Win 10 new clients in 90 days from leads you already paid for, with our lead reactivation system" (sentence case) (90 days: ~35 meetings at ~30% close needs 500-1,000 past contacts; 60 only for big fresh lists). Subhead: pain, then the system, then "You only pay for meetings that land" (the price model, no number). `ask.assure` puts one line under the form's button on every step. The form heading is neutral until the offer registry carries `reactivation`. Owed by the product: monitoring past clients for hiring windows, which the subhead promises.
- D17 (2026-09-29). /recruiting first screen for cold traffic. Form is contact first (name, email, phone; firm dropped, the email domain says it), then the fit questions; the first button is `ask.cta` ("Ready to win back my clients"). Below desktop the form follows the headline so it's on the first screen; lede and promise come after. `hero.promise` = a signed guarantee (works with your ATS and inbox, your process, your voice) with the byline "If it doesn't fit how your firm works, I change it. Not you." Long headlines (60+ chars) set smaller. `story` replaces the hero thread: one example in five beats (Watch, Spot, Write, Reply, Book) that light in order and loop while on screen; still, all beats are lit. Owed: partial capture (step 1 is saved only when the whole form sends; Turnstile tokens are single use, so a second POST needs its own check), `?v=` prefill from the email link, the VSL once recorded (no slot until the file exists).
- D18 (2026-09-29). /recruiting cleared of the free pilot. Page is now: hero + form, ATS strip ("Works with"), example reel, About, FAQ (5, pilot and cost items cut, prices stay for the call), close, footer. Cut: dot field, calculator, two halves, pilot days, the deal and its "Whatever happens" seal, the build, proof. Dead code went with them: Calc, field canvas, deal markup and CSS, slot bars, the call and flow diagrams, the free-deal build check. Nav: How it works, About, Questions; nav button "Get in touch". Halves and proof are optional now; / still uses both.

- D19 (2026-09-29). Form loses its "Step x of y" line (reads as friction); markup, CSS and copy keys gone. ATS "Works with" ticker cut from /recruiting; no page used it after, so the strip is gone from the code too. Copy says "outreach", not "email": sends may be email, LinkedIn or SMS.
- D20 (2026-09-29). The example section becomes a problem-agitate-solve letter. Top: "Dear recruiting firm owner,", three pains as checkmarked questions, and one line on what the system does (the heading). Beside it, the pain in depth. Then what they don't need and what they do, beside the reel. Ends on "Our target for you is 10 new clients in 90 days" and the form button. Copy is `story.dear/questions/answer/pain/solve/target/cta`; a letter body is a list where a string is a paragraph and a nested list is a checklist.- D21 (2026-09-29). The letter becomes the problem section (`problem`, `#problem`): no salutation ("this isn't a letter"), no example reel (redundant), one column top down. The questions and the fix line share one size. The goal ("10 new clients in 90 days") and the button move up, right under the fix line, before the pain in depth. The four bad things get X marks (`{ bad: [...] }` in a body list). A reload now lands where the reader was: pitch.ts saves scrollY per path on pagehide and restores it after fonts and load (Safari reset to the top).
- D22 (2026-09-29). Two button labels on /recruiting: "Ready to win back my clients" where there's room (hero form, problem, close), "Win back my clients" in the bar and the phone float. Under 460px the bar shows the stamp without the name (the name is in the byline and footer), and any button too long for the line wraps; the page no longer loads wider than the phone.

## Next

- William: generate the 9 image slots with Higgsfield (via autobrowse). `npm run images` lists file, shape and prompt; save each at the path shown, rebuild, deploy. `?prompts` shows them on the page.

- wren: pull applications from D1 into deals (authenticated `/api/export`); `BookingSync` reads bookings through the `calcom` site and joins on `metadata.application`.
- wren: a recruiting niche whose arm pitches `recruiting-reactivation-pilot` and links `/recruiting`.

## Where to attack

1. No-JS applicants can't pass Turnstile, so they land on the error block with a mailto. Acceptable for now; a JS-off visitor is rare.
2. The fit rule is duplicated in wren and `src/lib/offers.ts`. Same logic, two copies; a change in one without the other drifts silently until the snapshot check. Move it to a shared package if it grows.
3. Short phones: on an iPhone SE (568px tall) the panel heading shows at 413px but question 1 starts below the fold. iPhone 13 and up show it.
