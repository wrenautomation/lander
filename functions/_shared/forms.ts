// Push one application to wren the moment it's saved (wren packages/channel-sms/src/restate/forms.ts), so its
// first text goes in minutes, not on wren's 30-minute pass. Only the id crosses: wren reads the row from
// /api/export. The body `{application, at}` is signed with EXPORT_TOKEN (hex HMAC-SHA256 in
// x-wren-signature-256) and the phone Worker checks it. Runs in waitUntil, times out, never throws: the pass
// is the net.
import type { Env } from './env';

const TIMEOUT_MS = 5000;
export const SIGNATURE_HEADER = 'x-wren-signature-256';

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** Hex HMAC-SHA256 of the body, as the phone Worker checks it. */
export async function signBody(shared: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(shared), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
}

/** Tell wren about one application. Unset WREN_FORMS_URL or EXPORT_TOKEN = nothing sent. */
export async function pushApplication(env: Env, application: number): Promise<void> {
  if (!env.WREN_FORMS_URL || !env.EXPORT_TOKEN || !application) return;
  const body = JSON.stringify({ application, at: Date.now() });
  try {
    await fetch(env.WREN_FORMS_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: await signBody(env.EXPORT_TOKEN, body) },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    /* the pass finds it */
  }
}
