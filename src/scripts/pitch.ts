// Pitch pages: the motion (the hero coming in, headings rising whole, blocks and pictures entering as you
// scroll, each step's diagram assembling, the steps rule filling) and the stepped form,
// which works without motion too. html.js is set in the layout's head (Pitch.astro, Hub.astro) when motion is on;
// without it everything renders whole and still. Diagrams are always complete: motion only brings their parts in.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountBooking } from './cal';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const motion = root.classList.contains('js');
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/* ---------- the steps: the rule fills as you read; each stop lights when the rule reaches it ---------- */
/* the build's week chart lights its stage's bar with it */
for (const line of $$('[data-timeline]')) {
  const rail = $('[data-rail]', line), bars = $$('[data-bar]', line.closest('.sec')!);
  $$('[data-stop]', line).forEach((li, k) => {
    const light = (on: boolean) => { li.classList.toggle('on', on); bars[k]?.classList.toggle('lit', on); };
    if (motion) ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'max', onToggle: (s) => light(s.isActive) });
    else light(true);
  });
  if (motion && rail) gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
}

/* ---------- a reload lands where the reader was, not at the top ---------- */
// Safari restores before fonts and the pinned sections settle, then lands short or at the top. Save the spot on the
// way out, go back to it at once so the top barely shows, and again once layout is final. A link to #apply or a first
// visit is left alone. landY is that spot (0 when there's none): what's above its screen bottom shows whole.
let landY = 0;
try {
  const key = `scroll:${location.pathname}`;
  history.scrollRestoration = 'manual';
  addEventListener('pagehide', () => { try { sessionStorage.setItem(key, String(scrollY)); } catch {} });
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const y = Number(sessionStorage.getItem(key));
  if (nav?.type === 'reload' && !location.hash && y > 0) {
    landY = y;
    const back = () => scrollTo({ top: y, behavior: 'instant' });
    back();
    (document.fonts?.ready ?? Promise.resolve()).then(() => (document.readyState === 'complete' ? requestAnimationFrame(back) : addEventListener('load', () => requestAnimationFrame(back), { once: true })));
  }
} catch {}
// Already on screen when the page starts (or on the screen a reload goes back to): shown whole, never hidden to rise
// back in, so nothing blinks or replays on a reload.
const seen = (el: Element) => el.getBoundingClientRect().top + scrollY < Math.max(scrollY, landY) + innerHeight;

/* ---------- entrances: nothing waits on a click, everything arrives as it's reached ---------- */
const OUT = 'expo.out';

