# to_fix pass, 2026-09-14

Every item in `to_fix.md`, then a humanizer pass over the yaml copy.
Every visible string now lives in `src/content/`; the layout has no prose.

What changed: CTA "Request an audit"; proof strip gone, replaced by an
offer teaser under the hero (promise, risk reversal, link to the offer);
"Who I've helped"; case studies start with `story`, then `now`, and the
pipeline block is larger and tinted; new "What this proves to you"
section per niche; three pillars inside the offer; about rewritten
(student, internships, why), "Why me" added, facts and "fixed price"
gone; form fields are a list in `site.yaml` with `required` + `error`,
`*` marks, client-side check that focuses the first bad field; 404 page;
`robots.txt`.

## Where to attack, ranked

1. Pillars 2 and 3 and the line "if a piece doesn't do what we agreed,
   you don't pay for it" are commitments William has not made yet. They
   read as terms. Confirm or soften before this goes live.
2. Case studies still contradict the emails (GoC policy chatbot for
   17,000 staff vs. a document pipeline; U of Alberta lookups vs. a
   report watcher). Numbers are placeholders and say so in the file.
3. The note field is now required. A visitor with nothing to say
   bounces. Flip `required` in `site.yaml` if that costs leads.
4. Client-side validation trusts `checkValidity()`. The server still
   only checks the email; an empty note posted without JS lands as a
   row with an empty note.
5. Headless Chrome clamps `--window-size` below ~440px. Phone
   screenshots must go through an iframe (see `scratchpad/frame.html`
   pattern) or they lie.
