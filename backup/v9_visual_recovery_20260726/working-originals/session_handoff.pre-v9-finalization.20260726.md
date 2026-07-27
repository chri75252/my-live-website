# TBM Reveal + Hero V4 Recovery Handoff

## Authoritative current state

- Branch: `codex/final-forge-hero-recovery-v3`
- HEAD remains `65cdf3c`; the recovery is uncommitted and not deployed.
- Active reveal: 64 MP4-derived frames, source frames 0–159, manifest-driven.
- Active hero: `js/hero-3d-reveal-match-v4.js` with V2 visual foundations, lifecycle control, calibrated static pose, delayed cards/motion, and no independent GSAP pin.
- Active hero CSS: V2 baseline plus `css/hero-reveal-match-v4.css`.
- Supported preview: `http://127.0.0.1:4173/index.html` through `preview-site.cmd`.
- Direct `file://` viewing is deliberately limited and shows an explicit notice.

## Superseded claims

- V3 is not the active renderer and its prior technical “complete” status was visually rejected.
- The earlier V4 wrapper was not a complete V4 renderer and did not control V2 motion or scroll ownership. It is preserved at `backup/reveal-hero-corrective-recovery_20260724/js/hero-3d-reveal-match-v4-wrapper-pre-calibration.js`.
- The blank/duplicated-homepage defect was not caused solely by the reveal spacer. Runtime evidence showed the hero ScrollTrigger had already progressed to about 90% and created a pin spacer behind the reveal. V4 now has one reveal scroll owner through handoff and starts hero progress at zero.

## Completed and verified

- V2 source JS/CSS hashes remain unchanged.
- Static match passes the plan tolerances:
  - centre X difference: 0.22% of stage;
  - centre Y difference: 1.38%;
  - silhouette width difference: 1.99%;
  - silhouette height difference: 2.69%.
- Five-viewport automated path passed at 1920×1080, 1680×900, 1366×768, 390×844, and 430×932.
- Forward, spatial midpoint, swap, settled, and reverse captures exist.
- No V4 `pin-spacer` is created; hero `targetProgress` is zero at reveal release.
- Mobile uses the direct renderer and keeps the handoff canvas in the first viewport.
- Reduced motion, manifest failure, WebGL context loss, and direct-file limited mode pass.
- Syntax, Python compilation, frame validation, V4 verification, and `git diff --check` pass.

## Evidence

- `artifacts/final-forge-v4/automated-capture/diagnostics.json`
- `artifacts/final-forge-v4/calibration/static-match-metrics.json`
- `artifacts/final-forge-v4/calibration/static-50-50-overlay.png`
- `artifacts/final-forge-v4/runtime-matrix.json`
- `artifacts/final-forge-v4/capture/`

## Open approvals and limitations

- The supplied final reveal frame still contains the lower-right generator/star mark. It has not been retouched.
- The static pose meets numeric silhouette gates, but final visual approval belongs to Christian.
- Chrome CDP port 9223 was unavailable. Browser checks used the installed system Chrome in headless mode; headed-user-browser review and screen recording remain pending.
- No merge, commit, push, pull request, Sites deployment, GitHub Pages deployment, or DNS change has been made.

## Next checks

1. Christian opens `preview-site.cmd` and reviews forward and reverse behavior in the headed browser.
2. Confirm whether frame 64’s lower-right star mark is accepted or a clean source must replace it.
3. If approved, run the durable validators once more and decide separately whether to commit/deploy.

## Rollback

- Corrective-pass backup and tracker: `backup/reveal-hero-corrective-recovery_20260724/`
- Earlier V3 backup: `backup/final-forge-hero-recovery_20260724/`
- Full pre-pass Git ref: `backup/pre-final-forge-hero-recovery-20260724`
