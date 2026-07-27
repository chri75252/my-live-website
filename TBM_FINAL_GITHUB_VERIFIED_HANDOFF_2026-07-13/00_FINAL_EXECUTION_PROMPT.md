# Final Execution Prompt — Recover and Finish the TBM Reveal + Live Armillary

Work directly against:

`https://github.com/chri75252/my-live-website`

## Starting point

Use current `main` at or after:

`65cdf3c34ad6fc87837bee9969b1d382cf3bb762`

That commit is the squash merge of PR #12. PR #11 and PR #12 are already merged; do not attempt to continue either merged branch as the final delivery branch.

Create one new backup ref and one new implementation branch from current `main`, for example:

```text
backup/pre-final-forge-hero-recovery-2026-07-13
feature/final-forge-hero-recovery-v3
```

Open one new **draft PR**. Keep all implementation, tests, evidence and final refinements in that PR. Stop before merge for explicit user approval.

## User-provided asset

The user will supply the original reveal video. Use it as the primary source for:

- motion cadence;
- visual quality;
- frame extraction;
- final clean reveal state;
- reveal-to-live-object calibration.

The current repository JPG frames were produced by a tool that appears to have compressed them too heavily. Do not simply re-encode those JPGs and call the reveal improved.

## Final objective

Deliver a polished homepage experience in which:

1. scrolling through the reveal is smooth and deterministic;
2. the reveal does not appear to skip frames or change rate inconsistently;
3. the final reveal state transitions cleanly into the homepage;
4. the persistent Three.js armillary looks like the live continuation of the reveal object;
5. the result is visually richer and more premium than the current deployed component;
6. mobile and desktop remain performant and accessible.

## Mandatory first actions

Before writing code:

1. Retrieve and read all current production files named in `07_EXACT_REPOSITORY_INSPECTION_MAP.md` from current `main`.
2. Read merged PRs #3–#12 and inspect the historical files/commits listed in `03_PR_HISTORY_AND_REUSE_MAP.md`.
3. Recursively inspect repository folders:
   - `REFERENCE/`
   - `docs/tbm-3d-handoff/`
   - `skills/`
   - `artifacts/forge-frame-audit/`
   - `TEVEAL/`
   - `assets/forge-reveal/`
4. Read each external skill at the exact GitHub URL listed in `06_SKILL_AND_TOOLCHAIN_MATRIX.md`.
5. Inspect the supplied source video with `ffprobe` and `ffmpeg`; generate a lossless numbered contact sheet and frame inventory.
6. Reproduce the current deployed regression locally before modifying it.
7. Capture a performance trace showing the reveal and the reveal-to-homepage transition.

## Do not confuse CI success with visual success

PR #12 passed its automated evidence workflow, but the user has now tested the deployed result and rejected the visual quality and reveal smoothness. The new agent must prioritize real observed behavior over stale CI claims.

## Part A — reveal recovery

Audit the current interaction between:

- `js/forge-intro.js`
- `js/forge-frame-sequence.js`
- `css/forge-intro.css`
- `js/hero-3d-reveal-match-v2.js`
- `css/hero-reveal-match-v2.css`

Test the hypotheses in `02_CONFIRMED_PROBLEMS_AND_ROOT_CAUSE_HYPOTHESES.md`, especially simultaneous hidden WebGL rendering, the two-stage requestAnimationFrame pipeline, blur-heavy 2D Canvas drawing, nearest-loaded-frame fallback, only 32 source frames, and mismatch between reveal progress and the live hero's independent ScrollTrigger state.

Use the supplied video to determine the correct production approach. Do not assume the existing 32-frame output must remain. Choose the frame count and format from evidence, image quality, decoded-memory cost and real-device performance.

A likely good solution is a higher-quality, correctly sampled image sequence with all required frames decoded before active scrubbing, a single render scheduler, no hidden continuous WebGL workload during most of the reveal, and an explicitly coordinated handoff pose. This is a hypothesis to validate, not a mandatory implementation.

