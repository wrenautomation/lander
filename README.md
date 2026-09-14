# Wren Automation lander

Post-email credibility page. `/`, `/ria`, `/insurance`, `/agencies`.
Spec: `designs/2026-09-14-lander-spec.md`.

## Edit the copy

All words live in `src/content/`. Nothing in `src/` outside that folder is prose.

| Want to change | File |
|---|---|
| Headline, intro, "what this proves", "what gets automated" list for one page | `niches/<page>.yaml` (`general.yaml` is `/`) |
| A case study (story, now, steps, numbers, stack) | `case-studies/<name>.yaml` |
| Everything else: nav, offer teaser, section headings and labels, how it works, pillars, questions, about, form fields, footer, 404 | `site/site.yaml` |

Rules:
- `**bold**` works in `lede`, `ask_intro` and `offer.promise` only.
- A value with a colon or a `*` needs quotes: `h1: "Renewals: the short version"`.
- Form fields are the `ask_fields` list. `required: true` adds the `*` and the check; `error` is the line shown under the field when the check fails. The email is always checked on the server.
- Keep the indentation. A stray key or missing field fails the build with the file and line.
- Case-study `count:` makes a figure count up on scroll. Leave it out for text figures like `½ day`.
- A step with `you: true` gets the filled node (a person does it).

New page: copy `niches/ria.yaml` to `niches/<slug>.yaml`. The file name is the URL. Set `hue` (rust, green or red) and `form_value`.
New case study: add `case-studies/<name>.yaml`, then list `<name>` under `cases:` in each niche that should show it.
Photo: drop `public/william.jpg`, then uncomment `photo: /william.jpg` in `site.yaml`.
Colours, spacing, breakpoint: `src/styles/global.css`. One breakpoint, 840px.

## Run it

```
npm install
npm run dev        # http://localhost:4321, live reload, no form backend
npm run preview    # full build + Cloudflare emulation, form works against a local D1
```

Before the first `preview`: `npx wrangler d1 execute wren-leads --local --file schema.sql`.

Theme: light by default, follows the system, the button remembers. Add `?theme=dark` to force it.
Motion off: `?static`, or the OS reduced-motion setting.

## Deploy (once)

```
npx wrangler login
npx wrangler pages project create wren-lander
npm run db:create                      # paste the id into wrangler.toml
npm run db:migrate
npx wrangler pages secret put TURNSTILE_SECRET --project-name wren-lander   # optional, blocks bots
npx wrangler pages secret put RESEND_API_KEY   --project-name wren-lander   # optional, emails you each lead
npm run deploy
```

- Turnstile: create a widget at dash.cloudflare.com → Turnstile. Put the site key in `.env` as `PUBLIC_TURNSTILE_SITE_KEY`, the secret above. Without it the form still works; the honeypot field catches the dumb bots.
- Lead email: Resend, domain verified, sender in `wrangler.toml` `LEAD_FROM`. Without it leads still land in D1.
- Analytics: Cloudflare Web Analytics token in `.env` as `PUBLIC_CF_ANALYTICS`.
- Custom domain: Pages project → Custom domains.

Every later deploy: `npm run deploy`. Read leads: `npm run leads`.

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
functions/api/lead.ts      POST handler: D1 row, optional Turnstile + email
schema.sql                 the leads table
```
