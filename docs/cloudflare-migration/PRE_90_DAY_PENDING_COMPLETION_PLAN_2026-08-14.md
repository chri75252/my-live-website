# The Blacksmith Market: pre-90-day pending-completion implementation plan

Version: 1.0  
Prepared: 2026-08-14  
Scope: complete every prerequisite still pending before beginning Day 1 of `TBM_Forge_90_Day_Content_Interactive_Growth_Implementation_Plan_2026-08-13.html`.

## 1. Required outcome

The prerequisite programme is complete only when all of the following are true:

1. Cloudflare DNS, proxying, strict TLS and the canonical redirect remain proven live.
2. The infrastructure commit is safely published to GitHub and reviewed against the actual live-site branch.
3. `POST /ask` performs strict validation, server-side Turnstile verification and prepared D1 persistence.
4. A privacy-aligned Ask The Forge form is live, accessible and usable on desktop and mobile.
5. No analytics, advertising or newsletter marketing is silently activated.
6. Production success and failure paths, email DNS, website assets, the 3D experience and rollback are verified.
7. The evidence and operational handoff are sufficient for another agent to reproduce, maintain or reverse the work.

This plan does not authorize the 90-day content calendar, calculators, topic hubs, research voting, GA4, Clarity, Cloudflare Web Analytics, newsletter delivery or monetisation. Those begin only after the final gate in section 12.

## 2. Verified starting state

### Live and complete

- GitHub Pages remains the static origin.
- Cloudflare is authoritative for `theblacksmithmarket.com`.
- Nameservers are `lara.ns.cloudflare.com` and `nile.ns.cloudflare.com`.
- Four apex GitHub Pages A records and the `www` CNAME are proxied.
- Mail/service A records, MX records and TXT records remain DNS-only.
- Cloudflare SSL/TLS mode is Full (strict).
- Apex HTTP and HTTPS requests redirect with HTTP 301 to canonical `www`, preserving path and query.
- `api.theblacksmithmarket.com` routes to Worker `tbm-forge-api`.
- D1 database `tbm-forge` exists and migration `0001_create_forge_questions.sql` is applied.
- Turnstile widget exists for `www.theblacksmithmarket.com`; its secret is an encrypted Worker secret.
- `GET /health` is live and returns 200.

### Pending

- Commit `932faf3` exists only locally on `codex/cloudflare-forge-infrastructure`.
- The branch was not pushed; no GitHub PR exists because GitHub CLI authentication failed.
- The actual GitHub Pages publication branch must be re-confirmed before selecting a PR base.
- The Worker has no `POST /ask` handler.
- `verifyTurnstile()` exists but is not called by a request path.
- The public Ask The Forge form does not exist.
- The privacy notice does not yet describe Ask The Forge processing.
- No production submission, validation, persistence, replay or failure-state test has been completed.
- Final mobile, accessibility, console/network and performance checks remain pending for the completed feature.

## 3. Operating rules and change boundaries

- Work from `my-live-website-cloudflare`; do not overwrite unrelated changes in `my-live-website`.
- Read and compare the latest remote branch before integrating.
- Before each implementation pass, back up every changed existing file under `backup/<reason>_<YYYYMMDD>/` and update `REVERT_TRACKING.md`.
- Use `apply_patch` for surgical source edits.
- Do not commit secrets, production submissions, database exports containing PII, cookies or credentials.
- Do not enable Cloudflare Pages, Email Routing, Flexible TLS, HSTS preload, Cache Everything or aggressive JavaScript optimisation.
- Do not emit raw questions, email addresses, Turnstile tokens or consent text into analytics/log fields.
- D1 is the source of truth; optional email notification must never determine submission success.
- Calculators remain browser-side and are outside this prerequisite pass.

## 4. Milestone A: reconcile GitHub and publish the infrastructure change

### A1. Authenticate without storing credentials in the repository

Run interactively:

```powershell
gh auth login
gh auth status
```

Use GitHub.com, HTTPS and the user's normal browser authentication. Do not paste a token into a tracked file.

