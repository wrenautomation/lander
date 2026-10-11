// The blog's posts and each post's email version (wren designs/2026-10-11-newsletter.md).
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Published posts, newest first. Drafts show in dev only. */
export async function posts(): Promise<Post[]> {
  const all = await getCollection('blog', (p) => import.meta.env.DEV || !p.data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const postPath = (p: Post) => `/blog/${p.id}`;

export const day = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/**
 * A post's Markdown as a plain-text email: links read "words (url)", an image or an embed points at the post,
 * headings and emphasis lose their marks. The visuals live on the page; the email sends people there.
 */
export function emailText(body: string, url: string): string {
  return body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*<[^>]+>.*$/gm, `(See it on the page: ${url})`)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt: string) => `(${alt ? `${alt}: ` : ''}see it on the page: ${url})`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '$1 ($2)')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_]/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** The signup under every post. Bump `version` whenever `text` changes: wren keeps the exact words as proof. */
export const SIGNUP = {
  topic: 'newsletter',
  text: 'Get each new post by email. One email per post, nothing else. Unsubscribe in one click.',
  version: 'blog-v1',
  button: 'Get new posts',
};
