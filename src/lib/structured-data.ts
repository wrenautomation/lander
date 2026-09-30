// Structured data (schema.org JSON-LD): who Wren is and what a page sells, in the form search engines and AI answers
// read. Built from the page's own content files, so it never says what the page doesn't. No prices, as on the page.
import { bare } from './text';

type Site = { name: string; email: string; city: string; profiles: string[] };
export type QA = { q: string; a: string };
export type Service = { name: string; text: string };

export function structuredData(o: { site: Site; url: URL; title: string; description: string; faq?: QA[]; services?: Service[] }): string {
  const home = new URL('/', o.url).href, id = (k: string) => `${home}#${k}`;
  const graph = [
    // The company, its founder and the site go whole on every page: a search engine reads one page at a time.
    {
      '@type': 'Organization', '@id': id('org'), name: 'Wren Automation', url: home, logo: `${home}brand/wren-mark-512.png`,
      email: o.site.email, address: { '@type': 'PostalAddress', addressLocality: o.site.city },
      founder: { '@id': id('founder') }, sameAs: o.site.profiles,
      ...(o.services?.length && {
        makesOffer: o.services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: bare(s.name), description: bare(s.text) } })),
      }),
    },
    { '@type': 'Person', '@id': id('founder'), name: o.site.name, jobTitle: 'Founder', worksFor: { '@id': id('org') } },
    { '@type': 'WebSite', '@id': id('site'), url: home, name: 'Wren Automation', publisher: { '@id': id('org') } },
    {
      '@type': o.faq?.length ? ['WebPage', 'FAQPage'] : 'WebPage', '@id': `${o.url.href}#page`, url: o.url.href,
      name: o.title, description: o.description, isPartOf: { '@id': id('site') }, about: { '@id': id('org') },
      ...(o.faq?.length && {
        mainEntity: o.faq.map((x) => ({ '@type': 'Question', name: bare(x.q), acceptedAnswer: { '@type': 'Answer', text: bare(x.a) } })),
      }),
    },
  ];
  // "<" escaped, so nothing in the copy can close the script tag
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
