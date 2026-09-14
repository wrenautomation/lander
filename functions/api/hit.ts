// POST /api/hit. One anonymous row per page view from src/scripts/hit.ts. No ip, no id.
interface Env { DB: D1Database }

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const i = (v: unknown, max: number) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  await env.DB.prepare(
    `insert into hits (ts, page, niche, depth, secs, cta, touched, w, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ua)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    new Date().toISOString(), s(b.page, 200), s(b.niche, 40), i(b.depth, 100), i(b.secs, 86400), i(b.cta, 1), i(b.touched, 1), i(b.w, 10000),
    s(b.utm_source, 100), s(b.utm_medium, 100), s(b.utm_campaign, 100), s(b.utm_content, 100), s(b.ref, 200),
    request.headers.get('cf-ipcountry') || '', s(request.headers.get('user-agent'), 300),
  ).run();
  return new Response(null, { status: 204 });
};
