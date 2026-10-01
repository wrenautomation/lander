// Whether this browser may carry the visitor cookie (`wv`, visitor.ts). `wc` holds the choice made on the cookie
// banner (src/components/Consent.astro), yes or no; it is itself strictly necessary, so it needs no asking.
// With no choice made: where the law wants a yes before any tracking cookie (the EU and EEA, the UK, Switzerland,
// Quebec, Brazil, and anywhere Cloudflare can't place) the banner asks. A browser sending Global Privacy Control is a
// no. Everywhere else the cookie is on, and "Cookie settings" in every footer turns it off.

export type Consent = 'yes' | 'no' | 'ask';
export const CHOICE = 'wc';
const MAX_AGE = 180 * 24 * 60 * 60; // ask again after six months

const ASK = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', // the EU
  'IS', 'LI', 'NO', 'GB', 'CH', 'BR',
  'XX', 'T1', // Cloudflare: unknown, Tor
]);

/** The choice on this request's `wc` cookie, if one was made. */
export function choiceOf(request: Request): 'yes' | 'no' | null {
  const got = (request.headers.get('cookie') || '').match(/(?:^|;\s*)wc=(yes|no)\b/);
  return got ? (got[1] as 'yes' | 'no') : null;
}

export function consentOf(request: Request): Consent {
  const chosen = choiceOf(request);
  if (chosen) return chosen;
  if (request.headers.get('sec-gpc') === '1') return 'no';
  const country = request.headers.get('cf-ipcountry') || '';
  const region = (request as Request & { cf?: { regionCode?: string } }).cf?.regionCode;
  return ASK.has(country) || (country === 'CA' && region === 'QC') ? 'ask' : 'yes';
}

/** The Set-Cookie value that keeps a banner choice. Readable by the page, which never asks twice. */
export const choiceCookie = (choice: 'yes' | 'no') => `${CHOICE}=${choice}; Max-Age=${MAX_AGE}; Path=/; Secure; SameSite=Lax`;
