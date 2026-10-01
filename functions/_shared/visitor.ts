// Who a visitor is across visits, and what brought them. One first-party cookie, `wv`, a random id set by the
// server (HttpOnly, 400 days) so the /api/hit rows of one browser join up and a form knows its visitor's history.
// Only with consent (consent.ts): without it there is no cookie and no id, and each view stands alone.
// A touch is a view that arrived from somewhere: an email link (?r=), a /go link, a utm link, or another site.
// First and last touch are read from `hits` at submit time, so the database is the one source of truth.
import { type Consent, consentOf } from './consent';

export const VISITOR = 'wv';
const MAX_AGE = 400 * 24 * 60 * 60; // the longest a browser keeps any cookie

export interface Visitor {
  /** The id on this browser's cookie, a fresh one to set, or null: no consent, no id. */
  id: string | null;
  consent: Consent;
  /** A cookie came with the request. */
  had: boolean;
}

/** The id on this request's visitor cookie, if it has one. */
export const cookieId = (request: Request): string | null =>
  (request.headers.get('cookie') || '').match(/(?:^|;\s*)wv=([A-Za-z0-9-]{8,64})/)?.[1] ?? null;

/** The visitor on this request. */
export function visitorOf(request: Request): Visitor {
  const got = cookieId(request), consent = consentOf(request);
  return { id: consent === 'yes' ? (got ?? crypto.randomUUID()) : null, consent, had: !!got };
}

/** The Set-Cookie header value that keeps (or starts) this visitor. Sent on every answer so the 400 days roll. */
export const visitorCookie = (id: string) => `${VISITOR}=${id}; Max-Age=${MAX_AGE}; Path=/; Secure; HttpOnly; SameSite=Lax`;
/** Takes the cookie away: a no, after a yes. */
export const forgetCookie = `${VISITOR}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`;

/** A response with the visitor cookie on it, or taken off it when consent is gone. */
export function withVisitor(response: Response, v: Visitor): Response {
  if (!v.id && !v.had) return response;
  const r = new Response(response.body, response);
  r.headers.append('set-cookie', v.id ? visitorCookie(v.id) : forgetCookie);
  return r;
}

export interface Touch { ts: string; source: string; page: string; r: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_content: string; ref: string }

/** One line naming where a touch came from: `email r:abc123`, `youtube / profile / bio`, `ref news.ycombinator.com`. */
export function label(t: Pick<Touch, 'r' | 'utm_source' | 'utm_medium' | 'utm_campaign' | 'ref'>): string {
  if (t.r) return `email r:${t.r}`;
  if (t.utm_source) return [t.utm_source, t.utm_medium, t.utm_campaign].filter(Boolean).join(' / ');
  if (t.ref) { try { return `ref ${new URL(t.ref).host}`; } catch { return `ref ${t.ref}`; } }
  return 'direct';
}

/** This visitor's first and last touch and how many views they have made, from `hits`. */
export async function history(db: D1Database, visitor: string | null): Promise<{ first: Touch | null; last: Touch | null; views: number }> {
  if (!visitor) return { first: null, last: null, views: 0 };
  const { results } = await db.prepare(
    `select ts, page, r, utm_source, utm_medium, utm_campaign, utm_content, ref from hits
     where visitor = ? and (r != '' or utm_source != '' or ref != '') order by id`,
  ).bind(visitor).all<Omit<Touch, 'source'>>();
  const views = (await db.prepare('select count(*) n from hits where visitor = ?').bind(visitor).first<{ n: number }>())?.n ?? 0;
  const touch = (t: Omit<Touch, 'source'> | undefined): Touch | null => (t ? { ...t, source: label(t) } : null);
  return { first: touch(results[0]), last: touch(results[results.length - 1]), views };
}

/** How a form's ping says where the person came from. */
export function cameFrom(h: Awaited<ReturnType<typeof history>>): string {
  if (!h.first) return `Came from: direct · ${h.views} views`;
  const day = (t: Touch) => t.ts.slice(0, 10);
  const same = h.last && h.last.ts === h.first.ts;
  return `Came from: ${h.first.source} (${day(h.first)})${same || !h.last ? '' : `, last ${h.last.source} (${day(h.last)})`} · ${h.views} views`;
}
