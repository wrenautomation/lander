// /blog/rss.xml: every published post, for feed readers. Built from the same files as the pages.
import type { APIRoute } from 'astro';
import { postPath, posts } from '../../lib/blog';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const items = (await posts()).map((p) => {
    const url = new URL(postPath(p), site).href;
    return `  <item><title>${esc(p.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${esc(p.data.description)}</description></item>`;
  });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Wren Automation</title>
  <link>${new URL('/blog', site).href}</link>
  <description>What I build and what it did.</description>
${items.join('\n')}
</channel></rss>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml' } });
};
