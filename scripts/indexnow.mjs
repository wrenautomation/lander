// IndexNow: tells Bing (which feeds ChatGPT search and Copilot), Yandex and the other IndexNow engines which pages
// changed, minutes after a deploy instead of whenever they next crawl. CI runs it on both sides of the deploy:
//   node scripts/indexnow.mjs changed   before: sitemap pages whose words differ from the live site, into .indexnow
//   node scripts/indexnow.mjs ping      after: submits them (--all submits every sitemap page, for a first run by hand)
// Only changed pages go out: the engines ask for that, and a page resubmitted on every push gets ignored.
// The key is public by design; public/<key>.txt proves the site is ours. Never fails the deploy.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const LIST = '.indexnow';
const key = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.slice(0, 32);
const sitemap = () => [...readFileSync('dist/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const built = (url) => {
  const path = new URL(url).pathname;
  return `dist${path === '/' ? '/index' : path}.html`; // build.format 'file'
};

// What a reader sees: title, description and body text. Asset hashes and scripts change on every build; words don't.
// Cloudflare hides email addresses on the live page ([email protected]), so an address counts as the same word either way.
const words = (html) => {
  const meta = [...html.matchAll(/<meta name="description" content="([^"]*)"/gi)].map((m) => m[1]).join(' ');
  const text = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  return `${meta} ${text}`
    .replace(/\[email(?:&#160;|&nbsp;|\s)protected\]|[\w.+-]+@[\w-]+\.[\w.-]+/g, 'EMAIL')
    .replace(/\s+/g, ' ')
    .replace(/ ([,.;:!?)])/g, '$1') // its wrapper tag also leaves a space before the next comma
    .trim();
};

async function changed() {
  const out = [];
  for (const url of sitemap()) {
    if (!existsSync(built(url))) continue;
    const live = await fetch(url, { signal: AbortSignal.timeout(10_000) }).then((r) => (r.ok ? r.text() : ''), () => '');
    if (words(live) !== words(readFileSync(built(url), 'utf8'))) out.push(url);
  }
  writeFileSync(LIST, out.join('\n'));
  console.log(out.length ? `changed:\n${out.join('\n')}` : 'no page changed');
}

async function ping(all) {
  const urls = all ? sitemap() : existsSync(LIST) ? readFileSync(LIST, 'utf8').split('\n').filter(Boolean) : [];
  if (!key) return console.log('no key file in public/');
  if (!urls.length) return console.log('nothing to submit');
  const host = new URL(urls[0]).host;
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(15_000),
  });
  console.log(`IndexNow ${r.status} for ${urls.length} page(s): ${urls.join(' ')}`);
}

const [cmd] = process.argv.slice(2);
try {
  if (cmd === 'changed') await changed();
  else if (cmd === 'ping') await ping(process.argv.includes('--all'));
  else console.log('usage: node scripts/indexnow.mjs changed | ping [--all]');
} catch (e) {
  console.log(`IndexNow skipped: ${e.message}`);
}
