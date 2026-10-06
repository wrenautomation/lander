// The booking page (src/pages/schedule.astro). At /book/<offer>: open times on the visitor's clock, then name and
// email, then the confirmation. At /booking/<token>: the booked call, with a new time or a cancel. Every call goes
// to the lander's own API (functions/api/{slots,book,booking}.ts), which signs and forwards it to wren.
// ?embed=1 is the pitch page's fit block: no header, and the frame's height goes to the parent.

type Offers = Record<string, { name: string; page: string | null }>;
type View = { start: string; end: string; zone: string; title: string; offer: string | null; meetUrl: string | null; state: 'booked' | 'cancelled'; open: boolean };
type Turnstile = { reset: (el?: Element) => void };
declare global { interface Window { turnstile?: Turnstile } }

const main = document.querySelector<HTMLElement>('main.book')!;
const $ = <T extends HTMLElement = HTMLElement>(s: string) => main.querySelector<T>(s)!;
const OFFERS = JSON.parse(main.dataset.offers || '{}') as Offers;
const MAIL = main.dataset.email || '';
const q = new URLSearchParams(location.search);
const [, kind, key = ''] = location.pathname.split('/');
const embed = q.has('embed');
if (embed) document.documentElement.classList.add('embed');

let zone = 'America/Toronto';
try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || zone; } catch {}

const on = (el: HTMLElement, shown: boolean) => { el.hidden = !shown; };
const fmt = (iso: string, o: Intl.DateTimeFormatOptions, z = zone) => new Intl.DateTimeFormat('en-US', { timeZone: z, ...o }).format(new Date(iso));
const longWhen = (iso: string) => fmt(iso, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
const dayOf = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

const error = $('[data-error]');
function say(text: string | null) {
  error.textContent = text ?? '';
  on(error, !!text);
}
const SAID: Record<string, string> = {
  taken: 'Someone just took that time. Pick another.',
  turnstile: "The bot check didn't pass. Try again.",
  email: "That email address doesn't look right.",
  name: 'Add your name.',
  link: "This link doesn't work. Open the newest email about your call and use the link in it.",
};
const down = () => `Something broke on my end. Try again in a minute, or email me at ${MAIL}.`;

async function post<T>(url: string, body: BodyInit, json = false): Promise<{ status: number; j: T & { ok: boolean; error?: string } }> {
  try {
    const r = await fetch(url, { method: 'POST', body, headers: json ? { 'content-type': 'application/json' } : { accept: 'application/json' } });
    return { status: r.status, j: await r.json() };
  } catch {
    return { status: 0, j: { ok: false, error: 'down' } as T & { ok: boolean; error?: string } };
  }
}

// --- the picker: days across the top, that day's times under them, all on `zone`'s clock

const pick = $('[data-pick]');
const zoneSelect = $<HTMLSelectElement>('[data-zone]');
const days = $('[data-days]');
const times = $('[data-times]');
let slots: string[] = [];
let day = '';
let picked: (iso: string) => void = () => {};

function zones() {
  let all: string[] = [];
  try { all = (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'); } catch {}
  if (!all.includes(zone)) all.unshift(zone);
  zoneSelect.innerHTML = '';
  for (const z of all) zoneSelect.add(new Option(z.replace(/_/g, ' '), z, false, z === zone));
}
zoneSelect.addEventListener('change', () => { zone = zoneSelect.value; day = ''; draw(); });

function draw() {
  const byDay = new Map<string, string[]>();
  for (const s of slots) { const d = dayOf(s); byDay.set(d, [...(byDay.get(d) ?? []), s]); }
  on($('[data-none]'), byDay.size === 0);
  if (!byDay.has(day)) day = byDay.keys().next().value ?? '';
  days.innerHTML = '';
  for (const [d, list] of byDay) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(d === day));
    const first = list[0]!;
    b.innerHTML = `<span>${fmt(first, { weekday: 'short' })}</span><b>${fmt(first, { day: 'numeric' })}</b><span>${fmt(first, { month: 'short' })}</span>`;
    b.addEventListener('click', () => { day = d; draw(); });
    days.append(b);
  }
  times.innerHTML = '';
  for (const s of byDay.get(day) ?? []) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'time'; b.textContent = fmt(s, { hour: 'numeric', minute: '2-digit' });
    b.addEventListener('click', () => picked(s));
    times.append(b);
  }
  days.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

async function loadSlots(): Promise<boolean> {
  const r = await fetch('/api/slots').then((x) => (x.ok ? x.json() : null)).catch(() => null) as { length: number; slots: string[] } | null;
  if (!r) { say(down()); return false; }
  slots = r.slots;
  $('[data-length]').textContent = `A ${r.length}-minute call with me on Google Meet.`;
  draw();
  return true;
}

// --- the form: name and email for a booking; for a move, only the button

const form = $<HTMLFormElement>('[data-form]');
const submit = $<HTMLButtonElement>('[data-submit]');
let start = '';
$('[data-back]').addEventListener('click', () => { on(form, false); on(pick, true); say(null); });

function choose(iso: string) {
  start = iso;
  $('[data-when]').textContent = longWhen(iso);
  on(pick, false); on(form, true); say(null);
  form.querySelector<HTMLInputElement>('input[name=name]:not([hidden])')?.focus();
}

async function busy<T>(run: () => Promise<T>): Promise<T> {
  const label = submit.querySelector('span')!, was = label.textContent;
  submit.disabled = true; label.textContent = 'One moment';
  try { return await run(); } finally { submit.disabled = false; label.textContent = was; }
}

// --- /book/<offer>

function touch(): Record<string, string> {
  let t: Record<string, string> = {};
  try { t = JSON.parse(sessionStorage.getItem('wren-touch') || 'null') || {}; } catch {}
  const out: Record<string, string> = {};
  for (const k of ['r', 'application', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref']) {
    const v = q.get(k) || t[k];
    if (v) out[k] = v;
  }
  return out;
}

async function book(offer: string) {
  const o = OFFERS[offer];
  if (o) $('[data-offer]').textContent = o.name;
  // The pitch's fit block says who they are in the fragment.
  const who = new URLSearchParams(location.hash.slice(1));
  for (const k of ['name', 'email']) {
    const v = who.get(k);
    if (v) (form.elements.namedItem(k) as HTMLInputElement).value = v.slice(0, 200);
  }
  if (location.hash) history.replaceState(history.state, '', location.pathname + location.search);
  picked = choose;
  on(pick, true);
  zones();
  await loadSlots();
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    if (!name) return say(SAID.name!);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say(SAID.email!);
    const body = new FormData(form);
    for (const [k, v] of Object.entries({ offer, start, zone, page: `/book/${offer}`, ...touch() })) body.set(k, v);
    const { j } = await busy(() => post<{ booking: View; manage: string }>('/api/book', body));
    if (j.ok) return done(j.booking, j.manage);
    window.turnstile?.reset();
    say(SAID[j.error ?? ''] ?? down());
    if (j.error === 'taken') { on(form, false); on(pick, true); await loadSlots(); say(SAID.taken!); }
  });
}

