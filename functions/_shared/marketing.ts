// The lander's side of opt-in marketing (wren designs/2026-10-04-borrowed-ui.md, M2). The signup form and the
// preference center call wren's `Marketing` service through the phone Worker. No new secret: a signup is signed
// with EXPORT_TOKEN after the bot check, and wren checks the signature.
import type { Env } from './env';

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** HMAC-SHA256 of `signup:<topic>:<address>`, the same as wren's `signupSig`. */
export async function signupSig(shared: string, topic: string, address: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(shared), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(`signup:${topic}:${address.trim().toLowerCase()}`)));
}

/** One `Marketing/<handler>` call. `data` is null on any failure; `status` says which. */
export async function marketing<T>(env: Env, handler: string, body: unknown): Promise<{ status: number; data: T | null }> {
  if (!env.WREN_MARKETING_URL) return { status: 503, data: null };
  const r = await fetch(`${env.WREN_MARKETING_URL}/${handler}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }).catch(() => null);
  if (!r) return { status: 502, data: null };
  return { status: r.status, data: r.ok ? ((await r.json().catch(() => null)) as T | null) : null };
}

/** What the preference center shows for one signed link. */
export interface Prefs {
  address: string;
  everything: boolean;
  frequency: 'as_sent' | 'weekly' | 'monthly';
  pausedUntil: string | null;
  topics: { name: string; publicName: string; line: string; cadence: string; on: boolean }[];
  topic: string | null;
  named: string | null;
}
