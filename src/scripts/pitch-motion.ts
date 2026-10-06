// The motion on pitch pages and the hub: the hero thread playing out, headings rising whole, blocks and pictures
// entering as you scroll, each step's diagram assembling, the steps rule filling, the flows playing in story order.
// pitch.ts imports this only when motion is on (html.js), so GSAP never holds up the form or the menu, and a reader
// who asked for less motion never downloads it. Diagrams are always complete: motion only brings their parts in.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$ } from './dom';
import type { Flows, Wire } from './pitch';

gsap.registerPlugin(ScrollTrigger);
// every animation plays at 1.2x: brisk, not hurried. Diagram catch-up stays 2x on top of it.
gsap.globalTimeline.timeScale(1.2);
const root = document.documentElement;
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const OUT = 'expo.out';

// landY: the spot a reload went back to (0 when none); flows: the page's wired diagrams, if it has them
export function play({ landY, flows }: { landY: number; flows: Flows | null }) {
  // Already on screen when the page starts (or on the screen a reload goes back to): shown whole, never hidden to rise
  // back in, so nothing blinks or replays on a reload.
  const seen = (el: Element) => el.getBoundingClientRect().top + scrollY < Math.max(scrollY, landY) + innerHeight;

  /* ---------- the steps: the rule fills as you read; each stop lights when the rule reaches it ---------- */
  /* the build's week chart lights its stage's bar with it */
  for (const line of $$('[data-timeline]')) {
    const rail = $('[data-rail]', line), bars = $$('[data-bar]', line.closest('.sec')!);
    $$('[data-stop]', line).forEach((li, k) => {
      const light = (on: boolean) => { li.classList.toggle('on', on); bars[k]?.classList.toggle('lit', on); };
      ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'max', onToggle: (s) => light(s.isActive) });
    });
    if (rail) gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
  }

  /* ---------- entrances: nothing waits on a click, everything arrives as it's reached ---------- */
  // the first screen waits for the page to be up: at load, or as a slow load's screen lifts (Loader.astro)
  const shown = (window as { wrenShown?: Promise<void> }).wrenShown ?? Promise.resolve();
  // the hero's copy rises in CSS as the load screen goes (pitch.css), so text never waits on this script
  root.classList.add('arrived');

  // the example thread plays out: a message, the other side typing, the reply, what it means
  const scene = $('.scene[data-scene]'); // the thread, not the hub's value cards
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
  const ups = $$('.sec .intro, .qs li, .pain>*, .target, .problem .btn, .agitate .btn, .say p, .say .btn, .side h3, .side .sub, .side li, .bridge, .rows li, .timeline h3, .timeline>li>p, .figs>div, .case, .window, .table, .about .photo, .about .para, .sign, .qa>div, .first3 .st, .start .say>*, .close .head>p, .close .btn, .vs p, .sec .wrap>.btn, .sec .head>.btn, .sec .head>.act, .grp-hd').filter((x) => !seen(x));
  gsap.set(ups, { opacity: 0, y: 20 });
  ScrollTrigger.batch(ups, { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: OUT, stagger: 0.08, overwrite: true }) });

  // pictures wipe open from alternate sides and settle
  $$('[data-shot]').forEach((s, k) => {
    const pic = s.firstElementChild as HTMLElement;
    if (!seen(s)) gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 85%', once: true } })
      .fromTo(s, { clipPath: k % 2 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut' })
      .fromTo(pic, { scale: 1.08 }, { scale: 1, duration: 1.8, ease: OUT }, 0.1);
  });

  // each step's diagram assembles itself once, then the flow keeps a dot running through it
  const ART: Record<string, (el: HTMLElement, tl: gsap.core.Timeline) => unknown> = {
    rows: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -12 }, { opacity: 1, x: 0, stagger: 0.14 })
      .fromTo($$('.mk', el), { scale: 0 }, { scale: 1, stagger: 0.14, duration: 0.6, ease: 'back.out(1.6)' }, 0.4),
    // what makes it stick: the cards rise in reading order, then each scene plays its point, one card after another
    values: (el, tl) => {
      const cards = $$(':scope > li', el);
      tl.fromTo(cards, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.1 });
      const SCENE: Record<string, (v: HTMLElement, t: number) => void> = {
        // the to-do list empties: each task struck through, then handled
        handled: (v, t) => $$('li', v).forEach((r, k) => tl
          .fromTo($('s', r), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.in' }, t + k * 0.35)
          .fromTo($('b', r), { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, t + k * 0.35 + 0.25)),
        // each thing that goes wrong turns into the thing that happened instead
        messy: (v, t) => $$('li', v).forEach((r, k) => tl
          .fromTo($('.bad', r), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3 }, t + k * 0.35)
          .fromTo($('i', r), { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: 'power1.inOut' }, t + k * 0.35 + 0.2)
          .fromTo($('.ok', r), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, t + k * 0.35 + 0.45)),
        // you set the switches: some flip on, one stays off, each saying what it means
        charge: (v, t) => {
          $$('li', v).forEach((r, k) => {
            const on = $('.tg.on', r), at = t + 0.3 + k * 0.4;
            if (on) tl.fromTo(on, { backgroundColor: 'rgba(14,14,14,.14)' }, { backgroundColor: '#136B35', duration: 0.3 }, at)
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
            .fromTo(top, { backgroundColor: 'rgba(14,14,14,.14)' }, { backgroundColor: '#136B35', duration: 0.3 }, t + 1)
            .fromTo($('em', top), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }, t + 1.1);
        },
      };
      cards.forEach((c, k) => SCENE[c.dataset.scene!]?.($('.va', c)!, 0.5 + k * 0.35));
      return tl;
    },
    // margin by team size: both lines draw left to right, each point popping as the line reaches it, then the key
    margin: (el, tl) => {
      const D = 4 / 3, at = (d: HTMLElement) => (D * parseFloat(d.style.getPropertyValue('--x'))) / 100; // when the line reaches it
      tl.fromTo($('svg', el), { clipPath: 'inset(-10px 100% -10px 0)' }, { clipPath: 'inset(-10px 0% -10px 0)', duration: D, ease: 'none' });
      $$('.dot', el).forEach((d) => tl.fromTo(d, { opacity: 0, scale: 0 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, at(d) - 0.1));
      // the gap rides the drawing edge, stretched between the two lines wherever it is
      const gap = $('.gap', el);
      if (gap) {
        const v = (d: HTMLElement, k: string) => parseFloat(d.style.getPropertyValue(k));
        const real = $$('.dot.real', el).map((d) => [v(d, '--x'), v(d, '--y')]), aim = [real[0]!, ...$$('.dot.aim', el).map((d) => [v(d, '--x'), v(d, '--y')])];
        const y = (line: number[][], x: number) => {
          const k = Math.max(1, line.findIndex(([px]) => px >= x)), [x0, y0] = line[k - 1]!, [x1, y1] = line[k]!;
          return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
        };
        gsap.set(gap, { opacity: 0, x: 0 });
        const o = { x: 0 }, first = real[0]![0]!, last = real.at(-1)![0]!;
        tl.fromTo(o, { x: 0 }, { x: 100, duration: D, ease: 'none', onUpdate: () => {
          const x = Math.min(o.x, last), lo = y(real, x), hi = y(aim, x);
          gsap.set(gap, { opacity: o.x < first ? 0 : 1, '--x': x, '--lo': Math.min(lo, hi), '--hi': Math.max(lo, hi) });
        } }, 0).to(gap, { x: 15, duration: 0.3, ease: 'power2.out' }, D);
      }
      return tl.fromTo($$('.key li', el), { opacity: 0 }, { opacity: 1, stagger: 0.15, duration: 0.4 });
    },
    bars: (el, tl) => tl
      .fromTo($$('i', el), { scaleX: 0 }, { scaleX: 1, duration: 1.3, stagger: 0.14 })
      .fromTo($$('span', el), { opacity: 0 }, { opacity: 1, stagger: 0.14 }, 0),
    merge: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -10 }, { opacity: 1, x: 0, stagger: 0.12 })
      .fromTo($('svg', el), { clipPath: 'inset(-10% 100% -10% 0)' }, { clipPath: 'inset(-10% 0% -10% 0)', duration: 1.2, ease: 'expo.inOut' }, 0.3)
      .fromTo($('.into', el), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, ease: 'back.out(1.4)' }, '-=0.5'),
    // past work: each card in, its diagram runs, the numbers count up on their own (below)
    work: (el, tl) => {
      $$('article', el).forEach((a, k) => {
        const t = k * 0.5, dot = $('.wire i', a)!;
        tl.fromTo(a, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, t)
          .fromTo($('.nd.in', a), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.5 }, t + 0.25)
          .fromTo($('.wire', a), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, t + 0.6)
          .fromTo(dot, { left: '0%', opacity: 1 }, { left: '100%', duration: 0.45, ease: 'power1.inOut', immediateRender: false }, t + 0.95)
          .set(dot, { opacity: 0 }, t + 1.4)
          .fromTo($('.nd.out', a), { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)' }, t + 1.3);
      });
      return tl;
    },
    // a service rises, then its scene plays what it hands you. Services side by side trigger together, so each waits by
    // how far across the screen it sits: left to right on a wide screen, each as it's reached down a phone.
    svc: (el, tl) => {
      const t = (el.getBoundingClientRect().left / innerWidth) * 0.9, s = t + 0.45, v = $('.ui', el)!; // s: as it settles
      const pop = (x: gsap.TweenTarget, at: number, stagger = 0) => tl.fromTo(x, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)', stagger }, at);
      const grow = (x: gsap.TweenTarget, at: number, stagger = 0.12, axis = 'scaleX') => tl.fromTo(x, { [axis]: 0 }, { [axis]: 1, duration: 0.5, ease: 'power2.out', stagger }, at);
      tl.fromTo(el, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7 }, t);
      const SCENE: Record<string, () => void> = {
        // the email fills in, the line written for them gets its tag, then it sends
        email: () => {
          pop($('.rcpt b', v), s); grow($$('u', v), s + 0.2, 0.15); pop($('.mine em', v), s + 0.6);
          tl.fromTo($('.snd .was', v), { opacity: 1 }, { opacity: 0, duration: 0.2 }, s + 1.1); pop($('.snd .now', v), s + 1.15);
        },
        // an inquiry late at night, my reply two minutes later, then the call on the calendar
        inquiry: () => {
          tl.fromTo($('.q', v), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4 }, s)
            .fromTo($('.r', v), { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.4 }, s + 0.55);
          pop($('.bk', v), s + 1.1);
        },
        // each person reached in turn; the last has already replied
        people: () => { tl.fromTo($$('li', v), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.25 }, s); pop($$('b', v), s + 0.3, 0.25); },
        // the checklist ticks itself off, then they're ready
        onboard: () => { pop($$('li i', v), s, 0.3); pop($('.fin', v), s + 1); },
        // hours come in from each tool, then out go the invoices and payroll
        hours: () => {
          grow($$('.tools i', v), s); grow($('.arw', v), s + 0.45, 0);
          tl.fromTo($$('.made li', v), { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.15 }, s + 0.7);
          pop($$('.made b', v), s + 0.9, 0.15);
        },
        // the summary writes itself, its chart rises, then its sources
        report: () => { grow($$('.ln u', v), s, 0.1); grow($$('.cht i', v), s + 0.25, 0.1, 'scaleY'); pop($$('.srcs b', v), s + 0.8, 0.12); },
      };
      SCENE[el.dataset.ui!]?.();
      return tl;
    },
    // the five levels, out of order then in order: the pinned level's own block drops in over empty outlines, shakes
    // with nothing under it and falls; then each level builds bottom up, block on block, says what it has and lacks,
    // and my bubble pops over it with what I build there
    levels: (el, tl) => {
      // stacks stand on desktop and lie flat on phones, so blocks drop in from above or slide in from the left. On
      // phones level four sits a screen below where this starts, so the jump would play unseen: the levels just build.
      const flat = matchMedia('(max-width:899px)').matches, off = flat ? { x: -14, y: 0 } : { x: 0, y: -26 };
      const rows = $$(':scope > li:not(.gate)', el), gate = $('.gate', el), jump = $('.most .brick.own', el), pin = $('.pin', el);
      const hide = (x: gsap.TweenTarget, v: gsap.TweenVars) => tl.fromTo(x, v, { ...v, duration: 0.01 }, 0);
      hide($$('.brick', el), { opacity: 0, ...off }); hide($$('.what', el), { opacity: 0, y: 10 });
      hide($$('.fix', el), { opacity: 0, scale: 0.85 });
      if (gate) hide(gate, { opacity: 0 });
      if (pin) hide(pin, { opacity: 0 });
      let t = 0.2;
      if (jump && !flat) {
        const oops = $('.oops', el)!;
        tl.to(jump, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, t)
          .to(pin!, { opacity: 1, duration: 0.3 }, t + 0.3)
          .to(jump, { backgroundColor: 'rgb(210,40,30)', duration: 0.25 }, t + 0.9)
          .fromTo(oops, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t + 0.9)
          .to(jump, { x: 2, duration: 0.08, repeat: 3, yoyo: true, ease: 'sine.inOut' }, t + 1)
          .to(jump, { y: 3 * 40, rotation: 8, opacity: 0, duration: 0.5, ease: 'power2.in' }, t + 1.5)
          .to(oops, { opacity: 0, duration: 0.3 }, t + 1.6)
          .set(jump, { clearProps: 'backgroundColor', rotation: 0, ...off }, t + 2);
        t += 2.2;
      }
      // where the story starts: a cue beside level one that stays, then a line along the floor as each level builds
      const start = $('.start', el), track = $('.track', el);
      if (start && !flat) tl.fromTo(start, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35 }, t - 0.2);
      if (track && !flat) tl.fromTo(track, { opacity: 0.7, width: '0%' }, { width: '100%', duration: rows.length * 0.5, ease: 'none' }, t).to(track, { opacity: 0, duration: 0.5 }, t + rows.length * 0.5 + 0.2);
      rows.forEach((li, i) => {
        const at = t + i * 0.5;
        if (gate && li.previousElementSibling === gate) tl.to(gate, { opacity: 1, duration: 0.4 }, at - 0.2);
        tl.to($$('.brick', li), { opacity: 1, x: 0, y: 0, duration: 0.35, stagger: 0.06, ease: 'power3.out' }, at)
          .to($('.what', li), { opacity: 1, y: 0, duration: 0.45 }, at + 0.2)
          .to($('.fix', li), { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, at + 0.35);
        if (pin && li.contains(pin) && flat) tl.to(pin, { opacity: 1, duration: 0.3 }, at + 0.3);
      });
      return tl;
    },
    gantt: (el, tl) => tl
      .fromTo($$('.g-axis i', el), { opacity: 0 }, { opacity: 1, stagger: 0.04, duration: 0.4 })
      .fromTo($$('b', el), { scaleX: 0 }, { scaleX: 1, duration: 1.1, stagger: 0.18 }, 0.2),
  };
  for (const el of $$('[data-art]').filter((x) => !seen(x))) {
    ART[el.dataset.art!]?.(el, gsap.timeline({ defaults: { ease: OUT, duration: 0.9 }, scrollTrigger: { trigger: el, start: el.dataset.start ?? 'top 85%', once: true } }));
  }

  // proof figures count up to their number, in a box held at the final number's width so nothing beside it moves
  for (const f of $$('.fig .n').filter((x) => !seen(x))) {
    const m = /^([\d,]+)(.*)$/.exec(f.textContent!.trim()), end = m ? Number(m[1].replace(/,/g, '')) : 0;
    if (!m || end < 10) continue;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 0.6, ease: 'power2.out', onStart: () => { f.style.minWidth = `${f.getBoundingClientRect().width}px`; }, onUpdate: () => { f.textContent = fmt(o.v) + m[2]; }, scrollTrigger: { trigger: f, start: 'top 90%', once: true } });
  }

  // a section on its way out dims a little, so the next one reads as a new slide. Phones show one card or button at a
  // time, so the dim waits until the section's end is nearly off the top: nothing still being read goes gray.
  const phone = matchMedia('(max-width:719px)').matches;
  for (const w of $$('.sec>.wrap')) {
    gsap.to(w, { opacity: 0.55, ease: 'none', scrollTrigger: { trigger: w.parentElement, start: phone ? 'bottom 12%' : 'bottom 40%', end: 'bottom top', scrub: true } });
  }
  // a sticky heading leaves with its last item, not after it: gone before the item reaches the top
  for (const h of $$('.head.sticky')) {
    gsap.to(h, { opacity: 0, ease: 'none', scrollTrigger: { trigger: h.parentElement, start: 'bottom 55%', end: 'bottom 25%', scrub: true } });
  }

  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  if (flows) playFlows(flows);
}

