// POST /api/replay?view=&seq=&page=&w=. One chunk of a session recording from src/scripts/replay.ts: a JSON array
// of rrweb events. Gzipped and put in S3 at site/replays/<view>/<seq 0000>.json, then the view's `replays` row is
// made or raised. Only for a visitor who said yes (it has the wv cookie); the row, like a hits row, belongs to the
// visitor who made it. A view stops at REPLAY_MAX_BYTES of gzip. Without the keys the endpoint does not exist.
import { AwsClient } from 'aws4fetch';
import { type Env, replayOn } from '../_shared/env';
import { cookieId, history, visitorOf } from '../_shared/visitor';

const MAX_BODY = 1_000_000;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!replayOn(env) || !env.REPLAY_REGION) return new Response(null, { status: 404 });
  const visitor = visitorOf(request);
  // a consenting visitor already has its cookie from /api/hit; a fresh id here would join nothing
  if (!visitor.id || visitor.id !== cookieId(request)) return new Response(null, { status: 403 });
  const q = new URL(request.url).searchParams;
  const view = q.get('view') || '', seq = Number(q.get('seq'));
  if (!/^[A-Za-z0-9-]{8,40}$/.test(view) || !Number.isInteger(seq) || seq < 0 || seq > 2000) return new Response(null, { status: 400 });
  if (Number(request.headers.get('content-length')) > MAX_BODY) return new Response(null, { status: 413 });
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_BODY) return new Response(null, { status: 413 });
  try { if (!Array.isArray(JSON.parse(new TextDecoder().decode(body)))) throw 0; } catch { return new Response(null, { status: 400 }); }

  const row = await env.DB.prepare('select visitor, bytes from replays where view = ?').bind(view).first<{ visitor: string | null; bytes: number }>();
  if (row && row.visitor !== visitor.id) return new Response(null, { status: 403 });
  if (row && row.bytes >= Number(env.REPLAY_MAX_BYTES || 5_000_000)) {
    await env.DB.prepare('update replays set capped = 1 where view = ?').bind(view).run();
    return new Response(null, { status: 413 });
  }

  const gz = await new Response(new Blob([body]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
  const aws = new AwsClient({ accessKeyId: env.REPLAY_KEY_ID!, secretAccessKey: env.REPLAY_SECRET!, service: 's3', region: env.REPLAY_REGION });
  const put = await aws.fetch(`https://${env.REPLAY_BUCKET}.s3.${env.REPLAY_REGION}.amazonaws.com/site/replays/${view}/${String(seq).padStart(4, '0')}.json`, {
    method: 'PUT', body: gz, headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' },
  });
  if (!put.ok) { console.error('replay put', put.status, await put.text()); return new Response(null, { status: 502 }); }

  const now = new Date().toISOString();
  // what first brought this visitor, as /api/apply stores it; read once, on the view's first chunk
  const first = row ? null : (await history(env.DB, visitor.id)).first;
  const w = Math.min(10000, Math.max(0, Math.round(Number(q.get('w')) || 0)));
  await env.DB.prepare(
    `insert into replays (view, visitor, page, started, last, chunks, bytes, w, country, first_touch) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     on conflict (view) do update set last = excluded.last, chunks = max(chunks, excluded.chunks), bytes = bytes + excluded.bytes
     where replays.visitor is excluded.visitor`,
  ).bind(view, visitor.id, (q.get('page') || '').slice(0, 200), now, now, seq + 1, gz.byteLength, w, request.headers.get('cf-ipcountry') || '',
    first ? JSON.stringify(first) : null).run();
  return new Response(null, { status: 204 });
};
