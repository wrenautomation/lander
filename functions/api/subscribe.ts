// POST /api/subscribe: a signup form that names a topic (fields email, topic, text, text_version, page). After the
// bot check it signs the address with EXPORT_TOKEN and hands it to wren, which mails the confirm link
// (functions/_shared/marketing.ts). The answer never says whether the address was already on the list.
import type { Env } from '../_shared/env';
import { EMAIL, clip, human, isBot, origin, readForm } from '../_shared/form';
import { marketing, signupSig } from '../_shared/marketing';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const back = new URL(request.headers.get('referer') || '/', request.url);
  const reply = (status: number, ok: boolean) => {
    if (wantsJson) return Response.json({ ok }, { status });
    back.searchParams.set('subscribed', ok ? '1' : '0'); back.hash = 'subscribe';
    return Response.redirect(back.toString(), 303);
  };

  const form = await readForm(request);
  if (!form) return reply(400, false);
  if (isBot(form)) return reply(200, true);
  const address = clip(form.get('email'), 200).toLowerCase();
  const topic = clip(form.get('topic'), 64);
  if (!EMAIL.test(address) || !topic) return reply(400, false);
  if (!env.EXPORT_TOKEN) return reply(503, false);
  const o = origin(form, request);
  if (!(await human(env, form, o.ip))) return reply(403, false);

  const r = await marketing(env, 'signUp', {
    topic, address, sig: await signupSig(env.EXPORT_TOKEN, topic, address),
    form: o.page || back.pathname, text: clip(form.get('text'), 500), textVersion: clip(form.get('text_version'), 64) || 'v1',
    ip: o.ip, ua: o.ua,
  });
  return reply(r.status === 200 ? 200 : 502, r.status === 200);
};
