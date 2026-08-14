# Configuration record

Recorded 2026-08-14.

- Cloudflare account owner: `info@theblacksmithmarket.com`
- Account ID: `277316911bdd1bc2621652922a8505a8`
- Zone ID: `aa5ee40274f9014d08831857a79e5a0b`
- Plan: Free
- Authoritative nameservers: `lara.ns.cloudflare.com`, `nile.ns.cloudflare.com`
- Proxied web records: four apex GitHub Pages A records and `www` CNAME to `chri75252.github.io`
- TLS mode: Full (strict)
- Redirect: apex to `https://www.theblacksmithmarket.com/${1}`, HTTP 301, query preserved
- Worker: `tbm-forge-api`; deployed version `8900e7e7-8334-4050-9e6a-8b94e0f8c9ca`
- D1: `tbm-forge` (`ddef5fdb-dc28-4320-b8e7-fa483f0dd433`)
- Encrypted Worker secret: `TURNSTILE_SECRET` (value intentionally omitted)
- Analytics, Email Routing, HSTS preload, Cloudflare Pages, and the public Ask The Forge form are disabled/not configured.
