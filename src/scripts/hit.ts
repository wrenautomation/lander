// One anonymous beacon per page view, sent when the tab is hidden or closed: how far they read, how long,
// whether they clicked through to the form, whether they touched it. No cookies, no id. Also fills the
// form's hidden utm/ref fields so a lead carries the link it came from.
const q = new URLSearchParams(location.search);
if (!q.has('static') && !q.has('probe')) {
  const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  // first touch: the utm on the link they clicked survives a hop from / to /ria within the tab
  let touch: Record<string, string> = {};
  try { touch = JSON.parse(sessionStorage.getItem('wren-touch') || 'null') || {}; } catch {}
  if (KEYS.some((k) => q.has(k)) || !('ref' in touch)) {
    touch = Object.fromEntries(KEYS.filter((k) => q.has(k)).map((k) => [k, q.get(k)!.slice(0, 100)]));
    touch.ref = document.referrer.slice(0, 200);
    try { sessionStorage.setItem('wren-touch', JSON.stringify(touch)); } catch {}
  }
  for (const k of [...KEYS, 'ref']) {
    const el = document.querySelector<HTMLInputElement>(`form[data-lead] input[name=${k}]`);
    if (el) el.setAttribute('value', touch[k] || '');
  }

  let depth = 0, cta = 0, touched = 0, shown = document.hidden ? 0 : performance.now(), secs = 0, sent = false;
  const measure = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    depth = Math.max(depth, h > 0 ? Math.min(100, Math.round((scrollY / h) * 100)) : 100);
  };
  measure(); addEventListener('scroll', measure, { passive: true });
  document.querySelectorAll('a[href="#ask"]').forEach((a) => a.addEventListener('click', () => { cta = 1; }));
  document.querySelector('form[data-lead]')?.addEventListener('focusin', () => { touched = 1; });

  const send = () => {
    if (sent) return; sent = true;
    if (shown) secs += (performance.now() - shown) / 1000;
    const body = {
      page: location.pathname, niche: document.querySelector<HTMLInputElement>('input[name=niche]')?.value || '',
      depth, secs: Math.round(secs), cta, touched, w: innerWidth, ...touch,
    };
    navigator.sendBeacon('/api/hit', new Blob([JSON.stringify(body)], { type: 'application/json' }));
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (shown) { secs += (performance.now() - shown) / 1000; shown = 0; } send(); }
    else { shown = performance.now(); sent = false; } // came back: the next hide sends again, as a second view
  });
  addEventListener('pagehide', send);
}
