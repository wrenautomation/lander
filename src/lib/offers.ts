// The offer registry as this site reads it: src/data/offers.json, exported from wren (packages/offers).
// Pure TypeScript, no Astro, so the build and functions/api/apply.ts share it. The build validates the
// JSON against the schema in content.config.ts, so the function can trust the shape it imports.
// fits and invalidAnswers port wren's (packages/offers/src/offer.ts), which stay canonical. The rule
// language is one gate kind (anyOf) on purpose, so the two cannot drift far.
import snap from '../data/offers.json';

export interface Choice { id: string; label: string }
export type Question =
  | { id: string; ask: string; kind: 'one' | 'many'; choices: Choice[]; required: boolean }
  | { id: string; ask: string; kind: 'text'; placeholder: string; required: boolean };
export interface Application { questions: Question[]; fit: { question: string; anyOf: string[] }[] }
export interface Offer {
  id: string; name: string; status: 'draft' | 'live' | 'paused' | 'retired';
  promise: string; slots: number | null; days: number | null;
  youGet: string[]; youGive: string[]; weGet: string[]; guarantee: string | null;
  next: string[]; page: string | null; booking: string | null; application: Application | null;
}
export type Answers = Record<string, string | string[]>;

const OFFERS = (snap as unknown as { offers: Offer[] }).offers;

export const offerFor = (id: string): Offer | undefined => OFFERS.find((o) => o.id === id);

/** Whether the answers pass every fit gate. An offer without an application always fits. */
export function fits(offer: Offer, answers: Answers): boolean {
  const app = offer.application;
  if (app === null) return true;
  return app.fit.every((rule) => {
    const got = answers[rule.question];
    const picked = typeof got === 'string' ? [got] : (got ?? []);
    return picked.some((id) => rule.anyOf.includes(id));
  });
}

/** The first problem with an application, or null when it is complete and well-formed. */
export function invalidAnswers(offer: Offer, answers: Answers): string | null {
  const app = offer.application;
  if (app === null) return Object.keys(answers).length ? `offer '${offer.id}' takes no application` : null;
  const byId = new Map(app.questions.map((q) => [q.id, q] as const));
  for (const key of Object.keys(answers)) if (!byId.has(key)) return `unknown question '${key}'`;
  for (const q of app.questions) {
    const got = answers[q.id];
    const empty = got === undefined || (typeof got === 'string' ? !got.trim() : got.length === 0);
    if (empty) { if (q.required) return `'${q.id}' is required`; continue; }
    if (q.kind === 'text') { if (typeof got !== 'string') return `'${q.id}' takes text`; continue; }
    const picked = typeof got === 'string' ? [got] : got;
    if (q.kind === 'one' && picked.length !== 1) return `'${q.id}' takes one choice`;
    const known = new Set(q.choices.map((c) => c.id));
    const bad = picked.find((id) => !known.has(id));
    if (bad !== undefined) return `'${q.id}' has no choice '${bad}'`;
  }
  return null;
}

/** Form field name for a question: `q.<id>`. Radios and checkboxes share it; checkboxes repeat it. */
export const fieldName = (questionId: string) => `q.${questionId}`;

/** A choice with this id ("Something else") opens a short text box on the page, sent as `q.<id>.other`. */
export const OTHER = 'other';
export const otherName = (questionId: string) => `${fieldName(questionId)}.${OTHER}`;
const takesOther = (q: Question) => q.kind !== 'text' && q.choices.some((c) => c.id === OTHER);

/** What they wrote next to "Something else", by question id: kept only where they picked it. Stored beside the answers, never validated as one. */
export function writeInsFrom(offer: Offer, form: FormData, answers: Answers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of offer.application?.questions ?? []) {
    const got = answers[q.id], text = form.get(otherName(q.id));
    const picked = typeof got === 'string' ? got === OTHER : (got ?? []).includes(OTHER);
    if (takesOther(q) && picked && typeof text === 'string' && text.trim()) out[q.id] = text.trim().slice(0, 200);
  }
  return out;
}

/** Read an application's answers out of a submitted form, by the offer's questions. Unknown q.* fields come back too, so validation can refuse them. */
export function answersFrom(offer: Offer, form: FormData): Answers {
  const out: Answers = {};
  const kinds = new Map((offer.application?.questions ?? []).map((q) => [q.id, q.kind] as const));
  const others = new Set((offer.application?.questions ?? []).filter(takesOther).map((q) => otherName(q.id)));
  for (const key of new Set([...form.keys()].filter((k) => k.startsWith('q.') && !others.has(k)))) {
    const id = key.slice(2);
    const vals = form.getAll(key).filter((v): v is string => typeof v === 'string').map((v) => v.slice(0, 2000));
    out[id] = kinds.get(id) === 'many' ? vals : (vals.length === 1 ? vals[0] : vals);
  }
  return out;
}
