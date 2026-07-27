# TBM V9 Evidence-Gated Visual Recovery Handoff

## Authoritative current state

- Active implementation: V9 Cycles-rendered, pre-rendered image-sequence reveal.
- Active page wiring: `index.html` loads `css/tbm-reference-refinement-v7.css`, then `css/tbm-reference-refinement-v9.css`, and `js/tbm-reveal-v9.js`.
- The active hero plate and final reveal frame are the same asset: `assets/tbm-cinematic-v9/reveal-desktop/frame_0120.webp` (mobile switches to its separately rendered `reveal-mobile/frame_0120.webp`).
- V8 live-GLB work is rejected and remains archived. It is not active.
- Product Focus V7 constellation CSS/controller remain active and byte-identical to the pre-V9 baseline.
- Local preview is currently reachable at `http://127.0.0.1:4173/index.html`.

## Completed and verified

- Recovery backups and precise patch register: `backup/v9_visual_recovery_20260726/REVERT_TRACKING.md`.
- Cycles delivery: 120 ordered desktop frames at 1600×900 and 120 separately composed mobile frames at 900×1600. Manifest parity passes.
- Reveal controller is reversible, uses requestAnimationFrame-coalesced exact-frame selection, becomes interactive after the first 12 contiguous frames, decodes remaining frames concurrently, and is never destroyed at completion.
- Browser validation passes desktop forward → end → reverse → return and mobile forward → end → reverse. There are no console/page errors or failed requests.
- `node --check js/tbm-reveal-v9.js`, V9 Python compilation, JSON contract parsing, asset gate, `python tests/test_tbm_v9_visual.py`, HTTP 200, Product Focus geometry guard, and `git diff --check` pass.
- Final evidence: `artifacts/reference-match-v9/browser/desktop-reversed-to-opening.png`, `desktop-final-hero.png`, `mobile-reversed-25.png`, and `product-constellation-retained.png`.

## Superseded claims

- The pre-existing V4 handoff and its renderer/capture claims are stale and must not guide further changes.
- V8's live Three.js/GLB approach is not a fallback. It caused material, assembly, camera, and handoff regressions because browser rendering was substituted before visual parity was demonstrated.

## Open approval and constraint

- The source approval manifest is deliberately `pending-headed-browser-review`: `artifacts/tbm-v9-approval/gate-01-source-stills-r01/approval-manifest.json`.
- Chrome CDP at port 9223 is unavailable. Headless browser captures are diagnostic and passed, but they do not replace a headed visual review.
- No commit, deploy, or external publication has been made in this pass.

## Required next action

1. Open the local preview in a headed browser and inspect the forward/reverse reveal, final hero continuity, brightness/material balance, and mobile layout.
2. If changes are requested, retain V9's pre-rendered Cycles architecture; back up each affected file and extend the existing V9 tracker before editing.

## Rollback

- Restore pre-V9 active page files from `backup/v9_visual_recovery_20260726/originals/` as mapped in `backup/v9_visual_recovery_20260726/REVERT_TRACKING.md`.
- Remove additive V9 JS/CSS/assets only if fully reverting to the V7 baseline.
