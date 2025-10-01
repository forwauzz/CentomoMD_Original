# Nginx Config for api.alie.app (Reference)

This folder tracks the intended Nginx configuration so we can avoid config drift.
**Committing this file does not change production.**

## Compare with production (run on EC2)
1) Dump live config:
   sudo nginx -T | sudo tee /tmp/nginx.full.conf >/dev/null

2) If your live vhost file exists:
   sudo cp /etc/nginx/conf.d/api.alie.app.conf /tmp/api.alie.app.conf || true

3) Pull those files locally and diff with infra/nginx/api.alie.app.conf.

## Adopt in production (when ready)
1) Copy `infra/nginx/api.alie.app.conf` to `/etc/nginx/conf.d/api.alie.app.conf`.
   - Ensure the `ssl_certificate` paths match real certs.
   - Ensure the `/ws` proxy path matches the backend WS mount.

2) Test and reload:
   sudo nginx -t && sudo systemctl reload nginx

## CSP strategy
- Default here sets CSP at the edge (Nginx). If your backend also sets CSP,
  avoid sending two headers. Prefer one source of truth.
- If you want a runtime toggle, ship CSP from backend (env-flagged) and
  comment out the `add_header Content-Security-Policy ...` line in Nginx.