Acceptance evidence:

- `gh auth status` identifies the intended GitHub account.
- `git remote -v` remains `https://github.com/chri75252/my-live-website.git`.

### A2. Identify the authoritative live-site branch

Do not assume `main` or `Version_v_codex`. Verify all three sources:

```powershell
git fetch --prune origin
git remote show origin
gh api repos/chri75252/my-live-website/pages
gh api repos/chri75252/my-live-website/branches --paginate
```

Record:

- GitHub Pages `source.branch` and `source.path`;
- default repository branch;
- latest commit on the live Pages branch;
- whether `Version_v_codex` contains unmerged website work;
- whether commit `770da32` is still the correct infrastructure branch base.

Hard gate: if the live branch has moved since `770da32`, rebase or merge only after inspecting the conflict surface. Never force-push or rewrite shared history.

### A3. Review the infrastructure diff

```powershell
git status --short
git diff 770da32..932faf3 --stat
git diff 770da32..932faf3 -- . ':!backend/forge-api/package-lock.json'
git diff --check 770da32..932faf3
```

Confirm the PR contains only:

- `.gitignore` additions;
- `backend/forge-api/**`;
- backend-scoped GitHub Actions;
- Cloudflare migration, rollback and verification documents;
- concise root README context.

Explicit non-goals: no hero/3D, general styling, article, navigation or content rewrite.

### A4. Push and create a draft PR

```powershell
git push -u origin codex/cloudflare-forge-infrastructure
gh pr create --draft `
  --base <VERIFIED_LIVE_OR_INTEGRATION_BRANCH> `
  --head codex/cloudflare-forge-infrastructure `
  --title "Add Cloudflare Forge infrastructure" `
  --body-file docs/cloudflare-migration/pr-body.md
```

The PR body must state:

- live Cloudflare resources already exist independently of the PR;
- this PR adds maintainable source/configuration/evidence;
- Ask The Forge is not yet public;
- secrets and D1 data are excluded;
- exact validation performed;
- no automatic merge.

### A5. CI and review gate

```powershell
gh pr checks <PR_NUMBER> --watch
gh pr diff <PR_NUMBER>
```

Merge only after:

- tests and dry run pass in GitHub Actions;
- base branch is confirmed correct;
- no unrelated live-site changes are removed;
- the user approves the PR.

After merge, verify GitHub Pages still builds from its configured source. The backend workflow must not accidentally deploy the static site or require secrets on ordinary pull requests.

Rollback: close the PR without merge, or revert the merge commit. Live Cloudflare resources are unaffected by closing the PR.

## 5. Milestone B: approve data, privacy and retention design

This decision must occur before publishing any form.

### B1. Initial processing scope

Launch only Ask The Forge question collection with:

- required question;
- optional topic;
- optional country/region relevance;
- optional email;
- optional `notify_answer`;
- separate optional `newsletter_consent` field stored for evidence but no newsletter messages sent yet;
- source page and limited UTM context;
- Turnstile anti-abuse verification.

Do not activate GA4, Clarity, Cloudflare Web Analytics or a newsletter provider in this release.

### B2. Validation and minimisation rules

Recommended contract:

| Field | Rule |
|---|---|
| `question` | required string, trim, 20-3000 characters |
| `topic` | optional enum: ecommerce, ai-automation, procurement, operations, search-digital, other |
| `country_relevance` | optional string, trim, maximum 100 |
| `email` | optional, maximum 254, conservative email format |
| `notify_answer` | boolean; requires email when true |
| `newsletter_consent` | boolean; requires email when true; no marketing until provider/policy is approved |
| `source_page` | same-site pathname only, maximum 500; reject absolute off-site URLs |
| `referrer` | optional origin/path or coarse source, maximum 500; do not store sensitive query data |
| UTM fields | optional, each maximum 100 |
| `turnstile_token` | required, non-empty; never persist |

Do not store precise IP, browser fingerprint, full User-Agent or inferred location. IP may be passed transiently to Turnstile and then discarded.

