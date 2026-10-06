// What every form endpoint reads from the Pages project. Secrets: wrangler pages secret put <NAME>.
export interface Env {
  DB: D1Database;
  TURNSTILE_SECRET?: string;
  DISCORD_WEBHOOK?: string;    // channel → Integrations → Webhooks
  DISCORD_PING_USER_ID?: string; // William's Discord user id: lead pings @mention him
  DISCORD_MEETINGS_WEBHOOK?: string; // #meetings: cal.com bookings land here
  CALCOM_WEBHOOK_SECRET?: string;    // signs /api/calcom; made and kept by `autobrowse site call calcom POST /v2/webhooks`
  RESEND_API_KEY?: string;
  LEAD_TO?: string;            // where the notification goes
  LEAD_FROM?: string;          // a sender on a domain verified in Resend
  EXPORT_TOKEN?: string;       // bearer for /api/export, shared with wren (WREN_SITE_EXPORT_TOKEN)
  WREN_MARKETING_URL?: string; // wren's Marketing service via the phone Worker (wrangler.toml); signups are signed with EXPORT_TOKEN
  WREN_CALENDAR_URL?: string;  // wren's Calendar service via the phone Worker (wrangler.toml); bookings are signed with EXPORT_TOKEN
  BOOKING?: string;            // var: "wren" books on our own calendar, anything else on Cal.com (functions/_shared/booking.ts)
  ASSETS: Fetcher;             // the built site, for pages a function fills or serves
  // Session replay (functions/api/replay.ts). Off until key, secret and bucket are all set.
  REPLAY_BUCKET?: string;      // secret: the private files bucket (wren terraform)
  REPLAY_REGION?: string;      // secret: that bucket's region
  REPLAY_KEY_ID?: string;      // secret: IAM user lander-replays, s3:PutObject on site/replays/* only
  REPLAY_SECRET?: string;      // secret: that key's secret
  REPLAY_SAMPLE?: string;      // optional var: share of consenting views recorded, 0..1 (default 1)
  REPLAY_MAX_BYTES?: string;   // optional var: gzip bytes one view may store (default 5000000)
}

/** Replay is on: key, secret and bucket are all set. */
export const replayOn = (env: Env) => !!(env.REPLAY_KEY_ID && env.REPLAY_SECRET && env.REPLAY_BUCKET);
