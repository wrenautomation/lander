// Pitch pages: the motion (the hero coming in, headings rising word by word, blocks and pictures entering as you
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

/* ---------- entrances: nothing waits on a click, everything arrives as it's reached ---------- */
// Wraps each word in .w>span so it can rise out of its own line box. Keeps inline markup (the *punch* em).
const words = (el: HTMLElement) => {
  const walk = (n: Node) => {
    for (const c of [...n.childNodes]) {
      if (c.nodeType === Node.ELEMENT_NODE) { walk(c); continue; }
      if (c.nodeType !== Node.TEXT_NODE) continue;
      const frag = document.createDocumentFragment();
      for (const t of c.textContent!.split(/(\s+)/)) {
        if (!t) continue;
        if (/^\s+$/.test(t)) { frag.append(t); continue; }
        const w = document.createElement('span'), i = document.createElement('span');
        w.className = 'w'; i.textContent = t; w.append(i); frag.append(w);
      }
      c.replaceWith(frag);
    }
  };
  walk(el);
  return $$('.w>span', el);
};
const OUT = 'expo.out';

if (motion) {
  // the first screen arrives all at once: headline and copy rise together. The form panel is never held back.
  gsap.fromTo($$('.hero :is(.kicker,h1,.lede,.promise,.checks,.more,.ctas,.by)'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: OUT, delay: 0.05 });

  // the example thread plays out: a message, the other side typing, the reply, what it means
  const scene = $('[data-scene]');
  if (scene) {
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
  }

  // section headings: word by word, as each comes into view
  for (const h of $$('.sec h2, .close h2')) {
    gsap.fromTo(words(h), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: OUT, stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  }

  // blocks rise in, in reading order, a few at a time
  const ups = $$('.sec .intro, .qs li, .pain>*, .target, .problem .btn, .agitate .btn, .say p, .say .btn, .side h3, .side .sub, .side li, .bridge, .rows li, .timeline h3, .timeline>li>p, .figs>div, .case, .window, .table, .about .photo, .about .para, .sign, .qa>div, .first3 .st, .start .say>*, .close .head>p, .close .btn, .vs p, .sec .wrap>.btn, .sec .head>.btn');
  gsap.set(ups, { opacity: 0, y: 48 });
  ScrollTrigger.batch(ups, { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: OUT, stagger: 0.08, overwrite: true }) });

  // pictures wipe open from alternate sides, settle, then drift a little against the scroll
  $$('[data-shot]').forEach((s, k) => {
    const pic = s.firstElementChild as HTMLElement;
    gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 85%', once: true } })
      .fromTo(s, { clipPath: k % 2 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
      .fromTo(pic, { scale: 1.35 }, { scale: 1.12, duration: 1.8, ease: OUT }, 0.1);
    gsap.fromTo(pic, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // each step's diagram assembles itself once, then the flow keeps a dot running through it
  const ART: Record<string, (el: HTMLElement, tl: gsap.core.Timeline) => unknown> = {
    rows: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -24 }, { opacity: 1, x: 0, stagger: 0.14 })
      .fromTo($$('.mk', el), { scale: 0 }, { scale: 1, stagger: 0.14, duration: 0.6, ease: 'back.out(3)' }, 0.4),
    bars: (el, tl) => tl
      .fromTo($$('i', el), { scaleX: 0 }, { scaleX: 1, duration: 1.3, stagger: 0.14 })
      .fromTo($$('span', el), { opacity: 0 }, { opacity: 1, stagger: 0.14 }, 0),
    merge: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.12 })
      .fromTo($('svg', el), { clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)', duration: 1.2, ease: 'expo.inOut' }, 0.3)
      .fromTo($('.into', el), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: 'back.out(2)' }, '-=0.5'),
    gantt: (el, tl) => tl
      .fromTo($$('.g-axis i', el), { opacity: 0 }, { opacity: 1, stagger: 0.04, duration: 0.4 })
      .fromTo($$('b', el), { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.18 }, 0.2),
  };
  for (const el of $$('[data-art]')) {
    ART[el.dataset.art!]?.(el, gsap.timeline({ defaults: { ease: OUT, duration: 0.9 }, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));
  }

  // proof figures count up to their number
  for (const f of $$('.fig')) {
    const m = /^([\d,]+)(.*)$/.exec(f.textContent!.trim()), end = m ? Number(m[1].replace(/,/g, '')) : 0;
    if (!m || end < 10) continue;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: OUT, onUpdate: () => { f.textContent = fmt(o.v) + m[2]; }, scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
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
  layout();
  const ro = new ResizeObserver(layout);
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
      // the hub's late inquiry: it lands, the reply types itself, a time is picked, the calendar takes it
      inbound: (f, tl, ws) => {
        const inq = node(f, 'inq'), reply = node(f, 'reply'), cal = node(f, 'cal'), type = typer($('[data-type]', reply)!);
        const times = $$('.times i', reply), pick = $('[data-pick]', reply)!;
        pick.classList.remove('pick');
        gsap.set($('.fast', reply), { opacity: 0 });
        gsap.set(times, { opacity: 0, y: 6 });
        gsap.set($('.note', cal), { opacity: 0 });
        tl.to(inq, { opacity: 1, y: 0 }, 0);
        wire(tl, into(f, ws, 'reply'), 0.6);
        tl.to(reply, { opacity: 1, y: 0 }, 1.0);
        type(tl, 1.2, 2.0);
        tl.to(times, { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }, 3.3)
          .call(() => pick.classList.add('pick'), [], 3.9)
          .to($('.fast', reply), { opacity: 1, duration: 0.4 }, 4.0);
        wire(tl, into(f, ws, 'cal'), 4.2);
        tl.to(cal, { opacity: 1, y: 0 }, 4.7)
          .to($('.note', cal), { opacity: 1, duration: 0.4 }, 5.1);
      },
      // the hub's paperwork: the contract is signed, the record fills itself, then the invoice, kickoff and report go
      admin: (f, tl, ws) => {
        const doc = node(f, 'doc'), rec = node(f, 'crm'), rows = $$('li', rec), chs = $$('.ch', f);
        chs.forEach((c) => c.classList.add('wait'));
        gsap.set($('.sig em', doc), { opacity: 0, scale: 0.8 });
        gsap.set(rows, { opacity: 0, x: -10 });
        tl.to(doc, { opacity: 1, y: 0 }, 0)
          .to($('.sig em', doc), { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(3)' }, 0.6);
        wire(tl, into(f, ws, 'crm'), 1.0);
        tl.to(rec, { opacity: 1, y: 0 }, 1.4)
          .to(rows, { opacity: 1, x: 0, duration: 0.4, stagger: 0.22 }, 1.6);
        wire(tl, from(f, ws, 'crm'), 2.7);
        tl.to(chs, { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 }, 3.1);
        chs.forEach((c, k) => tl.call(() => c.classList.remove('wait'), [], 3.5 + k * 0.3));
      },
      // the hub's firm map: the tools come in and wire into one CRM, its records fill, then both halves light with results
      map: (f, tl, ws) => {
        const crm = node(f, 'crm'), rows = $$('li', crm), goals = $$('.goal', f), ticks = $$('.goal li', f), checks = $$('.goal li i', f);
        gsap.set($('.cap', f), { opacity: 0 });
        gsap.set(rows, { opacity: 0, x: -12 });
        gsap.set(ticks, { opacity: 0 });
        gsap.set(checks, { scale: 0 });
        tl.to($('.cap', f), { opacity: 1, duration: 0.4 }, 0)
          .to($$('.ch', f), { opacity: 1, y: 0, duration: 0.5, stagger: 0.12 }, 0.1);
        wire(tl, into(f, ws, 'crm'), 0.8, 0.8);
        tl.to(crm, { opacity: 1, y: 0 }, 1.5)
          .to(rows, { opacity: 1, x: 0, duration: 0.5, stagger: 0.25 }, 1.8);
        wire(tl, from(f, ws, 'crm'), 2.8, 0.8);
        tl.to(goals, { opacity: 1, y: 0, stagger: 0.2 }, 3.5)
          .to(ticks, { opacity: 1, duration: 0.3, stagger: 0.2 }, 3.8)
          .to(checks, { scale: 1, duration: 0.5, stagger: 0.2, ease: 'back.out(3)' }, 3.8);
      },
    };
    const done = new Map<HTMLElement, Promise<void>>();
    // one diagram plays at a time, in story order. A fast scroll queues the next one, and any diagram with another
    // waiting behind it plays at 2x; nothing jumps or skips.
    let playing: gsap.core.Timeline | null = null, waiting = 0, queue = Promise.resolve();
    // (re)build a diagram's timeline from its reset state; PLAY puts every node back where the story starts
    const build = (f: HTMLElement) => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: OUT, duration: 0.7 } });
      gsap.set(nodes(f), { opacity: 0, y: 16 });
      PLAY[f.dataset.flow!]?.(f, tl, wires.get(f)!);
      return tl;
    };
    const run = (tl: gsap.core.Timeline, speed = 1) => new Promise<void>((r) => {
      playing = tl;
      tl.eventCallback('onComplete', () => { if (playing === tl) playing = null; r(); }).timeScale(speed).play(0);
    });
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
          queue = queue.then(() => run(tl, --waiting ? 2 : 1)).then(() => { finish(); r(); });
        } });
      }));
      ScrollTrigger.create({ trigger: f, start: 'top bottom', end: 'bottom top', onToggle: (s) => { seen = s.isActive; if (whole) s.isActive ? loop.play() : loop.pause(); } });
      // replay: the diagram plays again from the start, at full speed
      const again = document.createElement('button');
      again.type = 'button'; again.className = 'replay'; again.tabIndex = -1; // the diagram is decorative (aria-hidden)
      again.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 8a5 5 0 1 0 1.6-3.7M3 2.5v2.8h2.8" /></svg>Replay';
      again.addEventListener('click', () => {
        if (!whole) return;
        whole = false; f.classList.remove('whole'); loop.pause(0);
        ws.forEach((w) => { w.dot.style.opacity = '0'; });
        tl.kill(); tl = build(f);
        run(tl).then(finish);
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

/* ---------- a reload lands where the reader was, not at the top ---------- */
// Safari restores before fonts and the pinned sections settle, then lands short or at the top. Save the spot on the
// way out and put it back once layout is final. A link to #apply or a first visit is left alone.
try {
  const key = `scroll:${location.pathname}`;
  history.scrollRestoration = 'manual';
  addEventListener('pagehide', () => { try { sessionStorage.setItem(key, String(scrollY)); } catch {} });
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const y = Number(sessionStorage.getItem(key));
  if (nav?.type === 'reload' && !location.hash && y > 0) {
    const back = () => requestAnimationFrame(() => scrollTo({ top: y, behavior: 'instant' }));
    (document.fonts?.ready ?? Promise.resolve()).then(() => (document.readyState === 'complete' ? back() : addEventListener('load', back, { once: true })));
  }
} catch {}

/* ---------- the form: contact details, then one question at a time, then fetch ---------- */
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
  const contactOk = () => [fieldOk(email, EMAIL.test(email.value.trim())), !firm || fieldOk(firm, !!firm.value.trim())].every(Boolean);

  const answered = (s: HTMLElement) => {
    if ('contact' in s.dataset) return contactOk();
    if (!('required' in s.dataset)) return true;
    if (s.dataset.kind === 'text') return !!$<HTMLTextAreaElement>('textarea', s)?.value.trim();
    return !!$('input:checked', s);
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
        if (t.type === 'radio') setTimeout(() => { if (steps[cur] === s) advance(); }, 320); // pick one = move on
      });
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cur < steps.length - 1) { advance(); return; } // Enter in a field before the last step moves on
    if (!contactOk()) { if (steps.length > 1) show(0); $<HTMLElement>('.field.invalid input', form)?.focus(); return; }
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
