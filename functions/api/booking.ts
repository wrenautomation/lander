// POST /api/booking: the manage page's calls, JSON {token, do, start?, reason?}. `do` is "get" (the call as it
// stands), "move" (to `start`) or "cancel". The token is the booking's own signed link; wren checks it, so nothing
// here is trusted but its shape. A move or a cancel pings William in #meetings.
import { type BookingView, MANAGE_TOKEN, calendar, meetings, when } from '../_shared/calendar';
import type { Env } from '../_shared/env';
import { clip } from '../_shared/form';

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const reply = (status: number, body: Record<string, unknown>) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = clip(body?.token, 64);
  if (!MANAGE_TOKEN.test(token)) return reply(404, { ok: false, error: 'link' });
  const fail = (status: number) =>
    reply(status === 404 ? 404 : status === 409 ? 409 : status === 400 ? 400 : 502, {
      ok: false, error: status === 404 ? 'link' : status === 409 ? 'taken' : status === 400 ? 'invalid' : 'down',
    });
  switch (body?.do) {
    case 'get': {
      const r = await calendar<BookingView>(env, 'booking', { token });
      return r.data ? reply(200, { ok: true, booking: r.data }) : fail(r.status);
    }
    case 'move': {
      const start = clip(body.start, 40);
      if (Number.isNaN(Date.parse(start))) return reply(400, { ok: false, error: 'invalid' });
      const was = await calendar<BookingView>(env, 'booking', { token });
      const r = await calendar<BookingView>(env, 'reschedule', { token, start });
      if (!r.data) return fail(r.status);
      waitUntil(caches.default.delete(new Request(new URL('/api/slots', request.url).toString())).catch(() => false));
      waitUntil(meetings(env, 'moved', r.data, was.data ? [`was ${when(was.data.start)}`] : []));
      return reply(200, { ok: true, booking: r.data });
    }
    case 'cancel': {
      const reason = clip(body.reason, 500);
      const was = await calendar<BookingView>(env, 'booking', { token });
      const r = await calendar<BookingView>(env, 'cancel', { token, ...(reason ? { reason } : {}) });
      if (!r.data) return fail(r.status);
      if (was.data?.state !== 'booked') return reply(200, { ok: true, booking: r.data });
      waitUntil(caches.default.delete(new Request(new URL('/api/slots', request.url).toString())).catch(() => false));
      waitUntil(meetings(env, 'cancelled', r.data, reason ? [`reason: ${reason}`] : []));
      return reply(200, { ok: true, booking: r.data });
    }
    default:
      return reply(400, { ok: false, error: 'invalid' });
  }
};
