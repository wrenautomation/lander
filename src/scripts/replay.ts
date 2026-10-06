// Session replay for one page view, loaded by hit.ts only when /api/hit says replay: true (consent yes, keys set,
// in the sample). rrweb records the page; every 10 s the buffer goes to /api/replay as one chunk, and the rest goes
// in a beacon when the tab hides. Every input is masked and [data-private] is blocked. Stops after 30 minutes, or
// when the server says no more (cap reached, keys gone, no consent).
import { record as rrweb } from 'rrweb';

const BEACON_MAX = 64_000; // sendBeacon's own limit is 64 KiB in flight

export function record(view: string) {
  let buf: unknown[] = [], seq = 0;
  const url = () => `/api/replay?view=${view}&seq=${seq++}&page=${encodeURIComponent(location.pathname)}&w=${innerWidth}`;
  const stop = rrweb({
    emit: (e) => { buf.push(e); },
    maskAllInputs: true,
    blockSelector: '[data-private]',
    recordCanvas: false,
    collectFonts: false,
    inlineImages: false,
    slimDOMOptions: 'all',
    sampling: { mousemove: 50, scroll: 150, input: 'last' },
    // Motion is recorded as is. Measured 2026-10-06 on / and /recruiting/lead-reactivation (Chromium, 60 s read):
    // ~950 KB/min raw, ~100 KB/min gzip as stored; GSAP's inline transform/opacity is ~30% of the raw. rrweb's
    // ignoreCSSAttributes only filters stylesheet setProperty, not inline style mutations, so it saves nothing here;
    // the churn is spread over every scroll reveal, so blocking selectors would blank the page.
  });
  const end = () => { clearInterval(timer); clearTimeout(cap); stop?.(); buf = []; };
  const post = () => {
    if (!buf.length || seq > 2000) return;
    fetch(url(), { method: 'POST', body: JSON.stringify(buf.splice(0)), headers: { 'content-type': 'application/json' } })
      .then((r) => { if (r.status >= 400 && r.status < 500) end(); }).catch(() => {});
  };
  const beacon = () => {
    if (!buf.length || seq > 2000) return;
    const blob = new Blob([JSON.stringify(buf.splice(0))], { type: 'application/json' });
    if (blob.size <= BEACON_MAX) navigator.sendBeacon(url(), blob); // ponytail: a bigger tail is dropped
  };
  const timer = setInterval(post, 10_000);
  const cap = setTimeout(() => { post(); end(); }, 30 * 60_000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) beacon(); });
  addEventListener('pagehide', beacon);
}
