// The parts every form endpoint shares: trimming input, the sender's context, Turnstile, the honeypot.
import type { Env } from './env';

export const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The posted form, or null when the body isn't one (a probe, a bad client). */
export const readForm = (request: Request): Promise<FormData | null> => request.formData().catch(() => null);

/** Where the submit came from: the page, this tab's touch (filled by src/scripts/hit.ts) and the request. */
export function origin(form: FormData, request: Request) {
  return {
    page: clip(form.get('page'), 200), r: clip(form.get('r'), 40),
    utm_source: clip(form.get('utm_source'), 100), utm_medium: clip(form.get('utm_medium'), 100),
    utm_campaign: clip(form.get('utm_campaign'), 100), utm_content: clip(form.get('utm_content'), 100),
    ref: clip(form.get('ref'), 200), country: request.headers.get('cf-ipcountry') || '',
    ip: request.headers.get('cf-connecting-ip') || '', ua: clip(request.headers.get('user-agent'), 300),
  };
}

/** A bot filled the hidden field. Answer as if it worked. */
export const isBot = (form: FormData) => !!clip(form.get('website'), 10);

/** True when Turnstile is off (no secret) or the token checks out. */
export async function human(env: Env, form: FormData, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: clip(form.get('cf-turnstile-response'), 3000), remoteip: ip }),
  }).then((r) => r.json() as Promise<{ success: boolean }>).catch(() => ({ success: false }));
  return v.success;
}
