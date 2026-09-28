// Lists the pitch pages' image slots that have no picture yet: where the file goes, its shape, and the prompt that
// makes it. Generate each one (Higgsfield), save it at the path shown, rebuild. `npm run images -- --all` lists every slot.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'yaml';

const DIR = 'src/content/pitches', IMG = 'src/assets/img';
const all = process.argv.includes('--all');
const slots = [];
const walk = (v, page, face) => {
  if (Array.isArray(v)) return v.forEach((x) => walk(x, page));
  if (!v || typeof v !== 'object') return;
  if (typeof v.file === 'string' && typeof v.prompt === 'string') slots.push({ page, face, ...v });
  for (const [k, x] of Object.entries(v)) walk(x, page, k === 'face');
};
for (const f of readdirSync(DIR).filter((f) => f.endsWith('.yaml'))) walk(parse(readFileSync(`${DIR}/${f}`, 'utf8')), f);

const todo = slots.filter((s) => all || !existsSync(`${IMG}/${s.file}`));
for (const s of todo) {
  const done = existsSync(`${IMG}/${s.file}`) ? ' (done)' : '';
  console.log(`${IMG}/${s.file}${done}\n  ${s.face ? '1:1, square' : s.ratio ?? '4/3'} · ${s.page}\n  ${s.prompt}\n`);
}
console.log(`${todo.length} of ${slots.length} slots ${all ? 'listed' : 'still need a picture'}.`);
