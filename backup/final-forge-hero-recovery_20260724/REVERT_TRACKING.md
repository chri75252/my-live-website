# Final Forge Reveal + Hero Recovery — Revert Tracking

## Scope

Surgical implementation of the approved V3 source-video reveal and persistent armillary hero. Existing V2 hero files remain unchanged as an additional rollback path.

## Recovery points

- Git backup branch: `backup/pre-final-forge-hero-recovery-20260724`
- Backup commit: `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`
- Working branch: `codex/final-forge-hero-recovery-v3`
- File-level backups: this directory, preserving the original relative paths.
- Source video: `Master_Execution_Prompt_—_TBM.mp4` (user-supplied, unmodified)

## Implementation log

| Phase | File / asset | Intended scope | Backup / restore source | Validation | Status |
|---|---|---|---|---|---|
| 0 | `index.html` | V3 integration and readiness attribute | File backup + Git backup branch | static validator + desktop/mobile browser capture | Complete |
| 0 | `js/forge-frame-sequence.js` | Manifest-driven loading and one synchronous draw path | File backup + Git backup branch | syntax, hash validator, browser requested/rendered-index checks | Complete |
| 0 | `js/forge-intro.js` | Reveal state machine, scroll space and V3 lifecycle handoff | File backup + Git backup branch | syntax, lifecycle/reverse-scroll/failure/reduced-motion checks | Complete |
| 0 | `css/forge-intro.css` | Reveal and reversible scroll-space styling | File backup + Git backup branch | desktop/mobile capture | Complete |
| 0 | `scripts/build-forge-frame-assets.py` | Approved-MP4 candidate and production asset builder | File backup + Git backup branch | `py_compile`, three candidate builds, final manifest hash validation | Complete |
| 0 | `scripts/validate-forge-frame-sequence.mjs` | MP4-manifest runtime/asset validator | File backup + Git backup branch | `node --check` and successful execution | Complete |
| 0 | `.github/workflows/forge-intro-visual.yml` | Run V3 source checks and V3 capture | File backup + Git backup branch | YAML readback; CI dependency installation remains remote | Complete |
| 0 | `assets/forge-reveal/**` | Regenerated 64-frame desktop/mobile inventory + manifest | File backup directory | inventory, SHA-256 manifest checks, browser decode | Complete |
| 0 | `artifacts/forge-frame-audit/**` | New V3 source-selection/provenance evidence | File backup directory | audit artifacts present and traced to approved MP4 | Complete |
| 1 | `js/hero-3d-reveal-match-v3.js` | Isolated Three.js armillary V3; V2 stays untouched | Delete V3 file and restore `index.html` from Git backup branch | syntax, static verifier, browser lifecycle and screenshot capture | Complete |
| 1 | `css/hero-reveal-match-v3.css` | V3 presentation and responsive integration | Delete V3 file and restore `index.html` from Git backup branch | desktop/mobile screenshot capture | Complete |
| 1 | `scripts/verify-reveal-match-v3.py` | Static V3 contract verifier | Delete V3 file | `py_compile` + successful execution | Complete |
| 1 | `scripts/capture-reveal-match-v3.mjs` | CI/browser V3 diagnostics capture | Delete V3 file | `node --check`; browser behavior additionally proven locally with Python Playwright because this repo has no local Node package | Complete |
| 1 | `.github/workflows/reveal-match-v3-evidence.yml` | V3 CI evidence workflow | Delete V3 file | YAML readback; CI dependency installation remains remote | Complete |

### Phase updates

- **Phase 1 — baseline and source audit: complete.** Baseline syntax and old sequence validator passed before edits. The supplied MP4 SHA-256 matched the approved source hash and `ffprobe` confirmed 1280x720, 24fps, 240 frames.
- **Phase 2 — cutoff evidence: complete.** Frame-level contact sheets are in `artifacts/final-forge-v3/source-audit/`. Source frame `159` is the last clean full-screen armillary image; source frame `160` is the first visible underlying-homepage contamination. The approved exclusive cutoff is therefore `160`.
- **Phase 2 — candidate build: complete.** Deterministic 48, 64 and 80 frame candidates were built under `artifacts/final-forge-v3/frame-candidates/`. Selected trade-off: **64 frames** (2.82 MiB desktop, 1.46 MiB mobile), retaining a smooth source-derived sequence without the 80-frame memory/network cost.
- **Phase 2 — builder: edited and syntax-checked.** `scripts/build-forge-frame-assets.py` now validates the approved MP4 and can write isolated candidates or the active inventory. Its file-level backup is intact above.
- **Phase 3 — reveal runtime: complete.** The active renderer uses the committed manifest, has a single scheduler owned by `forge-intro.js`, draws one exact frame after readiness, and has no canvas-filter blur or asynchronous second draw loop.
- **Phase 4 — V3 armillary and lifecycle: complete.** V3 is integrated while V2 remains on disk. Browser evidence confirms `suspended → prewarming → handoff-ready → active`, reverse-scroll suspension, zero fallback after readiness, and exact requested/rendered frame indices on desktop and mobile.
- **Phase 5 — resilience and final reinspection: complete.** Reduced-motion users bypass the reveal without inert content; forced manifest failure fails open to the homepage. Final source, asset, syntax, static, browser, and diff-whitespace checks passed. Evidence is in `artifacts/final-forge-v3/`.

## Restore instructions

1. For the entire implementation, switch to `backup/pre-final-forge-hero-recovery-20260724` or restore selected tracked files with `git restore --source backup/pre-final-forge-hero-recovery-20260724 -- <path>`.
2. For generated assets and audit evidence, copy the matching backup path from this directory back into the repository.
3. For V3-only files, remove the listed file and restore `index.html` from the backup branch if reverting the V3 integration.
4. Run the validator and browser capture commands recorded against the affected row before treating a revert as complete.