### B3. Retention and data-subject operations

Approve and place in the privacy notice:

- purpose: editorial research and, only when requested, answer notification;
- newsletter consent is separate and dormant until a provider is selected;
- processors: Cloudflare Workers, D1 and Turnstile;
- categories: question/context, optional email and consent evidence;
- retention: proposed 24 months for unanswered/editorial research records, with earlier deletion on valid request; answered/anonymised research may be retained without email;
- contact route for access/deletion requests;
- no sale of data, advertising or automated eligibility decision.

If the user chooses a different retention duration, substitute it consistently in policy, operations and deletion queries.

### B4. Privacy notice edit

Back up `privacy-policy.html`, update the rollback tracker, then add exact sections covering:

- Ask The Forge fields and purposes;
- lawful/consent basis as applicable;
- Cloudflare processing;
- Turnstile;
- notification versus marketing consent;
- retention and rights;
- current analytics truth: remain explicit that no newly unapproved analytics is active.

Hard gate: legal wording must be reviewed and approved by the user before the public form deploys. Do not invent a claim that the notice has received formal legal advice.

## 6. Milestone C: implement the production Ask The Forge Worker API

### C1. Endpoint contract

Endpoint:

```text
POST https://api.theblacksmithmarket.com/ask
Origin: https://www.theblacksmithmarket.com
Content-Type: application/json
```

Example request:

```json
{
  "question": "How should a small importer compare landed cost across suppliers?",
  "topic": "procurement",
  "country_relevance": "United Kingdom",
  "email": "reader@example.com",
  "notify_answer": true,
  "newsletter_consent": false,
  "source_page": "/blog/example.html",
  "referrer": "https://www.google.com/",
  "utm_source": null,
  "utm_medium": null,
  "utm_campaign": null,
  "turnstile_token": "<browser-token>"
}
```

Success response (201):

```json
{
  "ok": true,
  "id": "<uuid>"
}
```

The ID is a receipt, not an authorization secret. Do not return the stored question or email.

Stable errors:

```json
{"ok":false,"error":"invalid_request","fields":{"question":"too_short"}}
{"ok":false,"error":"origin_not_allowed"}
{"ok":false,"error":"turnstile_failed"}
{"ok":false,"error":"temporarily_unavailable"}
```

Recommended status codes: 400 invalid JSON/fields, 403 origin or Turnstile failure, 405 method, 413 oversized body, 415 content type, 429 abuse limit if implemented, 503 dependency/storage failure.

### C2. Fail-safe request order

Implement in this order:

1. Match method and `/ask` path.
2. Require exact production Origin.
3. Require JSON content type.
4. Reject oversized body before parsing (for example 16 KiB maximum).
5. Parse JSON with controlled failure.
6. Validate and normalize allowed fields; discard unknown fields.
7. Reject consent-without-email combinations.
8. Verify Turnstile server-side with secret, token, remote IP and expected hostname/action where configured.
9. Insert using a prepared D1 statement.
10. Return 201 only after D1 confirms success.
11. Trigger optional notification only after persistence; failure must not delete or misreport the stored question.

### C3. Suggested Worker structure

Keep the implementation simple and testable:

```text
src/
  index.js          routing and response construction
  validation.js     pure normalization/validation
  turnstile.js      Siteverify wrapper
  repository.js     prepared D1 insert
```

If the code remains small, two files are acceptable. Do not create abstractions with only hypothetical consumers.

Illustrative prepared insert:

