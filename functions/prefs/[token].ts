// /prefs/<token>: the preference center (wren designs/2026-10-04-borrowed-ui.md, M2). The token is signed per
// address by wren, so the link is the login. Every change is a POST: a GET never changes anything, so a link
// scanner can't unsubscribe anyone. A confirm (?confirm=1) or unsubscribe (?off=1) link opens a page that posts
// itself, with a button for when scripts are off. A mail app's one-click unsubscribe (RFC 8058) posts
// `List-Unsubscribe=One-Click` to the ?off=1 address. Kept out of search: noindex, and not in the sitemap.
import type { Env } from '../_shared/env';
import { type Prefs, marketing } from '../_shared/marketing';

const TOKEN = /^[A-Za-z0-9_-]{8,600}\.[A-Za-z0-9_-]{16,40}$/;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const FREQ: [Prefs['frequency'], string][] = [
  ['as_sent', 'Whenever I send'], ['weekly', 'Once a week at most'], ['monthly', 'Once a month at most'],
];
type Visit = { ip?: string; ua?: string };
type Result = { status: number; data: { prefs: Prefs; event: number | null } | null };

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const token = String(params.token ?? '');
  if (!TOKEN.test(token)) return broken(404);
  const r = await marketing<Prefs>(env, 'prefs', { token });
  if (!r.data) return broken(r.status);
  const p = r.data;
  const q = new URL(request.url).searchParams;
  const named = esc(p.named ?? 'this list');
  if (q.get('confirm') === '1')
    return page(`<h1>Confirm your signup</h1><p>Press the button to start getting ${named}.</p>${act('confirm', 'Confirm', true)}`);
  if (q.get('off') === '1' && p.topic)
    return page(`<h1>Unsubscribe</h1><p>Press the button to stop getting ${named}.</p>${act('off', 'Unsubscribe', true)}`);
  return page(flash(q, p) + prefsOf(p));
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  const token = String(params.token ?? '');
  if (!TOKEN.test(token)) return broken(404);
  const form = await request.formData().catch(() => null);
  if (!form) return broken(400);
  const visit: Visit = { ip: request.headers.get('cf-connecting-ip') || undefined, ua: request.headers.get('user-agent')?.slice(0, 300) };
  const set = (change: unknown): Promise<Result> => marketing(env, 'set', { token, change, ...visit });
  const back = (was: string, event?: number | null) =>
    Response.redirect(new URL(`/prefs/${token}?was=${was}${event ? `&event=${event}` : ''}`, request.url).toString(), 303);

  const oneClick = form.get('List-Unsubscribe') === 'One-Click';
  const what = oneClick ? 'off' : String(form.get('do') ?? '');
  let r: Result;
  switch (what) {
    case 'confirm': {
      const c = await marketing<{ ok: boolean }>(env, 'confirm', { token, ...visit });
      if (!c.data) return broken(c.status);
      return back(c.data.ok ? 'in' : 'late');
    }
    case 'off': {
      const p = await marketing<Prefs>(env, 'prefs', { token });
      if (!p.data?.topic) return broken(p.status === 200 ? 404 : p.status);
      r = await set({ topic: p.data.topic, on: false });
      if (oneClick) return new Response(r.data ? 'Unsubscribed' : 'Failed', { status: r.data ? 200 : 502 });
      return r.data ? back('off') : broken(r.status);
    }
    case 'topic':
      r = await set({ topic: String(form.get('topic') ?? ''), on: form.get('on') === '1' });
      return r.data ? back('saved') : broken(r.status);
    case 'frequency':
      r = await set({ frequency: String(form.get('frequency') ?? '') });
      return r.data ? back('saved') : broken(r.status);
    case 'pause': {
      const days = Number(form.get('days'));
      r = await set({ pause: days === 30 || days === 90 ? days : null });
      return r.data ? back('saved') : broken(r.status);
    }
    case 'everything':
      r = await set({ everything: true });
      return r.data ? back('all', r.data.event) : broken(r.status);
    case 'undo':
      r = await set({ undo: Number(form.get('event')) });
      return r.data ? back('back') : broken(r.status);
    default:
      return broken(400);
  }
};

/** A one-button form posting `do`; `auto` posts itself as soon as the page loads. */
const act = (what: string, label: string, auto = false, fields: Record<string, string | number> = {}, cls = '') =>
  `<form method="post"${auto ? ' data-auto' : ''}><input type="hidden" name="do" value="${what}">${Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(String(v))}">`).join('')}<button class="btn ${cls}">${label}</button></form>`;

function flash(q: URLSearchParams, p: Prefs): string {
  const named = esc(p.named ?? 'that list');
  const line = (text: string, undo = '') => `<div class="flash" role="status"><p>${text}</p>${undo}</div>`;
  switch (q.get('was')) {
    case 'in': return line(`Confirmed. You'll get ${named}.`);
    case 'late': return line(`That link is more than 7 days old. Sign up again and I'll send a new one.`);
    case 'off': return line(`You're off ${named}.`, p.topic ? act('topic', 'Undo', false, { topic: p.topic, on: 1 }, 'ghost') : '');
    case 'all': {
      const event = Number(q.get('event'));
      return line(`You're off everything. I won't email you again.`, event ? act('undo', 'Undo', false, { event }, 'ghost') : '');
    }
    case 'back': return line('Undone. Your settings are back.');
    case 'saved': return line('Saved.');
    default: return '';
  }
}

