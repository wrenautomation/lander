// /blog/<slug>.json: one post as its newsletter issue. `wren newsletter send <slug>` reads it, so the email is the
// post itself and never a second copy to keep in step.
import type { APIRoute, GetStaticPaths } from 'astro';
import { emailText, postPath, posts, type Post } from '../../lib/blog';

export const getStaticPaths = (async () =>
  (await posts()).map((p) => ({ params: { slug: p.id }, props: { post: p } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const p = (props as { post: Post }).post;
  const url = new URL(postPath(p), site).href;
  return Response.json({
    slug: p.id,
    title: p.data.title,
    description: p.data.description,
    date: p.data.date.toISOString().slice(0, 10),
    draft: p.data.draft,
    url,
    text: emailText(p.body ?? '', url),
  });
};
