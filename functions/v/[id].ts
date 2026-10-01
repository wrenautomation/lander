// GET /v/<id>: one firm's demo video, linked from that firm's email. The page is the static shell at /v
// (src/pages/v.astro); this fills in the firm, the video and its poster from <VIDEOS_ORIGIN>/v/<id>.json, which
// wren writes last when it publishes one (`wren video render`). An id that isn't one, or one with no video, is
// the site's 404. The ?r= on the email's link rides through untouched for src/scripts/hit.ts.
import data from '../../src/data/offers.json';

interface Env {
  ASSETS: Fetcher;
  VIDEOS_ORIGIN?: string; // the CDN in front of wren's videos bucket, no trailing slash
}
type Meta = { firm?: unknown; mp4?: unknown; poster?: unknown };

const ID = /^[A-Za-z0-9_-]{16,64}$/;
const OFFER = data.offers.find((o) => o.id === 'reactivation')!.name;

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const id = String(params.id ?? '');
  const origin = env.VIDEOS_ORIGIN;
  if (!origin || !ID.test(id)) return notFound(env, request);
  const res = await fetch(`${origin}/v/${id}.json`, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!res.ok) return notFound(env, request);
  const meta = (await res.json().catch(() => ({}))) as Meta;
  // only media under this id on our CDN, whatever the file says
  const own = (u: unknown, ext: string) => (u === `${origin}/v/${id}.${ext}` ? u : null);
  const mp4 = own(meta.mp4, 'mp4');
  const poster = own(meta.poster, 'jpg');
  const firm = typeof meta.firm === 'string' && meta.firm.trim() ? meta.firm.trim().slice(0, 60) : null;
  if (!mp4 || !poster || !firm) return notFound(env, request);

  const shell = await env.ASSETS.fetch(new URL('/v', request.url));
  const page = new URL(request.url);
  const out = new HTMLRewriter()
    .on('title', { element: (e) => { e.setInnerContent(`${OFFER}, made for ${firm} | Wren Automation`); } })
    .on('meta[property="og:title"]', { element: (e) => { e.setAttribute('content', `Made for ${firm}`); } })
    .on('meta[property="og:image"]', { element: (e) => { e.setAttribute('content', poster); } })
    .on('meta[property="og:url"]', { element: (e) => { e.setAttribute('content', page.origin + page.pathname); } })
    .on('[data-firm]', { element: (e) => { e.setInnerContent(firm); } })
    .on('video[data-video]', { element: (e) => { e.setAttribute('src', mp4); e.setAttribute('poster', poster); } })
    .transform(shell);
  const headers = new Headers(out.headers);
  headers.set('cache-control', 'public, max-age=300');
  return new Response(out.body, { status: 200, headers });
};

async function notFound(env: Env, request: Request): Promise<Response> {
  const page = await env.ASSETS.fetch(new URL('/404', request.url));
  return new Response(page.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
}
