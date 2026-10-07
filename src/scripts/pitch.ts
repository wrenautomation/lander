// Pitch pages and the hub: the stepped form (works without motion too), the nav menu, a reload landing where the reader
// was, and the flow diagrams' wiring. html.js is set in the layout's head (Pitch.astro, Hub.astro) when motion is on;
// without it everything renders whole and still. The motion itself (GSAP) is pitch-motion.ts, fetched only when motion
// is on: it is most of the page's script, so nothing here waits on it.
import { mountBooking } from './cal';
import { $, $$ } from './dom';

const root = document.documentElement;
const motion = root.classList.contains('js');

/* ---------- the steps: without motion every stop shows lit (with it, pitch-motion.ts lights each as the rule reaches it) ---------- */
if (!motion) for (const line of $$('[data-timeline]')) {
  const bars = $$('[data-bar]', line.closest('.sec')!);
  $$('[data-stop]', line).forEach((li, k) => { li.classList.add('on'); bars[k]?.classList.add('lit'); });
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

// the form's light runs round its edge until the reader starts on it (Loader.astro's wrenShown: the page is up)
const panel = motion ? $('.hero .panel') : null;
if (panel) ((window as { wrenShown?: Promise<void> }).wrenShown ?? Promise.resolve()).then(() => panel.classList.add('beam'));
panel?.addEventListener('focusin', () => panel.classList.remove('beam'), { once: true });

/* ---------- the flows: node diagrams wired in code, one line down the section through all three ---------- */
// The wires are drawn with motion on or off; motion only plays each diagram in and runs the line as you scroll.
export type Box = { x: number; y: number; w: number; h: number };
export type Wire = { path: SVGPathElement; ends: SVGCircleElement[]; dot: SVGCircleElement };
// what pitch-motion.ts plays the flows with
export type Flows = {
  flows: HTMLElement[]; wires: Map<HTMLElement, Wire[]>; joins: Wire[];
  edges: (f: HTMLElement) => string[][]; node: (f: HTMLElement, n: string) => HTMLElement;
  boxIn: (el: HTMLElement, box: HTMLElement) => Box; draw: (w: Wire, t: number) => void; at: (w: Wire, t: number) => void;
  ghosts: () => void; // set by the motion: puts each node's skeleton where it will land, again on every resize
};
let kit: Flows | null = null;
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
  const k: Flows = { flows, wires, joins, edges, node, boxIn, draw, at, ghosts: () => {} };
  kit = k;
  layout();
  const ro = new ResizeObserver(() => { layout(); k.ghosts(); });
  for (const el of [flowsBox, ...flows]) ro.observe(el);
  phone.addEventListener('change', layout);

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
    if (state !== 'error') document.dispatchEvent(new Event('wren:sent')); // survey.ts: a form-moment survey may ask now
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

// the money lost on the pain screen underlines itself, one figure after another, when the reader reaches it
if (motion) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('drawn');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -25% 0px' });
  $$('.pain em').forEach((em, i) => { em.style.transitionDelay = `${i * 0.4}s`; io.observe(em); });
}

// read the spot a reload lands on now, before the motion arrives and anything moves
if (motion) void import('./pitch-motion').then((m) => m.play({ landY, flows: kit }));