```js
const result = await env.DB.prepare(`
  INSERT INTO forge_questions (
    id, question, topic, country_relevance, email,
    notify_answer, newsletter_consent, source_page, referrer,
    utm_source, utm_medium, utm_campaign, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
`).bind(
  id,
  body.question,
  body.topic,
  body.country_relevance,
  body.email,
  body.notify_answer ? 1 : 0,
  body.newsletter_consent ? 1 : 0,
  body.source_page,
  body.referrer,
  body.utm_source,
  body.utm_medium,
  body.utm_campaign
).run();

if (!result.success) throw new Error("d1_insert_failed");
```

Illustrative route skeleton:

```js
if (request.method === "POST" && url.pathname === "/ask") {
  const origin = request.headers.get("Origin");
  if (origin !== PRODUCTION_ORIGIN) {
    return json({ ok: false, error: "origin_not_allowed" }, { status: 403 });
  }

  const parsed = await parseAndValidateRequest(request);
  if (!parsed.ok) return json(parsed.error, { status: parsed.status, headers: corsHeaders(origin) });

  const turnstile = await verifyTurnstile(
    parsed.value.turnstile_token,
    env.TURNSTILE_SECRET,
    request.headers.get("CF-Connecting-IP")
  );
  if (!turnstile.success || turnstile.hostname !== "www.theblacksmithmarket.com") {
    return json({ ok: false, error: "turnstile_failed" }, { status: 403, headers: corsHeaders(origin) });
  }

  const id = crypto.randomUUID();
  await insertQuestion(env.DB, id, parsed.value);
  return json({ ok: true, id }, { status: 201, headers: corsHeaders(origin) });
}
```

The production implementation must not expose internal exception messages.

### C4. Turnstile verification requirements

- Treat every token as single-use and short-lived.
- Require `success === true`.
- Verify returned hostname equals `www.theblacksmithmarket.com`.
- If an action is configured on the widget, verify the action too.
- Map Siteverify/network failures to a generic safe error.
- Never log token or secret.
- Keep test fixtures synthetic; use Cloudflare test keys locally where appropriate.

### C5. Abuse baseline

Minimum release controls:

- Turnstile;
- strict Origin/CORS;
- size and field limits;
- one D1 write per verified request;
- no public read/list endpoint;
- no reflected HTML;
- generic errors and `Cache-Control: no-store`.

Do not claim rate limiting unless it is actually configured and tested. If early production traffic shows abuse, add a Cloudflare rate-limiting rule or a narrowly designed idempotency/replay control in a separate reviewed pass.

### C6. Automated tests

Add tests for at least:

- health 200 and minimal response;
- `/ask` success with mocked Turnstile and mocked D1;
- exact CORS allow origin;
- missing/wrong Origin;
- OPTIONS approved and rejected;
- invalid content type;
- malformed JSON;
- oversized request;
- question missing, too short and too long;
- invalid topic;
- invalid/oversized email;
- notify without email;
- newsletter consent without email;
- off-site/invalid `source_page`;
- Turnstile missing, failed, hostname mismatch and provider unavailable;
- D1 failure returns 503 with no success claim;
- prepared binding receives normalized values;
- unknown route 404 and unsupported method 405;
- response never includes secret, token, raw exception or stored PII.

Required commands:

```powershell
node --check src/index.js
npm test
npm run deploy:dry
```

### C7. Local integration test

Use `.dev.vars` locally only; it is ignored by Git. Apply the migration to local D1 and start Wrangler:

```powershell
npx wrangler d1 migrations apply tbm-forge --local
npx wrangler dev
```

Test health, OPTIONS, validation, Turnstile-test-key behavior and local D1 persistence. Query the test row, then delete it. Never use a real visitor email.

### C8. Production deployment

Before deploying:

```powershell
npx wrangler whoami
npx wrangler secret list
npx wrangler d1 migrations list tbm-forge --remote
npm run deploy:dry
```

Deploy with:

```powershell
npx wrangler deploy
```

Record the new Worker version ID. Do not replace the currently healthy version until all automated checks pass.

Rollback: use Cloudflare Worker version rollback to `8900e7e7-8334-4050-9e6a-8b94e0f8c9ca`. Schema changes in this pass should be additive; export D1 before any later destructive migration.

## 7. Milestone D: implement the public Ask The Forge front end

### D1. Files and backups

Expected minimum files:

```text
ask-the-forge.html
js/ask-forge.js
css/ask-forge.css              # only if existing shared CSS cannot cover it
privacy-policy.html
blog.html                      # CTA only
sitemap.xml
```

Back up every existing file before editing and list it in the new revert tracker. Reuse the established design system; do not redesign unrelated sections.

### D2. Form markup

Use semantic labels, help text and a live status region:

```html
<form id="ask-forge-form" novalidate>
  <label for="forge-question">Your question</label>
  <textarea id="forge-question" name="question" minlength="20" maxlength="3000" required></textarea>

  <label for="forge-topic">Topic</label>
  <select id="forge-topic" name="topic">
    <option value="">Choose a topic (optional)</option>
    <option value="ecommerce">Ecommerce and product economics</option>
    <option value="ai-automation">AI and automation</option>
    <option value="procurement">Procurement and suppliers</option>
    <option value="operations">Operations and project controls</option>
    <option value="search-digital">Search and digital systems</option>
    <option value="other">Other</option>
  </select>

  <label for="forge-country">Country or region relevant to the question (optional)</label>
  <input id="forge-country" name="country_relevance" maxlength="100">

  <label for="forge-email">Email (optional)</label>
  <input id="forge-email" name="email" type="email" maxlength="254" autocomplete="email">

  <label><input name="notify_answer" type="checkbox"> Email me if this question is answered</label>
  <label><input name="newsletter_consent" type="checkbox"> Also send me The Forge Brief</label>

  <div class="cf-turnstile" data-sitekey="PUBLIC_SITE_KEY" data-action="ask_forge"></div>
  <button type="submit">Ask The Forge</button>
  <p id="ask-forge-status" role="status" aria-live="polite"></p>
</form>
```

The public site key may be in HTML. The secret must never be present in HTML or JavaScript.

### D3. Submission JavaScript

Requirements:

- progressively enhance the form;
- derive `source_page` from `location.pathname`, not user input;
- allowlist UTM keys and cap lengths;
- disable only the submit button during a request;
- prevent duplicate double-click submission;
- show concise field-specific validation;
- show success only after API 201;
- reset Turnstile after all failed submissions and after success;
- preserve entered text after transient API failure;
- never write question/email/token to console;
- use `credentials: "omit"` and no cookies.

Illustrative fetch:

```js
const response = await fetch("https://api.theblacksmithmarket.com/ask", {
  method: "POST",
  mode: "cors",
  credentials: "omit",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const result = await response.json().catch(() => null);
if (response.status !== 201 || !result?.ok) {
  throw new SubmissionError(result?.error || "temporarily_unavailable", result?.fields);
}
```

### D4. Placement

Initial release:

- dedicated `/ask-the-forge.html` page;
- one CTA on `blog.html`;
- include in sitemap;
- no mass insertion into every historical article until the dedicated flow is proven.

After production validation, add the contextual end-of-article CTA in a separate surgical pass.

### D5. Frontend tests

Test:

- keyboard-only completion;
- visible focus;
- programmatic labels and error association;
- 320, 390, 768 and desktop widths;
- zoom to 200%;
- reduced-motion mode;
- missing JavaScript messaging;
- missing/blocked Turnstile script;
- invalid and expired token;
- API 400, 403, 429 and 503;
- slow response and double click;
- success focus/status announcement;
- no console errors or mixed content;
- CSP/script restrictions if present;
- no regression to the 3D hero, navigation, CSS or article pages.

## 8. Milestone E: production launch sequence

Perform in this exact order:

1. Merge/deploy the approved privacy notice and dormant form assets only if they cannot submit before the backend is ready; otherwise deploy atomically with the backend.
2. Deploy the tested Worker version.
3. Verify `/health` and non-mutating API errors.
4. Publish the form and CTA through the verified GitHub Pages source.
5. Wait for the Pages build to complete.
6. Perform one clearly marked production test submission using non-personal test data.
7. Query D1 to prove exactly one row persisted.
8. Confirm no secret/token/raw request appears in logs.
9. Delete the production test row and document its ID/time.
10. Re-test live site, email DNS and redirects.

Example remote verification query:

```powershell
npx wrangler d1 execute tbm-forge --remote --command "
SELECT id, created_at, topic, country_relevance, status
FROM forge_questions
WHERE id = '<TEST_UUID>';
"
```

Example cleanup:

```powershell
npx wrangler d1 execute tbm-forge --remote --command "
DELETE FROM forge_questions WHERE id = '<TEST_UUID>';
"
```

Do not include a real email in the test record.

## 9. Infrastructure and regression verification matrix

### DNS and mail

Verify against at least Cloudflare and Google resolvers:

```powershell
Resolve-DnsName theblacksmithmarket.com -Type NS -Server 1.1.1.1
Resolve-DnsName theblacksmithmarket.com -Type NS -Server 8.8.8.8
Resolve-DnsName theblacksmithmarket.com -Type MX -Server 1.1.1.1
Resolve-DnsName google._domainkey.theblacksmithmarket.com -Type TXT -Server 1.1.1.1
```

Compare all mail/service records with `pre-cutover-dns-inventory.md`. Do not alter SPF/DMARC merely because Cloudflare recommends them; that requires a separate mail-policy decision.

### Redirect and origin

```powershell
curl.exe -sS -D - -o NUL --max-redirs 0 "http://theblacksmithmarket.com/deep/path?x=1"
curl.exe -sS -D - -o NUL --max-redirs 0 "https://theblacksmithmarket.com/deep/path?x=1"
curl.exe -sS -D - -o NUL "https://www.theblacksmithmarket.com/"
curl.exe -sS -D - -o NUL "https://www.theblacksmithmarket.com/blog.html"
```

Expected: apex 301 preserves path/query; canonical pages return expected status through Cloudflare; response evidence still identifies GitHub Pages/Fastly as origin.

### API

```powershell
curl.exe -sS -i "https://api.theblacksmithmarket.com/health"
curl.exe -sS -i -X OPTIONS "https://api.theblacksmithmarket.com/ask" `
  -H "Origin: https://www.theblacksmithmarket.com" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: Content-Type"
```

Also verify unauthorized Origin, invalid JSON, missing Turnstile and D1 failure behavior without creating a row.

### Security and repository

```powershell
node --check backend/forge-api/src/index.js
Set-Location backend/forge-api
npm test
npm run deploy:dry
Set-Location ../..
git diff --check
git status --short
git grep -n -I -E "(TURNSTILE_SECRET[[:space:]]*=|sk_live_|api[_-]?key[[:space:]]*[:=])"
```

Inspect `.gitignore` behavior for `.dev.vars`, `.wrangler`, `node_modules`, database exports and local backups containing PII.

### Browser, accessibility and performance

Using signed-in Chrome/Playwright:

- desktop and 390x844 mobile screenshots;
- homepage 3D animation/reveal;
- form page and blog CTA;
- console errors and warnings;
- failed network requests;
- form success/failure focus behavior;
- Lighthouse/PageSpeed before/after comparison for homepage and form page;
- no unexpected analytics/network beacons;
- no raw form content in URLs.

## 10. CI/CD completion

The workflow must distinguish validation from production deployment.

Recommended behavior:

- pull request affecting `backend/forge-api/**`: install, syntax, tests and dry run only;
- merge/push to the verified deployment branch: production deployment only when approved Cloudflare credentials are configured as GitHub secrets;
- workflow permissions set to the minimum required;
- no secret exposed to forked PRs or logs;
- static site Pages deployment remains independent.

If automated Worker deployment credentials are not yet approved, keep production deployment manual and document the exact `wrangler deploy` handoff. A validation-only workflow is acceptable; a misleading workflow that appears to deploy but cannot is not.

## 11. Operations, backup and rollback handoff

Complete these operational artifacts:

- configuration record with current Worker version;
- database schema and migration list;
- secret names only;
- Turnstile widget hostname/mode/action;
- D1 query/export commands;
- data deletion/anonymisation procedure;
- deployment command and CI behavior;
- API contract and stable error codes;
- test evidence with timestamps;
- rollback steps for frontend, Worker and Cloudflare redirect/DNS;
- named location of backups and `REVERT_TRACKING.md`.

Periodic D1 backup command:

```powershell
npx wrangler d1 export tbm-forge --remote --output="<PRIVATE_BACKUP_PATH>\tbm-forge_YYYYMMDD.sql"
```

The export must be stored outside the public repository or in an explicitly ignored/private location because it can contain visitor PII.

Rollback layers:

1. Frontend: revert the Ask The Forge/Privacy deployment commit; remove/disable CTAs.
2. Worker: roll back to the last known-good version; health endpoint remains available.
3. Database: do not drop the table during normal rollback; preserve submissions and restrict access.
4. Turnstile: disable widget only if the form is also disabled.
5. DNS/proxy: not part of application rollback; retain healthy Cloudflare integration.
6. Full Cloudflare rollback: follow `rollback.md`, restoring registrar DNS before deleting the zone.

## 12. Final hard gate before the 90-day plan starts

Every box must be checked with evidence:

### GitHub and source control

- [ ] GitHub authenticated to the intended account.
- [ ] Live Pages branch and path confirmed via GitHub API.
- [ ] Infrastructure branch pushed.
- [ ] Draft PR created against the correct base.
- [ ] CI passed and diff reviewed.
- [ ] Merge explicitly approved; no unrelated website work lost.
- [ ] Worktree clean after the approved merge/deployment.

### Cloudflare foundation

- [ ] Zone active; expected nameservers resolve globally.
- [ ] Only apex web A records and `www` are proxied.
- [ ] Mail/MX/TXT/DKIM/service records match baseline.
- [ ] Full (strict) persists.
- [ ] Apex 301 preserves path and query.
- [ ] GitHub Pages remains origin.
- [ ] API custom domain and `/health` are healthy.
- [ ] HSTS preload, Email Routing, Pages migration and analytics remain off.

### Ask The Forge API

- [ ] `POST /ask` implemented.
- [ ] Exact Origin and CORS enforced.
- [ ] Size, content-type and field validation enforced.
- [ ] Consent-without-email rejected.
- [ ] Turnstile verified server-side with hostname/action checks.
- [ ] Prepared D1 insert used.
- [ ] Success returned only after persistence.
- [ ] No public raw-question/email listing endpoint.
- [ ] All unit/integration tests pass.
- [ ] Production test row proved and removed.

### Privacy and frontend

- [ ] Privacy wording approved and deployed before/same time as collection.
- [ ] Notification and newsletter consent remain separate.
- [ ] No analytics/newsletter provider silently activated.
- [ ] Dedicated page and controlled blog CTA live.
- [ ] Form accessible by keyboard and assistive technology.
- [ ] Mobile, zoom, reduced motion and error states pass.
- [ ] No PII/token in console, URLs, analytics or logs.

### Release and handoff

- [ ] Homepage, 3D animation, navigation, articles, CSS/JS/images pass regression.
- [ ] Browser console/network clean of material errors.
- [ ] Performance comparison recorded.
- [ ] Worker version, release commit and Pages build recorded.
- [ ] Rollback tested conceptually with exact commands/targets.
- [ ] Operational documents and revert tracker updated.

Only after all applicable boxes are checked may execution move to P0-B measurement decisions and Day 1 of the 90-day content programme.

## 13. Recommended execution order and estimated work blocks

These are sequencing blocks, not promises of elapsed time:

1. GitHub authentication, live-branch proof, push and draft PR.
2. Privacy/data-retention decision and approved wording.
3. Backend tests first, then `/ask` implementation and local integration.
4. Worker preview/production deployment and API verification.
5. Frontend form/CTA implementation with backups.
6. Atomic privacy/form publication.
7. Production D1 submission proof and cleanup.
8. Full regression, mobile/accessibility/performance and mail-DNS verification.
9. Documentation, rollback and final readiness sign-off.

The immediate next action is block 1. Do not begin content production or interactive calculators until section 12 passes.
