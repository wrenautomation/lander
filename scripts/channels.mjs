// npm run channels [-- --days 30] [--local]: how well each channel works, from D1. Every visitor is credited to their first
// touch (the first view that arrived from an email link, a /go or utm link, or another site; none = direct), then
// followed to the end: views, time on page, clicks to the form, form touched, applied, fit.
// Tables: by channel, by campaign, and each email link code (?r=) that was clicked; `wren email clicks` names them.
import { execFileSync } from 'node:child_process';

const i = process.argv.indexOf('--days');
const days = i > 0 ? Math.max(1, Number(process.argv[i + 1]) || 30) : 3650;
const where = process.argv.includes('--local') ? '--local' : '--remote';
const since = `date('now', '-${days} days')`;

const host = `substr(substr(ref, instr(ref, '//') + 2), 1, instr(substr(ref, instr(ref, '//') + 2) || '/', '/') - 1)`;
const base = `
with touch as (
  select visitor, id, r, utm_source, utm_medium, utm_campaign,
    case when r != '' then 'email link'
         when utm_source != '' then utm_source || ' / ' || coalesce(nullif(utm_medium, ''), '-')
         else 'ref ' || replace(${host}, 'www.', '') end channel
  from hits where visitor is not null and ts >= ${since} and (r != '' or utm_source != '' or ref != '')
),
first as (select * from touch t where id = (select min(id) from touch where visitor = t.visitor)),
seen as (select visitor, count(*) views, sum(secs) secs, max(cta) cta, max(touched) touched from hits
         where visitor is not null and ts >= ${since} group by visitor),
app as (select visitor, 1 applied, max(fit) fit from applications where visitor is not null group by visitor)`;
const totals = `count(*) visitors, sum(s.views) views, round(avg(s.secs)) avg_secs, sum(s.secs >= 30) read_30s,
  sum(s.cta) to_form, sum(s.touched) form_touched, sum(coalesce(a.applied, 0)) applied, sum(coalesce(a.fit, 0)) fit`;

const run = (sql) => {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'wren-leads', where, '--json', '--command', sql], { encoding: 'utf8' });
  return JSON.parse(out)[0].results;
};
const show = (title, rows) => { console.log(`\n${title}`); rows.length ? console.table(rows) : console.log('  (none yet)'); };

console.log(`Last ${days === 3650 ? 'all' : days} days. Visitors counted from 2026-09-29, when the visitor cookie started.`);
show('By channel (first touch)', run(`${base}
  select coalesce(f.channel, 'direct') channel, ${totals}
  from seen s left join first f using (visitor) left join app a using (visitor) group by 1 order by visitors desc`));
show('By campaign (first touch, utm and /go links)', run(`${base}
  select f.utm_source source, f.utm_medium medium, coalesce(nullif(f.utm_campaign, ''), '-') campaign, ${totals}
  from seen s join first f using (visitor) left join app a using (visitor) where f.utm_source != ''
  group by 1, 2, 3 order by visitors desc`));
show('Email link clicks (?r=, name them with: wren email clicks)', run(`
  select h.r, min(h.ts) first_click, count(distinct h.visitor) visitors,
    (select count(*) from hits x where x.visitor in (select visitor from hits where r = h.r)) views,
    (select max(fit) from applications p where p.visitor in (select visitor from hits where r = h.r)) applied_fit
  from hits h where h.r != '' and h.ts >= ${since} group by h.r order by first_click desc limit 100`));
