// Experiments and site flags, picked at the edge (wren designs/2026-10-06-flags-experiments-surveys-heatmaps.md §3).
// A page carries its variants as markup, `<div data-flag="hero" data-variant="b">`, and this removes every variant
// the visitor isn't in before the page leaves, so nothing flickers and the page stays static. Only pages whose HTML
// has `data-flag` run through here (scripts/routes.mjs writes dist/_routes.json); every other request passes.
//   - A flag wren pushed (edge.ts): its rules pick, sticky by the `wv` visitor id. The kept variant gets
//     `data-shown`, and src/scripts/hit.ts sends `exp.seen` for it. Without the cookie yes the visitor gets a random
//     pick and no id, so the exposure is stored without a visitor and never counted.
//   - A flag wren hasn't pushed: the first variant in the markup shows, the rest go. A page reads right either way.
// A page that was rewritten goes out `Cache-Control: private`: a shared cache must never hold one visitor's pick.
import { edgeConfig, type EdgeFlag, variantOf } from './_shared/edge';
import type { Env } from './_shared/env';
import { visitorOf, withVisitor } from './_shared/visitor';

/** The functions' own paths: their pages and answers pass untouched. scripts/routes.mjs checks it at build. */
export const FUNCTIONS = /^\/(api|book|booking|go|prefs|v|watch)(\/|$)/;

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const response = await next();
  if (request.method !== 'GET' || FUNCTIONS.test(new URL(request.url).pathname)) return response;
  if (!(response.headers.get('content-type') || '').startsWith('text/html')) return response;
  const flags = new Map<string, EdgeFlag>((await edgeConfig(env)).flags.map((f) => [f.key, f]));
  const visitor = visitorOf(request);
  // No consent: a fresh id each view, so a share still splits these visitors, but none is kept or counted.
  const id = visitor.id ?? crypto.randomUUID();
  const picked = new Map<string, string>();
  const pick = (key: string, first: string) => {
    let v = picked.get(key);
    if (v === undefined) {
      const f = flags.get(key);
      v = f ? variantOf(f, id) : first;
      picked.set(key, v);
    }
    return v;
  };
  const rewritten = new HTMLRewriter()
    .on('[data-flag]', {
      element(el) {
        const key = el.getAttribute('data-flag') || '', variant = el.getAttribute('data-variant') || '';
        if (pick(key, variant) !== variant) el.remove();
        else if (flags.has(key)) el.setAttribute('data-shown', '');
      },
    })
    .transform(response);
  const out = new Response(rewritten.body, rewritten);
  out.headers.set('cache-control', 'private, no-cache');
  return withVisitor(out, visitor);
};
