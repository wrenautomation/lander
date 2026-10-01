// Soft sounds under the motion: a pop as a diagram's part lands, a chime when its result shows, a tick per check.
// Made in the browser (Web Audio), no files. Off until the visitor turns it on with the speaker button
// (src/components/Sound.astro); the choice and the volume are kept in localStorage. Silent without motion.
type Sfx = 'pop' | 'chime' | 'tick' | 'thud';

const KEY = 'wren-sound';
let on = false, volume = 0.5, ctx: AudioContext | null = null, out: GainNode | null = null, last = 0;
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { on = !!s.on; volume = Math.min(1, Math.max(0, Number(s.volume) || 0)); } } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ on, volume })); } catch {} };

const audio = () => {
  if (!ctx) {
    const A = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return null;
    ctx = new A(); out = ctx.createGain(); out.connect(ctx.destination);
  }
  out!.gain.value = volume * 0.35; // full volume is still quiet
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
};

// one note: a sine with a fast attack and a soft tail
const note = (a: AudioContext, freq: number, at: number, len: number, peak: number, type: OscillatorType = 'sine') => {
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out!); o.start(t); o.stop(t + len + 0.02);
  return o;
};

const VOICES: Record<Sfx, (a: AudioContext) => void> = {
  pop: (a) => { const o = note(a, 520, 0, 0.12, 0.5); o.frequency.exponentialRampToValueAtTime(780, a.currentTime + 0.06); },
  tick: (a) => { note(a, 1320, 0, 0.05, 0.25, 'triangle'); },
  chime: (a) => { note(a, 784, 0, 0.5, 0.35); note(a, 1175, 0.09, 0.6, 0.3); },
  thud: (a) => { const o = note(a, 160, 0, 0.25, 0.6, 'triangle'); o.frequency.exponentialRampToValueAtTime(70, a.currentTime + 0.22); },
};

/** Plays a sound if sound is on and the tab is in view. Sounds closer than 50ms merge into one. */
export function sfx(name: Sfx) {
  if (!on || volume === 0 || document.hidden) return;
  const now = performance.now();
  if (now - last < 50) return;
  last = now;
  const a = audio();
  if (a) VOICES[name](a);
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
  btn.addEventListener('click', () => { on = !on; if (on && volume === 0) volume = 0.5; save(); show(); if (on) { audio(); sfx('chime'); } });
  range.addEventListener('input', () => { volume = Number(range.value) / 100; on = volume > 0; save(); show(); if (out) out.gain.value = volume * 0.35; });
  range.addEventListener('change', () => sfx('tick'));
  box.hidden = false;
  show();
}
