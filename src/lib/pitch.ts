// A pitch page = its copy (src/content/pitches/*.yaml) + the offer it sells (src/data/offers.json).
// Everything a page can get wrong about its offer fails the build here, not in front of a buyer.
import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { fill } from './text';

type OfferData = CollectionEntry<'offers'>['data'];
const terms = (o: OfferData) => ({ slots: o.slots, days: o.days });

async function liveOffer(id: string, where: string): Promise<OfferData> {
  const o = (await getEntry('offers', id))?.data;
  if (!o) throw new Error(`${where}: no offer '${id}' in src/data/offers.json (pnpm offers:export in wren)`);
  if (o.status !== 'live') throw new Error(`${where}: offer '${id}' is ${o.status}, not live`);
  return o;
}

export async function loadPitch(entry: CollectionEntry<'pitches'>) {
  const where = `pitches/${entry.id}.yaml`;
  const raw = entry.data;
  const offer = await liveOffer(raw.offer, where);
  if (offer.page !== raw.path) {
    throw new Error(`${where}: offer '${offer.id}' claims page ${offer.page}, this page is ${raw.path}`);
  }

  // Industry cards may name their own offer; their {tokens} fill from it. The rest fill from the page's.
  const industries = raw.industries && {
    ...raw.industries,
    items: await Promise.all(raw.industries.items.map(async (it) =>
      it.offer ? fill(it, terms(await liveOffer(it.offer, `${where} industries`)), `${where} industries '${it.name}'`) : it)),
  };
  const p = fill({ ...raw, industries }, terms(offer), where);

  for (const s of p.build?.stages ?? []) {
    if (s.from > p.build!.weeks || (s.to !== null && (s.to < s.from || s.to > p.build!.weeks))) {
      throw new Error(`${where}: build stage '${s.name}' weeks ${s.from}-${s.to} don't fit a ${p.build!.weeks}-week chart`);
    }
  }

  const a = p.ask;
  const need = (ok: unknown, what: string) => { if (!ok) throw new Error(`${where}: ask.${what} is required for offer '${offer.id}'`); };
  if (offer.application) { need(a.steps, 'steps'); need(a.nofit_h && a.nofit, 'nofit_h and ask.nofit'); }
  if (offer.booking) need(a.book_h && a.book, 'book_h and ask.book');

  return { p, offer };
}

/** Every pitch, with its URL slug for [...slug].astro ('/' is undefined). */
export async function pitchPaths() {
  const all = await getCollection('pitches');
  const seen = new Set<string>();
  for (const e of all) {
    if (seen.has(e.data.path)) throw new Error(`two pitch pages claim ${e.data.path}`);
    seen.add(e.data.path);
  }
  return all.map((entry) => ({ slug: entry.data.path === '/' ? undefined : entry.data.path.slice(1), entry }));
}
