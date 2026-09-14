import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://wrenautomation.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  // pre-bundle gsap at startup; discovering it on first request leaves the dev page with a stale deps cache
  vite: { optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger'] } },
});
