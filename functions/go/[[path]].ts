// GET /go/<channel>[/<campaign>[/<content>]]: a short link for a post, a video description or a profile bio.
// Redirects to the channel's page with utm_* on it; src/scripts/hit.ts records them on arrival and takes them off
// the address bar. Channels live in src/data/links.json; an unlisted one still lands on / credited to its name,
// so a typo'd or brand-new link is never lost. `?to=/some/page` overrides where it lands (our pages only).
// `?v=<YouTube id>` sends them on to that video instead (a promo post, wren's funnel.ts). No page of ours loads,
// so the hop is recorded here: one `hits` row, page `youtube:<id>`, with the utm, the visitor (with consent) and
// no time on page. Link previews (crawlers) are not counted. Only a YouTube id goes through: never an open redirect.
// A hop to one of our pages is logged too: one `clicks` row with the page it went to and the utm, so wren counts
// each tracked link's clicks (Sites → Links). Crawlers are left out here as well.
import links from '../../src/data/links.json';
import type { Env } from '../_shared/env';
import { visitorOf, withVisitor } from '../_shared/visitor';

type Channel = { source: string; medium: string; to: string };
const CHANNELS = links.channels as Record<string, Channel>;
const WORD = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const PAGE = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;
const VIDEO = /^[A-Za-z0-9_-]{11}$/;
// The fetchers that unfurl a link in a feed or a chat: not a person clicking.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|embedly|slack|discord|whatsapp|telegram|linkedinbot|twitterbot|redditbot/i;

export const onRequestGet: PagesFunction<Env> = ({ request, params, env, waitUntil }) => {
  const url = new URL(request.url);
  const parts = ([] as string[]).concat(params.path ?? []).filter((p) => WORD.test(p)).slice(0, 3);
  const [name = 'go', campaign = '', content = ''] = parts.map((p) => p.toLowerCase());
  const channel = CHANNELS[name] ?? { source: name, medium: 'link', to: '/' };
  const video = url.searchParams.get('v') || '';
  if (VIDEO.test(video)) {
    const visitor = visitorOf(request);
    const ua = request.headers.get('user-agent') || '';
    if (!BOT.test(ua))
      waitUntil(
        env.DB.prepare(
          `insert into hits (view, visitor, ts, page, depth, secs, cta, touched, w, r, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ua)
           values (?, ?, ?, ?, 0, 0, 0, 0, 0, '', ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(), visitor.id, new Date().toISOString(), `youtube:${video}`,
          channel.source, channel.medium, campaign, content, (request.headers.get('referer') || '').slice(0, 200),
          request.headers.get('cf-ipcountry') || '', ua.slice(0, 300),
        ).run().catch(() => {}),
      );
    const out = new Response(null, {
      status: 302,
      headers: { location: `https://www.youtube.com/watch?v=${video}`, 'cache-control': 'no-store' },
    });
    return withVisitor(out, visitor);
  }
  const to = url.searchParams.get('to') || '';
  const target = new URL(PAGE.test(to) ? to : channel.to, url.origin);
  const ua = request.headers.get('user-agent') || '';
  if (!BOT.test(ua))
    waitUntil(
      env.DB.prepare(
        `insert into clicks (ts, link, source, medium, campaign, content, page, ref, country)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        new Date().toISOString(), name, channel.source, channel.medium, campaign, content, target.pathname,
        (request.headers.get('referer') || '').slice(0, 200), request.headers.get('cf-ipcountry') || '',
      ).run().catch(() => {}),
    );
  target.searchParams.set('utm_source', channel.source);
  target.searchParams.set('utm_medium', channel.medium);
  if (campaign) target.searchParams.set('utm_campaign', campaign);
  if (content) target.searchParams.set('utm_content', content);
  return new Response(null, { status: 302, headers: { location: target.pathname + target.search, 'cache-control': 'no-store' } });
};
