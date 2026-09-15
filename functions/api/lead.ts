// POST /api/lead. Stores the row in D1, pings William (Discord and/or email), answers JSON or redirects back to the page.
interface Env {
  DB: D1Database;
  TURNSTILE_SECRET?: string;   // wrangler pages secret put TURNSTILE_SECRET
  DISCORD_WEBHOOK?: string;    // wrangler pages secret put DISCORD_WEBHOOK (channel → Integrations → Webhooks)
  RESEND_API_KEY?: string;     // wrangler pages secret put RESEND_API_KEY
  LEAD_TO?: string;            // where the notification goes
  LEAD_FROM?: string;          // a sender on a domain verified in Resend
}

const clip = (v: ReturnType<FormData['get']>, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  const back = new URL(request.headers.get('referer') || '/', request.url);
  const reply = (status: number, ok: boolean) => {
    if (wantsJson) return Response.json({ ok }, { status });
    back.searchParams.set('sent', ok ? '1' : '0'); back.hash = 'ask';
    return Response.redirect(back.toString(), 303);
  };

  const form = await request.formData();
  if (clip(form.get('website'), 10)) return reply(200, true); // honeypot: pretend it worked
  const email = clip(form.get('email'), 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply(400, false);
  const row = {
    name: clip(form.get('name'), 120), email, phone: clip(form.get('phone'), 40), note: clip(form.get('note'), 4000), questions: clip(form.get('questions'), 4000),
    niche: clip(form.get('niche'), 40) || 'general', page: clip(form.get('page'), 200),
    utm_source: clip(form.get('utm_source'), 100), utm_medium: clip(form.get('utm_medium'), 100),
    utm_campaign: clip(form.get('utm_campaign'), 100), utm_content: clip(form.get('utm_content'), 100),
    ref: clip(form.get('ref'), 200), country: request.headers.get('cf-ipcountry') || '',
    ip: request.headers.get('cf-connecting-ip') || '', ua: clip(request.headers.get('user-agent'), 300),
  };

  if (env.TURNSTILE_SECRET) {
    const token = clip(form.get('cf-turnstile-response'), 3000);
    const v = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: row.ip }),
    }).then((r) => r.json() as Promise<{ success: boolean }>).catch(() => ({ success: false }));
    if (!v.success) return reply(403, false);
  }

  await env.DB.prepare(
    `insert into leads (ts, name, email, phone, note, questions, niche, page, utm_source, utm_medium, utm_campaign, utm_content, ref, country, ip, ua)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    new Date().toISOString(), row.name, row.email, row.phone, row.note, row.questions, row.niche, row.page,
    row.utm_source, row.utm_medium, row.utm_campaign, row.utm_content, row.ref, row.country, row.ip, row.ua,
  ).run();

  const who = `${row.name ? `${row.name} · ` : ''}${row.email}${row.phone ? ` · ${row.phone}` : ''}`;
  const body = `${row.note || '(no note)'}${row.questions ? `\n\nQuestions: ${row.questions}` : ''}`;
  const where = `${row.page}${row.utm_campaign ? ` · ${row.utm_campaign}` : ''}${row.country ? ` · ${row.country}` : ''}`;
  if (env.DISCORD_WEBHOOK) {
    await fetch(env.DISCORD_WEBHOOK, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: `**Lead · ${row.niche}** · ${where}\n${who}\n> ${body.slice(0, 1500).replace(/\n/g, '\n> ')}` }),
    }).catch(() => {}); // the row is saved; the ping is a courtesy
  }
  if (env.RESEND_API_KEY && env.LEAD_TO && env.LEAD_FROM) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: env.LEAD_FROM, to: env.LEAD_TO, reply_to: row.email,
        subject: `Lead (${row.niche}): ${row.email}`,
        text: `${who}\n${where}\n\n${body}`,
      }),
    }).catch(() => {});
  }
  return reply(200, true);
};
