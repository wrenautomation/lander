// POST /api/answer: a visitor's answer to a live site survey (src/scripts/survey.ts). Only with the cookie yes, since
// the answer is kept against the visitor; one per visitor per survey, the first wins. wren reads them through
// /api/export?table=answers and counts them by day, value and first-touch channel.
import { answerOf, edgeConfig } from '../_shared/edge';
import type { Env } from '../_shared/env';
import { visitorOf, withVisitor } from '../_shared/visitor';

const s = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const visitor = visitorOf(request);
  if (!visitor.id || !visitor.had) return new Response(null, { status: 403 });
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  const survey = (await edgeConfig(env)).surveys.find((x) => x.key === b.survey);
  if (!survey) return new Response(null, { status: 404 });
  const value = answerOf(survey, b.value);
  if (value === null) return new Response(null, { status: 400 });
  const r = await env.DB.prepare(
    'insert into answers (ts, survey, visitor, view, page, value) values (?, ?, ?, ?, ?, ?) on conflict (visitor, survey) do nothing',
  ).bind(new Date().toISOString(), survey.key, visitor.id, s(b.view, 40), s(b.page, 200), value).run();
  return withVisitor(Response.json({ saved: r.meta.changes > 0 }, { headers: { 'cache-control': 'no-store' } }), visitor);
};