if (motion) {
  // the first screen waits for the page to be up: at load, or as a slow load's screen lifts (Loader.astro)
  const shown = (window as { wrenShown?: Promise<void> }).wrenShown ?? Promise.resolve();
  const hero = $$('.hero :is(.kicker,h1,.lede,.promise,.checks,.more,.ctas,.to-form,.by)');
  // the first screen arrives all at once: headline and copy rise together. The form panel is never held back.
  // A reload that goes back down the page shows it whole.
  if (!landY) {
    gsap.set(hero, { opacity: 0, y: 20 });
    shown.then(() => gsap.to(hero, { opacity: 1, y: 0, duration: 0.7, ease: OUT, delay: 0.05 }));
  }
  root.classList.add('arrived');
  // the form's light runs round its edge until the reader starts on it
  const panel = $('.hub-hero .panel');
  if (panel) shown.then(() => panel.classList.add('beam'));
  panel?.addEventListener('focusin', () => panel.classList.remove('beam'), { once: true });

  // the example thread plays out: a message, the other side typing, the reply, what it means
  const scene = $('[data-scene]');
  if (scene) shown.then(() => {
    gsap.set(scene, { opacity: 1 });
    const [a, b] = $$('.msg', scene);
    gsap.timeline({ defaults: { ease: OUT, duration: 0.9 }, scrollTrigger: { trigger: scene, start: 'top 88%', once: true } })
      .fromTo($('.label', scene), { opacity: 0 }, { opacity: 1 }, 0.5)
      .fromTo(a, { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, 0.6)
      .fromTo(b, { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, 1.3)
      .fromTo($('.txt', b), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 2.5)
      .fromTo($('.typing', b), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 1.5)
      .to($('.typing', b), { opacity: 0, duration: 0.2 }, 2.4)
      .fromTo($('.tag', scene), { opacity: 0, y: 12 }, { opacity: 1, y: 0 }, 2.9);
  });

  // section headings: the whole line rises a little and fades in at once, as each comes into view
  for (const h of $$('.sec h2, .close h2').filter((x) => !seen(x))) {
    gsap.fromTo(h, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: OUT, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  }

  // blocks rise in, in reading order, a few at a time
  const ups = $$('.sec .intro, .qs li, .pain>*, .target, .problem .btn, .agitate .btn, .say p, .say .btn, .side h3, .side .sub, .side li, .bridge, .rows li, .timeline h3, .timeline>li>p, .figs>div, .case, .window, .table, .about .photo, .about .para, .sign, .qa>div, .first3 .st, .start .say>*, .close .head>p, .close .btn, .vs p, .sec .wrap>.btn, .sec .head>.btn').filter((x) => !seen(x));
  gsap.set(ups, { opacity: 0, y: 48 });
  ScrollTrigger.batch(ups, { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: OUT, stagger: 0.08, overwrite: true }) });

  // pictures wipe open from alternate sides, settle, then drift a little against the scroll
  $$('[data-shot]').forEach((s, k) => {
    const pic = s.firstElementChild as HTMLElement;
    if (!seen(s)) gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 85%', once: true } })
      .fromTo(s, { clipPath: k % 2 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
      .fromTo(pic, { scale: 1.35 }, { scale: 1.12, duration: 1.8, ease: OUT }, 0.1);
    gsap.fromTo(pic, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // each step's diagram assembles itself once, then the flow keeps a dot running through it
  const ART: Record<string, (el: HTMLElement, tl: gsap.core.Timeline) => unknown> = {
    rows: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -24 }, { opacity: 1, x: 0, stagger: 0.14 })
      .fromTo($$('.mk', el), { scale: 0 }, { scale: 1, stagger: 0.14, duration: 0.6, ease: 'back.out(3)' }, 0.4),
    // the roadmap: the line runs through the phases in order, each node lands as the line reaches it, then its words
    road: (el, tl) => {
      const down = matchMedia('(max-width: 899px)').matches, lis = $$('li', el), T = 0.45;
      tl.fromTo($('.track', el), down ? { scaleY: 0 } : { scaleX: 0 }, { ...(down ? { scaleY: 1 } : { scaleX: 1 }), duration: T * lis.length, ease: 'none' });
      lis.forEach((li, k) => {
        tl.fromTo($('.stop', li), { scale: 0 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, k * T)
          .fromTo($$('h3, p', li), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06 }, k * T + 0.1);
      });
      return tl;
    },
    // what makes it stick: the cards rise in reading order, then each scene plays its point, one card after another
    values: (el, tl) => {
      const cards = $$(':scope > li', el);
      tl.fromTo(cards, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 });
      const SCENE: Record<string, (v: HTMLElement, t: number) => void> = {
        // the to-do list empties: each task struck through, then handled
        handled: (v, t) => $$('li', v).forEach((r, k) => tl
          .fromTo($('s', r), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.in' }, t + k * 0.35)
          .fromTo($('b', r), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, t + k * 0.35 + 0.25)),
        // each thing that goes wrong turns into the thing that happened instead
        messy: (v, t) => $$('li', v).forEach((r, k) => tl
          .fromTo($('.bad', r), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3 }, t + k * 0.35)
          .fromTo($('i', r), { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power1.inOut' }, t + k * 0.35 + 0.2)
          .fromTo($('.ok', r), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, t + k * 0.35 + 0.45)),
        // you set the switches: some flip on, one stays off, each saying what it means
        charge: (v, t) => {
          $$('li', v).forEach((r, k) => {
            const on = $('.tg.on', r), at = t + 0.3 + k * 0.4;
            if (on) tl.fromTo(on, { backgroundColor: 'rgba(14,14,14,.14)' }, { backgroundColor: '#17803D', duration: 0.3 }, at)
              .fromTo($('u', on), { left: 2 }, { left: 16, duration: 0.3, ease: 'power2.inOut' }, at);
            tl.fromTo($('em', r), { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.35 }, at + 0.15);
          });
        },
        // the log fills in; one run fails, then gets fixed
        watched: (v, t) => {
          tl.fromTo($$('li', v), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.3 }, t);
          const was = $('.was', v)!, now = $('.now', v)!, st = $('.state.fix', v)!;
          tl.set(was, { opacity: 1 }, t + 0.3).set(now, { opacity: 0 }, t + 0.3)
            .set(st, { backgroundColor: 'rgba(210,40,30,.08)' }, t + 0.3)
            .to(was, { opacity: 0, duration: 0.25 }, t + 1.4).to(now, { opacity: 1, duration: 0.25 }, t + 1.5)
            .to(st, { backgroundColor: 'rgba(23,128,61,.1)', duration: 0.3 }, t + 1.4);
        },
        // what each job costs, drawn as it's counted
        cost: (v, t) => { tl.fromTo($$('i', v), { scaleX: 0 }, { scaleX: 1, duration: 0.6, stagger: 0.18, ease: 'power2.out' }, t); },
        // the jobs, jumbled, sort themselves tallest first; the tallest turns green and is where you start
        first: (v, t) => {
          const bars = $$('.rank i', v), top = bars[0]!, pos = (b: HTMLElement, key: string) => `calc(${b.style.getPropertyValue(key)} * 20% + 3%)`;
          tl.fromTo(bars, { left: (_: number, b: HTMLElement) => pos(b, '--from') }, { left: (_: number, b: HTMLElement) => pos(b, '--at'), duration: 0.8, ease: 'power2.inOut' }, t + 0.2)
            .fromTo(top, { backgroundColor: 'rgba(14,14,14,.14)' }, { backgroundColor: '#17803D', duration: 0.3 }, t + 1)
            .fromTo($('em', top), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }, t + 1.1);
        },
      };
      cards.forEach((c, k) => SCENE[c.dataset.scene!]?.($('.va', c)!, 0.5 + k * 0.35));
      return tl;
    },
    // margin by team size: both lines draw left to right, each point popping as the line reaches it, then the key
    margin: (el, tl) => {
      const D = 2, at = (d: HTMLElement) => (D * parseFloat(d.style.getPropertyValue('--x'))) / 100; // when the line reaches it
      tl.fromTo($('svg', el), { clipPath: 'inset(-10px 100% -10px 0)' }, { clipPath: 'inset(-10px 0% -10px 0)', duration: D, ease: 'none' });
      $$('.dot', el).forEach((d) => tl.fromTo(d, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' }, at(d) - 0.1));
      return tl.fromTo($$('.key li', el), { opacity: 0 }, { opacity: 1, stagger: 0.15, duration: 0.4 });
    },
    bars: (el, tl) => tl
      .fromTo($$('i', el), { scaleX: 0 }, { scaleX: 1, duration: 1.3, stagger: 0.14 })
      .fromTo($$('span', el), { opacity: 0 }, { opacity: 1, stagger: 0.14 }, 0),
    merge: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.12 })
      .fromTo($('svg', el), { clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)', duration: 1.2, ease: 'expo.inOut' }, 0.3)
      .fromTo($('.into', el), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: 'back.out(2)' }, '-=0.5'),
    // the service list: row by row, the name, then the thing going in, the wire, a dot along it, the result
    catalog: (el, tl) => {
      let t = 0;
      for (const g of $$('.grp', el)) {
        tl.fromTo($('.grp-hd', g), { opacity: 0 }, { opacity: 1, duration: 0.5 }, t);
        for (const r of $$('.svc', g)) {
          const dot = $('.wire i', r)!;
          tl.fromTo($$('.n, .what', r), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, t)
            .fromTo($('.nd.in', r), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5 }, t + 0.15)
            .fromTo($('.wire', r), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, t + 0.5)
            .fromTo(dot, { left: '0%', opacity: 1 }, { left: '100%', duration: 0.45, ease: 'power1.inOut', immediateRender: false }, t + 0.85)
            .set(dot, { opacity: 0 }, t + 1.3)
            .fromTo($('.nd.out', r), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, t + 1.2);
          t += 0.55;
        }
      }
      return tl;
    },
    // the five levels: each step rises, then its name; the pin drops on the level most companies are on
    levels: (el, tl) => {
      $$('li', el).forEach((li, i) => {
        const flat = matchMedia('(max-width: 899px)').matches; // phones lay the steps as bars growing right
        tl.fromTo($('.block', li), flat ? { scaleX: 0 } : { scaleY: 0 }, flat ? { scaleX: 1, duration: 0.5, ease: 'power2.out' } : { scaleY: 1, duration: 0.5, ease: 'power2.out' }, i * 0.4)
          .fromTo($$('h3, p', li), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, i * 0.4 + 0.2);
      });
      const pin = $('.pin', el);
      if (pin) tl.fromTo(pin, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2)' });
      return tl;
    },
    gantt: (el, tl) => tl
      .fromTo($$('.g-axis i', el), { opacity: 0 }, { opacity: 1, stagger: 0.04, duration: 0.4 })
      .fromTo($$('b', el), { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.18 }, 0.2),
  };
  for (const el of $$('[data-art]').filter((x) => !seen(x))) {
    ART[el.dataset.art!]?.(el, gsap.timeline({ defaults: { ease: OUT, duration: 0.9 }, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
  }

  // proof figures count up to their number, in a box held at the final number's width so nothing beside it moves
  for (const f of $$('.fig .n').filter((x) => !seen(x))) {
    const m = /^([\d,]+)(.*)$/.exec(f.textContent!.trim()), end = m ? Number(m[1].replace(/,/g, '')) : 0;
    if (!m || end < 10) continue;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: OUT, onStart: () => { f.style.minWidth = `${f.getBoundingClientRect().width}px`; }, onUpdate: () => { f.textContent = fmt(o.v) + m[2]; }, scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
  }

  // a section on its way out dims and lifts, so the next one reads as a new slide
  for (const w of $$('.sec>.wrap')) {
    gsap.to(w, { opacity: 0.25, y: -40, ease: 'none', scrollTrigger: { trigger: w.parentElement, start: 'bottom 40%', end: 'bottom top', scrub: true } });
  }
  // a sticky heading leaves with its last item, not after it: gone before the item reaches the top
  for (const h of $$('.head.sticky')) {
    gsap.to(h, { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: h.parentElement, start: 'bottom 55%', end: 'bottom 25%', scrub: true } });
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ---------- the flows: node diagrams wired in code, one line down the section through all three ---------- */
// The wires are drawn with motion on or off; motion only plays each diagram in and runs the line as you scroll.
type Box = { x: number; y: number; w: number; h: number };
type Wire = { path: SVGPathElement; ends: SVGCircleElement[]; dot: SVGCircleElement };
const flowsBox = $('[data-flows]');
if (flowsBox) {
  const NS = 'http://www.w3.org/2000/svg';
  // where an element sits inside `box`, ignoring transforms: nodes move in, the wires stay where they'll land
  const boxIn = (el: HTMLElement, box: HTMLElement): Box => {
    let x = 0, y = 0, n: HTMLElement | null = el;
    while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  };
  // side by side: out the right, in the left (or mirrored). Stacked: out the bottom, in the top.
  const curve = (a: Box, b: Box) => {
    const right = b.x >= a.x + a.w - 1, left = b.x + b.w <= a.x + 1;
    if (right || left) {
      const x1 = right ? a.x + a.w : a.x, x2 = right ? b.x : b.x + b.w, y1 = a.y + a.h / 2, y2 = b.y + b.h / 2;
      const c = Math.max(20, Math.abs(x2 - x1) / 2) * (right ? 1 : -1);
      return `M${x1} ${y1}C${x1 + c} ${y1} ${x2 - c} ${y2} ${x2} ${y2}`;
    }
    const x1 = a.x + a.w / 2, y1 = a.y + a.h, x2 = b.x + b.w / 2, y2 = b.y, c = Math.max(16, (y2 - y1) / 2);
    return `M${x1} ${y1}C${x1} ${y1 + c} ${x2} ${y2 - c} ${x2} ${y2}`;
  };
  // between diagrams: down, across the gap between rows on rounded corners, down again
  const elbow = (x1: number, y1: number, x2: number, y2: number, ym: number) => {
    const s = Math.sign(x2 - x1), r = Math.min(18, Math.abs(x2 - x1) / 2, (y2 - y1) / 4);
    if (!s || r < 2) return `M${x1} ${y1}C${x1} ${ym} ${x2} ${ym} ${x2} ${y2}`;
    return `M${x1} ${y1}V${ym - r}Q${x1} ${ym} ${x1 + s * r} ${ym}H${x2 - s * r}Q${x2} ${ym} ${x2} ${ym + r}V${y2}`;
  };
  // phones: the rows stack with the words between diagrams, so the line takes the left margin: out of one diagram,
  // into the gap, left to the margin, down past the words, across the gap above the next diagram, into it
  const rail = (x1: number, y1: number, x2: number, y2: number, ya: number, yb: number, xg: number) => {
    const r = Math.max(2, Math.min(14, (ya - y1) / 2, (yb - ya) / 2, (y2 - yb) / 2, (x1 - xg) / 2, (x2 - xg) / 2));
    return `M${x1} ${y1}V${ya - r}Q${x1} ${ya} ${x1 - r} ${ya}H${xg + r}Q${xg} ${ya} ${xg} ${ya + r}V${yb - r}Q${xg} ${yb} ${xg + r} ${yb}H${x2 - r}Q${x2} ${yb} ${x2} ${yb + r}V${y2}`;
  };
  const make = (svg: SVGSVGElement): Wire => {
    const el = <T extends SVGElement>(tag: string, cls = '') => { const e = document.createElementNS(NS, tag) as T; if (cls) e.setAttribute('class', cls); e.setAttribute('r', '3.5'); svg.append(e); return e; };
    const path = el<SVGPathElement>('path');
    path.removeAttribute('r');
    return { path, ends: [el<SVGCircleElement>('circle', 'port'), el<SVGCircleElement>('circle', 'port')], dot: el<SVGCircleElement>('circle', 'dot') };
  };
  const len = (w: Wire) => { try { return w.path.getAttribute('d') ? w.path.getTotalLength() : 0; } catch { return 0; } };
  const at = (w: Wire, t: number) => {
    const L = len(w);
    if (!L) return;
    const q = w.path.getPointAtLength(L * t);
    w.dot.setAttribute('cx', `${q.x}`); w.dot.setAttribute('cy', `${q.y}`);
  };
  // t = how much of the wire is drawn; the dot rides its head
  const drawn = new WeakMap<Wire, number>();
  const draw = (w: Wire, t: number) => {
    drawn.set(w, t);
    const L = len(w), p = w.path.style;
    p.strokeDasharray = t >= 1 ? '' : `${L} ${L}`;
    p.strokeDashoffset = t >= 1 ? '' : `${L * (1 - t)}`;
    w.ends[0].style.opacity = t > 0 ? '' : '0';
    w.ends[1].style.opacity = t >= 1 ? '' : '0';
    w.dot.style.opacity = t > 0 && t < 1 ? '1' : '0';
    at(w, t);
  };
  const shape = (w: Wire, d: string) => {
    w.path.setAttribute('d', d);
    const L = len(w);
    if (!L) return;
    [0, L].forEach((l, k) => { const q = w.path.getPointAtLength(l); w.ends[k].setAttribute('cx', `${q.x}`); w.ends[k].setAttribute('cy', `${q.y}`); });
    if (drawn.has(w)) draw(w, drawn.get(w)!);
  };

  const flows = $$('[data-flow]', flowsBox);
  const edges = (f: HTMLElement) => f.dataset.edges!.split(' ').map((e) => e.split('>'));
  const node = (f: HTMLElement, n: string) => $(`[data-node="${n}"]`, f)!;
  const wires = new Map(flows.map((f) => [f, edges(f).map(() => make($<SVGSVGElement>('[data-edges-svg]', f)!))]));
  const joinSvg = $<SVGSVGElement>('[data-joins]', flowsBox)!;
  const joins = flows.slice(1).map(() => make(joinSvg));
  const phone = matchMedia('(max-width: 899px)');
  const layout = () => {
    for (const f of flows) {
      $('[data-edges-svg]', f)!.setAttribute('viewBox', `0 0 ${f.offsetWidth} ${f.offsetHeight}`);
      edges(f).forEach(([a, b], k) => {
        const w = wires.get(f)![k];
        shape(w, curve(boxIn(node(f, a), f), boxIn(node(f, b), f)));
        // wires out of a quiet node (a source that didn't fire) stay faint
        [w.path, ...w.ends].forEach((e) => e.classList.toggle('faint', node(f, a).hasAttribute('data-quiet')));
      });
    }
    joinSvg.setAttribute('viewBox', `0 0 ${flowsBox.offsetWidth} ${flowsBox.offsetHeight}`);
    joins.forEach((w, k) => {
      const A = flows[k], B = flows[k + 1], fa = boxIn(A, flowsBox), fb = boxIn(B, flowsBox);
      const a = boxIn($('[data-out]', A)!, flowsBox), b = boxIn($('[data-in]', B)!, flowsBox);
      if (phone.matches) {
        const gap = (B.closest('.bn') as HTMLElement).offsetTop - (A.closest('.bn') as HTMLElement).offsetTop - (A.closest('.bn') as HTMLElement).offsetHeight;
        shape(w, rail(a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y, fa.y + fa.h + gap / 3, fb.y - 16, fa.x - 8));
      } else shape(w, elbow(a.x + a.w / 2, a.y + a.h, b.x + b.w / 2, b.y, (fa.y + fa.h + fb.y) / 2));
    });
  };
  let placeGhosts = () => {};
  layout();
  const ro = new ResizeObserver(() => { layout(); placeGhosts(); });
  for (const el of [flowsBox, ...flows]) ro.observe(el);
  phone.addEventListener('change', layout);

  if (motion) {
    type Play = (f: HTMLElement, tl: gsap.core.Timeline, ws: Wire[]) => void;
    // one wire, or a fan of them drawn together
    const wire = (tl: gsap.core.Timeline, w: Wire | Wire[], pos: number, duration = 0.6) => {
      for (const x of [w].flat()) {
        const o = { t: 0 };
        draw(x, 0);
        tl.to(o, { t: 1, duration, ease: 'power1.inOut', onUpdate: () => draw(x, o.t) }, pos);
      }
    };
    // the wires out of a node, or into it
    const from = (f: HTMLElement, ws: Wire[], n: string) => ws.filter((_, k) => edges(f)[k][0] === n);
    const into = (f: HTMLElement, ws: Wire[], n: string) => ws.filter((_, k) => edges(f)[k][1] === n);
    const nodes = (f: HTMLElement) => $$('.fn', f);
    // a message that types itself: the typed part shows, the rest holds its space so nothing reflows
    const typer = (body: HTMLElement) => {
      const full = body.textContent!.trim(), shown = document.createElement('span'), rest = document.createElement('span');
      shown.className = 'shown'; rest.className = 'rest'; rest.textContent = full; body.replaceChildren(shown, rest);
      return (tl: gsap.core.Timeline, pos: number, duration: number) => {
        const o = { n: 0 };
        tl.call(() => body.classList.add('writing'), [], pos)
          .to(o, { n: full.length, duration, ease: 'none', onUpdate: () => { const k = Math.round(o.n); shown.textContent = full.slice(0, k); rest.textContent = full.slice(k); } }, pos)
          .call(() => body.classList.remove('writing'), [], pos + duration + 0.1);
      };
    };
    const PLAY: Record<string, Play> = {
      // the list sits grey; it fans out to every source; job posts fire, the rest go quiet; that client lights and jumps to the top; the others are ruled out; the alert
      watch: (f, tl, ws) => {
        // by structure, not class: a replay rebuilds from whatever state the last run left
        const rows = $$('[data-rows] li', f), hot = rows[0], outs = rows.slice(1), chs = $$('.ch', f);
        const hit = chs.find((c) => !c.hasAttribute('data-quiet'))!, quiet = chs.filter((c) => c !== hit);
        const alert = node(f, 'alert'), spark = $('.spark svg', alert);
        hot.classList.remove('lit'); hit.classList.remove('on'); outs.forEach((r) => r.classList.remove('out')); quiet.forEach((c) => c.classList.remove('quiet'));
        gsap.set(rows, { opacity: 0 });
        gsap.set(hot, { yPercent: 200 });
        gsap.set(rows.slice(1, 3), { yPercent: -100 });
        gsap.set(spark, { clipPath: 'inset(-40% 100% -40% 0)' });
        gsap.set($$('.spark .tip', alert), { opacity: 0 });
        tl.to(node(f, 'list'), { opacity: 1, y: 0 }, 0)
          .to(rows, { opacity: 1, duration: 0.4, stagger: 0.07 }, 0.15);
        wire(tl, from(f, ws, 'list'), 0.7);
        tl.to(chs, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, clearProps: 'opacity' }, 1.0)
          .call(() => { hit.classList.add('on'); quiet.forEach((c) => c.classList.add('quiet')); }, [], 1.9)
          .call(() => hot.classList.add('lit'), [], 2.2)
          .to([hot, ...rows.slice(1, 3)], { yPercent: 0, duration: 0.8, ease: 'power3.inOut' }, 2.5);
        // the rest are ruled out one by one, crossed through with the reason
        outs.forEach((r, k) => tl.call(() => r.classList.add('out'), [], 3.3 + k * 0.25));
        wire(tl, into(f, ws, 'alert'), 4.1);
        tl.to(alert, { opacity: 1, y: 0 }, 4.6)
          .fromTo($('.bell', alert), { rotate: -20 }, { rotate: 0, duration: 1, ease: 'elastic.out(1.2,0.3)' }, 4.7)
          .to(spark, { clipPath: 'inset(-40% 0% -40% 0)', duration: 1.1, ease: 'power1.inOut' }, 4.9)
          .to($$('.spark .tip', alert), { opacity: 1, duration: 0.3 }, 5.9);
      },
      // what the message is written from shows first, then it types itself in the recruiter's name; you approve; it branches out to email, LinkedIn and text
      reach: (f, tl, ws) => {
        const msg = node(f, 'msg'), ok = node(f, 'ok'), type = typer($('[data-type]', msg)!);
        const ptr = $('.ptr', ok), chs = $$('.ch', f);
        ok.classList.remove('done'); chs.forEach((c) => c.classList.add('wait'));
        gsap.set($('.voice', msg), { opacity: 0 });
        gsap.set($$('.why li', msg), { opacity: 0, x: -8 });
        gsap.set(ptr, { opacity: 0, x: 40, y: 26 });
        tl.to(msg, { opacity: 1, y: 0 }, 0)
          .to($$('.why li', msg), { opacity: 1, x: 0, duration: 0.4, stagger: 0.15 }, 0.25);
        type(tl, 0.4, 2.4);
        tl.to($('.voice', msg), { opacity: 1, duration: 0.4 }, 2.9);
        wire(tl, into(f, ws, 'ok'), 3.1);
        tl.to(ok, { opacity: 1, y: 0 }, 3.5)
          .to(ptr, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'power2.out' }, 3.8)
          .to(ptr, { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 4.65)
          .call(() => ok.classList.add('done'), [], 4.75)
          .to(ptr, { opacity: 0, duration: 0.4 }, 5.2);
        wire(tl, from(f, ws, 'ok'), 5.0);
        tl.to(chs, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 5.4);
        chs.forEach((c, k) => tl.call(() => c.classList.remove('wait'), [], 5.8 + k * 0.3));
      },
      // replies land and sort themselves; the warm one goes to the calendar; the count climbs
      book: (f, tl, ws) => {
        const inbox = node(f, 'inbox'), cal = node(f, 'cal'), lis = $$('li', inbox), tags = $$('em', inbox);
        const num = $('[data-count]', f)!, segs = $$('.segs i', f), end = Number(num.textContent), c = { n: 0 };
        inbox.classList.remove('sorted');
        gsap.set(lis, { opacity: 0, y: -12 });
        gsap.set(tags, { opacity: 0 });
        gsap.set($$('.busy, .note', cal), { opacity: 0 });
        gsap.set($('.slot', cal), { scaleY: 0 });
        num.textContent = '0'; segs.forEach((s) => s.classList.add('off'));
        tl.to(inbox, { opacity: 1, y: 0 }, 0)
          .to(lis, { opacity: 1, y: 0, stagger: 0.25 }, 0.2)
          .to(tags, { opacity: 1, duration: 0.3, stagger: 0.12 }, 1.1)
          .call(() => inbox.classList.add('sorted'), [], 1.6);
        wire(tl, ws[0], 2.0);
        tl.to(cal, { opacity: 1, y: 0 }, 2.4)
          .to($$('.busy', cal), { opacity: 1, duration: 0.3, stagger: 0.05 }, 2.5)
          .to($('.slot', cal), { scaleY: 1, duration: 0.6, ease: 'power3.out' }, 3.1)
          .to($('.note', cal), { opacity: 1, duration: 0.4 }, 3.5);
        wire(tl, ws[1], 3.8);
        tl.to(node(f, 'count'), { opacity: 1, y: 0 }, 4.2)
          .to(c, { n: end, duration: 2, ease: 'power2.out', onUpdate: () => { const n = Math.round(c.n); num.textContent = String(n); segs.forEach((s, k) => s.classList.toggle('off', k >= n)); } }, 4.4);
      },
    };
    // ghosts: a soft skeleton where each node will land, so a diagram waiting its turn reads as coming, not broken.
    // Each fades as its node starts in; the timeline says when.
    const ghosts = new Map(flows.map((f) => [f, nodes(f).map((n) => {
      const g = document.createElement('span');
      g.className = n.classList.contains('ch') ? 'ghost pill' : 'ghost';
      f.append(g);
      return [n, g] as const;
    })]));
    placeGhosts = () => ghosts.forEach((gs, f) => gs.forEach(([n, g]) => {
      const b = boxIn(n, f);
      Object.assign(g.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
    }));
    placeGhosts();
    // when a node first starts showing in a timeline: the earliest opacity tween on it, stagger included
    const shows = (tl: gsap.core.Timeline, n: HTMLElement) => Math.min(tl.duration(), ...tl.getChildren(false, true, false).flatMap((c) => {
      const k = (c as gsap.core.Tween).targets().indexOf(n);
      if (k < 0 || !('opacity' in c.vars)) return [];
      return [c.startTime() + k * (typeof c.vars.stagger === 'number' ? c.vars.stagger : 0)];
    }));
    const done = new Map<HTMLElement, Promise<void>>();
    // diagrams play in story order at 3/4 speed, each starting as the one before it has about a second left, so they
    // overlap a little. A fast scroll queues the next one, and any diagram with another waiting behind it plays at
    // 2x; nothing jumps or skips.
    const SPEED = 0.75, LEAD = 0.8; // LEAD: seconds of the last diagram (at SPEED) the next one overlaps
    let playing: gsap.core.Timeline | null = null, waiting = 0, queue = Promise.resolve();
    // (re)build a diagram's timeline from its reset state; PLAY puts every node back where the story starts
    const build = (f: HTMLElement) => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: OUT, duration: 0.7 } });
      gsap.set(nodes(f), { opacity: 0, y: 16 });
      PLAY[f.dataset.flow!]?.(f, tl, wires.get(f)!);
      for (const [n, g] of ghosts.get(f)!) {
        gsap.set(g, { opacity: 1 });
        tl.to(g, { opacity: 0, duration: 0.4, ease: 'none' }, shows(tl, n));
      }
      return tl;
    };
    // next: when the following diagram may start; done: when this one is whole
    const run = (tl: gsap.core.Timeline, speed = SPEED) => {
      playing = tl;
      let go = () => {};
      const next = new Promise<void>((r) => { go = r; });
      const done = new Promise<void>((r) => {
        tl.eventCallback('onComplete', () => { if (playing === tl) playing = null; go(); r(); });
      });
      tl.call(go, [], Math.max(0, tl.duration() - LEAD * SPEED)).timeScale(speed).play(0);
      return { next, done };
    };
    for (const f of flows) {
      const ws = wires.get(f)!;
      let tl = build(f);
      // once whole, a dot keeps running through its wires while it's on screen
      // a fan runs at once: wires share a stage when they leave the same node, or meet at the same one
      const loop = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true });
      const E = edges(f), stage = E.map(([a, b]) => (E.filter((e) => e[0] === a).length > 1 ? `>${a}` : `${b}<`));
      [...new Set(stage)].forEach((g) => {
        const t0 = loop.duration();
        ws.forEach((w, k) => {
          if (stage[k] !== g || w.path.classList.contains('faint')) return;
          const o = { t: 0 };
          loop.to(o, { t: 1, duration: 0.9, ease: 'none', onUpdate: () => { w.dot.style.opacity = o.t > 0 && o.t < 1 ? '1' : '0'; at(w, o.t); } }, t0);
        });
      });
      let whole = false, seen = false;
      const finish = () => { whole = true; f.classList.add('whole'); if (seen) loop.play(); };
      done.set(f, new Promise((r) => {
        ScrollTrigger.create({ trigger: $('[data-in]', f) ?? f, start: 'top 70%', once: true, onEnter: () => {
          playing?.timeScale(2);
          waiting++;
          queue = queue.then(() => {
            const p = run(tl, --waiting ? 2 : SPEED);
            p.done.then(() => { finish(); r(); });
            return p.next;
          });
        } });
      }));
      ScrollTrigger.create({ trigger: f, start: 'top bottom', end: 'bottom top', onToggle: (s) => { seen = s.isActive; if (whole) s.isActive ? loop.play() : loop.pause(); } });
      // replay: the diagram plays again from the start, at its normal speed
      const again = document.createElement('button');
      again.type = 'button'; again.className = 'replay'; again.tabIndex = -1; // the diagram is decorative (aria-hidden)
      again.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" /></svg>Replay';
      again.addEventListener('click', () => {
        if (!whole) return;
        whole = false; f.classList.remove('whole'); loop.pause(0);
        ws.forEach((w) => { w.dot.style.opacity = '0'; });
        tl.kill(); tl = build(f);
        run(tl).done.then(finish);
      });
      f.classList.add('replayable');
      f.prepend(again);
    }
    // the line between diagrams draws as you scroll, from one's last node into the next one's first. It waits for
    // its diagram to finish playing; scrolled past early, it catches up to the scroll once the diagram is whole.
    joins.forEach((w, k) => {
      const o = { t: 0 };
      let live = false;
      draw(w, 0);
      done.get(flows[k])!.then(() => {
        const c = { v: 0 };
        gsap.to(c, { v: 1, duration: 0.6, ease: 'power1.inOut', onUpdate: () => draw(w, o.t * c.v), onComplete: () => { live = true; draw(w, o.t); } });
      });
      gsap.to(o, { t: 1, ease: 'none', onUpdate: () => { if (live) draw(w, o.t); }, scrollTrigger: { trigger: $('[data-out]', flows[k])!, start: 'bottom 80%', endTrigger: $('[data-in]', flows[k + 1])!, end: 'top 70%', scrub: 0.5 } });
    });
  }
}

