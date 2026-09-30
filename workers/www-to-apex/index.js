// www.wrenautomation.com → wrenautomation.com, 301 to https, same path and query. Pages' _redirects can't match a host,
// so this Worker sits on the www route only; the apex never runs it. Deployed by hand (README beside it), rarely changes.
export default {
  fetch(request) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.hostname = 'wrenautomation.com';
    return Response.redirect(url.toString(), 301);
  },
};
