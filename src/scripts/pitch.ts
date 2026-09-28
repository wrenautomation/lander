// Pitch pages: the motion (the hero coming in, headings rising word by word, blocks and pictures entering as you
// scroll, each step's diagram assembling, the dormant list waking, the steps rule filling) and the two things that
// work without motion too (the calculator, the stepped form). html.js is set in Pitch.astro's head when motion is on;
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

/* ---------- the phone's floating button: shown between the hero and the rust back cover, which has its own ---------- */
const float = $('[data-float]'), hero = $('.hero');
if (float && hero) {
  const inView = new Set<Element>();
  const io = new IntersectionObserver((es) => {
    for (const e of es) e.isIntersecting ? inView.add(e.target) : inView.delete(e.target);
    float.classList.toggle('show', inView.size === 0);
  });
  for (const el of [hero, $('.close'), $('.foot')]) if (el) io.observe(el);
}

/* ---------- the steps: the rule fills as you read; each stop lights when the rule reaches it ---------- */
const rail = $('[data-rail]'), line = $('[data-timeline]');
if (motion && rail && line) {
  gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
  for (const li of $$('[data-stop]', line)) ScrollTrigger.create({ trigger: li, start: 'top 60%', end: 'max', onToggle: (s) => li.classList.toggle('on', s.isActive) });
} else {
  for (const li of $$('[data-stop]')) li.classList.add('on');
}