## Part B — live armillary reconstruction

The current PR #12 object is technically competent but visually too simplified and still does not match the reveal closely enough.

Reconstruct/tune the live object using the reveal video and frames 029–031 as the visual target. Reuse the strongest prior ideas selectively:

- PR #4: full-size initial composition and immediate subtle ambient motion;
- PR #5: geometry-aware camera fitting and restrained desktop post-processing only;
- PR #6: six restrained nodes, three surface-bound reflections, no pedestal/halo/comets, deterministic progression;
- PR #7: custom black-metal shader with three elongated surface glints and dark bronze treatment;
- PR #8: direct premium hero framing, larger presence, six nodes, three glints, subtle particles;
- PR #9: exact user-preferred pre-PR5 size/presence baseline;
- PR #12: current import-map architecture, diagnostics, disposal, mobile layout, direct/composer test paths and resource budgets.

Do not wholesale restore any rejected PR. Extract only the specific useful implementation sections named in this pack.

## Required visual direction

The persistent component must have:

- a deep glossy near-black sphere;
- controlled, moving or orientation-responsive surface reflections;
- a compact, deliberate bronze armillary silhouette;
- approximately three visually dominant intersecting rings, with any additional cage elements clearly subordinate;
- a fine irregular internal network;
- a small number of intentional metallic nodes;
- richer cinematic depth and presence than the current simplified result;
- no cheap red/orange neon treatment;
- no large external light balls;
- no comet heads/trails;
- no pedestal;
- no broad yellow halo.

The user explicitly preferred the earlier moving-light/surface-glint effect over later floating-light/orb treatments. Evaluate both the PR #7 shader implementation and PR #8 surface-glint implementation. Build a superior final implementation rather than blindly copying either.

## Handoff contract

The last clean reveal frame and the first live Three.js frame must be calibrated as one transition:

- same apparent centre;
- close outer diameter;
- close core diameter;
- close ring crossing angles;
- close background tone;
- close highlight placement;
- no sudden card/header interference;
- no separate independent scroll state causing the live object to appear mid-animation at release.

Pre-warm the live renderer before it becomes visible, but do not let it continuously consume full composer/GPU cost under the entire reveal. Define an explicit lifecycle such as `suspended → prewarming → handoff-ready → active` and test it.

## Performance requirements

- Measure actual frame times during reveal scrolling and handoff.
- Avoid simultaneous full-resolution 2D blur compositing and full post-processed WebGL rendering when hidden.
- Keep desktop/mobile DPR budgets evidence-based.
- Do not increase frame count without accounting for decoded memory.
- Do not use nearest-loaded fallback during user-controlled scrubbing once the reveal is declared ready.
- Prefer loading the selected variant only.
- Pause hidden/offscreen animation.
- Preserve fail-open and reduced-motion behavior.

## Evidence requirements

The final PR must include GitHub Actions artifacts—not committed generated media—with:

- source-video audit report;
- numbered lossless contact sheet;
- selected frame manifest and hashes;
- desktop and mobile reveal down-scroll recordings;
- desktop and mobile reverse-scroll recordings;
- slow incremental wheel/touch-equivalent test;
- fast scroll test;
- final-frame/handoff close-up;
- five viewport screenshots;
- persistent hero screenshots with UI and isolated stage crops;
- comparison sheets against source-video reference frames;
- performance diagnostics before and after;
- loaded-frame/decode state diagnostics;
- console/network errors;
- reduced-motion and no-JavaScript/failure fallbacks.

## Completion gate

Do not mark the task complete until:

- the user-observed reveal lag/skipping is eliminated or materially improved with evidence;
- the handoff is visibly cleaner than current production;
- the live component is materially closer to the reveal and more premium;
- both desktop and mobile are accepted visually;
- protected unrelated site behavior remains intact;
- the new PR is clean, current with `main`, and ready for user review;
- the PR remains unmerged.
