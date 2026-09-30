// /llms.txt: the site in plain Markdown for AI assistants and answer engines (the llmstxt.org format). Built from the
// same content files as the pages, so it never drifts from them. No prices, as on the pages.
import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { loadHub, loadPitch } from '../lib/pitch';
import { CITE, bare, plain } from '../lib/text';

type QA = { q: string; a: string };
type Source = { text: string; url: string };

// "Lead reactivation for recruiting companies | Wren Automation" names the page; the brand is already the heading
const named = (title: string) => bare(title).replace(/\s*\|\s*Wren Automation$/, '');
// a [^n] marker becomes a link to its source, so a figure travels with where it came from
const cited = (s: string, sources: Source[] = []) =>
  bare(s.replace(CITE, (_, n: string) => {
    const url = sources[Number(n) - 1]?.url;
    return url ? ` ([source](${url}))` : '';
  }));
const questions = (items: QA[], sources?: Source[]) => items.flatMap((x) => [`### ${bare(x.q)}`, '', cited(x.a, sources), '']);

export const GET: APIRoute = async ({ site: origin }) => {
  const at = (path: string) => new URL(path, origin).href;
  const site = (await getEntry('site', 'site'))!.data;
  const { p: hub } = await loadHub((await getCollection('hub'))[0]!);
  const pitches = await Promise.all((await getCollection('pitches')).map(async (e) => (await loadPitch(e)).p));
  const niches = await getCollection('niches');

  const lines = [
    '# Wren Automation',
    '',
    `> ${bare(hub.description)}`,
    '',
    cited(hub.hero.lede, hub.sources.items),
    '',
    `Founded and run by ${site.name}, in ${site.city}. Contact: ${site.email}.`,
    '',
    '## Pages',
    '',
    `- [Wren Automation](${at(hub.path)}): ${bare(hub.description)}`,
    ...pitches.map((p) => `- [${named(p.title)}](${at(p.path)}): ${bare(p.description)}`),
    ...niches.map((n) => `- [${named(n.data.title)}](${at(`/${n.id}`)}): ${plain(n.data.description ?? n.data.lede).trim()}`),
    '',
    '## Services',
    '',
    ...hub.catalog.groups.flatMap((g) => [`### ${g.for}`, '', ...g.items.map((s) => `- **${s.name}**: ${s.text} ${s.gets}`), '']),
    '## Questions',
    '',
    ...questions(hub.faq.items, hub.sources.items),
    ...pitches.flatMap((p) => [
      `## ${named(p.title)}`,
      '',
      bare([p.hero.h1, p.hero.h1_tail].filter(Boolean).join(' ')),
      '',
      bare(p.hero.lede).trim(),
      '',
      ...questions(p.faq.items),
    ]),
    '## Optional',
    '',
    `- [Privacy](${at('/privacy')})`,
    `- [Terms](${at('/terms')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
