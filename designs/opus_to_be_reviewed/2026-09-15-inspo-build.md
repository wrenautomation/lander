# Inspo build, 2026-09-15

Items 1, 2, 4 to 9 from the inspo notes, plus the form. Item 3 skipped on William's call.

## What changed

- `site.yaml`: cta "Get the free audit"; teaser `safe` and `how[0]` name the audit's one page; `pillars` replaced by `compare` (h3, two column headings, five rows); six FAQ entries, pre-call order; `ask_fields` gains `name` and `questions` (optional).
- `niches/*.yaml`: `sides_h2`, `sides_intro`, `sides_hand`, `sides_auto`, `sides[]` (four rows each).
- `case-studies/*.yaml`: `result`, the card title.
- `content.config.ts`: the keys above; `ask_fields.key` enum adds name, questions.
- `Lander.astro`: section numbers via a counter; sides table after the teaser; compare table after the steps; head shows result then client · kind; textareas for note and questions.
- `global.css`: `.num`, `.sides`, `.compare` (phone: stacked with USUALLY / WITH ME prefixes; desktop: three columns); `.pillars` removed; case head stacked; impact figure column no longer clips "6 to 7 hrs" on phones; desktop section padding 5rem.
- `functions/api/lead.ts`, `schema.sql`, `package.json`: name and questions stored and included in the Discord and email pings; `npm run db:alter` adds the columns to an existing database; `npm run leads` shows them.

## Where to attack

1. The compare table's left column describes "the usual arrangement". Every line is a claim about other vendors. Check each is fair; "A salesperson, a project manager, and whoever is free that week" is the sharpest.
2. Sides rows are my guesses at each niche's by-hand jobs. RIA rows come from the ADV work; insurance and agencies are less grounded.
3. Page is longer (8 sections). Sides + proves + targets are three list sections in a row on the phone. Consider merging proves into the case cards later.
4. The two case titles differ in shape ("6 to 7 hours a week back for…" vs "200 hours of lookups by hand, gone"). Fine as headlines; a fragment may read as copy if both were fragments.
5. `questions` field placeholder promises "I answer in the reply". Keep it true.
