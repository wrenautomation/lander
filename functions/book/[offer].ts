// GET /book/<offer>[?r=<code>]: the booking link in an email, or a page's "Book a call" button. Records the click as a
// view of /book/<offer> in `hits` (so `wren email clicks` sees it beside the page views). On our own calendar
// (functions/_shared/booking.ts) it then serves the booking page, src/pages/schedule.astro, at this same address;
// on Cal.com it sends them to the offer's Cal.com page with the offer and the email's code in metadata[...], so
// the booking says which email it came from. An offer with no booking page lands on its pitch page; an unknown one
// on the home page.
import data from '../../src/data/offers.json';
import { bookingLink, ownCalendar } from '../_shared/booking';
import { schedule } from '../_shared/calendar';
import type { Env } from '../_shared/env';
import { visitorOf, withVisitor } from '../_shared/visitor';

type Offer = { id: string; page?: string; booking?: string | null };

const OFFERS = data.offers as Offer[];
const CODE = /^[A-Za-z0-9_-]{8,40}$/;

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env, waitUntil }) => {
  const url = new URL(request.url);
  const offer = OFFERS.find((o) => o.id === String(params.offer ?? ''));
  const back = (to: string) => new Response(null, { status: 302, headers: { location: to, 'cache-control': 'no-store' } });
  if (!offer) return back('/');
  if (!offer.booking) return back(offer.page || '/');
  const raw = url.searchParams.get('r') || '';
  const r = CODE.test(raw) ? raw : '';
  const visitor = visitorOf(request);
  // An embedded page (the pitch's fit block) was already counted by its own button.
  if (!url.searchParams.has('embed'))
    waitUntil(
      env.DB.prepare(
        `insert into hits (view, visitor, ts, page, niche, depth, secs, cta, touched, w, r, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ua)
         values (?, ?, ?, ?, '', 0, 0, 1, 0, 0, ?, '', '', '', '', ?, ?, ?)`,
      ).bind(
        crypto.randomUUID(), visitor.id, new Date().toISOString(), `/book/${offer.id}`, r,
        (request.headers.get('referer') || '').slice(0, 200), request.headers.get('cf-ipcountry') || '',
        (request.headers.get('user-agent') || '').slice(0, 300),
      ).run().catch(() => {}),
    );
  if (ownCalendar(env, url)) return withVisitor(await schedule(env, request), visitor);
  return withVisitor(back(bookingLink(offer.booking, { offer: offer.id, r })), visitor);
};

