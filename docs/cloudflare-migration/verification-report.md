# Verification report

Verified 2026-08-14.

- Nameservers propagated through Cloudflare, Google, and Quad9 resolvers.
- Four apex A records persisted as Proxied; `www` CNAME persisted as Proxied.
- Apex MX remains `smtp.google.com` preference 1; mail/service records were not edited.
- SSL/TLS changed from Full to Full (strict), with Cloudflare success confirmation.
- HTTPS and HTTP apex deep-path requests return 301 to canonical `www`, preserving `/test-path?source=codex`.
- Canonical `www` returns 200 through Cloudflare with GitHub Pages/Fastly origin headers still present.
- `https://api.theblacksmithmarket.com/health` returns 200 JSON; root 404, allowed CORS 204, and unauthorized origin 403 were previously verified.
- D1 migration `0001_create_forge_questions.sql` is applied remotely.
- Turnstile secret is stored encrypted and not present in repository documentation.

No public Ask The Forge UI was enabled.
