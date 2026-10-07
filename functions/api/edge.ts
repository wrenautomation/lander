// POST /api/edge: wren's site flags and live site surveys (functions/_shared/edge.ts), the whole set each time, replacing the row.
// GET answers what is stored, so wren can check. Bearer EDGE_TOKEN, a Pages secret; with none set the endpoint
// does not exist.
import { forgetEdge, parseEdge } from '../_shared/edge';
import type { Env } from '../_shared/env';

const MAX = 64 * 1024;

function allowed(request: Request, token: string): boolean {
  const a = new TextEncoder().encode(request.headers.get('authorization') || '');
  const b = new TextEncoder().encode(`Bearer ${token}`);
  return a.byteLength === b.byteLength && crypto.subtle.timingSafeEqual(a, b);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.EDGE_TOKEN) return new Response(null, { status: 404 });
  if (!allowed(request, env.EDGE_TOKEN)) return new Response(null, { status: 401 });
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX) return new Response(null, { status: 413 });
  let body: unknown;
  try { body = JSON.parse(text); } catch { return new Response(null, { status: 400 }); }
  const config = parseEdge(body), at = new Date().toISOString();
  await env.DB.prepare('insert into edge (id, body, at) values (1, ?, ?) on conflict (id) do update set body = excluded.body, at = excluded.at')
    .bind(JSON.stringify(config), at).run();
  forgetEdge();
  return Response.json({ flags: config.flags.length, surveys: config.surveys.length, at }, { headers: { 'cache-control': 'no-store' } });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.EDGE_TOKEN) return new Response(null, { status: 404 });
  if (!allowed(request, env.EDGE_TOKEN)) return new Response(null, { status: 401 });
  const row = await env.DB.prepare('select body, at from edge where id = 1').first<{ body: string; at: string }>();
  return Response.json(row ? { ...JSON.parse(row.body), at: row.at } : { flags: [], surveys: [], at: null }, { headers: { 'cache-control': 'no-store' } });
};
