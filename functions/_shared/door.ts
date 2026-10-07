// Forward a stored form row to wren's door (wren designs/2026-10-07-speed-to-lead.md), so Wren runs speed to
// lead on its own leads. WREN_DOOR_URL is the hook URL `wren hooks preset site` prints; unset, nothing is sent.
// The row is already saved and the visitor already answered: this runs in waitUntil, times out, and swallows
// every failure. The id is the D1 row, so a retry of the same row enters wren once.
import type { Env } from './env';
import type { Touch } from './visitor';

const TIMEOUT_MS = 5000;

export interface DoorRow {
  table: 'leads' | 'applications';
  rowId: number;
  name: string;
  email: string;
  phone: string;
  /** The form's text-consent box: undefined when the form has none (wren reads that as no). */
  smsConsent?: boolean;
  note: string;
  niche: string;
  page: string;
  offer?: string;
  fit?: boolean;
  visitor: string | null;
  first: Touch | null;
  last: Touch | null;
  utm: { source: string; medium: string; campaign: string; content: string };
  ref: string;
  r: string;
}

/** The market a page is for: its first path segment (`/recruiting/...` is recruiting), `/` is general. */
export function nicheOfPage(page: string): string {
  let path = page;
  try { path = new URL(page, 'https://wrenautomation.com').pathname; } catch { /* keep it */ }
  return path.split('/').filter(Boolean)[0]?.toLowerCase() || 'general';
}

/** The payload wren's `site` preset reads (wren packages/core/src/door.ts, HOOK_PRESETS.site). */
export function doorPayload(row: DoorRow) {
  return {
    id: `site:${row.table}:${row.rowId}`,
    source: 'site',
    form: row.table === 'leads' ? 'lead' : 'apply',
    name: row.name, email: row.email, phone: row.phone,
    ...(row.smsConsent === undefined ? {} : { sms_consent: row.smsConsent }),
    note: row.note, niche: row.niche, page: row.page,
    ...(row.offer ? { offer: row.offer, fit: !!row.fit } : {}),
    visitor: row.visitor, first_touch: row.first, last_touch: row.last,
    utm_source: row.utm.source, utm_medium: row.utm.medium, utm_campaign: row.utm.campaign, utm_content: row.utm.content,
    ref: row.ref, r: row.r,
  };
}

/** Post the row to the door, or do nothing. Never throws. */
export async function forwardToDoor(env: Env, row: DoorRow): Promise<void> {
  if (!env.WREN_DOOR_URL || !row.rowId) return;
  await fetch(env.WREN_DOOR_URL, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(doorPayload(row)), signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
}
