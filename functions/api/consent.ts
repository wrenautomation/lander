// POST /api/consent {choice: "yes" | "no"}: the cookie banner's answer (src/components/Consent.astro). Keeps the choice
// in `wc`; a yes starts the visitor cookie, a no takes it away.
import { choiceCookie } from '../_shared/consent';
import { cookieId, forgetCookie, visitorCookie } from '../_shared/visitor';

export const onRequestPost: PagesFunction = async ({ request }) => {
  let b: { choice?: unknown };
  try { b = await request.json(); } catch { return new Response(null, { status: 400 }); }
  if (b.choice !== 'yes' && b.choice !== 'no') return new Response(null, { status: 400 });
  const r = new Response(null, { status: 204 });
  r.headers.append('set-cookie', choiceCookie(b.choice));
  r.headers.append('set-cookie', b.choice === 'yes' ? visitorCookie(cookieId(request) ?? crypto.randomUUID()) : forgetCookie);
  return r;
};
