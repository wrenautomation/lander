// Who a visitor is across visits, and what brought them. One first-party cookie, `wv`, a random id set by the
// server (HttpOnly, 400 days) so the /api/hit rows of one browser join up and a form knows its visitor's history.
// A touch is a view that arrived from somewhere: an email link (?r=), a /go link, a utm link, or another site.
// First and last touch are read from `hits` at submit time, so the database is the one source of truth.

export const VISITOR = 'wv';
const MAX_AGE = 400 * 24 * 60 * 60; // the longest a browser keeps any cookie

/** The visitor id on this request, or a fresh one to set with `visitorCookie`. */
export function visitorOf(request: Request): { id: string; fresh: boolean } {
  const got = (request.headers.get('cookie') || '').match(/(?:^|;\s*)wv=([A-Za-z0-9-]{8,64})/);
  return got ? { id: got[1], fresh: false } : { id: crypto.randomUUID(), fresh: true };
}

/** The Set-Cookie header value that keeps (or starts) this visitor. Sent on every answer so the 400 days roll. */
export const visitorCookie = (id: string) => `${VISITOR}=${id}; Max-Age=${MAX_AGE}; Path=/; Secure; HttpOnly; SameSite=Lax`;

/** A response with the visitor cookie on it. */
export function withVisitor(response: Response, id: string): Response {
  const r = new Response(response.body, response);
  r.headers.append('set-cookie', visitorCookie(id));
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
export async function history(db: D1Database, visitor: string): Promise<{ first: Touch | null; last: Touch | null; views: number }> {
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
