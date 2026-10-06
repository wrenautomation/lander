// POST /api/book: a booking from the page at /book/<offer> (fields offer, start, name, email, zone, plus the tags it
// came with: r, application, utm_*, ref). After the bot check it signs the booking with EXPORT_TOKEN and hands it to
// wren's `Calendar/book`, which takes the slot in Postgres, makes the Google event with Meet and mails the booker.
// Then it pings William in #meetings. JSON only: the page needs a script to pick a time anyway.
import data from '../../src/data/offers.json';
import { type BookingView, bookSig, calendar, meetings } from '../_shared/calendar';
import type { Env } from '../_shared/env';
import { EMAIL, clip, human, isBot, origin, readForm } from '../_shared/form';
import { visitorOf, withVisitor } from '../_shared/visitor';

type Offer = { id: string; name: string; booking?: string | null };
const OFFERS = data.offers as Offer[];
const ZONE = /^[A-Za-z][A-Za-z0-9_+\-/]{0,63}$/;
const CODE = /^[A-Za-z0-9_-]{8,40}$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const visitor = visitorOf(request);
  const reply = (status: number, body: Record<string, unknown>) => withVisitor(Response.json(body, { status, headers: { 'cache-control': 'no-store' } }), visitor);

  const form = await readForm(request);
  if (!form) return reply(400, { ok: false, error: 'form' });
  if (isBot(form)) return reply(200, { ok: false, error: 'taken' });
  const offer = OFFERS.find((o) => o.id === clip(form.get('offer'), 64));
  if (!offer?.booking) return reply(400, { ok: false, error: 'offer' });
  const start = clip(form.get('start'), 40);
  const name = clip(form.get('name'), 200);
  const email = clip(form.get('email'), 200);
  const zone = clip(form.get('zone'), 64);
  if (Number.isNaN(Date.parse(start))) return reply(400, { ok: false, error: 'start' });
  if (!name) return reply(400, { ok: false, error: 'name' });
  if (!EMAIL.test(email)) return reply(400, { ok: false, error: 'email' });
  if (!env.EXPORT_TOKEN) return reply(503, { ok: false, error: 'off' });
  const o = origin(form, request);
  if (!(await human(env, form, o.ip))) return reply(403, { ok: false, error: 'turnstile' });

  const r = clip(form.get('r'), 40);
  const application = clip(form.get('application'), 64);
  const source = Object.fromEntries(
    Object.entries({
      utm_source: o.utm_source, utm_medium: o.utm_medium, utm_campaign: o.utm_campaign, utm_content: o.utm_content,
      ref: o.ref, page: o.page || `/book/${offer.id}`, visitor: visitor.id ?? '',
    }).filter(([, v]) => v),
  );
  const res = await calendar<BookingView & { manage: string }>(env, 'book', {
    offer: offer.id, start, name, email, zone: ZONE.test(zone) ? zone : 'America/Toronto',
    ...(CODE.test(r) ? { code: r } : {}), ...(/^\d{1,12}$/.test(application) ? { application } : {}),
    source, sig: await bookSig(env.EXPORT_TOKEN, offer.id, start, email),
  });
  if (!res.data) {
    const error = res.status === 409 ? 'taken' : res.status === 400 ? 'invalid' : 'down';
    return reply(res.status === 409 || res.status === 400 ? res.status : 502, { ok: false, error });
  }
  const b = res.data;
  // The next list read sees the slot gone.
  waitUntil(caches.default.delete(new Request(new URL('/api/slots', request.url).toString())).catch(() => false));
  waitUntil(meetings(env, 'booked', b, [
    [`offer ${offer.id}`, r ? `r ${r}` : '', o.utm_campaign ? `utm_campaign ${o.utm_campaign}` : ''].filter(Boolean).join(' · '),
  ], email));
  return reply(200, { ok: true, booking: { start: b.start, end: b.end, zone: b.zone, title: b.title, meetUrl: b.meetUrl }, manage: new URL(b.manage).pathname });
};
