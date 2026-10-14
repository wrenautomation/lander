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

// The scroll-built figures in src/components/blog wrap a Markdown list, so the email keeps every word of them.
const FIGURE_OPEN = /^<(?:Rack|Leaks|Fan|Timeline)\b([^>]*)>[ \t]*$/gm;
const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? '';

/**
 * A post's Markdown as a plain-text email: links read "words (url)", an image or an embed points at the post,
 * headings and emphasis lose their marks. The visuals live on the page; the email sends people there.
 * An .mdx post's imports go. The blog components keep their words: a figure's title heads its list, a Stat's number
 * leads its sentence. Any other component (over however many lines) becomes one line to the page.
 */
export function emailText(body: string, url: string): string {
  const see = `(See it on the page: ${url})`;
  return body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^(import|export)\s.*$/gm, '')
    // the blog components keep their words: Steps and Note lose only their tags, Compare labels its two lists
    .replace(/^<Compare\s+before="([^"]*)"\s+after="([^"]*)"\s*>\s*\n([\s\S]*?)\n\s*<\/Compare>/gm, (_, a: string, b: string, inner: string) => {
      const [one = '', two = ''] = inner.trim().split(/\n\s*---\s*\n/);
      return `${a}:\n${one.trim()}\n\n${b}:\n${two.trim()}`;
    })
    .replace(/^<Note\s+title="([^"]*)"\s*>[ \t]*$/gm, '$1:')
    // a Stat's number leads its sentence; a figure's title heads its list
    .replace(/^<Stat\b([^>]*)>\s*\n([\s\S]*?)\n\s*<\/Stat>/gm, (_, a: string, inner: string) =>
      `${attr(a, 'prefix')}${attr(a, 'n')}${attr(a, 'suffix')} ${inner.trim()}`)
    .replace(FIGURE_OPEN, (_, a: string) => (attr(a, 'title') ? `${attr(a, 'title')}:` : ''))
    .replace(/^<\/?(Steps|Note|Rack|Leaks|Fan|Timeline)>[ \t]*$/gm, '')
    .replace(/^<([A-Z]\w*)\b[\s\S]*?(<\/\1>|\/>)[ \t]*$/gm, see)
    .replace(/^\s*<[^>]+>.*$/gm, see)
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
