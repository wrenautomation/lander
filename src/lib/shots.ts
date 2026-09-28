import type { ImageMetadata } from 'astro';

// Generated pictures live at src/assets/img/<file> (the yaml's `file`); Astro resizes and compresses them at build.
// A slot whose file isn't there yet draws a tile (a face: initials). `npm run images` lists what's missing.
const all = import.meta.glob<{ default: ImageMetadata }>('/src/assets/img/**/*.{jpg,jpeg,png,webp,avif}', { eager: true });
export const shotSrc = (file: string) => all[`/src/assets/img/${file}`]?.default ?? null;
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
