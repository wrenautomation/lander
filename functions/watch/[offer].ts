// GET /watch/<offer>: the offer's own video (its VSL, `video` in the offers registry), linked from emails whose firm
// has no demo of its own. The page is the /v shell (src/pages/v.astro) with the offer's mp4 in it and the "Made for"
// line taken out and the copy, buttons and links made this offer's. An offer with no video lands on its pitch page; an unknown one on the home page. The ?r= on the
// email's link rides through for src/scripts/hit.ts, which also puts it on the Book button.
import data from '../../src/data/offers.json';

interface Env { ASSETS: Fetcher }
type Offer = { id: string; name: string; promise: string; page?: string | null; video?: string };

const OFFERS = data.offers as Offer[];
const MP4 = /^https:\/\/\S+\.mp4$/;

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const url = new URL(request.url);
  const offer = OFFERS.find((o) => o.id === String(params.offer ?? ''));
  const away = (to: string) =>
    new Response(null, { status: 302, headers: { location: to + url.search, 'cache-control': 'no-store' } });
  if (!offer) return away('/');
  if (!offer.video || !MP4.test(offer.video)) return away(offer.page || '/');
  const video = offer.video;
  const shell = await env.ASSETS.fetch(new URL('/v', request.url));
  const out = new HTMLRewriter()
    .on('title', { element: (e) => { e.setInnerContent(`${offer.name} | Wren Automation`); } })
    .on('meta[property="og:title"]', { element: (e) => { e.setAttribute('content', offer.name); } })
    .on('meta[property="og:url"]', { element: (e) => { e.setAttribute('content', url.origin + url.pathname); } })
    .on('.watch .label', { element: (e) => { e.remove(); } })
    .on('.watch h1', { element: (e) => { e.setInnerContent(offer.name); } })
    .on('.watch .lede', { element: (e) => { e.setInnerContent(offer.promise); } })
    .on('a[data-book]', { element: (e) => { e.setAttribute('href', `/book/${offer.id}`); } })
    .on('a[data-how]', { element: (e) => { if (offer.page) e.setAttribute('href', offer.page); else e.remove(); } })
    .on('video[data-video]', { element: (e) => { e.setAttribute('src', video); } })
    .transform(shell);
  const headers = new Headers(out.headers);
  headers.set('cache-control', 'public, max-age=300');
  return new Response(out.body, { status: 200, headers });
};