function prefsOf(p: Prefs): string {
  const head = `<h1>Your emails</h1><p class="mute">For ${esc(p.address)}</p>`;
  if (p.everything)
    return `${head}<p>You're unsubscribed from everything, so I won't email you. To come back, sign up again on my site.</p>`;
  const lists = p.topics.length
    ? p.topics.map((t) => `<form method="post" class="topic"><input type="hidden" name="do" value="topic"><input type="hidden" name="topic" value="${esc(t.name)}">
<label><span><b>${esc(t.publicName)}</b><span>${esc(t.line)}</span><span class="mute">Sent ${esc(t.cadence)}</span></span>
<input type="checkbox" name="on" value="1" role="switch" data-save${t.on ? ' checked' : ''}></label><noscript><button class="btn ghost">Save</button></noscript></form>`).join('')
    : `<p>There's nothing to sign up for right now.</p>`;
  const until = p.pausedUntil ? new Date(p.pausedUntil) : null;
  const paused = until && until > new Date()
    ? `<p>Paused until ${until.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}.</p>${act('pause', 'Resume now', false, { days: 0 }, 'ghost')}`
    : `<div class="row">${act('pause', 'Pause 30 days', false, { days: 30 }, 'ghost')}${act('pause', 'Pause 90 days', false, { days: 90 }, 'ghost')}</div>`;
  return `${head}<h2>Lists</h2>${lists}
<h2>How often</h2><form method="post"><input type="hidden" name="do" value="frequency"><select name="frequency" aria-label="How often" data-save>${FREQ.map(([v, l]) => `<option value="${v}"${p.frequency === v ? ' selected' : ''}>${l}</option>`).join('')}</select><noscript><button class="btn ghost">Save</button></noscript></form>
<h2>Take a break</h2>${paused}
<hr>${act('everything', 'Unsubscribe from everything', false, {}, 'ghost')}`;
}

function broken(status: number): Response {
  const gone = status === 404 || status === 401 || status === 400;
  return page(gone
    ? `<h1>This link doesn't work</h1><p>It may be cut off or old. Open the newest email from me and use the link at the bottom.</p>`
    : `<h1>Something broke on my end</h1><p>Try again in a minute.</p>`, gone ? 404 : 502);
}

function page(body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Your emails | Wren Automation</title><link rel="icon" href="/brand/wren-mark.png">
<style>
@font-face{font-family:'General Sans';src:url(/fonts/general-sans-400.woff2) format('woff2');font-weight:400;font-display:swap}
@font-face{font-family:'General Sans';src:url(/fonts/general-sans-600.woff2) format('woff2');font-weight:600;font-display:swap}
:root{--paper:#fff;--paper-2:#F4F1EC;--ink:#0E0E0E;--mute:#6E6E68;--rule:rgba(14,14,14,.13);--acc:#A83B12;--cream:#FAF7F2}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:17px/1.6 'General Sans',ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:600px;margin:0 auto;padding:32px 16px 64px}header{display:flex;align-items:center;gap:10px;margin-bottom:40px;font-weight:600}header img{width:28px;height:28px}
h1{font-size:32px;line-height:1.15;margin:0 0 6px}h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin:40px 0 8px}p{margin:0 0 16px}.mute{color:var(--mute)}
.btn{display:inline-flex;align-items:center;padding:1em 1.4em;background:var(--acc);color:var(--cream);font:600 12.5px/1 inherit;font-family:inherit;letter-spacing:.08em;text-transform:uppercase;border:0;border-radius:0;cursor:pointer}
.btn:hover{background:var(--ink)}.btn.ghost{background:none;color:var(--ink);box-shadow:inset 0 0 0 1px var(--rule)}.btn.ghost:hover{box-shadow:inset 0 0 0 1px var(--ink)}
.flash{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--paper-2);padding:14px 16px;margin-bottom:32px}.flash p{margin:0}
.topic{border-top:1px solid var(--rule);padding:14px 0}.topic label{display:flex;justify-content:space-between;gap:16px;cursor:pointer}.topic label>span{display:flex;flex-direction:column}
input[role=switch]{appearance:none;flex:none;width:44px;height:24px;margin:2px 0 0;background:var(--rule);position:relative;cursor:pointer}
input[role=switch]::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;transition:left .15s}
input[role=switch]:checked{background:var(--acc)}input[role=switch]:checked::after{left:23px}input[role=switch]:focus-visible,select:focus-visible,.btn:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
select{font:inherit;padding:10px 12px;border:1px solid var(--rule);background:var(--paper);color:var(--ink);border-radius:0;max-width:100%}
.row{display:flex;flex-wrap:wrap;gap:8px}hr{border:0;border-top:1px solid var(--rule);margin:48px 0 24px}form{margin:0}
</style></head><body><main><header><img src="/brand/wren-mark-224.png" alt="">Wren Automation</header>${body}</main>
<script>
document.querySelectorAll('form[data-auto]').forEach(function(f){f.submit()});
document.querySelectorAll('[data-save]').forEach(function(i){i.addEventListener('change',function(){i.form.submit()})});
</script></body></html>`;
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex',
      'referrer-policy': 'no-referrer',
    },
  });
}
