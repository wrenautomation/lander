// GET /api/export?since=<id>&limit=<n>&table=hits|applications: rows newer than an id, for wren to read
// (`wren email clicks` joins ?r= codes to the emails that carried them). Bearer EXPORT_TOKEN, a Pages secret;
// with no secret set the endpoint does not exist.
import type { Env } from '../_shared/env';

const TABLES = {
  hits: 'select id, ts, view, visitor, page, depth, secs, cta, touched, w, r, utm_source, utm_medium, utm_campaign, utm_content, ref, country from hits',
  applications: 'select id, ts, offer, visitor, name, email, firm, fit, page, first_touch, last_touch, r, utm_source, utm_medium, utm_campaign from applications',
} as const;

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.EXPORT_TOKEN) return new Response(null, { status: 404 });
  const given = request.headers.get('authorization') || '';
  const want = `Bearer ${env.EXPORT_TOKEN}`;
  const a = new TextEncoder().encode(given), b = new TextEncoder().encode(want);
  if (a.byteLength !== b.byteLength || !crypto.subtle.timingSafeEqual(a, b)) return new Response(null, { status: 401 });
  const url = new URL(request.url);
  const table = url.searchParams.get('table') === 'applications' ? 'applications' : 'hits';
  const since = Math.max(0, Number(url.searchParams.get('since')) || 0);
  const limit = Math.min(5000, Math.max(1, Number(url.searchParams.get('limit')) || 1000));
  const { results } = await env.DB.prepare(`${TABLES[table]} where id > ? order by id limit ?`).bind(since, limit).all();
  return Response.json({ [table]: results }, { headers: { 'cache-control': 'no-store' } });
};
