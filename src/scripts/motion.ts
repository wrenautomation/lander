// Theme toggle, the drawn traces, the counters, the form. The page reads without any of it.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const q = new URLSearchParams(location.search);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || q.has('static');
if (q.has('probe')) gsap.ticker.lagSmoothing(0); // headless screenshots: virtual time otherwise reads as lag
const root = document.documentElement;
if (reduce) root.classList.add('no-motion');
const BP = '(max-width:839px)'; // same number as global.css

/* ---------- theme ---------- */
const tb = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!;
const setTheme = (t: string, save = true) => {
  root.dataset.theme = t; const l = t === 'dark' ? tb.dataset.toLight! : tb.dataset.toDark!; tb.setAttribute('aria-label', l); tb.title = l;
  if (save) try { localStorage.setItem('wren-theme', t); } catch {}
};
setTheme(q.get('theme') || root.dataset.theme || 'light', false);
tb.onclick = () => {
  const flip = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (reduce || !d.startViewTransition) flip(); else d.startViewTransition(flip);
};

/* ---------- form: fetch when JS is on, plain POST + redirect when it is off ---------- */
const ask = document.querySelector<HTMLElement>('[data-ask]');
if (ask) {
  const form = ask.querySelector<HTMLFormElement>('form[data-lead]')!;
  if (q.get('sent') === '1') ask.classList.add('done');
  if (q.get('sent') === '0') ask.classList.add('error');
  // Required and email checks with the messages from site.yaml. The browser's own checks still run when JS is off.
  form.noValidate = true;
  const fields = [...form.querySelectorAll<HTMLElement>('.field')];
  const check = (f: HTMLElement) => {
    const el = f.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea')!;
    const bad = !el.checkValidity();
    f.classList.toggle('bad', bad); el.setAttribute('aria-invalid', String(bad));
    return !bad;
  };
  fields.forEach((f) => { const el = f.querySelector('input,textarea')!; el.addEventListener('input', () => { if (f.classList.contains('bad')) check(f); }); });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const ok = fields.map(check).every(Boolean);
    if (!ok) { fields.find((f) => f.classList.contains('bad'))?.querySelector<HTMLElement>('input,textarea')?.focus(); return; }
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    btn.disabled = true; ask.classList.remove('error');
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(String(r.status));
      ask.classList.add('done');
    } catch {
      ask.classList.add('error'); btn.disabled = false;
    }
  };
}

/* ---------- the landing intro. Base.astro decides whether it runs (html[data-intro]); CSS hides the target until then. 1 = overlay, 2 = the hero draws itself. ---------- */
const NS = 'http://www.w3.org/2000/svg';
const el = (tag: string, attrs: Record<string, string | number>) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, String(attrs[k])); return e; };
(() => {
  const v = root.dataset.intro, target = document.querySelector<HTMLElement>('[data-intro-target]');
  if (!v || !target || reduce) { delete root.dataset.intro; return; }
  const itr = target.querySelector<SVGSVGElement>('svg.itr'), parts = [...target.children].filter((c) => c !== itr).flatMap((c) => (c.classList.contains('copy') ? [...c.children] : [c])); // the hero's text column staggers line by line, the card comes up as one
  const finish = () => { if (v === '2') itr?.classList.add('on'); delete root.dataset.intro; gsap.set(parts, { clearProps: 'opacity,transform' }); ScrollTrigger.refresh(); };
  const prep = (svg: SVGSVGElement) => {
    const paths = [...svg.querySelectorAll('path')], nodes = [...svg.querySelectorAll('circle')];
    paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = String(L); p.style.strokeDashoffset = String(L); });
    gsap.set(nodes, { scale: 0, transformOrigin: 'center' });
    return { paths, nodes };
  };
  const tl = gsap.timeline({ onComplete: finish });
  if (v === '1') {
    // Overlay: a trace runs in from the left to the mark, the mark appears, the trace runs on to a filled node, then the sheet lifts.
    const box = document.querySelector<HTMLElement>('.sheet')!, svg = box.querySelector<SVGSVGElement>('svg')!, mark = box.querySelector<HTMLElement>('.intro-mark')!;
    const W = innerWidth, cx = W / 2, m = Math.min(72, W * .16), jog = W < 600 ? 60 : 110;
    svg.setAttribute('viewBox', `0 0 ${W} 80`);
    svg.append(
      el('path', { d: `M0 52 H${cx - m - jog - 12} L${cx - m - jog} 40 H${cx - m}` }),
      el('path', { d: `M0 28 H${Math.round(W * .18)}` }), el('circle', { cx: Math.round(W * .18) + 4, cy: 28, r: 3.5 }),
      el('path', { class: 'a', d: `M${cx + m} 40 H${cx + m + jog} L${cx + m + jog + 12} 52 H${W - 48}` }), el('circle', { class: 'a', cx: W - 44, cy: 52, r: 4 }),
    );
    const { paths, nodes } = prep(svg);
    gsap.set(mark, { opacity: 0, scale: .92 });
    tl.to(paths[0], { strokeDashoffset: 0, duration: .45, ease: 'power1.inOut' }, 0)
      .to(paths[1], { strokeDashoffset: 0, duration: .3, ease: 'power1.inOut' }, .1)
      .to(nodes[0], { scale: 1, duration: .25, ease: 'back.out(2)' }, .38)
      .to(mark, { opacity: 1, scale: 1, duration: .45, ease: 'power2.out' }, .3)
      .to(paths[2], { strokeDashoffset: 0, duration: .45, ease: 'power1.inOut' }, .5)
      .to(nodes[1], { scale: 1, duration: .3, ease: 'back.out(2)' }, .9)
      .to(box, { yPercent: -100, duration: .7, ease: 'power3.inOut' }, 1.3)
      .fromTo(parts, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .55, stagger: .07, ease: 'power2.out' }, 1.5)
      .set(box, { display: 'none' });
  } else {
    // In place: the trace already in the hero (svg.itr, shown by CSS for data-intro=2) draws across the top, and the lines under it come up as it goes.
    const svg = itr;
    if (!svg) { finish(); return; }
    const W = target.clientWidth, y = 20;
    svg.setAttribute('viewBox', `0 0 ${W} 40`);
    svg.append(
      el('path', { d: `M0 32 H${Math.round(W * .22)}` }), el('circle', { cx: Math.round(W * .22) + 4, cy: 32, r: 3.5 }),
      el('path', { class: 'a', d: `M0 ${y} H${Math.round(W * .34)} L${Math.round(W * .34) + 12} 8 H${Math.round(W * .68)} L${Math.round(W * .68) + 12} ${y} H${W - 44}` }), el('circle', { class: 'a', cx: W - 40, cy: y, r: 4 }),
    );
    const { paths, nodes } = prep(svg);
    tl.to(paths[1], { strokeDashoffset: 0, duration: .8, ease: 'power1.inOut' }, 0)
      .to(paths[0], { strokeDashoffset: 0, duration: .4, ease: 'power1.inOut' }, .15)
      .to(nodes[0], { scale: 1, duration: .25, ease: 'back.out(2)' }, .5)
      .to(nodes[1], { scale: 1, duration: .3, ease: 'back.out(2)' }, .75)
      .fromTo(parts, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .08, ease: 'power2.out' }, .2);
  }
})();

