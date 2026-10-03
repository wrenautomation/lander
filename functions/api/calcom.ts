// POST /api/calcom: Cal.com's booking webhook. A call made, moved or cancelled pings William in #meetings.
// Cal.com signs the raw body (x-cal-signature-256, HMAC-SHA256 hex) with CALCOM_WEBHOOK_SECRET; unsigned = 401.
// A PING (Cal.com's test, or our own) posts silent, so proving the wire never buzzes his phone.
import type { Env } from '../_shared/env';

interface Attendee { name?: string; email?: string; timeZone?: string }
interface Payload {
  title?: string;
  startTime?: string;
  attendees?: Attendee[];
  metadata?: Record<string, unknown>;
  rescheduleStartTime?: string;
  cancellationReason?: string;
}

const HEAD: Record<string, string> = {
  BOOKING_CREATED: '📅 **Call booked**',
  BOOKING_RESCHEDULED: '🔁 **Call moved**',
  BOOKING_CANCELLED: '❌ **Call cancelled**',
};

async function signed(secret: string, body: string, sig: string): Promise<boolean> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// His clock: Toronto. "Fri Oct 3, 2:00 PM"
const when = (iso?: string) => iso
  ? new Date(iso).toLocaleString('en-US', { timeZone: 'America/Toronto', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' ET'
  : 'time unknown';

// Text a booker typed never reaches Discord as markdown or a mention.
const plain = (s: unknown, max = 200) => String(s ?? '').replace(/[*_`~|>@#\\]/g, '').slice(0, max);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.CALCOM_WEBHOOK_SECRET) return new Response('not set up', { status: 503 });
  const body = await request.text();
  const sig = (request.headers.get('x-cal-signature-256') || '').toLowerCase();
  if (!sig || !(await signed(env.CALCOM_WEBHOOK_SECRET, body, sig))) return new Response('bad signature', { status: 401 });

  let event: { triggerEvent?: string; payload?: Payload };
  try { event = JSON.parse(body); } catch { return new Response('bad json', { status: 400 }); }
  const hook = env.DISCORD_MEETINGS_WEBHOOK;
  if (!hook) return new Response(null, { status: 204 });

  const trigger = event.triggerEvent || '';
  const p = event.payload || {};
  let post: Record<string, unknown>;
  if (trigger === 'PING') {
    post = { content: 'cal.com webhook connected', allowed_mentions: { parse: [] }, flags: 1 << 12 };
  } else if (HEAD[trigger]) {
    const who = p.attendees?.[0] || {};
    const m = p.metadata || {};
    const tags = ['offer', 'r', 'utm_campaign'].filter((k) => m[k]).map((k) => `${k} ${plain(m[k], 60)}`);
    const lines = [
      `${HEAD[trigger]} · ${when(p.startTime)}`,
      `${plain(who.name, 120) || 'someone'} (${plain(who.email, 200)})${who.timeZone ? ` · ${plain(who.timeZone, 60)}` : ''}`,
      ...(trigger === 'BOOKING_RESCHEDULED' && p.rescheduleStartTime ? [`was ${when(p.rescheduleStartTime)}`] : []),
      ...(trigger === 'BOOKING_CANCELLED' && p.cancellationReason ? [`reason: ${plain(p.cancellationReason, 300)}`] : []),
      ...(tags.length ? [tags.join(' · ')] : []),
    ];
    const ping = env.DISCORD_PING_USER_ID;
    post = { content: `${ping ? `<@${ping}> ` : ''}${lines.join('\n')}`, allowed_mentions: { parse: [], users: ping ? [ping] : [] } };
  } else {
    return new Response(null, { status: 204 });
  }
  const res = await fetch(hook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(post) });
  // Discord down: 502 so Cal.com retries.
  return new Response(null, { status: res.ok ? 204 : 502 });
};
