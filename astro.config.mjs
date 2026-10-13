import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://wrenautomation.com',
  output: 'static',
  trailingSlash: 'never',
  // .mdx blog posts: Markdown plus the components in src/components/blog
  integrations: [mdx()],
  // styles go inline in each page: no stylesheet request holds the first paint (each page's CSS is ~15 KB gzipped)
  build: { format: 'file', inlineStylesheets: 'always' },
  // pre-bundle gsap at startup; discovering it on first request leaves the dev page with a stale deps cache
  vite: { optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger'] } },
});
