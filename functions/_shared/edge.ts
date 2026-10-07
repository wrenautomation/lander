// What wren pushes to the edge (POST /api/edge): its site flags and live site surveys, as one row in D1. Each isolate keeps the row for a
// minute, so a page costs no D1 read most of the time. A flag picks a variant by its rules, first match wins; on the
// site only `everyone` and percent rules can match (roles, clients and people are the portal's). The hash is the one
// wren uses (packages/core/src/flags.ts), so a visitor lands in the same bucket on both sides.
import type { Env } from './env';

export interface EdgeRule {
  variant: string;
  roles?: string[];
  clients?: string[];
  people?: string[];
  /** 0 to 100: the share of visitors, by the hash of the flag key and the visitor id. */
  percent?: number;
}
export interface EdgeFlag {
  key: string;
  variants: string[];
  rules: EdgeRule[];
  fallback: string;
  killed: boolean;
}
/** A live site survey (wren packages/core/src/surveys.ts): one question, when it shows and who sees it. */
export interface EdgeSurvey {
  key: string;
  question: string;
  kind: 'choice' | 'scale' | 'text';
  choices: string[];
  /** view: on the page after `after` seconds; exit, form, book, booked: on that moment. */
  trigger: { on: 'view' | 'exit' | 'form' | 'book' | 'booked'; page?: string; after?: number };
  /** Every part given must hold: the first touch's channel, a variant of a site flag. */
  audience: { channels?: string[]; flag?: { key: string; variant: string } };
}
export interface EdgeConfig {
  flags: EdgeFlag[];
  surveys: EdgeSurvey[];
  at: string | null;
}

const EMPTY: EdgeConfig = { flags: [], surveys: [], at: null };
const TTL = 60_000;
let kept: { config: EdgeConfig; until: number } | null = null;

/** The config this isolate holds, read from D1 at most once a minute. A bad or missing row is no flags. */
export async function edgeConfig(env: Env, now = Date.now()): Promise<EdgeConfig> {
  if (kept && now < kept.until) return kept.config;
  let config = EMPTY;
  try {
    const row = await env.DB.prepare('select body, at from edge where id = 1').first<{ body: string; at: string }>();
    if (row) config = { ...parseEdge(JSON.parse(row.body)), at: row.at };
  } catch {}
  kept = { config, until: now + TTL };
  return config;
}

/** Forget the kept row: the next read goes to D1. After a push. */
export const forgetEdge = () => { kept = null; };

const KEY = /^[a-z][a-z0-9_.-]{0,59}$/;
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 200) : undefined);

/** The flags and surveys in a pushed body, each checked; anything malformed is left out. */
export function parseEdge(body: unknown): Omit<EdgeConfig, 'at'> {
  const raw = body && typeof body === 'object' ? (body as { flags?: unknown }).flags : null;
  const flags = (Array.isArray(raw) ? raw : []).flatMap((f): EdgeFlag[] => {
    if (!f || typeof f !== 'object') return [];
    const { key, variants, rules, fallback, killed } = f as Record<string, unknown>;
    const vs = strings(variants) ?? [];
    if (typeof key !== 'string' || !KEY.test(key) || typeof fallback !== 'string' || !vs.includes(fallback)) return [];
    const rs = (Array.isArray(rules) ? rules : []).slice(0, 50).flatMap((r): EdgeRule[] => {
      if (!r || typeof r !== 'object') return [];
      const o = r as Record<string, unknown>;
      if (typeof o.variant !== 'string' || !vs.includes(o.variant)) return [];
      const p = Number(o.percent);
      return [{
        variant: o.variant,
        roles: strings(o.roles), clients: strings(o.clients), people: strings(o.people),
        percent: o.percent === undefined || !Number.isFinite(p) ? undefined : Math.min(100, Math.max(0, p)),
      }];
    });
    return [{ key, variants: vs, rules: rs, fallback, killed: killed === true }];
  });
  return { flags: flags.slice(0, 200), surveys: parseSurveys(body) };
}

const KINDS = ['choice', 'scale', 'text'] as const;
const EVENTS = ['view', 'exit', 'form', 'book', 'booked'] as const;
const PATH = /^\/[A-Za-z0-9/_.-]{0,199}$/;

function parseSurveys(body: unknown): EdgeSurvey[] {
  const raw = body && typeof body === 'object' ? (body as { surveys?: unknown }).surveys : null;
  return (Array.isArray(raw) ? raw : []).slice(0, 50).flatMap((x): EdgeSurvey[] => {
    if (!x || typeof x !== 'object') return [];
    const { key, question, kind, choices, trigger, audience } = x as Record<string, unknown>;
    if (typeof key !== 'string' || !KEY.test(key) || typeof question !== 'string' || !question || question.length > 300) return [];
    if (!KINDS.includes(kind as EdgeSurvey['kind'])) return [];
    const cs = (strings(choices) ?? []).filter((c) => c.length <= 80).slice(0, 8);
    if (kind === 'choice' && cs.length < 2) return [];
    const t = (trigger && typeof trigger === 'object' ? trigger : {}) as Record<string, unknown>;
    const on = (EVENTS as readonly unknown[]).includes(t.on) ? (t.on as EdgeSurvey['trigger']['on']) : 'view';
    const after = Number(t.after);
    const a = (audience && typeof audience === 'object' ? audience : {}) as Record<string, unknown>;
    const f = a.flag && typeof a.flag === 'object' ? (a.flag as Record<string, unknown>) : null;
    return [{
      key, question, kind: kind as EdgeSurvey['kind'], choices: kind === 'choice' ? cs : [],
      trigger: {
        on,
        page: typeof t.page === 'string' && PATH.test(t.page) ? t.page : undefined,
        after: Number.isFinite(after) && after > 0 ? Math.min(999, Math.round(after)) : undefined,
      },
      audience: {
        channels: strings(a.channels),
        flag: f && typeof f.key === 'string' && typeof f.variant === 'string' ? { key: f.key, variant: f.variant } : undefined,
      },
    }];
  });
}

/** An answer as stored, or null when it doesn't fit the question. The same check as wren's answerOf. */
export function answerOf(s: Pick<EdgeSurvey, 'kind' | 'choices'>, value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const v = String(value).trim();
  if (s.kind === 'choice') return s.choices.includes(v) ? v : null;
  if (s.kind === 'scale') return /^(?:[1-9]|10)$/.test(v) ? v : null;
  return v.length >= 1 && v.length <= 500 ? v : null;
}

/** FNV-1a, 32 bits: the same in wren. */
export function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(s)) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h;
}
/** 0 to 99.99: where a visitor falls for a flag. */
export const bucketOf = (key: string, id: string) => (fnv(`${key}:${id}`) % 10000) / 100;

/** The variant a visitor gets. No id (no consent): percent rules can't hold, so a share never counts them. */
export function variantOf(flag: EdgeFlag, visitor: string | null): string {
  if (flag.killed) return flag.fallback;
  for (const r of flag.rules) {
    if (r.roles?.length || r.clients?.length || r.people?.length) continue;
    if (r.percent !== undefined && (visitor === null || bucketOf(flag.key, visitor) >= r.percent)) continue;
    return r.variant;
  }
  return flag.fallback;
}
