# Measurement pass (2026-09-14, Opus)

What "pixels and analytics" became: no pixels, our own beacon, utm on
the lead row, Cloudflare Web Analytics as the optional second count.

## What landed

- `src/scripts/hit.ts`: per page view, tracks max scroll %, visible
  seconds, CTA click, form focus; `sendBeacon` to `/api/hit` on
  `visibilitychange` hidden and `pagehide`. Fills the form's hidden
  `utm_*`/`ref` inputs from the URL, first-touch per tab via
  sessionStorage. Off under `?static` / `?probe`.
- `functions/api/hit.ts`: clamps every field, inserts into `hits`.
  No ip. Country from `cf-ipcountry`.
- `leads` gains utm_*, ref, country. Email ping shows campaign and
  country.
- `package.json`: `hits`, `hits:campaign`, `forget` (delete a lead by
  email, honours the footer promise).
- Footer line: "No cookies. Visits are counted, not people."
- README: a table of every key the site takes, what it's for, what
  happens without it.

Verified locally under `wrangler pages dev`: beacon row lands with
utm, bad body → 400, lead row carries utm, hidden inputs filled in a
real browser (`--dump-dom`).

## Where to attack

1. `/api/hit` is unauthenticated and unthrottled. Anyone can fill the
   table. Cost is D1 rows, not money, and the summaries drop `secs < 2`.
   If it's ever abused: Cloudflare rate limit rule on `/api/hit`, or a
   per-deploy token in the beacon body.
2. `visibilitychange` → hidden fires on tab switch too, then the tab
   comes back and sends again as a second view. Deliberate (a return is
   a view), but `views` over-counts tab switchers. Check `secs`.
3. `X-Frame-Options: DENY` in `_headers` means the iframe screenshot
   harness only works against a server that ignores `_headers`
   (python http.server). `wrangler pages dev` honours it.
4. `db:migrate` is `create table if not exists`; adding columns to a
   live table needs `alter table`. Fine now (no remote DB yet). Next
   schema change needs a migration line in the README.
5. `sendBeacon` with a JSON Blob: Safari sends it, Firefox sends it,
   both count it as a keepalive request. Not tested on iOS Safari here.
   If hits from iPhone never appear, switch to `text/plain` and parse
   on the server.
6. `sum(w < 840)` in the summary depends on SQLite booleans as ints.
   Works on D1. Any other database, rewrite.
