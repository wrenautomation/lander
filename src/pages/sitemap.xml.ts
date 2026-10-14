// The hub, every pitch and niche page, the blog and its posts, then the legal pages. Search engines find it through robots.txt.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { postPath, posts } from '../lib/blog';

// /blog joins once there is a post to find on it
const blogPaths = async () => {
  const all = await posts();
  return all.length ? ['/blog', ...all.map(postPath)] : [];
};

export const GET: APIRoute = async ({ site }) => {
  const paths = [...(await getCollection('hub')).map((h) => h.data.path), ...(await getCollection('pitches')).map((p) => p.data.path), ...(await getCollection('niches')).map((n) => `/${n.id}`), ...await blogPaths(), '/terms', '/privacy', '/data-deletion'];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