function done(b: View, manage: string) {
  on(form, false); on(pick, false);
  $('[data-done-when]').textContent = longWhen(b.start);
  const a = $<HTMLAnchorElement>('[data-manage]');
  a.href = manage;
  if (embed) a.target = '_top';
  const box = $('[data-done]');
  on(box, true); box.focus();
}

// --- /booking/<token>

async function manage(token: string) {
  for (const el of form.querySelectorAll<HTMLElement>('.fields, .hp, .cf-turnstile')) el.hidden = true;
  submit.querySelector('span')!.textContent = 'Move the call';
  const call = async (what: string, extra: Record<string, string> = {}) =>
    post<{ booking: View }>('/api/booking', JSON.stringify({ token, do: what, ...extra }), true);
  const got = await call('get');
  if (!got.j.ok) return say(SAID[got.j.error ?? ''] ?? down());
  let b = got.j.booking;
  const show = () => {
    on(pick, false); on(form, false); on($('[data-cancel-box]'), false);
    $('[data-call-state]').textContent = b.state === 'cancelled' ? 'Cancelled' : b.open ? 'Your call' : 'Past call';
    $('[data-call-h]').textContent = b.title;
    $('[data-call-when]').textContent = longWhen(b.start);
    const meet = $<HTMLAnchorElement>('[data-meet]');
    if (b.meetUrl) meet.href = b.meetUrl;
    on($('[data-call-join]'), b.open && !!b.meetUrl);
    on($('[data-call-acts]'), b.open);
    const again = !b.open && b.offer && OFFERS[b.offer];
    if (again) $<HTMLAnchorElement>('[data-rebook-a]').href = `/book/${b.offer}`;
    on($('[data-rebook]'), !!again);
    on($('[data-call]'), true);
  };
  show();
  $('[data-move]').addEventListener('click', async () => {
    on($('[data-call]'), false); say(null);
    $('[data-pick-h]').textContent = 'Pick a new time';
    zones();
    on(pick, true);
    await loadSlots();
  });
  picked = choose;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { j } = await busy(() => call('move', { start }));
    if (j.ok) { b = j.booking; say(null); return show(); }
    say(SAID[j.error ?? ''] ?? down());
    if (j.error === 'taken') { on(form, false); on(pick, true); await loadSlots(); say(SAID.taken!); }
  });
  $('[data-cancel]').addEventListener('click', () => { on($('[data-call-acts]'), false); on($('[data-cancel-box]'), true); $('[data-reason]').focus(); });
  $('[data-cancel-keep]').addEventListener('click', show);
  $('[data-cancel-go]').addEventListener('click', async () => {
    const reason = $<HTMLTextAreaElement>('[data-reason]').value.trim();
    const { j } = await call('cancel', reason ? { reason } : {});
    if (!j.ok) return say(SAID[j.error ?? ''] ?? down());
    b = j.booking; say(null); show();
  });
}

for (const a of main.querySelectorAll<HTMLAnchorElement>('[data-mail]')) { a.href = `mailto:${MAIL}`; a.textContent = MAIL; }
if (kind === 'booking') void manage(key);
else void book(key);

// The pitch page sizes its frame to the page.
if (embed && window.parent !== window) {
  const tell = () => window.parent.postMessage({ wrenBook: Math.ceil(document.documentElement.scrollHeight) }, location.origin);
  new ResizeObserver(tell).observe(document.body);
}

export {};
