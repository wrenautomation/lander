// POST /api/lead: the contact form on /agencies. Stores the row in D1, pings William, answers JSON or redirects back.
// Pitch pages (/, /recruiting) post to /api/apply instead.
import type { Env } from '../_shared/env';
import { EMAIL, clip, human, isBot, origin } from '../_shared/form';
import { notify } from '../_shared/notify';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const back = new URL(request.headers.get('referer') || '/', request.url);
  const reply = (status: number, ok: boolean) => {
    if (wantsJson) return Response.json({ ok }, { status });
    back.searchParams.set('sent', ok ? '1' : '0'); back.hash = 'ask';
    return Response.redirect(back.toString(), 303);
  };

  const form = await request.formData();
  if (isBot(form)) return reply(200, true);
  const email = clip(form.get('email'), 200);
  if (!EMAIL.test(email)) return reply(400, false);
  const o = origin(form, request);
  const row = {
    name: clip(form.get('name'), 120), email, phone: clip(form.get('phone'), 40), note: clip(form.get('note'), 4000),
    questions: clip(form.get('questions'), 4000), niche: clip(form.get('niche'), 40) || 'general',
  };
  if (!(await human(env, form, o.ip))) return reply(403, false);

  await env.DB.prepare(
    `insert into leads (ts, name, email, phone, note, questions, niche, page, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ip, ua)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    new Date().toISOString(), row.name, row.email, row.phone, row.note, row.questions, row.niche, o.page,
    o.utm_source, o.utm_medium, o.utm_campaign, o.utm_content, o.ref, o.country, o.ip, o.ua,
  ).run();

  await notify(env, {
    title: `Lead (${row.niche}): ${row.email}`,
    lines: [
      `${row.name ? `${row.name} · ` : ''}${row.email}${row.phone ? ` · ${row.phone}` : ''}`,
      `${o.page}${o.utm_campaign ? ` · ${o.utm_campaign}` : ''}${o.country ? ` · ${o.country}` : ''}`,
    ],
    body: `${row.note || '(no note)'}${row.questions ? `\n\nQuestions: ${row.questions}` : ''}`,
    replyTo: row.email,
  });
  return reply(200, true);
};
