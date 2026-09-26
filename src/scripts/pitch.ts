// Pitch pages: the scroll-drawn parts (the dormant list waking, the steps rule filling) and the two things that work
// without motion too (the calculator, the stepped form). html.js is set in Pitch.astro's head when motion is on.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountBooking } from './cal';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const motion = root.classList.contains('js');
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/* ---------- the phone's floating button: shown once the form and the hero are out of view ---------- */
const float = $('[data-float]'), hero = $('.hero');
if (float && hero) {
  new IntersectionObserver(([e]) => float.classList.toggle('show', !e.isIntersecting)).observe(hero);
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
