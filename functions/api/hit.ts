// POST /api/hit. One row per page view from src/scripts/hit.ts, keyed by the view id the page made. The page posts
// once on arrival (so a bounce still counts) and again when hidden, with how far they read; the second post raises
// the first row's numbers, never lowers them. Each row carries the visitor cookie's id (functions/_shared/visitor.ts),
// or none without consent. The answer says the consent state, so the page knows to show the cookie banner, and
// whether to record this view (src/scripts/replay.ts): only with a yes, the replay keys set, and in REPLAY_SAMPLE.
// On arrival (?due=1) it also says which live site surveys this visitor is due (src/scripts/survey.ts): only with a
// yes, since an answer is kept against the visitor; for this page; in the audience; not answered yet.
import { type EdgeSurvey, edgeConfig, variantOf } from '../_shared/edge';
import { type Env, replayOn } from '../_shared/env';
import { visitorOf, withVisitor } from '../_shared/visitor';

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
const i = (v: unknown, max: number) => Math.min(max, Math.max(0, Math.round(Number(v) || 0)));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  const view = s(b.view, 40);
  if (!/^[A-Za-z0-9-]{8,40}$/.test(view)) return new Response(null, { status: 400 });
  const visitor = visitorOf(request);
  // A second post for the same view from another visitor changes nothing: views are not shared.
  await env.DB.prepare(
    `insert into hits (view, visitor, ts, page, niche, depth, secs, cta, touched, w, r, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ua)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     on conflict (view) do update set depth = max(depth, excluded.depth), secs = max(secs, excluded.secs),
       cta = max(cta, excluded.cta), touched = max(touched, excluded.touched)
     where hits.visitor is excluded.visitor`,
  ).bind(
    view, visitor.id, new Date().toISOString(), s(b.page, 200), s(b.niche, 40), i(b.depth, 100), i(b.secs, 86400), i(b.cta, 1), i(b.touched, 1), i(b.w, 10000),
    s(b.r, 40), s(b.utm_source, 100), s(b.utm_medium, 100), s(b.utm_campaign, 100), s(b.utm_content, 100), s(b.ref, 200),
    request.headers.get('cf-ipcountry') || '', s(request.headers.get('user-agent'), 300),
  ).run();
  // an empty REPLAY_SAMPLE reads as unset (1), "0" turns recording off
  const replay = visitor.consent === 'yes' && replayOn(env) && Math.random() < Number(env.REPLAY_SAMPLE || 1);
  const due = visitor.id && new URL(request.url).searchParams.has('due') ? await surveysDue(env, visitor.id, s(b.page, 200)) : [];
  return withVisitor(Response.json(due.length ? { consent: visitor.consent, replay, surveys: due } : { consent: visitor.consent, replay }), visitor);
};

const SEARCH = new Set(['google', 'bing', 'duckduckgo', 'yahoo', 'ecosia', 'brave']);
type First = { r: string; utm_source: string; utm_medium: string; ref: string };
/** A first touch's channel, as wren's touchChannel (packages/core/src/clients/touch.ts) names it. */
function channelOf(t: First | null): string {
  if (!t) return 'direct';
  const source = t.utm_source.trim().toLowerCase(), medium = t.utm_medium.trim().toLowerCase();
  let host: string[] = [];
  try { host = new URL(t.ref).hostname.split('.'); } catch {}
  if (t.r) return 'email';
  if (source === 'sms') return 'sms';
  if (medium === 'paid' || medium === 'cpc') return 'ads';
  if (SEARCH.has(source) || host.some((w) => SEARCH.has(w))) return 'search';
  if (medium === 'outreach') return 'email';
  if (medium === 'organic' || medium === 'social') return 'content';
  return 'other';
}

async function surveysDue(env: Env, visitor: string, page: string): Promise<Omit<EdgeSurvey, 'audience'>[]> {
  const config = await edgeConfig(env);
  const path = page.length > 1 ? page.replace(/\/$/, '') : page;
  const here = config.surveys.filter((x) => !x.trigger.page || x.trigger.page === path);
  if (!here.length) return [];
  const answered = new Set((await env.DB.prepare('select survey from answers where visitor = ?').bind(visitor).all<{ survey: string }>()).results.map((a) => a.survey));
  const open = here.filter((x) => !answered.has(x.key));
  if (!open.length) return [];
  const channel = open.some((x) => x.audience.channels?.length)
    ? channelOf(await env.DB.prepare(
      `select r, utm_source, utm_medium, ref from hits where visitor = ? and (r != '' or utm_source != '' or ref != '') order by id limit 1`,
    ).bind(visitor).first<First>())
    : '';
  return open
    .filter((x) => !x.audience.channels?.length || x.audience.channels.includes(channel))
    .filter((x) => {
      const want = x.audience.flag;
      const flag = want && config.flags.find((f) => f.key === want.key);
      return !want || (!!flag && variantOf(flag, visitor) === want.variant);
    })
    .map(({ audience: _, ...x }) => x);
}
