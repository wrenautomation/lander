// Quiet notes under the motion, one voice for the whole page. Each animation's beats play notes from one
// pentatonic scale (C major), so anything that overlaps still agrees:
//   step: a part lands. A scene's steps climb the scale in story order (the caller says which step).
//   done: the scene's result shows. A soft two-note resolve to the top.
//   miss: something fails in the story. Two low notes falling.
// Beats never stack: notes closer than GAP merge into the first, and a done keeps steps quiet for a moment after.
// One scene speaks at a time: while one is mid-phrase, another scene's notes are dropped, so two phrases never mix.
// Nothing plays while a diagram catches up at 2x, or for a part that isn't on screen.
// Made in the browser (Web Audio), no files. Off until the visitor turns it on with the speaker button
// (src/components/Sound.astro); the choice and the volume are kept in localStorage. Silent without motion.
type Cue = 'step' | 'done' | 'miss';

const KEY = 'wren-sound';
let on = false, volume = 0.5, ctx: AudioContext | null = null, out: GainNode | null = null;
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { on = !!s.on; volume = Math.min(1, Math.max(0, Number(s.volume) || 0)); } } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ on, volume })); } catch {} };

// the slider is linear to the ear: gain grows with the square, and full volume is still quiet
const level = () => volume * volume * 0.5;

const audio = () => {
  if (!ctx) {
    const A = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return null;
    try { (navigator as Navigator & { audioSession?: { type: string } }).audioSession!.type = 'playback'; } catch {}
    ctx = new A();
    // a soft lowpass takes the edge off every note
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 2200; soft.Q.value = 0.5;
    out = ctx.createGain();
    out.connect(soft).connect(ctx.destination);
  }
  out!.gain.value = level();
  return ctx;
};

// inside a tap: start (or restart) the audio, with a silent buffer for older iOS
const wake = (): Promise<void> => {
  if (!on) return Promise.resolve();
  const a = audio();
  if (!a || a.state === 'running') return Promise.resolve();
  const b = a.createBufferSource(); b.buffer = a.createBuffer(1, 1, 22050); b.connect(a.destination); b.start(0);
  return a.resume().catch(() => {});
};
for (const e of ['pointerdown', 'touchend', 'keydown'] as const) addEventListener(e, wake, { capture: true, passive: true });
document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx?.state !== 'running') ctx?.resume().catch(() => {}); });

// one note: a sine that swells in (no click) and dies away, with a faint octave above for a bell-like body
const note = (a: AudioContext, freq: number, at: number, len: number, peak: number) => {
  const t = a.currentTime + at, g = a.createGain();
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  g.connect(out!);
  for (const [f, k] of [[freq, 1], [freq * 2, 0.06]] as const) {
    const o = a.createOscillator(), v = a.createGain();
    o.frequency.value = f; v.gain.value = k;
    o.connect(v).connect(g); o.start(t); o.stop(t + len + 0.05);
  }
};

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5]; // C5 D5 E5 G5 A5 C6
const VOICES: Record<Cue, (a: AudioContext, step: number) => void> = {
  step: (a, k) => note(a, SCALE[Math.min(k, SCALE.length - 1)]!, 0, 0.55, 0.07),
  done: (a) => { note(a, 783.99, 0, 0.9, 0.06); note(a, 1046.5, 0.1, 1.2, 0.06); },
  miss: (a) => { note(a, 440, 0, 0.5, 0.06); note(a, 329.63, 0.14, 0.7, 0.05); },
};

const GAP = 200, HUSH = 450, HOLD = 900; // ms: the least time between notes; how long a done keeps steps quiet; how long a scene keeps the floor
let last = 0, hush = 0, owner: object | null = null;
const inView = (el: Element) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };

/**
 * Plays a beat if sound is on. `step` is which step of its scene this is (0 first), `scene` what the beat belongs to
 * (its timeline), `el` the part on screen, `fast` true while the animation catches up. A step within GAP of the last
 * note or just after a done is dropped, and so is any beat from another scene within HOLD of the last one.
 */
export function sfx(cue: Cue, o: { step?: number; scene?: object; el?: Element | null; fast?: boolean } = {}) {
  if (!on || volume === 0 || document.hidden || !ctx || ctx.state !== 'running' || o.fast) return;
  if (o.el && !inView(o.el)) return;
  const now = performance.now();
  if (now - last < (cue === 'step' ? GAP : GAP / 2) || (cue === 'step' && now < hush)) return;
  if (o.scene && owner && o.scene !== owner && now - last < HOLD) return;
  last = now; owner = o.scene ?? null;
  if (cue === 'done') hush = now + HUSH;
  VOICES[cue](ctx, o.step ?? 0);
}

// the speaker button and the volume slider, wherever Sound.astro put them
for (const box of document.querySelectorAll<HTMLElement>('[data-sound]')) {
  const btn = box.querySelector<HTMLButtonElement>('button')!, range = box.querySelector<HTMLInputElement>('input')!;
  const show = () => {
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Sound on. Turn off' : 'Sound off. Turn on');
    box.classList.toggle('on', on);
    range.value = String(Math.round(volume * 100));
    range.setAttribute('aria-valuetext', `${range.value}%`);
  };
  btn.addEventListener('click', () => {
    on = !on; if (on && volume === 0) volume = 0.5;
    save(); show();
    if (on) wake().then(() => sfx('done'));
  });
  range.addEventListener('input', () => { volume = Number(range.value) / 100; on = volume > 0; save(); show(); if (out) out.gain.value = level(); });
  range.addEventListener('change', () => wake().then(() => sfx('step', { step: 2 })));
  box.hidden = false;
  show();
}
