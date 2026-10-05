import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://wrenautomation.com',
  output: 'static',
  trailingSlash: 'never',
  // styles go inline in each page: no stylesheet request holds the first paint (each page's CSS is ~15 KB gzipped)
  build: { format: 'file', inlineStylesheets: 'always' },
  // pre-bundle gsap at startup; discovering it on first request leaves the dev page with a stale deps cache
  vite: { optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger'] } },
});
