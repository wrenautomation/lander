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
}
