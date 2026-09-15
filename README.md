# Wren Automation lander

Post-email credibility page. `/`, `/ria`, `/insurance`, `/agencies`.
Spec: `designs/2026-09-14-lander-spec.md`.

## Edit the copy

All words live in `src/content/`. Nothing in `src/` outside that folder is prose.

| Want to change | File |
|---|---|
| Headline, intro, "what this proves", "what gets automated" list for one page | `niches/<page>.yaml` (`general.yaml` is `/`) |
| A case study (story, now, steps, numbers, stack) | `case-studies/<name>.yaml` |
| "Which column is your week" rows for one page | `niches/<page>.yaml`, `sides:` |
| Everything else: nav, offer teaser, section headings and labels, how it works, principles, why not an agency, questions, about, form fields, footer, 404 | `site/site.yaml` |

Rules:
- `**bold**` works in `lede`, `ask_intro` and `offer.promise` only.
- A value with a colon or a `*` needs quotes: `h1: "Renewals: the short version"`.
- Form fields are the `ask_fields` list. Keys: `name`, `email`, `phone`, `note`, `questions`. `required: true` adds the `*` and the check; `error` is the line shown under the field when the check fails. The email is always checked on the server. A database made before 2026-09-15 needs `npm run db:alter` once for the `name` and `questions` columns.
- Keep the indentation. A stray key or missing field fails the build with the file and line.
- Case-study `count:` makes a figure count up on scroll. Leave it out for text figures like `½ day`.
- A step with `you: true` gets the filled node (a person does it).

New page: copy `niches/ria.yaml` to `niches/<slug>.yaml`. The file name is the URL. Set `hue` (rust, green or red) and `form_value`.
New case study: add `case-studies/<name>.yaml`, then list `<name>` under `cases:` in each niche that should show it.
Photo: drop `public/william.jpg`, then uncomment `photo: /william.jpg` in `site.yaml`. Until then the slot is empty and invisible.
Colours, spacing, breakpoint: `src/styles/global.css`. One breakpoint, 840px.

## Run it

```
npm install
npm run dev        # http://localhost:4321, live reload, no form backend
npm run preview    # full build + Cloudflare emulation, form works against a local D1
```

Before the first `preview`: `npx wrangler d1 execute wren-leads --local --file schema.sql`.

Theme: light by default, the button remembers. Add `?theme=dark` to force it.
Motion off: `?static`, or the OS reduced-motion setting.

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
Every later deploy: push to `main`. GitHub Actions (`.github/workflows/deploy.yml`) runs check, build and deploy; watch it with `gh run watch`. `npm run deploy` still works from your machine.
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
- **Leads** (`leads` table): the form fields plus the utm and referrer the visitor arrived with, country, ip, user agent.

```
npm run hits            # per page: views, mobile share, avg depth, avg secs, CTA clicks, form touches
npm run hits:campaign   # the same per utm_campaign
npm run leads           # last 50 leads
EMAIL=x@y.com npm run forget   # delete a lead on request
```

Views under 2 seconds are dropped from the summaries (bots, misclicks). Under ~100 views the numbers are noise.

### Links you send

Put a utm on every link in an email: `https://wrenautomation.com/ria?utm_source=email&utm_campaign=ria-sep`.
`utm_campaign` is the one you will group by. The first utm a visitor lands with stays with them if they click from `/` to `/ria` in the same tab, and it is saved on the lead if they submit.

### Pixels

None. A Meta / LinkedIn / Google pixel sets cookies, which breaks the footer promise and needs a consent banner (Quebec Law 25, PIPEDA). Add one only when running paid ads, together with a `/privacy` page and a consent gate. There is no `/thanks` page; the thank-you is `?sent=1` on the same URL, so count conversions from the `leads` table, not from a page view.

## Layout

```
src/content/         copy (yaml)
src/content.config.ts  what each yaml must contain
src/pages/[...slug].astro  one route per niche file
src/pages/404.astro        the not-found page (copy in site.yaml)
src/pages/sitemap.xml.ts   one URL per niche page
src/components/Foot.astro  footer: privacy line, © year, analytics clause
public/robots.txt          allows everything except /api/, points at the sitemap
public/_headers            security headers and cache rules
src/layouts/Lander.astro   the page
src/styles/global.css      mobile first, one breakpoint
src/scripts/motion.ts      theme, traces, counters, form
src/scripts/hit.ts         the page-view beacon, utm into the form
functions/api/lead.ts      POST handler: D1 row, optional Turnstile + email
functions/api/hit.ts       POST handler for the beacon
schema.sql                 the leads and hits tables
```
