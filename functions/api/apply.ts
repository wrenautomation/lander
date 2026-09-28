// POST /api/apply: an application (or, for an offer without one, a contact form) from a pitch page.
// Checks it against the offer in src/data/offers.json, stores it in D1 `applications`, pings William,
// and says whether it fits and where to book. JSON for the page's script; a redirect to #applied-* when JS is off.
import type { Env } from '../_shared/env';
import { EMAIL, clip, human, isBot, origin, readForm } from '../_shared/form';
import { bookingLink } from '../_shared/booking';
import { notify } from '../_shared/notify';
import { type Answers, answersFrom, fits, invalidAnswers, offerFor } from '../../src/lib/offers';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const back = new URL(request.headers.get('referer') || '/', request.url);
  const reply = (status: number, r: { ok: boolean; fit?: boolean; booking?: string | null; error?: string }) => {
    if (wantsJson) return Response.json(r, { status });
    back.hash = `applied-${!r.ok ? 'error' : r.fit ? 'fit' : 'nofit'}`; // Apply.astro shows that block with :target
    return Response.redirect(back.toString(), 303);
  };

  const form = await readForm(request);
  if (!form) return reply(400, { ok: false, error: 'form' });
  if (isBot(form)) return reply(200, { ok: true, fit: false, booking: null });
  const offer = offerFor(clip(form.get('offer'), 64));
  if (!offer || offer.status !== 'live') return reply(400, { ok: false, error: 'offer' });
  const email = clip(form.get('email'), 200);
  if (!EMAIL.test(email)) return reply(400, { ok: false, error: 'email' });
  const answers: Answers = answersFrom(offer, form);
  const bad = invalidAnswers(offer, answers);
  if (bad) return reply(400, { ok: false, error: bad });
  const o = origin(form, request);
  if (!(await human(env, form, o.ip))) return reply(403, { ok: false, error: 'turnstile' });

  const row = { name: clip(form.get('name'), 120), phone: clip(form.get('phone'), 40), firm: clip(form.get('firm'), 200), note: clip(form.get('note'), 4000), fit: fits(offer, answers) };
  const saved = await env.DB.prepare(
    `insert into applications (ts, offer, name, email, phone, firm, note, answers, fit, page, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ip, ua)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    new Date().toISOString(), offer.id, row.name, email, row.phone, row.firm, row.note, JSON.stringify(answers), row.fit ? 1 : 0, o.page,
    o.utm_source, o.utm_medium, o.utm_campaign, o.utm_content, o.ref, o.country, o.ip, o.ua,
  ).run();

  // Answers by label, so the ping reads without the offer file open.
  const said = (offer.application?.questions ?? []).flatMap((q) => {
    const got = answers[q.id];
    if (got === undefined || got.length === 0) return [];
    const ids = typeof got === 'string' ? [got] : got;
    const text = q.kind === 'text' ? ids.join('') : ids.map((id) => q.choices.find((c) => c.id === id)?.label ?? id).join(', ');
    return [`${q.ask} ${text}`];
  });
  await notify(env, {
    title: `${row.fit ? 'Fit' : 'Not a fit'} · ${offer.name}: ${email}`,
    lines: [
      `${row.name ? `${row.name} · ` : ''}${email}${row.phone ? ` · ${row.phone}` : ''}${row.firm ? ` · ${row.firm}` : ''}`,
      `${o.page}${o.utm_campaign ? ` · ${o.utm_campaign}` : ''}${o.country ? ` · ${o.country}` : ''}`,
    ],
    body: [...said, row.note].filter(Boolean).join('\n') || '(no answers)',
    replyTo: email,
  });
  const booking = row.fit && offer.booking
    ? bookingLink(offer.booking, {
        offer: offer.id, application: String(saved.meta.last_row_id),
        utm_source: o.utm_source, utm_medium: o.utm_medium, utm_campaign: o.utm_campaign, utm_content: o.utm_content,
      })
    : null;
  return reply(200, { ok: true, fit: row.fit, booking });
};
