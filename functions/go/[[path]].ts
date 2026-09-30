// GET /go/<channel>[/<campaign>[/<content>]]: a short link for a post, a video description or a profile bio.
// Redirects to the channel's page with utm_* on it; src/scripts/hit.ts records them on arrival and takes them off
// the address bar. Channels live in src/data/links.json; an unlisted one still lands on / credited to its name,
// so a typo'd or brand-new link is never lost. `?to=/some/page` overrides where it lands (our pages only).
import links from '../../src/data/links.json';

type Channel = { source: string; medium: string; to: string };
const CHANNELS = links.channels as Record<string, Channel>;
const WORD = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const PAGE = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

export const onRequestGet: PagesFunction = ({ request, params }) => {
  const url = new URL(request.url);
  const parts = ([] as string[]).concat(params.path ?? []).filter((p) => WORD.test(p)).slice(0, 3);
  const [name = 'go', campaign = '', content = ''] = parts.map((p) => p.toLowerCase());
  const channel = CHANNELS[name] ?? { source: name, medium: 'link', to: '/' };
  const to = url.searchParams.get('to') || '';
  const target = new URL(PAGE.test(to) ? to : channel.to, url.origin);
  target.searchParams.set('utm_source', channel.source);
  target.searchParams.set('utm_medium', channel.medium);
  if (campaign) target.searchParams.set('utm_campaign', campaign);
  if (content) target.searchParams.set('utm_content', content);
  return new Response(null, { status: 302, headers: { location: target.pathname + target.search, 'cache-control': 'no-store' } });
};
