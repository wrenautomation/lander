# www-to-apex

Sends `www.wrenautomation.com/*` to `wrenautomation.com` with a 301, so search engines see one site.
The www DNS record stays a proxied CNAME to Pages; this Worker's route answers first.

Deploy (needs `wrangler login` with Workers routes): `npx wrangler deploy -c workers/www-to-apex/wrangler.toml`
