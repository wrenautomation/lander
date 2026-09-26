// The one file that knows the booking vendor is Cal.com. A fit applicant's link carries who they are to wren:
// Cal.com keeps metadata[...] on the booking (read back through autobrowse's `calcom` site) but drops utm_*,
// so the utm rides in metadata too.

/** The offer's booking URL, tagged with the offer, the applications row and the utm the visitor came with. */
export function bookingLink(base: string, tags: Record<string, string>): string {
  const u = new URL(base);
  for (const [k, v] of Object.entries(tags)) if (v) u.searchParams.set(`metadata[${k}]`, v);
  return u.toString();
}
