// Writes dist/_routes.json after the build: which requests run Functions. Wrangler's own list would be `/*` once
// functions/_middleware.ts exists, and then every asset request would run (and count as) a Function. This keeps the
// list wrangler made before the middleware (each function's path), plus each page whose HTML carries `data-flag`:
// only those go through the middleware's variant pick (functions/_middleware.ts).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

// functions/api/hit.ts → /api/hit; functions/book/[offer].ts → /book/*; functions/go/[[path]].ts → /go/*
const fns = walk('functions')
  .map((f) => relative('functions', f).split(sep))
  .filter((parts) => parts.at(-1).endsWith('.ts') && !parts.some((p) => p.startsWith('_')))
  .map((parts) => {
    const segs = [...parts.slice(0, -1), parts.at(-1).replace(/\.ts$/, '')].filter((s) => s !== 'index');
    const wild = segs.findIndex((s) => s.startsWith('['));
    return '/' + (wild === -1 ? segs : [...segs.slice(0, wild), '*']).join('/');
  });

// The middleware leaves these paths alone by its own list; a new function directory must join it.
const own = readFileSync('functions/_middleware.ts', 'utf8').match(/FUNCTIONS = \/(.+)\/;/)?.[1];
const leftOut = fns.filter((f) => !new RegExp(own ?? '$^').test(f.replace(/\*$/, 'x')));
if (leftOut.length) throw new Error(`functions/_middleware.ts FUNCTIONS is missing ${leftOut.join(', ')}`);

// dist/agencies.html → /agencies; dist/index.html → / (build.format 'file', trailingSlash 'never')
const flagged = walk('dist')
  .filter((f) => f.endsWith('.html') && /\sdata-flag=/.test(readFileSync(f, 'utf8')))
  .map((f) => '/' + relative('dist', f).split(sep).join('/').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, ''))
  .map((p) => (p === '/' ? '/' : p.replace(/\/$/, '')));

const include = [...new Set([...fns, ...flagged])].sort();
if (include.length > 100) throw new Error(`_routes.json takes 100 rules; this build has ${include.length}`);
writeFileSync('dist/_routes.json', JSON.stringify({ version: 1, include, exclude: [] }, null, 2) + '\n');
console.log(`_routes.json: ${fns.length} function routes, ${flagged.length} flagged pages${flagged.length ? ` (${flagged.join(', ')})` : ''}`);
