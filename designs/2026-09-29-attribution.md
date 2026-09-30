# Attribution (2026-09-29)

Know which outreach brings people and which of them apply. Cold email first, then every organic link: bios, video descriptions, posts.

## What William asked

- "cookie management so i know whos coming from which outreach"
- Extend to organic content links in videos, posts and profiles. Engineering freedom.

## How it fits together

- **Visitor.** One first-party cookie `wv`: a random id set by the server on every `/api/hit`, `/api/apply` and `/api/lead` answer. HttpOnly, Secure, SameSite=Lax, 400 days (rolled each answer). `functions/_shared/visitor.ts` is the only file that knows it.
- **Touch.** A page view that arrived from somewhere: `?r=` (a code on one email's links), utm (a `/go` link or a tagged post), or another site's referrer. Stored on that view's `hits` row. `src/scripts/hit.ts` then strips `r` and utm from the address bar, so a forwarded link doesn't credit the wrong email.
- **Views.** `hits` has one row per view, keyed by a view id the page makes. Posted on arrival (a bounce still counts), raised by a beacon when hidden. The upsert only raises numbers, and only for the same visitor.
- **Forms.** At submit, `/api/apply` and `/api/lead` read the visitor's first and last touch from `hits` and store them as JSON with the `visitor` and `r`. The ping says "Came from: linkedin / organic / profile (2026-09-29), last email r:abc (2026-10-02) · 7 views". The form's hidden fields still carry this tab's touch, as a fallback for a blocked cookie.
- **Links out.** `/go/<channel>[/<campaign>[/<content>]]` 302s to the channel's page with utm set. Channels live in `src/data/links.json` (yt, li, ig, tt, x, rd, ads, sms, rec). Unknown channel = source is its name, lands on `/`. `?to=/path` picks a local page; anything else is ignored.
- **Report.** `npm run channels [-- --days 30]`: by channel and by campaign (first touch) with visitors, views, time, form reached, applied, fit; plus each email code clicked.
- **Names.** `/api/export` (Bearer `EXPORT_TOKEN`, 404 without it) returns hits or applications as JSON for wren. wren mints `r` per message, so `wren site visits` names the company, person and step behind each click.

## Decisions

- D1. First party and server set. No third-party analytics, no pixel vendors. HttpOnly so page scripts can't read or leak it.
- D2. First and last touch derived from `hits` at submit, not kept in the cookie. The database is the one source of truth, so a report can be recomputed any way later.
- D3. `r` is per email message, not per person. One code answers who, which step and which copy. Opaque, so the link shows no name.
- D4. `/go` links over hand-typed utm. Short enough for a bio, one registry, and a new channel works before it's registered.
- D5. Strip `r` and utm after reading them. Shared links stay clean and don't credit the sender's email.
- D6. Direct means no touch was ever seen for that visitor. Visitors are counted from 2026-09-29; older rows have no visitor.

## Owed

- wren: `link_token` per message, `?r=` on the sign-off link, `wren site visits`.
- Cal.com bookings joined to visitor (the booking metadata already carries it).
