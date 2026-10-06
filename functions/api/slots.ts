// GET /api/slots: the open times on our own calendar, as ISO instants, with the call's length. Read through
// wren's `Calendar/slots`, kept 30 seconds at the edge so a busy page doesn't ask Google every view. A booking still
// checks its slot in Postgres, so a stale list costs a "taken", never a double booking.
import { calendar } from '../_shared/calendar';
import type { Env } from '../_shared/env';

type Slots = { zone: string; length: number; slots: string[] };

export const onRequestGet: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const key = new Request(new URL('/api/slots', request.url).toString());
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;
  const r = await calendar<Slots>(env, 'slots', {});
  if (!r.data) return Response.json({ error: 'unavailable' }, { status: r.status === 503 ? 503 : 502, headers: { 'cache-control': 'no-store' } });
  const res = Response.json(r.data, { headers: { 'cache-control': 'public, max-age=30' } });
  waitUntil(cache.put(key, res.clone()));
  return res;
};
