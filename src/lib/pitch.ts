// A page = its copy (src/content/pitches/*.yaml, or hub/home.yaml for /) + the offer it sells (src/data/offers.json).
// Everything a page can get wrong about its offer fails the build here, not in front of a buyer.
import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { fill } from './text';

type OfferData = CollectionEntry<'offers'>['data'];
type Ask = CollectionEntry<'pitches'>['data']['ask'];
type Card = { name: string; to: string; offer?: string };
type Build = CollectionEntry<'pitches'>['data']['build'];
const terms = (o: OfferData) => ({ slots: o.slots, days: o.days });

async function liveOffer(id: string, where: string): Promise<OfferData> {
  const o = (await getEntry('offers', id))?.data;
  if (!o) throw new Error(`${where}: no offer '${id}' in src/data/offers.json (pnpm offers:export in wren)`);
  if (o.status !== 'live') throw new Error(`${where}: offer '${id}' is ${o.status}, not live`);
  return o;
}

// the page's own offer: live, and this is its page
async function pageOffer(raw: { offer: string; path: string }, where: string) {
  const offer = await liveOffer(raw.offer, where);
  if (offer.page !== raw.path) throw new Error(`${where}: offer '${offer.id}' claims page ${offer.page}, this page is ${raw.path}`);
  return offer;
}

// A card may name its own offer: it must be live, the card must link to its page, and its {tokens} fill from it.
const cards = <T extends Card>(items: T[], where: string) => Promise.all(items.map(async (it) => {
  if (!it.offer) return it;
  const o = await liveOffer(it.offer, `${where} '${it.name}'`);
  if (o.page !== it.to) throw new Error(`${where} '${it.name}': links to ${it.to}, offer '${o.id}' lives at ${o.page}`);
  return fill(it, terms(o), `${where} '${it.name}'`);
}));

function checkBuild(b: Build, where: string) {
  for (const s of b?.stages ?? []) {
    if (s.from > b!.weeks || (s.to !== null && (s.to < s.from || s.to > b!.weeks))) {
      throw new Error(`${where}: build stage '${s.name}' weeks ${s.from}-${s.to} don't fit a ${b!.weeks}-week chart`);
    }
  }
}

function checkAsk(a: Ask, offer: OfferData, where: string) {
  const need = (ok: unknown, what: string) => { if (!ok) throw new Error(`${where}: ask.${what} is required for offer '${offer.id}'`); };
  if (offer.application) { need(a.steps, 'steps'); need(a.nofit_h && a.nofit, 'nofit_h and ask.nofit'); }
  if (offer.booking) need(a.book_h && a.book, 'book_h and ask.book');
}

export async function loadPitch(entry: CollectionEntry<'pitches'>) {
  const where = `pitches/${entry.id}.yaml`;
  const raw = entry.data;
  const offer = await pageOffer(raw, where);
  const industries = raw.industries && { ...raw.industries, items: await cards(raw.industries.items, `${where} industries`) };
  const p = fill({ ...raw, industries }, terms(offer), where);
  checkBuild(p.build, where);
  checkAsk(p.ask, offer, where);
  return { p, offer };
}

export async function loadHub(entry: CollectionEntry<'hub'>) {
  const where = `hub/${entry.id}.yaml`;
  const raw = entry.data;
  const offer = await pageOffer(raw, where);
  const p = fill(raw, terms(offer), where);
  for (const r of p.compare.rows) {
    if (r.marks.length !== p.compare.them.length + 1) throw new Error(`${where}: compare row '${r.feature}' has ${r.marks.length} marks, needs ${p.compare.them.length + 1} (${p.compare.us} first)`);
  }
  checkAsk(p.ask, offer, where);
  return { p, offer };
}

/** Every pitch, with its URL slug for [...slug].astro. The hub owns '/'. */
export async function pitchPaths() {
  const all = await getCollection('pitches');
  const seen = new Set<string>((await getCollection('hub')).map((h) => h.data.path));
  for (const e of all) {
    if (seen.has(e.data.path)) throw new Error(`two pages claim ${e.data.path}`);
    seen.add(e.data.path);
  }
  return all.map((entry) => ({ slug: entry.data.path.slice(1), entry }));
}
