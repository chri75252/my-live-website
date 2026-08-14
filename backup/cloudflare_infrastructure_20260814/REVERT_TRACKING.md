# Cloudflare infrastructure revert tracking

Created: 2026-08-14
Branch: `codex/cloudflare-forge-infrastructure`
Baseline commit: `770da32`

| Planned file or surface | Intended scope | Backup or restore source | Planned validation | Status |
|---|---|---|---|---|
| `.gitignore` | Exclude Worker local secrets, state, dependencies, and private exports | `working-originals/.gitignore` | `git check-ignore`, secret scan | Complete |
| `backend/forge-api/**` | New Worker, D1 migration, tests, Wrangler configuration, README | New files; remove directory to revert | syntax, unit tests, Wrangler dry run, local and remote health checks | Complete |
| `.github/workflows/forge-api.yml` | Backend-only validation/deployment path filters | New file; remove to revert | YAML inspection; remote Actions runs after push | Complete locally |
| `docs/cloudflare-migration/**` | Sanitized architecture, DNS, configuration, rollback, verification records | New files; remove directory to revert | readback and secret scan | Complete |
| Cloudflare zone | Add `theblacksmithmarket.com` on Free plan, DNS-only first | Remove zone only after restoring old nameservers | imported-record comparison, zone state | Complete |
| Registrar nameservers | Replace Domain.com NS only after Cloudflare DNS parity | Restore `ns1.domain.com`, `ns2.domain.com` | public NS checks on multiple resolvers | Complete |
| Cloudflare proxy/TLS/redirect | Proxy web records, Full strict, apex to www 301 | Grey-cloud records; remove redirect rule | persisted UI state and live curl redirect/TLS tests | Complete |
| Worker/D1/Turnstile | `tbm-forge-api`, `tbm-forge`, widget for canonical site | Worker version rollback/delete; D1 export/Time Travel; disable widget | secret list, binding, migration, `/health`, CORS checks | Complete |

The original working tree at `my-live-website` contains unrelated V10/V11 changes and is intentionally not modified by this pass.
