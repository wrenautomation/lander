// A live site survey (functions/api/hit.ts says which are due): one question in a card at the bottom, at its moment.
// view: on the page after its delay; exit: the pointer leaves the top of the window; form: a lead form was sent;
// book: a "Book a call" click; booked: the booking page confirmed (schedule.ts tells the page it's embedded in).
// "Sent" is the form's own script saying so (`wren:sent`), not a bare submit: the pitch form submits per step.
// At most one card a visit, each survey once on this browser (the server keeps the first answer too), and never on
// a page with a lead form until that form is sent. The answer goes to /api/answer.

type Due = { key: string; question: string; kind: 'choice' | 'scale' | 'text'; choices: string[]; trigger: { on: string; after?: number } };
type Track = (name: string, props?: Record<string, unknown>) => void;

const SEEN = 'wren-surveys', VISIT = 'wren-survey-visit';
const seen = (): string[] => { try { return JSON.parse(localStorage.getItem(SEEN) || '[]'); } catch { return []; } };
const keep = (key: string) => { try { localStorage.setItem(SEEN, JSON.stringify([...seen(), key].slice(-50))); } catch {} };
const visited = () => { try { return sessionStorage.getItem(VISIT) === '1'; } catch { return false; } };

const CSS = `
.survey{position:fixed;z-index:60;left:16px;right:16px;bottom:16px;max-width:420px;margin:0 0 0 auto;padding:16px 18px;background:#0E0E0E;color:#FAF7F2;font:14px/1.5 Inter,system-ui,sans-serif;border:1px solid #2d2823;border-radius:2px;transition:opacity .24s ease,transform .24s ease}
.survey[data-in]{opacity:0;transform:translateY(8px)}
.survey p{margin:0 28px 12px 0;font-weight:600}
.survey .close{position:absolute;top:8px;right:8px;width:32px;height:32px;padding:0;background:none;border:0;color:#FAF7F2;font-size:20px;line-height:1;cursor:pointer;opacity:.7}
.survey .row{display:flex;flex-wrap:wrap;gap:8px}
.survey .scale{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}
.survey .ends{display:flex;justify-content:space-between;margin-top:6px;font-size:12px;opacity:.7}
.survey button.pick,.survey form button{min-height:40px;padding:0 14px;font:600 14px/1 Inter,system-ui,sans-serif;border-radius:2px;cursor:pointer;border:1px solid #FAF7F2;background:transparent;color:#FAF7F2}
.survey .scale button.pick{padding:0}
.survey button.pick:hover,.survey form button{background:#FAF7F2;color:#0E0E0E}
.survey form{display:flex;gap:8px}
.survey input{flex:1;min-width:0;min-height:40px;padding:0 10px;font:inherit;color:#FAF7F2;background:transparent;border:1px solid #6b635b;border-radius:2px}
.survey button:focus-visible,.survey input:focus-visible{outline:2px solid #FAF7F2;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.survey{transition:none}}
`;

export function surveys(due: Due[], view: string, track: Track) {
  if (visited()) return;
  const done = new Set(seen());
  const left = due.filter((s) => !done.has(s.key));
  if (!left.length) return;
  const gated = !!document.querySelector('form[data-lead]');
  let sent = false, up = false;

  const show = (s: Due) => {
    if (up || visited() || (gated && !sent)) return;
    up = true;
    try { sessionStorage.setItem(VISIT, '1'); } catch {}
    keep(s.key);
    track('survey.shown', { survey: s.key });
    if (!document.getElementById('survey-css')) {
      const st = document.createElement('style'); st.id = 'survey-css'; st.textContent = CSS; document.head.append(st);
    }
    const card = document.createElement('section');
    card.className = 'survey'; card.setAttribute('role', 'region'); card.setAttribute('aria-label', 'A question'); card.dataset.in = '';
    const q = document.createElement('p'); q.textContent = s.question;
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'close'; close.setAttribute('aria-label', 'Not now'); close.textContent = '×';
    const gone = () => { card.dataset.in = ''; setTimeout(() => card.remove(), 240); };
    close.onclick = gone;
    const answer = (value: string) => {
      fetch('/api/answer', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ survey: s.key, value, view, page: location.pathname }) }).catch(() => {});
      track('survey.answered', { survey: s.key });
      card.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'Thanks. I read every answer.' }));
      setTimeout(gone, 1800);
    };
    const pick = (label: string) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pick'; b.textContent = label;
      b.onclick = () => answer(label);
      return b;
    };
    let body: HTMLElement;
    if (s.kind === 'choice') {
      body = document.createElement('div'); body.className = 'row';
      body.append(...s.choices.map(pick));
    } else if (s.kind === 'scale') {
      body = document.createElement('div');
      const grid = document.createElement('div'); grid.className = 'scale';
      grid.append(...Array.from({ length: 10 }, (_, i) => pick(String(i + 1))));
      const ends = document.createElement('div'); ends.className = 'ends';
      ends.append(Object.assign(document.createElement('span'), { textContent: 'Low' }), Object.assign(document.createElement('span'), { textContent: 'High' }));
      body.append(grid, ends);
    } else {
      const f = document.createElement('form');
      const input = Object.assign(document.createElement('input'), { maxLength: 500, required: true });
      input.setAttribute('aria-label', 'Your answer');
      const go = Object.assign(document.createElement('button'), { type: 'submit', textContent: 'Send' });
      f.append(input, go);
      f.onsubmit = (e) => { e.preventDefault(); const v = input.value.trim(); if (v) answer(v); };
      body = f;
    }
    card.append(q, close, body);
    document.body.append(card);
    requestAnimationFrame(() => requestAnimationFrame(() => { delete card.dataset.in; }));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && card.isConnected) gone(); });
  };

  const after = (s: Due) => setTimeout(() => show(s), (s.trigger.after ?? 0) * 1000);
  const forms: Due[] = [];
  // motion.ts and pitch.ts say a lead form went through
  document.addEventListener('wren:sent', () => {
    sent = true;
    for (const s of forms) setTimeout(() => show(s), Math.max(2, s.trigger.after ?? 0) * 1000);
  });
  for (const s of left) {
    const on = s.trigger.on;
    if (on === 'view') after(s);
    else if (on === 'exit') document.addEventListener('mouseout', (e) => { if (!e.relatedTarget && e.clientY <= 0) show(s); });
    else if (on === 'book') document.addEventListener('click', (e) => { if (e.target instanceof Element && e.target.closest('a[data-book]')) show(s); }, true);
    else if (on === 'booked') {
      document.addEventListener('wren:booked', () => after(s));
      addEventListener('message', (e) => { if (e.origin === location.origin && e.data?.wren === 'booked') after(s); });
    } else if (on === 'form') forms.push(s);
  }
}
