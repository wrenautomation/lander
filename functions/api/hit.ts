// POST /api/hit. One row per page view from src/scripts/hit.ts, keyed by the view id the page made. The page posts
// once on arrival (so a bounce still counts) and again when hidden, with how far they read; the second post raises
// the first row's numbers, never lowers them. Each row carries the visitor cookie's id (functions/_shared/visitor.ts),
// or none without consent. The answer says the consent state, so the page knows to show the cookie banner.
import { visitorOf, withVisitor } from '../_shared/visitor';

interface Env { DB: D1Database }

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const i = (v: unknown, max: number) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  const view = s(b.view, 40);
  if (!/^[A-Za-z0-9-]{8,40}$/.test(view)) return new Response(null, { status: 400 });
  const visitor = visitorOf(request);
  // A second post for the same view from another visitor changes nothing: views are not shared.
  await env.DB.prepare(
    `insert into hits (view, visitor, ts, page, niche, depth, secs, cta, touched, w, r, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ua)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     on conflict (view) do update set depth = max(depth, excluded.depth), secs = max(secs, excluded.secs),
       cta = max(cta, excluded.cta), touched = max(touched, excluded.touched)
     where hits.visitor is excluded.visitor`,
  ).bind(
    view, visitor.id, new Date().toISOString(), s(b.page, 200), s(b.niche, 40), i(b.depth, 100), i(b.secs, 86400), i(b.cta, 1), i(b.touched, 1), i(b.w, 10000),
    s(b.r, 40), s(b.utm_source, 100), s(b.utm_medium, 100), s(b.utm_campaign, 100), s(b.utm_content, 100), s(b.ref, 200),
    request.headers.get('cf-ipcountry') || '', s(request.headers.get('user-agent'), 300),
  ).run();
  return withVisitor(Response.json({ consent: visitor.consent }), visitor);
};
