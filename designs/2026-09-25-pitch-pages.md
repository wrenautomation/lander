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
- `/api/apply` checks the offer is live, the email, the answers and Turnstile, then writes an `applications` row with answers as JSON and `fit`, and pings Discord and email. It returns JSON to the script, or 303s to `#applied-fit|nofit|error` with JS off.
- A fit applicant gets the Cal.com calendar in the page when `offer.booking` is set, otherwise a thank-you. `/api/apply` tags the link (`functions/_shared/booking.ts`); `src/scripts/cal.ts` mounts it with Cal's `embed.js`. Those are the only two files that know the vendor.

## Decisions

- D1. Pitch pages get their own layout and route (`[...slug].astro`); niche pages keep theirs (`[niche].astro`). Astro bundles CSS per route, so one route with both layouts mixed the stylesheets.
- D2. Answers stored as JSON keyed by question id, not columns. Questions change per offer; the table doesn't.
- D3. Fit is computed on the server from the offer rule, stored, and told to the applicant. Not-fit applicants are still saved and read.
- D4. Scarcity copy comes from `offer.slots`/`offer.days`, with the reason on the page (one engineer).
- D5. Dark only, rust accent, solid colours. Gradient text was removed.
- D7. Cal.com's official inline embed, not a bare iframe. Its `?embed=true` page stays blank until `embed.js` talks to it from the parent.
- D6. Imagery is code for now: an animated console and a dormant-list dot field. Generated imagery can replace them without layout changes.

## Next

- wren: pull applications from D1 into deals (authenticated `/api/export`); `BookingSync` reads bookings through the `calcom` site and joins on `metadata.application`.
- wren: a recruiting niche whose arm pitches `recruiting-reactivation-pilot` and links `/recruiting`.

## Where to attack

1. No-JS applicants can't pass Turnstile, so they land on the error block with a mailto. Acceptable for now; a JS-off visitor is rare.
2. The fit rule is duplicated in wren and `src/lib/offers.ts`. Same logic, two copies; a change in one without the other drifts silently until the snapshot check. Move it to a shared package if it grows.
3. The calculator's defaults (0.5% come back, 40% filled) are assumptions, labelled as such. Replace with pilot numbers once there are some.
