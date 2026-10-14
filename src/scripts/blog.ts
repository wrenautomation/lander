// The blog's motion: the figures in src/components/blog build as they scroll in, and the bar on top names the
// section being read. The page reads whole without it: every figure is drawn in its end state until this arms it.
//
// Figures play one at a time, in the order they come into view (the lander's rule). A fast scroll queues them and
// the queue catches up at no more than 2x; nothing skips or snaps to its end. Under reduced motion or ?static
// nothing arms, so every figure stays as drawn. Drips and lights rest while their figure is off screen.

const q = new URLSearchParams(location.search);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches || q.has('static');

/** One beat per step, in ms, at normal speed. */
const BEAT: Record<string, number> = { rack: 720, leaks: 980, fan: 460, timeline: 640, stat: 1300 };

type Fig = { el: HTMLElement; kind: string; steps: number; parts: Element[][]; readout: Element | null; unit: string };

const figs: Fig[] = [...document.querySelectorAll<HTMLElement>('[data-fig]')].map((el) => {
  const steps = Number(el.dataset.steps) || 0;
  const items = [...el.querySelectorAll('.b-items li')];
  const parts = Array.from({ length: steps }, (_, i) =>
    [...el.querySelectorAll(`[data-part="${i}"],[data-drip="${i}"],[data-puddle="${i}"],[data-crack="${i}"]`), items[i]].filter((x): x is Element => !!x));
  return { el, kind: el.dataset.fig || '', steps, parts, readout: el.querySelector('[data-readout]'), unit: el.dataset.unit || '' };
});

// pointing at a line of the list, or at its part in the drawing, picks both out
for (const f of figs) {
  f.parts.forEach((group, i) => {
    for (const node of group) {
      node.addEventListener('pointerenter', () => hot(f, i));
      node.addEventListener('pointerleave', () => hot(f, -1));
    }
  });
}
function hot(f: Fig, at: number) {
  f.el.toggleAttribute('data-picking', at >= 0);
  f.parts.forEach((group, i) => group.forEach((n) => n.classList.toggle('hot', i === at)));
}

const setStep = (f: Fig, k: number) => {
  f.el.style.setProperty('--k', String(k));
  f.parts.forEach((group, i) => group.forEach((n) => n.classList.toggle('on', i < k)));
  if (f.readout) f.readout.textContent = `${k} of ${f.steps} ${f.unit}`;
};

// figures rest off screen
const seen = new IntersectionObserver((es) => es.forEach((e) => (e.target as HTMLElement).toggleAttribute('data-vis', e.isIntersecting)));
figs.forEach((f) => seen.observe(f.el));

if (!still && figs.length) {
  for (const f of figs) {
    f.el.setAttribute('data-armed', '');
    setStep(f, 0);
    if (f.kind === 'stat') f.el.querySelector('[data-count]')!.textContent = '0';
  }
  const queue: Fig[] = [];
  let playing = false;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const play = async () => {
    if (playing) return;
    playing = true;
    while (queue.length) {
      const f = queue.shift()!;
      for (let k = 1; k <= f.steps; k++) {
        const speed = queue.length ? 2 : 1;
        f.el.style.setProperty('--speed', String(speed));
        setStep(f, k);
        if (f.kind === 'stat') count(f, BEAT.stat! / speed);
        await wait((BEAT[f.kind] ?? 600) / speed);
      }
      f.el.setAttribute('data-done', '');
    }
    playing = false;
  };
  const enter = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      enter.unobserve(e.target);
      const f = figs.find((x) => x.el === e.target);
      if (f) { queue.push(f); void play(); }
    }
  }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
  figs.forEach((f) => enter.observe(f.el));
}

function count(f: Fig, ms: number) {
  const out = f.el.querySelector('[data-count]')!;
  const end = Number(f.el.dataset.n) || 0;
  const t0 = performance.now();
  const tick = (t: number) => {
    const p = Math.min(1, (t - t0) / ms);
    out.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// the bar on top: the section being read, once the title has scrolled away
const at = document.querySelector<HTMLElement>('[data-at]');
const heads = [...document.querySelectorAll<HTMLElement>('.post h2')];
const title = document.querySelector<HTMLElement>('.post-hero h1');
if (at && title) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = 90;
    const past = title.getBoundingClientRect().bottom < 56;
    let name = past ? title.textContent || '' : '';
    for (const h of heads) if (h.getBoundingClientRect().top < line) name = h.textContent || '';
    if (at.textContent !== name) {
      at.classList.remove('swap');
      void at.offsetWidth;
      at.textContent = name;
      if (name && !still) at.classList.add('swap');
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