/* ---------- the dormant list: grey dots, a few of which light up as you scroll ---------- */
const canvas = $<HTMLCanvasElement>('[data-field]');
if (canvas) {
  const box = canvas.parentElement!, ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(root);
  const acc = css.getPropertyValue('--acc').trim() || '#C24E1C', dim = css.getPropertyValue('--ink-3').trim() || '#8A8A85';
  let rng = 7;
  const rand = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; }; // seeded: the same field every visit
  type Dot = { x: number; y: number; r: number }; // r = when it lights (0..1), or 2 = stays dormant
  let dots: Dot[] = [], W = 0, H = 0, p = motion ? 0 : 1;
  const AWAKE = 0.075, R = 2.6;
  const build = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = box.clientWidth; H = box.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = W < 520 ? 15 : 19, cols = Math.floor(W / gap), rows = Math.floor(H / gap);
    const ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
    rng = 7;
    const hubs = Array.from({ length: 4 }, () => ({ x: rand() * W, y: rand() * H }));
    const raw: { x: number; y: number; t: number }[] = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = ox + i * gap, y = oy + j * gap;
      const d = Math.min(...hubs.map((h) => Math.hypot(h.x - x, h.y - y))) / Math.max(W, H);
      raw.push({ x, y, t: rand() * 0.55 + d * 1.6 }); // low t = likely awake, clustered near a hub
    }
    const cut = [...raw].sort((a, b) => a.t - b.t)[Math.floor(raw.length * AWAKE)]?.t ?? 0;
    const awake = raw.filter((d) => d.t < cut).sort(() => rand() - 0.5);
    const order = new Map(awake.map((d, k) => [d, k / awake.length]));
    dots = raw.map((d) => ({ x: d.x, y: d.y, r: order.get(d) ?? 2 }));
  };
  // dormant: an outline in grey. Woken: the outline fills rust and grows a little, once, as the scroll reaches it.
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = dim;
    for (const d of dots) {
      const k = d.r > 1 ? 0 : Math.max(0, Math.min(1, (p - d.r) * 10));
      if (k === 0) { ctx.beginPath(); ctx.arc(d.x, d.y, R, 0, 7); ctx.stroke(); continue; }
      ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(d.x, d.y, R + 1.4 * k, 0, 7); ctx.fill();
    }
  };
  build(); draw();
  new ResizeObserver(() => { build(); draw(); }).observe(box);
  if (motion) {
    ScrollTrigger.create({
      trigger: box, start: 'top 75%', end: 'bottom 35%', scrub: true,
      onUpdate: (s) => { p = s.progress; draw(); },
    });
  }
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
  // the first screen: the headline rises, then the rest. The form panel is never held back.
  const h1 = $('.hero h1');
  const intro = gsap.timeline({ defaults: { ease: OUT, duration: 1.1 } });
  if (h1) { gsap.set(h1, { opacity: 1 }); intro.fromTo(words(h1), { yPercent: 110 }, { yPercent: 0, stagger: 0.06 }, 0.1); }
  intro.fromTo($$('.hero :is(.lede,.more,.by)'), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.12 }, 0.4);

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
  const ups = $$('.sec .intro, .legend, .dots, .calc-body>*, .side h3, .side .sub, .side li, .bridge, .rows li, .timeline h3, .timeline>li>p, .terms>div, .guarantee, .why>div, .rungs li, .figs>div, .about .photo, .about .para, .sign, .qa details, .close p, .close .btn, .me');
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
    call: (el, tl) => tl
      .fromTo($$('.tile', el), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.14 })
      .fromTo($$('.face', el), { scale: 0.6 }, { scale: 1, stagger: 0.14, ease: 'back.out(2)' }, 0.15)
      .fromTo($('.mins', el), { opacity: 0 }, { opacity: 1 }, 0.5)
      .fromTo($('[data-chip]', el), { opacity: 0, x: () => el.clientWidth / 4 }, { opacity: 1, x: 0, duration: 1.2 }, 0.7),
    rows: (el, tl) => tl
      .fromTo($$('li', el), { opacity: 0, x: -24 }, { opacity: 1, x: 0, stagger: 0.14 })
      .fromTo($$('.mk', el), { scale: 0 }, { scale: 1, stagger: 0.14, duration: 0.6, ease: 'back.out(3)' }, 0.4),
    flow: (el, tl) => tl
      .fromTo($('.wire', el), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut' })
      .fromTo($$('li', el), { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.2 }, 0)
      .call(() => el.classList.add('run')),
    bars: (el, tl) => tl
      .fromTo($$('i', el), { scaleX: 0 }, { scaleX: 1, duration: 1.3, stagger: 0.14 })
      .fromTo($$('span', el), { opacity: 0 }, { opacity: 1, stagger: 0.14 }, 0),
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

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ---------- the calculator ---------- */
const calc = $('[data-calc]');
if (calc) {
  const ins = $$<HTMLInputElement>('[data-in]', calc);
  const money = (x: number) => `$${x >= 1000 ? `${fmt(x / 1000)}k` : fmt(x)}`;
  const show = (i: HTMLInputElement) => {
    const v = Number(i.value), u = i.dataset.unit;
    i.style.setProperty('--p', `${((v - Number(i.min)) / (Number(i.max) - Number(i.min))) * 100}%`);
    $(`[data-out="${i.dataset.in}"]`, calc)!.textContent = u === 'usd' ? money(v) : u === 'percent' ? `${v}%` : fmt(v);
  };
  const run = () => {
    const v = Object.fromEntries(ins.map((i) => [i.dataset.in, Number(i.value)]));
    const orders = (v.contacts * v.rate) / 100, fees = orders * (v.fill / 100) * v.fee;
    $('[data-res="orders"]', calc)!.textContent = fmt(orders);
    $('[data-res="fees"]', calc)!.textContent = money(fees);
  };
  for (const i of ins) i.addEventListener('input', () => { show(i); run(); });
}

/* ---------- the form: one question at a time, then fetch ---------- */
const box = $('[data-apply]');
if (box) {
  const form = $<HTMLFormElement>('form', box)!;
  const steps = $$('.step', form);
  const next = $<HTMLButtonElement>('[data-next]', form), back = $<HTMLButtonElement>('[data-back]', form);
  const segs = $$('.segs i', form), at = $('[data-at]', form);
  const submit = $<HTMLButtonElement>('[data-submit]', form)!;
  let cur = 0;
  form.noValidate = true;

  const answered = (s: HTMLElement) => {
    if (!('required' in s.dataset)) return true;
    if (s.dataset.kind === 'text') return !!$<HTMLTextAreaElement>('textarea', s)?.value.trim();
    return !!$('input:checked', s);
  };
  const show = (i: number, focus = true) => {
    cur = i;
    steps.forEach((s, j) => s.classList.toggle('on', j === i));
    segs.forEach((g, j) => g.classList.toggle('on', j <= i));
    if (at) at.textContent = String(i + 1);
    if (back) back.hidden = i === 0;
    if (next) next.hidden = i === steps.length - 1;
    if (focus) $<HTMLElement>('input, textarea', steps[i])?.focus({ preventScroll: true });
  };
  const advance = () => {
    const s = steps[cur];
    if (!answered(s)) { s.classList.add('invalid'); return; }
    s.classList.remove('invalid');
    if (cur < steps.length - 1) show(cur + 1);
  };
  if (steps.length > 1 && next) {
    form.classList.add('stepping');
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

  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const fieldOk = (input: HTMLInputElement, ok: boolean) => { input.closest('.field')?.classList.toggle('invalid', !ok); return ok; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.elements.namedItem('email') as HTMLInputElement, firm = form.elements.namedItem('firm') as HTMLInputElement;
    const ok = [fieldOk(email, EMAIL.test(email.value.trim())), fieldOk(firm, !!firm.value.trim())].every(Boolean);
    if (!ok) { $<HTMLElement>('.field.invalid input', form)?.focus(); return; }
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
