# TBM V10 Continuous Cinematic Handoff — Authoritative Handoff

**Updated:** 2026-07-27

## Current state

- The prior V9 handoff is superseded. The active page loads `css/tbm-cinematic-v10.css` and `js/tbm-cinematic-v10.js` from `index.html`.
- V10 uses one persistent canvas across reveal and homepage handoff. There is no normal-motion static hero sculpture image; the V9 image is fallback-only.
- `assets/tbm-cinematic-v10/frame-manifest.json` is atomically published with `status: "rendered-v10"`.
- Delivery contains 132 desktop reveal frames (1600x900), 132 mobile reveal frames (900x1600), 72 desktop idle frames (1600x900), and 72 mobile idle frames (900x1600): 408 WebP files total.
- Blender is not running. The rendering phase is complete.

## Final checks completed

- `python scripts/validate-tbm-v10-assets.py`
- `node --check js/tbm-cinematic-v10.js`
- Python compilation of V10 builder/tests/scripts and JSON validation of the V10 contract
- `python tests/test_tbm_v10_visual.py`: desktop/mobile forward handoff, changing idle motion, reverse return, responsive reload, and error/request checks
- `python scripts/build-tbm-v10-approval-board.py`
- `git diff --check` (only unrelated pre-existing CRLF warnings)
- Manual inspection of generated desktop/mobile opening, handoff and reverse captures plus source boards. The final contact delivery frame contains no rejected white zig-zag or detached dash.

## Constraint and approval status

- Local preview returns HTTP 200 at `http://127.0.0.1:4173/index.html`.
- Headed Chrome/CDP at port 9223 was unavailable at final audit. The evidence is automated browser/capture validation, not a claimed headed-browser approval.

## Rollback and evidence

- Authoritative rollback register: `backup/v10_continuous_handoff_20260726/REVERT_TRACKING.md`.
- V9 snapshots/hashes: `backup/v10_continuous_handoff_20260726/originals/` and `SHA256_BASELINE.json`.
- V10 source/browser evidence: `artifacts/tbm-v10-approval/`.
- Do not edit immutable V9 files or broadly reset the dirty worktree. Retain the pre-rendered Cycles architecture; do not substitute a live GLB/Three.js rebuild.
