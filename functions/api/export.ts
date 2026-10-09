// GET /api/export?since=<id>&limit=<n>&table=hits|applications|events|replays|exposures|answers|clicks: rows newer
// than an id, for wren to read (exposures: the `exp.seen` events of visitors with the cookie yes, which experiments
// count; answers: site survey answers; clicks: /go/ hops to our pages, with the page each went to)
// (`wren email clicks` joins ?r= codes to the emails that carried them; wren's SMS watch texts applicants who
// ticked the texts box). Bearer EXPORT_TOKEN, a Pages secret; with no secret set the endpoint does not exist.
import type { Env } from '../_shared/env';

const TABLES = {
  hits: 'select id, ts, view, visitor, page, depth, secs, cta, touched, w, r, utm_source, utm_medium, utm_campaign, utm_content, ref, country from hits',
  applications: 'select id, ts, offer, visitor, name, email, phone, sms_consent, firm, fit, page, first_touch, last_touch, r, utm_source, utm_medium, utm_campaign from applications',
  events: 'select id, ts, view, visitor, page, name, props from events',
  replays: 'select id, view, visitor, page, started, last, chunks, bytes, w, country, capped, first_touch from replays',
  exposures: "select id, ts, view, visitor, page, name, props from events where name = 'exp.seen' and visitor is not null",
  answers: 'select id, ts, survey, visitor, view, page, value from answers',
  clicks: 'select id, ts, link, source, medium, campaign, content, page, ref, country from clicks',
} as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.EXPORT_TOKEN) return new Response(null, { status: 404 });
  const given = request.headers.get('authorization') || '';
  const want = `Bearer ${env.EXPORT_TOKEN}`;
  const a = new TextEncoder().encode(given), b = new TextEncoder().encode(want);
  if (a.byteLength !== b.byteLength || !crypto.subtle.timingSafeEqual(a, b)) return new Response(null, { status: 401 });
  const url = new URL(request.url);
  const asked = url.searchParams.get('table') || '';
  const table = (Object.hasOwn(TABLES, asked) ? asked : 'hits') as keyof typeof TABLES;
  const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
  const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get('limit')) || 1000));
  const select = TABLES[table];
  const { results } = await env.DB.prepare(`${select} ${select.includes(' where ') ? 'and' : 'where'} id > ? order by id limit ?`).bind(since, limit).all();
  return Response.json({ [table]: results }, { headers: { 'cache-control': 'no-store' } });
};
