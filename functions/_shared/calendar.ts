// The lander's side of our own booking calendar (wren designs/2026-10-06-calendar.md). The page at /book/<offer>
// and the manage page at /booking/<token> call wren's `Calendar` service through the phone Worker. No new secret:
// a booking is signed with EXPORT_TOKEN after the bot check, and wren checks the signature; a move or a cancel
// carries the booking's own signed token.
import type { Env } from './env';

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** HMAC-SHA256 of `book:<offer>:<start>:<email>`, the same as wren's `bookSig`. */
export async function bookSig(shared: string, offer: string, start: string, email: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(shared), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`book:${offer}:${start}:${email.trim().toLowerCase()}`)));
}

/** A manage link's token: `<id>.<mac>`, as wren's `manageToken` writes it. */
export const MANAGE_TOKEN = /^[1-9][0-9]{0,11}\.[A-Za-z0-9_-]{24}$/;

/** One booked call, as wren shows it. */
export interface BookingView {
  id: number;
  state: 'booked' | 'cancelled';
  start: string;
  end: string;
  name: string;
  zone: string;
  title: string;
  offer: string | null;
  meetUrl: string | null;
  open: boolean;
}

/** One `Calendar/<handler>` call. `data` is null on any failure; `status` says which, `error` wren's words. */
export async function calendar<T>(env: Env, handler: string, body: unknown): Promise<{ status: number; data: T | null; error: string }> {
  if (!env.WREN_CALENDAR_URL) return { status: 503, data: null, error: 'off' };
  const r = await fetch(`${env.WREN_CALENDAR_URL}/${handler}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { status: 502, data: null, error: 'unreachable' };
  if (r.ok) return { status: r.status, data: (await r.json().catch(() => null)) as T | null, error: '' };
  const said = (await r.json().catch(() => null)) as { message?: string } | null;
  return { status: r.status, data: null, error: String(said?.message ?? '').slice(0, 200) };
}

// Text a booker typed never reaches Discord as markdown or a mention.
const plain = (s: unknown, max = 200) => String(s ?? '').replace(/[*_`~|>@#\\]/g, '').slice(0, max);
// His clock: Toronto. "Fri Oct 3, 2:00 PM ET"
export const when = (iso: string) =>
  `${new Date(iso).toLocaleString('en-US', { timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ET`;

const HEAD = { booked: '📅 **Call booked**', moved: '🔁 **Call moved**', cancelled: '❌ **Call cancelled**' } as const;

/** Pings William in #meetings, as cal.com's webhook did. A failed ping is swallowed: the booking stands. */
export async function meetings(env: Env, what: keyof typeof HEAD, b: BookingView, extra: string[] = [], email = ''): Promise<void> {
  if (!env.DISCORD_MEETINGS_WEBHOOK) return;
  const ping = env.DISCORD_PING_USER_ID;
  const lines = [
    `${HEAD[what]} · ${when(b.start)}`,
    `${plain(b.name, 120) || 'someone'}${email ? ` (${plain(email)})` : ''} · ${plain(b.zone, 60)}`,
    ...extra.map((l) => plain(l, 300)),
  ];
  await fetch(env.DISCORD_MEETINGS_WEBHOOK, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: `${ping ? `<@${ping}> ` : ''}${lines.join('\n')}`, allowed_mentions: { parse: [], users: ping ? [ping] : [] } }),
  }).catch(() => {});
}

/** The booking page's static shell; its script reads the offer, the tags or the
 * manage token off the address it's served at. Not indexed, and no referrer leaves it. */
export async function schedule(env: Env, request: Request): Promise<Response> {
  const shell = await env.ASSETS.fetch(new URL('/schedule', request.url));
  const headers = new Headers(shell.headers);
  headers.set('cache-control', 'no-store');
  headers.set('x-robots-tag', 'noindex');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('x-frame-options', 'SAMEORIGIN'); // a pitch page's fit block embeds it
  return new Response(shell.body, { status: shell.ok ? 200 : 502, headers });
}
