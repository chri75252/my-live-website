# TBM Forge API

Cloudflare Worker backend for future first-party Forge features. The GitHub Pages site remains independent and is not served by this Worker.

Current public endpoint: `GET /health`. The Turnstile verification helper and D1 schema are prepared, but no public question-submission endpoint or form is exposed in this change.

## Local checks

```powershell
npm ci
npm run check
npx wrangler deploy --dry-run
npx wrangler d1 migrations apply tbm-forge --local
```

For local secrets, copy `.dev.vars.example` to `.dev.vars`. Never commit `.dev.vars`. Production `TURNSTILE_SECRET` must be set with `wrangler secret put TURNSTILE_SECRET` or the Cloudflare dashboard. Production D1 exports can contain personal data and must remain outside the public repository or under ignored `private-exports/`.