/* ---------- draw once ---------- */
function drawOnEnter(svg: SVGSVGElement, stagger: number) {
  const paths = [...svg.querySelectorAll('path')], nodes = [...svg.querySelectorAll('circle')];
  if (reduce || !paths.length) return;
  paths.forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = String(L); p.style.strokeDashoffset = String(L); });
  gsap.set(nodes, { scale: 0, transformOrigin: 'center' });
  ScrollTrigger.create({ trigger: svg, start: 'top 92%', once: true, onEnter: () => {
    gsap.to(paths, { strokeDashoffset: 0, duration: .9, stagger, ease: 'power1.inOut' });
    gsap.to(nodes, { scale: 1, duration: .35, stagger: stagger * 1.5, ease: 'power2.out', delay: .4 });
  }});
}
document.querySelectorAll<SVGSVGElement>('svg[data-band]').forEach((s) => drawOnEnter(s, .03));
const steps = document.querySelector<SVGSVGElement>('svg[data-steps]');
if (steps && getComputedStyle(steps).display !== 'none') drawOnEnter(steps, .15);

/* ---------- case pipelines: one trace through each case's nodes, a jog per step, stubs ending in hollow nodes ---------- */
type Pipe = HTMLElement & { _key?: string; _tl?: gsap.core.Timeline | null; _st?: ScrollTrigger | null; _done?: boolean };
function tracePipe(pipe: Pipe, animate: boolean) {
  const ol = pipe.querySelector('ol')!;
  let svg = ol.querySelector<SVGSVGElement>('svg.pt');
  if (!svg) { svg = el('svg', { class: 'pt', 'aria-hidden': 'true' }) as SVGSVGElement; ol.prepend(svg); }
  const vert = matchMedia(BP).matches;
  const lis = [...ol.querySelectorAll<HTMLElement>('li')], dots = lis.map((li) => li.querySelector<HTMLElement>('.dot')!);
  const W = ol.clientWidth, H = ol.clientHeight;
  svg.setAttribute('width', String(W)); svg.setAttribute('height', String(H)); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const pts = lis.map((li, i) => ({ x: li.offsetLeft + dots[i].offsetLeft + 6, y: li.offsetTop + dots[i].offsetTop + 6 }));
  const key = W + ':' + pts.map((p) => p.x + ',' + p.y).join('|');
  if (key === pipe._key && svg.firstChild) return; // nothing moved, leave any running animation alone
  pipe._key = key; svg.innerHTML = '';
  const J = 12, P = 36, SL = vert ? 20 : 30, SR = 3.5; // jog rise, jog plateau, stub run, stub node radius
  const d = [`M${pts[0].x} ${pts[0].y}`], cum = [0], marks: { at: number; els: Element[] }[] = [];
  let len = 0, cur = pts[0];
  const to = (x: number, y: number) => { len += Math.hypot(x - cur.x, y - cur.y); d.push(`L${x} ${y}`); cur = { x, y }; };
  const stub = (path: string, cx: number, cy: number, at: number) => { const p = el('path', { d: path }), c = el('circle', { cx, cy, r: SR }); svg!.appendChild(p); svg!.appendChild(c); marks.push({ at, els: [p, c] }); };
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i + 1], jog = i % 2 === 0, side = (i >> 1) % 2 ? 1 : -1; // steps alternate jog / stub; jogs alternate sides
    if (!vert) {
      const S = B.x - A.x, y = A.y;
      if (jog) { const x1 = Math.round(A.x + S * .5) - J - P / 2; to(x1, y); to(x1 + J, y + side * J); to(x1 + J + P, y + side * J); to(x1 + 2 * J + P, y); }
      else { const sx = Math.round(A.x + S * .4), sy = y - side * J; stub(`M${sx} ${y} L${sx + J} ${sy} H${sx + J + SL}`, sx + J + SL + SR, sy, len + sx - A.x); }
    } else {
      const S = B.y - A.y, x = A.x;
      if (jog) { const y1 = Math.round(A.y + S * .5) - J - P / 2; to(x, y1); to(x + side * J, y1 + J); to(x + side * J, y1 + J + P); to(x, y1 + 2 * J + P); }
      else { const sy = Math.round(A.y + S * .4), sx = x - J; stub(`M${x} ${sy} L${sx} ${sy + J} V${sy + J + SL}`, sx, sy + J + SL + SR, len + sy - A.y); } // stubs stay in the left gutter
    }
    to(B.x, B.y); cum.push(len);
  }
  const main = el('path', { d: d.join(' ') }); svg.prepend(main);
  const inFlight = !!(pipe._tl && pipe._tl.isActive());
  if (pipe._st) { pipe._st.kill(); pipe._tl!.kill(); pipe._st = pipe._tl = null; }
  if (!animate || pipe._done) { gsap.set(dots, { clearProps: 'transform' }); return; }
  const dur = .35 * pts.length;
  gsap.set(main, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set(dots, { scale: 0 }); marks.forEach((m) => gsap.set(m.els, { opacity: 0 }));
  const tl = gsap.timeline({ paused: true, onComplete: () => { pipe._done = true; } });
  tl.to(main, { strokeDashoffset: 0, duration: dur, ease: 'none' }, 0);
  dots.forEach((dot, i) => tl.to(dot, { scale: 1, duration: .25, ease: 'back.out(2)' }, cum[i] / len * dur));
  marks.forEach((m) => tl.to(m.els, { opacity: 1, duration: .3 }, m.at / len * dur));
  pipe._tl = tl;
  if (inFlight) tl.play(); // layout shifted mid-draw: draw again from the start
  else pipe._st = ScrollTrigger.create({ trigger: pipe, start: 'top 82%', once: true, onEnter: () => tl.play() });
}
const pipes = [...document.querySelectorAll<Pipe>('.pipe')];
const redraw = () => { pipes.forEach((p) => tracePipe(p, !reduce)); ScrollTrigger.refresh(); };
redraw(); document.fonts.ready.then(redraw);
let rz: ReturnType<typeof setTimeout>; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(redraw, 150); });

/* ---------- floating audit button ---------- */
const fl = document.querySelector<HTMLElement>('[data-float]'), heroBtn = document.querySelector<HTMLElement>('.hero .btn'), askSec = document.getElementById('ask');
if (fl && heroBtn && askSec && 'IntersectionObserver' in window) {
  let heroGone = false, askSeen = false;
  const show = () => { fl.hidden = !(heroGone && !askSeen); };
  new IntersectionObserver(([e]) => { heroGone = !e.isIntersecting && e.boundingClientRect.top < 0; show(); }).observe(heroBtn);
  new IntersectionObserver(([e]) => { askSeen = e.isIntersecting; show(); }, { rootMargin: '0px 0px -30% 0px' }).observe(askSec);
}

/* ---------- counters ---------- */
document.querySelectorAll<HTMLElement>('[data-count]').forEach((f) => {
  if (reduce || f.dataset.count === '' || f.dataset.count == null) return;
  const end = +f.dataset.count, suf = f.dataset.suffix || '', o = { v: 0 };
  f.textContent = '0' + suf;
  ScrollTrigger.create({ trigger: f, start: 'top 88%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1, ease: 'power2.out', onUpdate: () => { f.textContent = Math.round(o.v).toLocaleString('en') + suf; } }) });
});
