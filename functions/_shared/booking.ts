// Where a booking goes: Cal.com, or our own calendar (wren designs/2026-10-06-calendar.md). BOOKING in
// wrangler.toml picks the default ("calcom" or "wren"); ?via=wren or ?via=calcom on a /book link overrides it, so
// either can be tried live before the switch.
//
// Cal.com keeps metadata[...] on the booking (read back through autobrowse's `calcom` site) but drops utm_*, so
// the utm rides in metadata too. Our own page reads the same tags as plain query params.

/** Our own calendar takes this booking: the link's ?via=, else BOOKING. */
export function ownCalendar(env: { BOOKING?: string; WREN_CALENDAR_URL?: string }, url: URL): boolean {
  if (!env.WREN_CALENDAR_URL) return false;
  const via = url.searchParams.get('via');
  if (via === 'wren' || via === 'calcom') return via === 'wren';
  return env.BOOKING === 'wren';
}

/** The offer's booking URL, tagged with the offer, the applications row and the utm the visitor came with. */
export function bookingLink(base: string, tags: Record<string, string>): string {
  const u = new URL(base);
  for (const [k, v] of Object.entries(tags)) if (v) u.searchParams.set(`metadata[${k}]`, v);
  return u.toString();
}

/** Our own page for the offer, carrying the same tags; `via` keeps a preview on it. */
export function ownLink(offer: string, tags: Record<string, string>, via = false): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(tags)) if (v && k !== 'offer') q.set(k, v);
  if (via) q.set('via', 'wren');
  const s = q.toString();
  return `/book/${encodeURIComponent(offer)}${s ? `?${s}` : ''}`;
}
