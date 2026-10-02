// Ping William on Discord and by email. The row is already saved, so a failed ping is swallowed.
import type { Env } from './env';

export async function notify(env: Env, n: { title: string; lines: string[]; body: string; replyTo: string }) {
  const jobs: Promise<unknown>[] = [];
  if (env.DISCORD_WEBHOOK) {
    jobs.push(fetch(env.DISCORD_WEBHOOK, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      // A new lead is a ping: @mention William (only him, never a mention the form text carries).
      body: JSON.stringify({
        content: `${env.DISCORD_PING_USER_ID ? `<@${env.DISCORD_PING_USER_ID}> ` : ''}🔔 **${n.title}**\n${n.lines.join('\n')}\n> ${n.body.slice(0, 1500).replace(/\n/g, '\n> ')}`,
        allowed_mentions: { parse: [], users: env.DISCORD_PING_USER_ID ? [env.DISCORD_PING_USER_ID] : [] },
      }),
    }));
  }
  if (env.RESEND_API_KEY && env.LEAD_TO && env.LEAD_FROM) {
    jobs.push(fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.LEAD_FROM, to: env.LEAD_TO, reply_to: n.replyTo, subject: n.title, text: `${n.lines.join('\n')}\n\n${n.body}` }),
    }));
  }
  await Promise.allSettled(jobs);
}
