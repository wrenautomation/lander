// POST /api/events. What a visitor did on a page, batched by src/scripts/hit.ts and sent when the tab hides:
// {view, page, events: [{name, props?}]}. One `events` row each, under the same view id as the hits row, with the
// visitor cookie's id or none without consent (as hits). A bad name or props over 1 KB drops that event alone.
import type { Env } from '../_shared/env';
import { visitorOf, withVisitor } from '../_shared/visitor';

const NAME = /^[a-z][a-z0-9_.]{0,39}$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let b: { view?: unknown; page?: unknown; events?: unknown };
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  const view = typeof b.view === 'string' ? b.view : '';
  if (!/^[A-Za-z0-9-]{8,40}$/.test(view) || !Array.isArray(b.events)) return new Response(null, { status: 400 });
  const page = typeof b.page === 'string' ? b.page.slice(0, 200) : '';
  const rows = b.events.slice(0, 50).flatMap((e: { name?: unknown; props?: unknown }) => {
    if (typeof e?.name !== 'string' || !NAME.test(e.name)) return [];
    const p = e.props && typeof e.props === 'object' && !Array.isArray(e.props) ? JSON.stringify(e.props) : '{}';
    return new TextEncoder().encode(p).byteLength > 1024 ? [] : [{ name: e.name, props: p }];
  });
  const visitor = visitorOf(request), ts = new Date().toISOString();
  if (rows.length) {
    const ins = env.DB.prepare('insert into events (ts, view, visitor, page, name, props) values (?, ?, ?, ?, ?, ?)');
    await env.DB.batch(rows.map((r) => ins.bind(ts, view, visitor.id, page, r.name, r.props)));
  }
  return withVisitor(new Response(null, { status: 204 }), visitor);
};
