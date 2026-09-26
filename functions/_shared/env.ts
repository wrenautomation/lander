// What every form endpoint reads from the Pages project. Secrets: wrangler pages secret put <NAME>.
export interface Env {
  DB: D1Database;
  TURNSTILE_SECRET?: string;
  DISCORD_WEBHOOK?: string;    // channel → Integrations → Webhooks
  RESEND_API_KEY?: string;
  LEAD_TO?: string;            // where the notification goes
  LEAD_FROM?: string;          // a sender on a domain verified in Resend
}
