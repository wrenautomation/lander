# Wren Automation lander

wrenautomation.com. Two kinds of page:
- **Pitch pages** sell one offer: `/` (the general story, more business in and less busywork out) and `/recruiting/lead-reactivation` (lead reactivation). The wren recruiting emails link to `/recruiting/lead-reactivation`.
- **Niche pages**, the older design: `/agencies`. `/ria` and `/insurance` are gone and 301 to `/` (`public/_redirects`).

Specs: `designs/2026-09-25-pitch-pages.md` (pitch pages), `designs/2026-09-14-lander-spec.md` (niche pages). Offers: `wren/designs/2026-09-25-offers.md`.

## Offers come from wren

Every pitch page sells a named offer from wren's registry (`wren/packages/offers`). The lander reads a snapshot of it, `src/data/offers.json`. Never edit that file by hand. Change the offer in wren, then:

```
cd ../wren && pnpm offers:export ../lander/src/data/offers.json
```

wren's gates fail when the snapshot is stale. The build fails when a page names an offer that isn't live, or one whose `page` isn't that page's path.

From the offer, not the yaml: the deal terms (what you get, what you put in, what I get, the guarantee), `{slots}` and `{days}`, the ladder after it (`offer.next`), the form questions and who fits, and the booking link. Set `booking` on the offer to a Cal.com URL and a fit applicant gets the calendar in the page. While it's null they get the thank-you line. The link carries `metadata[offer]`, `metadata[application]` (the `applications.id`) and the utm, so wren can match a booking to its application.

## Edit the copy

All words live in `src/content/`.

| Want to change | File |
|---|---|
| Any words on `/` or `/recruiting/lead-reactivation` | `pitches/home.yaml`, `pitches/recruiting/lead-reactivation.yaml` |
| Any words on `/agencies` | `niches/agencies.yaml`, plus `site/site.yaml` for the shared parts |
| A case study on a niche page | `case-studies/<name>.yaml` |
| Footer, 404, email, city | `site/site.yaml` |

Rules for pitch yaml:
- `*word*` renders serif italic in the accent colour (headlines). `**word**` renders ink.
- `{slots}` and `{days}` fill from the offer. A card under `industries` that names its own `offer:` fills from that one. A token the offer doesn't have fails the build.
- A section left out doesn't render: `strip`, `field`, `calc`, `industries`, `deal`, `ladder` are optional. `deal` needs a free offer. `ladder.names` must name exactly the offer's `next`.
- `ask` must have `steps` and `nofit` when the offer has an application, `book_h` and `book` when it has a booking link. The `nofit` line says the fit rule in words; change it with the fit rule in wren.
- A blank line inside a `|` block is a paragraph break. A value with a colon or `*` at the start needs quotes.

New pitch page: add `pitches/<name>.yaml` with a `path`, name an offer whose `page` is that path, export the offer snapshot.

## Run it

```
npm install
npm run dev        # http://localhost:4321, live reload, no form backend
npm run preview    # full build + Cloudflare emulation, forms work against a local D1
npm run check      # astro check + functions typecheck
```

Before the first `preview`: `npx wrangler d1 execute wren-leads --local --file schema.sql`.
The real Turnstile keys fail on localhost. To test a form locally, build with the test site key and pass the test secret:
`PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npx astro build`, and `TURNSTILE_SECRET=1x0000000000000000000000000000000AA` in `.dev.vars`. Put the real ones back after.

Motion off: `?static`, or the OS reduced-motion setting. Pitch pages are light only (DESIGN.md); niche pages default dark with a toggle.

## Deploy (once)

```
npx wrangler login
npx wrangler pages project create wren-lander
npm run db:create                      # paste the id into wrangler.toml
npm run db:migrate
npx wrangler pages secret put TURNSTILE_SECRET --project-name wren-lander   # optional, blocks bots
npx wrangler pages secret put DISCORD_WEBHOOK  --project-name wren-lander   # optional, pings a Discord channel per lead
npx wrangler pages secret put RESEND_API_KEY   --project-name wren-lander   # optional, emails you each lead
npm run deploy
```

Custom domain (done 2026-09-15): Pages project → Custom domains → add `wrenautomation.com` and `www`, then DNS → Records → `CNAME @ wren-lander.pages.dev` and `CNAME www wren-lander.pages.dev`, both proxied. Pages goes active a few minutes after the records exist.
Every later deploy: push to `main`. A change to `schema.sql` needs `npm run db:migrate` first; CI doesn't migrate D1. GitHub Actions (`.github/workflows/deploy.yml`) runs check, build and deploy; watch it with `gh run watch`. `npm run deploy` still works from your machine.
The workflow needs four repo secrets: `CLOUDFLARE_API_TOKEN` (dash → My Profile → API Tokens → Create, Account · Cloudflare Pages · Edit), `CLOUDFLARE_ACCOUNT_ID`, `PUBLIC_CF_ANALYTICS`, `PUBLIC_TURNSTILE_SITE_KEY`. Set one with `gh secret set NAME -R wrenautomation/lander`.

