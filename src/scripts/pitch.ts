// Pitch pages: motion (reveals, counters, the dormant-list field, the timeline) and the two things that work
// without motion too (the calculator, the stepped form). html.js is set in Pitch.astro's head when motion is on.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const motion = root.classList.contains('js');
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const EASE = 'expo.out';
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/* ---------- nav and the floating CTA ---------- */
const nav = $('[data-nav]');
ScrollTrigger.create({ start: 60, end: 'max', onToggle: (s) => nav?.classList.toggle('scrolled', s.isActive) });
const float = $('[data-float]'), hero = $('.hero'), apply = $('#apply');
if (float && hero && apply) {
  const seen = new Map<Element, boolean>();
  new IntersectionObserver((es) => {
    for (const e of es) seen.set(e.target, e.isIntersecting);
    float.classList.toggle('show', !seen.get(hero) && !seen.get(apply));
  }).observe(hero);
  new IntersectionObserver((es) => {
    for (const e of es) seen.set(e.target, e.isIntersecting);
    float.classList.toggle('show', !seen.get(hero) && !seen.get(apply));
  }, { rootMargin: '0px 0px -30% 0px' }).observe(apply);
}

/* ---------- reveals ---------- */
// Wrap each word of the h1 in a mask, keeping <em> and <b> around their words.
function split(el: Element) {
  for (const node of [...el.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      for (const part of (node.textContent || '').split(/(\s+)/)) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.append(' '); continue; }
        const w = document.createElement('span'); w.className = 'w';
        const i = document.createElement('span'); i.textContent = part; w.append(i); frag.append(w);
      }
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) split(node as Element);
  }
}

if (motion) {
  const h1 = $('[data-split]');
  if (h1) split(h1);
  const heroRise = $$('.hero [data-rise]');
  const consoleEl = $('[data-console]');
  gsap.set('[data-rise]', { opacity: 0, y: 34 });
  if (consoleEl) gsap.set(consoleEl, { opacity: 0, y: 70 });
  if (h1) gsap.set($$('.w>span', h1), { yPercent: 115 });
  root.classList.add('ready');
  if (h1) (h1 as HTMLElement).style.visibility = 'visible';

  const tl = gsap.timeline({ defaults: { ease: EASE } });
  if (h1) tl.to($$('.w>span', h1), { yPercent: 0, duration: 1.3, stagger: 0.055 }, 0.1);
  tl.to(heroRise, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.35);
  if (consoleEl) tl.to(consoleEl, { opacity: 1, y: 0, duration: 1.6 }, 0.5).from($$('[data-feed]', consoleEl), { opacity: 0, x: 24, duration: 1, stagger: 0.14 }, 1.1);

  ScrollTrigger.batch($$('[data-rise]').filter((el) => !heroRise.includes(el)), {
    start: 'top 88%',
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.09, overwrite: true }),
  });

  // counters count up to the number already in the HTML
  for (const b of $$('[data-count]')) {
    const end = Number(b.dataset.count), pre = b.dataset.prefix || '', o = { v: 0 };
    b.textContent = `${pre}0`;
    gsap.to(o, {
      v: end, duration: 2.2, ease: 'power3.out', delay: 0.9, onUpdate: () => { b.textContent = pre + fmt(o.v); },
      scrollTrigger: { trigger: b, start: 'top 92%', once: true },
    });
  }

  // the console drifts up slower than the page
  if (consoleEl && hero) {
    gsap.to(consoleEl, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.glow i:first-child', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  // the timeline rail fills as you read; each step lights when the rail reaches it
  const rail = $('[data-rail]'), line = $('[data-timeline]');
  if (rail && line) {
    gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: line, start: 'top 60%', end: 'bottom 60%', scrub: 0.6 } });
    for (const li of $$('[data-stop]', line)) ScrollTrigger.create({ trigger: li, start: 'top 60%', onToggle: (s) => li.classList.toggle('on', s.isActive || s.progress > 0), end: 'max' });
  }
} else {
  for (const li of $$('[data-stop]')) li.classList.add('on');
}

/* ---------- the dormant list: grey dots, a few of which light up as you scroll ---------- */
const canvas = $<HTMLCanvasElement>('[data-field]');
if (canvas) {
  const box = canvas.parentElement!, ctx = canvas.getContext('2d')!;
  const acc = getComputedStyle(root).getPropertyValue('--acc').trim() || '#ec8a5b';
  let rng = 7;
  const rand = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; }; // seeded: the same field every visit
  type Dot = { x: number; y: number; r: number }; // r = when it lights (0..1), or 2 = stays dormant
  let dots: Dot[] = [], W = 0, H = 0, p = motion ? 0 : 1;
  const AWAKE = 0.075;
  const build = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = box.clientWidth; H = box.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const gap = W < 520 ? 13 : 16, cols = Math.floor(W / gap), rows = Math.floor(H / gap);
    const ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
    rng = 7;
    const hubs = Array.from({ length: 4 }, () => ({ x: rand() * W, y: rand() * H }));
    const raw = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = ox + i * gap, y = oy + j * gap;
      const d = Math.min(...hubs.map((h) => Math.hypot(h.x - x, h.y - y))) / Math.max(W, H);
      raw.push({ x, y, t: rand() * 0.55 + d * 1.6 }); // low t = likely awake, clustered near a hub
    }
    const cut = [...raw].sort((a, b) => a.t - b.t)[Math.floor(raw.length * AWAKE)]?.t ?? 0;
    const awake = raw.filter((d) => d.t < cut).sort(() => rand() - 0.5);
    const order = new Map(awake.map((d, k) => [d, k / awake.length]));
    dots = raw.map((d) => ({ x: d.x, y: d.y, r: order.get(d) ?? 2 }));
    box.classList.add('drawn');
  };
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(244,238,231,.17)';
    for (const d of dots) if (d.r > 1 || p <= d.r) { ctx.beginPath(); ctx.arc(d.x, d.y, 1.15, 0, 7); ctx.fill(); }
    for (const d of dots) {
      if (d.r > 1 || p <= d.r) continue;
      const k = Math.min(1, (p - d.r) * 10);
      ctx.globalAlpha = 0.16 * k; ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(d.x, d.y, 7 * k, 0, 7); ctx.fill();
      ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(d.x, d.y, 1.2 + 1.3 * k, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
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
  const bar = $('[data-bar]', form), at = $('[data-at]', form);
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
    if (bar) bar.style.transform = `scaleX(${(i + 1) / steps.length})`;
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
    if (state === 'fit' && booking && cal) {
      const u = new URL(booking);
      u.searchParams.set('embed', 'true'); u.searchParams.set('theme', 'dark');
      const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
      if (name) u.searchParams.set('name', name);
      u.searchParams.set('email', email.value.trim());
      const f = document.createElement('iframe'); f.src = u.toString(); f.title = 'Pick a time'; f.loading = 'lazy';
      cal.replaceChildren(f);
    }
    const shown = $<HTMLElement>(`[data-result="${state}"]`, box);
    shown?.focus({ preventScroll: true });
    if (state !== 'error') box.scrollIntoView({ behavior: motion ? 'smooth' : 'auto', block: 'start' });
  });
}
