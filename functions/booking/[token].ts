// GET /booking/<token>: a booked call's own page, linked from every mail about it: when it is, the Meet link, and a
// new time or a cancel. The token is signed per booking by wren, so the link is the login. The page is the same
// static shell as /book/<offer>; its script reads the token and calls /api/booking. A GET changes nothing.
import { MANAGE_TOKEN, schedule } from '../_shared/calendar';
import type { Env } from '../_shared/env';

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  if (!MANAGE_TOKEN.test(String(params.token ?? ''))) {
    const page = await env.ASSETS.fetch(new URL('/404', request.url));
    return new Response(page.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } });
  }
  return schedule(env, request);
};
