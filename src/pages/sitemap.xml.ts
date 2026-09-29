// The hub, every pitch and niche page, then the legal pages. Search engines find it through robots.txt.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const paths = [...(await getCollection('hub')).map((h) => h.data.path), ...(await getCollection('pitches')).map((p) => p.data.path), ...(await getCollection('niches')).map((n) => `/${n.id}`), '/terms', '/privacy'];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