## Every key the site can take

| Key | Where it goes | Get it from | Without it |
|---|---|---|---|
| `database_id` | `wrangler.toml` | `npm run db:create` prints it | form 500s; nothing else changes |
| `PUBLIC_CF_ANALYTICS` | `.env` | dash.cloudflare.com → Web Analytics → add site → token | no Cloudflare visit counts; our own beacon still works |
| `PUBLIC_TURNSTILE_SITE_KEY` | `.env` | dash.cloudflare.com → Turnstile → add widget (hostname wrenautomation.com, invisible) → site key | form still works; honeypot alone catches the dumb bots |
| `TURNSTILE_SECRET` | `wrangler pages secret put` | same widget → secret key | same as above (both or neither) |
| `DISCORD_WEBHOOK` | `wrangler pages secret put` | Discord channel → Edit → Integrations → Webhooks → New → copy URL | no Discord ping |
| `RESEND_API_KEY` | `wrangler pages secret put` | resend.com → API keys; first verify `wrenautomation.com` under Domains (3 DNS records) | leads land in D1 only, no email ping |
| `LEAD_TO` / `LEAD_FROM` | `wrangler.toml` `[vars]` | already set; `LEAD_FROM` must be on the verified domain | — |

`.env` and secrets are read at build/deploy time: change one → push again (or `npm run deploy`). The two `PUBLIC_` values also live as GitHub secrets; change both places. `.env` and `.dev.vars` are never committed.

## What gets measured

No cookies, no ids. The footer line promises that; keep it true.

- **Cloudflare Web Analytics** (if the token is set): visits, referrers, per page. Cookieless.
- **Our own beacon** (`src/scripts/hit.ts` → `/api/hit` → `hits` table): one row per page view when the tab closes or hides. Page, % scrolled, seconds visible, clicked the CTA, touched the form, viewport width, utm, referrer, country. Sent with `sendBeacon`, so it survives the tab closing. Skipped with `?static` / `?probe`.
- **Leads** (`leads` table): the niche-page form, plus the utm and referrer the visitor arrived with, country, ip, user agent.
- **Applications** (`applications` table): the pitch-page form. Offer, name, email, firm, note, every answer as JSON keyed by question id, `fit` (1/0 by the offer's rule), page, utm, ref, country, ip, user agent. A fit applicant is told so on the page; Discord and email ping either way.

```
npm run hits            # per page: views, mobile share, avg depth, avg secs, CTA clicks, form touches
npm run hits:campaign   # the same per utm_campaign
npm run leads           # last 50 leads
npm run applications    # last 50 applications
EMAIL=x@y.com npm run forget   # delete a lead on request
```

Views under 2 seconds are dropped from the summaries (bots, misclicks). Under ~100 views the numbers are noise.

### Links you send

Put a utm on every link in an email: `https://wrenautomation.com/recruiting/lead-reactivation?utm_source=email&utm_campaign=recruiting-sep`.
`utm_campaign` is the one you will group by. The first utm a visitor lands with stays with them for the tab, and it is saved on the lead or application if they submit.

### Pixels

None. A Meta / LinkedIn / Google pixel sets cookies, which breaks the footer promise and needs a consent banner (Quebec Law 25, PIPEDA). Add one only when running paid ads, together with a `/privacy` page and a consent gate. There is no `/thanks` page; the result shows on the same URL, so count conversions from the `leads` and `applications` tables, not from a page view.

## Layout

```
src/content/pitches/       pitch page copy (one yaml per page)
src/content/niches/        niche page copy
src/content.config.ts      what each yaml must contain
src/data/offers.json       offer snapshot exported from wren; never hand-edited
src/lib/offers.ts          offer types, fit rule, answer checks (shared by pages and functions)
src/lib/pitch.ts           loads a pitch with its offer; every build-time check lives here
src/lib/text.ts            *accent*, **ink**, paragraphs, {token} filling
src/pages/[...slug].astro  one route per pitch file
src/pages/[niche].astro    one route per niche file
src/layouts/Pitch.astro    the pitch page, sections in fixed order
src/layouts/Lander.astro   the niche page
src/components/pitch/      Calc, Apply (the form panel in the hero), Arrow
src/styles/pitch.css       pitch design: tokens, bezels, motion gates
src/styles/global.css      niche design
src/scripts/pitch.ts       pitch motion, calculator, stepped form
src/scripts/cal.ts         the Cal.com calendar in the page (embed.js, inline)
src/scripts/motion.ts      niche motion, theme, form
src/scripts/hit.ts         the page-view beacon, utm into the forms
functions/_shared/         env, form checks (Turnstile, bots), notify (Discord + Resend), booking link tags
functions/api/apply.ts     POST for pitch pages: offer check, answers, fit, D1, notify
functions/api/lead.ts      POST for niche pages
functions/api/hit.ts       POST for the beacon
schema.sql                 leads, hits, applications (safe to re-run)
public/_redirects          /ria and /insurance to /
```