/* ---------- the flows: each diagram plays in, the line between them runs as you scroll ---------- */
function playFlows(k: Flows) {
  const { flows, wires, joins, edges, node, boxIn, draw, at } = k;
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
        .fromTo($('.bell', alert), { rotate: -12 }, { rotate: 0, duration: 0.8, ease: 'back.out(1.4)' }, 4.7)
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
    // replies land and sort themselves; the warm one goes to the calendar; new clients count to 10, then ramp up until the number blurs away
    book: (f, tl, ws) => {
      const inbox = node(f, 'inbox'), cal = node(f, 'cal'), lis = $$('li', inbox), tags = $$('em', inbox);
      const num = $('[data-count]', f)!, up = $('.up', f), ramp = $('.ramp', f), c = { n: 0 };
      const show = () => { num.textContent = String(Math.round(c.n)); };
      inbox.classList.remove('sorted');
      gsap.set(lis, { opacity: 0, y: -12 });
      gsap.set(tags, { opacity: 0 });
      gsap.set($$('.busy, .note', cal), { opacity: 0 });
      gsap.set($('.slot', cal), { scaleY: 0 });
      num.classList.remove('gone'); num.textContent = '0';
      gsap.set(num, { clearProps: 'width,marginLeft,opacity,filter' });
      gsap.set(up, { opacity: 0, scale: 0.5 });
      gsap.set(ramp, { clipPath: 'inset(-20% 100% -20% 0%)' });
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
        // 0 to 10 at a walk, along the flat of the ramp
        .to(c, { n: 10, duration: 1.8, ease: 'none', onUpdate: show }, 4.4)
        .to(ramp, { clipPath: 'inset(-20% 50% -20% 0%)', duration: 1.8, ease: 'none' }, 4.4)
        .to(up, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, 5.2)
        // then faster and faster, up the steep end, until the number blurs out and only the arrow is left
        .to(c, { n: 999, duration: 1.8, ease: 'expo.in', onUpdate: show }, 6.3)
        .to(ramp, { clipPath: 'inset(-20% 0% -20% 0%)', duration: 1.8, ease: 'power2.in' }, 6.3)
        .to(num, { opacity: 0, filter: 'blur(8px)', duration: 0.9, ease: 'power1.in' }, 7.2)
        .to(num, { width: 0, marginLeft: -12, duration: 0.5, ease: 'power2.inOut' }, 8.1)
        .call(() => num.classList.add('gone'), [], 8.6);
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
  const placeGhosts = () => ghosts.forEach((gs, f) => gs.forEach(([n, g]) => {
    const b = boxIn(n, f);
    Object.assign(g.style, { left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px` });
  }));
  k.ghosts = placeGhosts; placeGhosts();
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
