// The one client file that knows the booking vendor is Cal.com. Its booking page renders only when Cal's embed.js
// talks to it from the parent page, so a bare iframe stays blank: load embed.js and mount inline instead.
// Every query param on the link (the metadata[...] tags /api/apply adds) is passed through to the booking.

type CalFn = ((...args: unknown[]) => void) & { q?: unknown[][]; ns?: Record<string, CalFn>; loaded?: boolean };
declare global { interface Window { Cal?: CalFn } }

const ORIGIN = 'https://app.cal.com';
const NS = 'wren';

/** Cal's loader: queue calls until embed.js arrives (their published snippet, unrolled). */
function cal(): CalFn {
  if (window.Cal) return window.Cal;
  const queue = (fn: CalFn, args: unknown[]) => { (fn.q ||= []).push(args); };
  const Cal: CalFn = (...args) => {
    if (!Cal.loaded) {
      Cal.ns = {};
      const s = document.createElement('script'); s.src = `${ORIGIN}/embed/embed.js`; s.async = true;
      document.head.appendChild(s); Cal.loaded = true;
    }
    if (args[0] === 'init' && typeof args[1] === 'string') {
      const ns = args[1];
      const api: CalFn = (...a) => queue(api, a);
      Cal.ns![ns] ||= api;
      queue(Cal.ns![ns], args); queue(Cal, ['initNamespace', ns]);
      return;
    }
    queue(Cal, args);
  };
  return (window.Cal = Cal);
}

/** Mount the booking calendar for `link` (a cal.com URL) into `el`, prefilled so the booker only confirms. */
export function mountBooking(el: HTMLElement, link: string, who: { name: string; email: string }, accent: string) {
  const u = new URL(link);
  const config: Record<string, string> = { ...Object.fromEntries(u.searchParams), theme: 'dark', layout: 'month_view', email: who.email };
  if (who.name) config.name = who.name;
  const Cal = cal();
  Cal('init', NS, { origin: ORIGIN });
  const api = Cal.ns![NS];
  api('inline', { elementOrSelector: el, calLink: u.pathname.replace(/^\//, ''), config });
  api('ui', { theme: 'dark', hideEventTypeDetails: false, layout: 'month_view', cssVarsPerTheme: { dark: { 'cal-brand': accent } } });
}
