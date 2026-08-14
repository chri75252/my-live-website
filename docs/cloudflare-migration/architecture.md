# Architecture

- Static origin: GitHub Pages (`chri75252.github.io`), unchanged.
- Public canonical site: `https://www.theblacksmithmarket.com` through Cloudflare.
- Apex: permanent redirect to canonical `www`, preserving path and query.
- API: Cloudflare Worker `tbm-forge-api` at `api.theblacksmithmarket.com`.
- Storage: D1 database `tbm-forge`, bound to the Worker.
- Abuse protection: managed Turnstile widget for `www`; public form remains disabled.
- Email: existing MX, TXT, and mail-service records remain DNS-only and unchanged.
