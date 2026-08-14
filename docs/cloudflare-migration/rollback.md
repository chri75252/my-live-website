# Rollback

1. Disable the `Redirect apex to canonical www` redirect rule.
2. Change the four apex A records and `www` CNAME to DNS-only.
3. If fully reverting authoritative DNS, first verify the registrar's prior DNS zone is complete, then restore `ns1.domain.com` and `ns2.domain.com` at the registrar.
4. Verify website and mail DNS publicly before removing the Cloudflare zone.
5. The Worker can be rolled back to a prior version or deleted independently. Export D1 before destructive database action; disable the Turnstile widget separately.

Do not delete the Cloudflare zone before registrar DNS restoration has propagated.
