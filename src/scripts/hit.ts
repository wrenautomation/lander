// One row per page view in D1 (functions/api/hit.ts): posted on arrival, then again when the tab is hidden with how
// far they read, how long, whether they clicked through to the form, whether they touched it. The server ties views
// together with a first-party cookie, so a visit from an email link and a form a week later join up. Where the law
// wants a yes first, the server says "ask" and the cookie banner shows (consent.ts); until then there is no cookie.
// What brought them rides only on the view they arrived on: ?r= (a code on the link in one of our emails), utm_*
// (a /go link or a tagged post), or another site's referrer. Those params are then taken off the address bar, so a
// copied link doesn't credit someone else's email. The form's hidden fields carry this tab's touch as a fallback.
// What they did on the page goes to /api/events in batches, sent when the tab hides: cta, form.start, form.submit,
// book.click, video.play, video.progress (25/50/75/100), and a click on any [data-signal="<name>"] as <name>.
// When /api/hit answers replay: true, src/scripts/replay.ts records this view under the same view id.
import { ask } from './consent';

const q = new URLSearchParams(location.search);
if (!q.has('static') && !q.has('probe')) {
  const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  const KEYS = ['r', ...UTM];
  const external = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer.slice(0, 200) : '';
  const here: Record<string, string> = Object.fromEntries(KEYS.filter((k) => q.get(k)).map((k) => [k, q.get(k)!.slice(0, k === 'r' ? 40 : 100)]));
  if (external) here.ref = external;
  const arrived = Object.keys(here).length > 0;

  // this tab's touch, for the form: the newest arrival wins, a hop between our pages keeps it
  let touch: Record<string, string> = {};
  try { touch = JSON.parse(sessionStorage.getItem('wren-touch') || 'null') || {}; } catch {}
  if (arrived) { touch = here; try { sessionStorage.setItem('wren-touch', JSON.stringify(touch)); } catch {} }
  for (const k of [...KEYS, 'ref']) {
    const el = document.querySelector<HTMLInputElement>(`form[data-lead] input[name=${k}]`);
    if (el) el.setAttribute('value', touch[k] || '');
  }
  // a "Book a call" button (functions/book) carries this tab's email code onto the booking
  if (touch.r) document.querySelectorAll<HTMLAnchorElement>('a[data-book]').forEach((a) => {
    const u = new URL(a.href); u.searchParams.set('r', touch.r); a.href = u.pathname + u.search;
  });
  if (KEYS.some((k) => q.has(k))) {
    const clean = new URL(location.href);
    for (const k of KEYS) clean.searchParams.delete(k);
    history.replaceState(history.state, '', clean.pathname + clean.search + clean.hash);
  }

  const view = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  let depth = 0, cta = 0, touched = 0, shown = document.hidden ? 0 : performance.now(), secs = 0;
  let queued = false; // scrollHeight forces layout: read it once a frame, not on every scroll event
  const measure = () => {
    queued = false;
    const h = document.documentElement.scrollHeight - innerHeight;
    depth = Math.max(depth, h > 0 ? Math.min(100, Math.round((scrollY / h) * 100)) : 100);
  };
  measure(); addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(measure); } }, { passive: true });

  // events, buffered and sent as one beacon when the tab hides (or every 50)
  const events: { name: string; props?: Record<string, unknown> }[] = [];
  const flush = () => {
    if (events.length) navigator.sendBeacon('/api/events', new Blob([JSON.stringify({ view, page: location.pathname, events: events.splice(0) })], { type: 'application/json' }));
  };
  const track = (name: string, props?: Record<string, unknown>) => { events.push(props ? { name, props } : { name }); if (events.length >= 50) flush(); };

  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target : null;
    const a = t?.closest<HTMLAnchorElement>('a[data-cta], a[href="#ask"], a[href="#apply"]');
    if (a) { cta = 1; track('cta', { label: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), to: (a.getAttribute('href') || '').slice(0, 200) }); }
    if (t?.closest('a[data-book]')) track('book.click');
    const sig = t?.closest('[data-signal]')?.getAttribute('data-signal');
    if (sig) track(sig);
  }, true);
  let started = false;
  document.addEventListener('focusin', (e) => {
    if (!(e.target instanceof Element) || !e.target.closest('form[data-lead]')) return;
    touched = 1;
    if (!started) { started = true; track('form.start'); }
  });
  document.addEventListener('submit', (e) => { if (e.target instanceof Element && e.target.matches('form[data-lead]')) track('form.submit'); }, true);
  // media events don't bubble: listen in the capture phase. Each mark fires once per video.
  const marks = new WeakMap<HTMLVideoElement, Set<number>>();
  document.addEventListener('play', (e) => { if (e.target instanceof HTMLVideoElement) track('video.play'); }, true);
  const progress = (e: Event) => {
    const v = e.target;
    if (!(v instanceof HTMLVideoElement) || !v.duration) return;
    const pct = e.type === 'ended' ? 100 : (v.currentTime / v.duration) * 100;
    const seen = marks.get(v) ?? new Set<number>(); marks.set(v, seen);
    for (const m of [25, 50, 75, 100]) if (pct >= m && !seen.has(m)) { seen.add(m); track('video.progress', { pct: m }); }
  };
  document.addEventListener('timeupdate', progress, true);
  document.addEventListener('ended', progress, true);

  const body = () => JSON.stringify({
    view, page: location.pathname, niche: document.documentElement.dataset.niche || '',
    depth, secs: Math.round(secs + (shown ? (performance.now() - shown) / 1000 : 0)), cta, touched, w: innerWidth, ...here,
  });
  fetch('/api/hit', { method: 'POST', body: body(), headers: { 'content-type': 'application/json' }, keepalive: true })
    .then((r) => r.json()).then((r: { consent?: string; replay?: boolean }) => {
      if (r.consent === 'ask') ask();
      if (r.replay) import('./replay').then((m) => m.record(view)).catch(() => {});
    }).catch(() => {});
  const send = () => { navigator.sendBeacon('/api/hit', new Blob([body()], { type: 'application/json' })); flush(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { send(); if (shown) { secs += (performance.now() - shown) / 1000; shown = 0; } }
    else shown = performance.now(); // came back: the same view keeps counting
  });
  addEventListener('pagehide', send);
}
