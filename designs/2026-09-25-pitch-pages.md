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
- D23 (2026-09-29). Problem section tightened. Questions lose their checkmarks. The pain is two sizes: a big opener and closer, a 17px grey middle with bold phrases in ink; "that's business you already earned" is cut (the hero lede already says don't hand them to a competitor). The X marks go true red (`--bad`). The target line no longer repeats the hero's "only pay for meetings that land"; it says "You only pay if you get a clear return on revenue and time saved." FAQ heading is "Questions."
- D24 (2026-09-29). The hero's "How it works" link becomes a bare thin arrow down that bobs slowly: a nudge to scroll, not a button (`hero.second` optional; no text = the arrow). FAQ heading: "Questions you should be asking." Next under the problem: three benefits (three is the number), alternating rows, animation left then right then left.
- D25 (2026-09-29). A section should read whole on arrival, no scrolling until the next one starts (desktop; phones scroll anyway). The problem splits into two screens: the questions, fix line and goal at full width (780px tall at 1440x900); then the pain and the button (about 660px). The fix list is gone (the three value-prop rows will say it). Main buttons read "I'm ready to win back my clients". The form loses its intro and "Where do I reach you?" (`ask.intro`, `steps.contact_h` optional): heading, then fields.
- D26 (2026-09-29). The value props land as "How it works" (`benefits`, `#how`): three rows, each a flow diagram in the n8n style beside its headline, sides swapping. One story across the three: a past client starts hiring (watch), gets a message from their old recruiter (reach), replies and lands on the calendar (book). One line leaves each diagram and enters the next, drawn as you scroll. A CTA under every row; "Book a consultation" under the problem's goal. "Voice" reads "brand voice". Two FAQ items cut (who writes, who handles replies): the rows say it. Example names in the diagrams are made up.
- D27 (2026-09-29). Watch and reach become branches, not blocks: the client list fans out to one node per source (LinkedIn in its blue, X, job posts, funding, news) and back into the alert; your approval fans out to email, LinkedIn and text. Day counts gone. On laptops under 1200px the source nodes show icons only; on phones every fan runs top to bottom. About: smaller photo, a "Get in touch" button. "Most mid-size firms"; "Our system watches".
- D28 (2026-09-29). Importance by size and tone: in watch, the clients that aren't hiring get crossed through one by one with the reason (no open roles, hiring freeze, filled in-house, quiet), smaller and grey; the sources that didn't fire fade and their wires go faint. The spark loses its duplicate "Job posts +3". The line between diagrams waits for its diagram to finish, then catches up to the scroll. Phones get the line too, down the left margin past the words, into the next diagram. Phone diagrams now run full width (a desktop centering rule had shrunk them).
- D29 (2026-09-29). The phone's floating button is gone: the sticky bar already carries the same button, every section has its own, and the float covered the diagrams and the margin line. It was the page's only shadow.

### D30 (2026-09-29): About after the FAQ, business-framed proof

About moves below the FAQ, so the reader meets the person after objections are handled, right before the close. Nav follows: Questions, then About. Internship proof reuses the portfolio's resume numbers (17,000+ staff, 220+ policy documents, 7,000+ papers, 200+ hours) but says what the user got, not what stack was used. Close line is William's: do such a good job that you'll tell every other business owner you know.

### D31 (2026-09-29): Real objections in the FAQ, a recap close

The FAQ swaps technical questions for the real objections: tried this before, what if no meetings, team time, email domain. The close becomes the recap: "a 2-minute form away" headline, one last reason (stop chasing dead ends with cold outreach), then the three benefits set as two firms side by side, the one that starts now and the one that waits. The CTA comes last, so on phones it follows the comparison. `close.reason` and `close.vs` are optional, so other pitches keep the short close.

### D32 (2026-09-29): Close promises time, step bars return

The close stops repeating "10 new clients in 90 days" and promises time instead: "a 2-minute form away from reliable client outreach." (was "getting your week back") The form gets its progress back as bars only, under the title on the left, one per step, filled up to the current one. No "Step 1 of 5" text (D19 still holds for the words).

### D33 (2026-09-29): Three steps to start, as risk reversal

A section above the FAQ shows everything the owner does: fill out the form, hop on a call, send the lead history. Three panels in the flows' style (dotted canvas, white nodes, numbered headers, a wire between them, made-up data), stacked with a vertical wire on phones. Under them, one line carries the risk reversal: "That's all you do. We build the rest. If it's not a fit, you've lost 30 minutes, not a budget." Then the CTA. `start` is optional in the pitch schema; Start.astro owns the pictures.

### D34 (2026-09-29): Picture nodes, fewer and varied CTAs, shorter SMS consent

The start cards became pictures you read at a glance, with the step as a caption under each: a bare form (two fields, Send), a video call (two faces, controls), a CSV file, then an ink card of booked meetings ("Leads land on your calendar, we do the rest"). The About heading is "A little bit about me."

CTA rule: a section you see in one screen gets one button; a long scroll (the benefits) gets one at its start and one at its end, not one per row. No two neighbours share a label: Book a consultation, I'm ready to win back my clients, See if my firm is a fit, Start booking meetings, Take step one, Get in touch, and the close repeats the main one.

SMS consent is down to: rates, STOP, Terms and Privacy. Frequency and HELP stay on /terms.

### D35 (2026-09-29): Reading order by type, green for the result

Each block now looks like its job, so the eye goes heading, then answer, then proof. Hero: the hook line of the lede in ink and larger, the how below it in grey; "My personal guarantee" a heading, underlined, not a small caps label; the form's title level with the headline's first line (a shared top padding, plus .3vw for the two fonts' leading). Problem: the answer in rust and a step bigger than the questions it answers. Green (`--win`) marks the result only: "10 new clients in 90 days" in the goal line and the New clients count, which is now a green card. Replies that aren't ready (Later, Not now) shrink, fade and get struck through, like the ruled-out clients in the first diagram. No italics anywhere: `em` is upright site-wide (the close's reason line had slipped into italic).

- **D36 (2026-09-29): a path per service, then the offer.** The recruiting page moves to
  `/recruiting/lead-reactivation`. Wren's offer `page` and niche `lander` moved with it, so the
  sign-off `{page}` and the opener's link follow on their own. `/recruiting` 302s there
  (`public/_redirects`, query kept) until the family has its own page. Hyphens, not underscores.
  Also fixed: canonical and og:url pointed at `/x.html`, a URL Pages redirects away from.

- **D37 (2026-09-29): one diagram plays at a time, replay on each.** A fast scroll fired all three
  flow timelines at once, so the story ran out of order. A 6x fast-forward read as a glitch, so now:
  diagrams queue in story order, one with another waiting plays at 2x (never faster), nothing skips.
  A replay button (rust, it's an action; green stays for results) sits over each diagram's first
  node once it's whole. Target line stays green: it's the result, and it matches the client count.

- **D38 (2026-09-29): / is the hub, niche-agnostic.** The logo on every page goes to `/`. The
  hub sells Wren as a whole: one clean CRM underneath, AI on both ends, more business in and less
  busywork out. First screen: the words left, a firm map right (tools, one CRM, the two halves,
  played in like the other diagrams). Then six services in two lists (live ones link to their
  page, the rest to the form), industries, the build, proof, FAQ, about, form. A CTA per screen,
  most pointing into the services. Copy in `src/content/hub/home.yaml` (its own collection); cards
  that name an offer must link to its page, checked at build. Header and footer are shared
  components now (`Top`, `End`).

- **D39 (2026-09-29): Hub on the B2B template; both pages restyled sleek.** The hub follows
  William's "B2B landing page V2" order: hero with the form, proof, pain, two builds, three
  benefits, about, a comparison table, three steps, FAQ, recap. One button per section, labels
  vary. Proof is real only (GoC, UAlberta, William); no phone yet, so the header shows the email.
  New diagrams in code: inbound (late inquiry, reply typed, booked) and admin (signed contract
  fills the CRM, then invoice, kickoff, report). The dotted canvas is gone on both pages: pill
  a blurred header, the form as a floating card with boxed fields, rounded cards, and
  every diagram in a dark window. The recruiting guarantee is a card with ink check circles.
  Copy on the recruiting page unchanged. Earlier unlogged tweaks: bigger, tighter benefit
  headings; the custom cursor; the typing fix; `h1_tail`. Photos stay deferred (Higgsfield).
  Buttons went pill, then back to square the same day: William says square looks less AI.
  Windows went black, then light gray (#F3F1EC, white nodes, no glows) the same day: black on
  white read too harsh.

- **D40 (2026-09-29): A service catalog on the hub, a Services menu, colored marks.** William
  wants every service listed, not just the three benefits, and a way from / to the recruiting
  page. After the benefits: every service as a numbered list grouped by who it's for
  (recruiting firms, any service firm), each row with a small in-and-out diagram that plays
  in row by row; the recruiting group links to its page. The header's Services menu opens
  on hover or tap: all services, and lead reactivation for recruiting firms. Links out of
  the hub must land on a pitch page, checked at build. Checks are green circles everywhere
  (hero, guarantee, compare); the compare table's no is a red cross.
- **D41 (2026-09-29): The hub reframed as ground up modernization, copy as placeholders.**
  William's brief: C-suite readers at mid to big companies, five levels (SOPs, one CRM,
  workflows, AI integration, scale and monitor), goal = a multi-step form that qualifies,
  then William calls fast. Added: the five levels as a staircase after the pain, a pin on
  the level most companies are on; each case study shows the levels it climbed (from, to);
  the hub form steps through four questions (level, what's slowing you, size, role; fit =
  10+ people and a decision role; defined on wren's ops-automation-build offer), phone
  required, no calendar (the fit message says William calls). All hub copy is bracketed
  placeholders until William writes it. Panels are flat white (no gradients); the Services
  menu lists only the niche pages.
- **D42 (2026-09-29): A wren backdrop on every pitch page and the hub.** William wanted the
  background subtly better, with a wren motif. The mark, tiled small (two birds per 240px
  tile, one mirrored and tilted), ink at 6%, fixed to the viewport and masked to fade out
  toward the middle, so it shows at the edges only. Cards and windows stay solid white or
  gray over it. Tile: public/brand/wren-pattern.png, made from wren-mark-512.png.

## Next

- The VSL, once the file exists: in the hero under the subhead, beside the form on desktop, above it on phones.
- William: generate the 9 image slots with Higgsfield (via autobrowse). `npm run images` lists file, shape and prompt; save each at the path shown, rebuild, deploy. `?prompts` shows them on the page.

- wren: pull applications from D1 into deals (authenticated `/api/export`); `BookingSync` reads bookings through the `calcom` site and joins on `metadata.application`.
- wren: a recruiting niche whose arm pitches `recruiting-reactivation-pilot` and links `/recruiting`.

## Where to attack

1. No-JS applicants can't pass Turnstile, so they land on the error block with a mailto. Acceptable for now; a JS-off visitor is rare.
2. The fit rule is duplicated in wren and `src/lib/offers.ts`. Same logic, two copies; a change in one without the other drifts silently until the snapshot check. Move it to a shared package if it grows.
3. Short phones: on an iPhone SE (568px tall) the panel heading shows at 413px but question 1 starts below the fold. iPhone 13 and up show it.