/* ---------- a nav menu: hover and focus open it in CSS; a tap toggles it, Escape or a tap outside closes it ---------- */
for (const m of $$('[data-menu]')) {
  const btn = $<HTMLButtonElement>('button', m)!;
  const set = (on: boolean) => { m.classList.toggle('open', on); btn.setAttribute('aria-expanded', String(on)); };
  btn.addEventListener('click', () => set(!m.classList.contains('open')));
  document.addEventListener('click', (e) => { if (!m.contains(e.target as Node)) set(false); });
  m.addEventListener('keydown', (e) => { if (e.key === 'Escape') { set(false); btn.focus(); } });
  for (const a of $$('a', m)) a.addEventListener('click', () => { set(false); (document.activeElement as HTMLElement | null)?.blur(); });
}

/* ---------- the form: contact details (after an opening question, on the hub), then one question at a time, then fetch ---------- */
const box = $('[data-apply]');
if (box) {
  const form = $<HTMLFormElement>('form', box)!;
  const steps = $$('.step', form);
  const next = $<HTMLButtonElement>('[data-next]', form), back = $<HTMLButtonElement>('[data-back]', form);
  const submit = $<HTMLButtonElement>('[data-submit]', form)!;
  let cur = 0;
  form.noValidate = true;

  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const fieldOk = (input: HTMLInputElement, ok: boolean) => { input.closest('.field')?.classList.toggle('invalid', !ok); return ok; };
  const email = form.elements.namedItem('email') as HTMLInputElement, firm = form.elements.namedItem('firm') as HTMLInputElement | null;
  const phone = form.elements.namedItem('phone') as HTMLInputElement | null; // required on a page that calls back
  const contactOk = () => [
    fieldOk(email, EMAIL.test(email.value.trim())),
    !firm?.required || fieldOk(firm, !!firm.value.trim()),
    !phone?.required || fieldOk(phone, phone.value.replace(/\D/g, '').length >= 7),
  ].every(Boolean);

  const answered = (s: HTMLElement) => {
    if ('contact' in s.dataset) return contactOk();
    if (!('required' in s.dataset)) return true;
    if (s.dataset.kind === 'text') return !!$<HTMLTextAreaElement>('textarea', s)?.value.trim();
    return !!$('input:checked', s);
  };
  // "Something else" opens its text box; picking another answer closes it (what they typed stays, the server drops it)
  const writeIn = (s: HTMLElement) => {
    const field = $<HTMLInputElement>('input.other', s);
    if (!field) return false;
    const open = !!$(`input[value="${field.dataset.choice}"]:checked`, s);
    const opening = open && field.hidden;
    field.hidden = !open;
    if (opening) field.focus();
    return open;
  };
  const pips = $$('.pips i', box); // one bar per step, filled up to the current one
  const show = (i: number, focus = true) => {
    cur = i;
    steps.forEach((s, j) => s.classList.toggle('on', j === i));
    pips.forEach((p, j) => p.classList.toggle('on', j <= i));
    if (back) back.hidden = i === 0;
    const last = i === steps.length - 1;
    if (next) {
      next.hidden = last;
      $('span', next)!.textContent = (i === 0 && next.dataset.first) || next.dataset.label || '';
    }
    submit.hidden = !last;
    if (focus) $<HTMLElement>('input, textarea', steps[i])?.focus({ preventScroll: true });
  };
  const advance = () => {
    const s = steps[cur];
    if (!answered(s)) {
      if ('contact' in s.dataset) $<HTMLElement>('.field.invalid input', s)?.focus();
      else s.classList.add('invalid');
      return;
    }
    s.classList.remove('invalid');
    if (cur < steps.length - 1) show(cur + 1);
  };
  if (steps.length > 1 && next) {
    form.classList.add('stepping');
    box.classList.add('stepping');
    show(0, false);
    next.addEventListener('click', advance);
    back?.addEventListener('click', () => show(Math.max(0, cur - 1)));
    for (const s of steps) {
      s.addEventListener('change', (e) => {
        s.classList.remove('invalid');
        const t = e.target as HTMLInputElement;
        if (t.classList.contains('other')) return;
        writeIn(s); // picking never moves on: they may switch back and forth, Next moves on
      });
    }
  }

  if (!form.classList.contains('stepping')) for (const s of steps) s.addEventListener('change', () => writeIn(s));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cur < steps.length - 1) { advance(); return; } // Enter in a field before the last step moves on
    if (!contactOk()) { if (steps.length > 1) show(steps.findIndex((s) => 'contact' in s.dataset)); $<HTMLElement>('.field.invalid input', form)?.focus(); return; }
    const label = $('span', submit)!, was = label.textContent;
    submit.disabled = true; label.textContent = submit.dataset.sending || was;
    let state = 'error', booking: string | null = null;
    try {
      const r = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
      const j = await r.json() as { ok: boolean; fit?: boolean; booking?: string | null };
      if (j.ok) { state = j.fit ? 'fit' : 'nofit'; booking = j.booking ?? null; }
    } catch { /* state stays error */ }
    submit.disabled = false; label.textContent = was;
    box.dataset.state = state;
    const cal = $('[data-cal]', box);
    if (state === 'fit' && booking && cal && !cal.childElementCount) {
      const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
      const accent = getComputedStyle(root).getPropertyValue('--acc').trim();
      mountBooking(cal, booking, { name, email: email.value.trim() }, accent); // booking is tagged by /api/apply
    }
    const shown = $<HTMLElement>(`[data-result="${state}"]`, box);
    shown?.focus({ preventScroll: true });
    if (state !== 'error') box.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
  });
}
