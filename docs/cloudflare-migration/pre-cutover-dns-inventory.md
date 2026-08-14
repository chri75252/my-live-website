# Pre-cutover DNS inventory

Captured: 2026-08-14 before Cloudflare onboarding or nameserver changes.

## Authority and registrar

- Domain: `theblacksmithmarket.com`
- Registrar: Domain.com - Network Solutions, LLC (Verisign RDAP)
- Previous authoritative nameservers: `ns1.domain.com`, `ns2.domain.com`
- Authoritative SOA primary: `NS1.DOMAIN.com`
- Registry DNSSEC state: unsigned (`delegationSigned: false`); no DS record was returned.

## Confirmed public records

| Name | Type | Value | Observed TTL | Intended Cloudflare state |
|---|---|---|---:|---|
| `@` | A | `185.199.108.153` | 7200 | DNS-only during cutover; proxy after validation |
| `@` | A | `185.199.109.153` | 7200 | DNS-only during cutover; proxy after validation |
| `@` | A | `185.199.110.153` | 7200 | DNS-only during cutover; proxy after validation |
| `@` | A | `185.199.111.153` | 7200 | DNS-only during cutover; proxy after validation |
| `www` | CNAME | `chri75252.github.io` | 7200 | DNS-only during cutover; proxy after validation |
| `@` | MX | priority 1 `smtp.google.com` | 3600 | DNS-only; preserve exactly |
| `@` | TXT | `google-site-verification=5PpYR2aKm4iffLmimlpolgLiOebdYUeqE3WfXUgVtpY` | 3600 | DNS-only; preserve exactly |
| `@` | TXT | `google-site-verification=tFCEwvGGsHbc8XZT2rmfWv08EnVbA7QYsRT2lrniK70` | 3600 | DNS-only; preserve exactly |
| `@` | TXT | `ahrefs-site-verification_50a8eb9925bdc4d2496a47cbf6614330e5be56edb51e6c6c5f0b909c47c0a42b` | 3600 | DNS-only; preserve exactly |
| `mail` | A | `66.96.162.148` | 3600 | DNS-only; preserve |
| `email` | A | `66.96.162.48` | provider import | DNS-only; preserve |
| `ftp` | A | `66.96.162.148` | provider import | DNS-only; preserve |
| `smtp` | A | `66.96.162.148` | 3600 | DNS-only; preserve |
| `imap` | A | `66.96.162.148` | 3600 | DNS-only; preserve |
| `pop` | A | `66.96.162.148` | 3600 | DNS-only; preserve |
| `mx` | A | `66.96.140.182` | provider import | DNS-only; preserve |
| `mx` | A | `66.96.140.183` | provider import | DNS-only; preserve |
| `webmail` | A | `66.96.162.48` | provider import | DNS-only; preserve |
| `google._domainkey` | TXT | Google DKIM public key (preserved verbatim in Cloudflare) | 14400 before cutover | DNS-only; preserve exactly |

No apex AAAA, `_dmarc` TXT, or probed `selector1._domainkey`, `selector2._domainkey`, or `default._domainkey` records were returned. Cloudflare's authoritative import recovered the Google DKIM record and additional legacy mail/service hostnames that the initial public probe missed. The legacy provider refused a complete zone transfer and RFC8482-minimized ANY responses.

## Baseline behavior

- `http://theblacksmithmarket.com/` -> 301 `https://www.theblacksmithmarket.com/`
- `https://theblacksmithmarket.com/` -> 301 `https://www.theblacksmithmarket.com/`
- `http://www.theblacksmithmarket.com/` -> 301 `https://www.theblacksmithmarket.com/`
- `https://www.theblacksmithmarket.com/` -> 200 from GitHub Pages
- Repository `CNAME`: `www.theblacksmithmarket.com`

This file contains no credentials, secrets, user submissions, or private database content.
