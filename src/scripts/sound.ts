// Soft sounds under the motion: a pop as a diagram's part lands, a chime when its result shows, a tick per check.
// Made in the browser (Web Audio), no files. Off until the visitor turns it on with the speaker button
// (src/components/Sound.astro); the choice and the volume are kept in localStorage. Silent without motion.
//
// Phones: browsers only start audio inside a tap, so the first tap anywhere (or the button itself) starts it, and
// it restarts after the tab comes back. iPhones mute Web Audio on the silent switch unless the page says it plays
// media (navigator.audioSession), and a silent buffer played inside the tap wakes older iOS.
type Sfx = 'pop' | 'chime' | 'tick' | 'thud';

const KEY = 'wren-sound';
let on = false, volume = 0.5, ctx: AudioContext | null = null, out: GainNode | null = null, last = 0;
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) { on = !!s.on; volume = Math.min(1, Math.max(0, Number(s.volume) || 0)); } } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ on, volume })); } catch {} };

// the slider is linear to the ear: gain grows with the square, and full volume is still quiet
const level = () => volume * volume * 0.6;

const audio = () => {
  if (!ctx) {
    const A = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return null;
    try { (navigator as Navigator & { audioSession?: { type: string } }).audioSession!.type = 'playback'; } catch {}
    ctx = new A();
    // every voice goes through a soft lowpass and a gentle limiter, so nothing is sharp or sudden
    const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 2800; soft.Q.value = 0.5;
    const limit = ctx.createDynamicsCompressor(); limit.threshold.value = -18; limit.ratio.value = 4;
    out = ctx.createGain();
    out.connect(soft).connect(limit).connect(ctx.destination);
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

// one note: a sine that swells in over a few ms (no click) and fades on a long soft tail; a hair of random
// detune so a run of the same sound doesn't drill
const note = (a: AudioContext, freq: number, at: number, len: number, peak: number, type: OscillatorType = 'sine') => {
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = (Math.random() - 0.5) * 24;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(out!); o.start(t); o.stop(t + len + 0.05);
  return o;
};

// notes from one pentatonic scale (C major), so any two sounds that overlap still agree
const VOICES: Record<Sfx, (a: AudioContext) => void> = {
  pop: (a) => { const o = note(a, 523, 0, 0.14, 0.22); o.frequency.exponentialRampToValueAtTime(659, a.currentTime + 0.07); },
  tick: (a) => { note(a, 1047, 0, 0.06, 0.1); },
  chime: (a) => { note(a, 659, 0, 0.9, 0.16); note(a, 1319, 0, 0.5, 0.03); note(a, 784, 0.11, 1.1, 0.14); },
  thud: (a) => { const o = note(a, 147, 0, 0.28, 0.32); o.frequency.exponentialRampToValueAtTime(87, a.currentTime + 0.24); },
};

/** Plays a sound if sound is on and the tab is in view. Sounds closer than 60ms merge into one. */
export function sfx(name: Sfx) {
  if (!on || volume === 0 || document.hidden || !ctx || ctx.state !== 'running') return;
  const now = performance.now();
  if (now - last < 60) return;
  last = now;
  VOICES[name](ctx);
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
    if (on) wake().then(() => sfx('chime'));
  });
  range.addEventListener('input', () => { volume = Number(range.value) / 100; on = volume > 0; save(); show(); if (out) out.gain.value = level(); });
  range.addEventListener('change', () => wake().then(() => sfx('tick')));
  box.hidden = false;
  show();
}
