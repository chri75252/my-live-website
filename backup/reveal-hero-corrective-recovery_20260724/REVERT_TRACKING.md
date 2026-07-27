# TBM Reveal + Hero Corrective Recovery — Revert Tracking

## Scope

Recovery from the visually rejected V3 hero/reveal handoff. This pass preserves the technically valid 64-frame reveal runtime, restores the V2 visual renderer as the V4 foundation, adds a supported local HTTP preview, and replaces the opacity-only handoff with a measured spatial proxy handoff.

## Recovery points

- Working branch: `codex/final-forge-hero-recovery-v3`
- Existing full-pass Git ref: `backup/pre-final-forge-hero-recovery-20260724`
- Existing V3 file backups: `backup/final-forge-hero-recovery_20260724/`
- This pass pre-edit backups: this directory, preserving repository-relative paths.
- User-supplied source video and handoff files remain unmodified.

## Pre-edit inventory

| Path | Pre-edit SHA-256 | Backup path | Planned correction | Validation | Status |
|---|---|---|---|---|---|
| `index.html` | `C2F5FC863D50CF4D687980D27F1BDB4867589EEC22CC774EFAF9B869CAA54724` | `index.html` | Load V4, add proxy/limited-preview DOM | DOM, HTTP visual capture | backed up |
| `js/forge-intro.js` | `DD43EB6F3ABAE8B3DBEE8A6FDB8DCD03CD68EBC5509187D95308C58F94E9A41F` | `js/forge-intro.js` | Spatial handoff controller | syntax, lifecycle, forward/reverse capture | backed up |
| `css/forge-intro.css` | `EFBE3D95C95EA2971479EB0E596A3413854938E85EE035D5BAD09D4067A4FB9D` | `css/forge-intro.css` | Proxy animation and direct-file guidance | visual capture | backed up |
| `js/hero-3d-reveal-match-v2.js` | `22FC0D4C783343B4DA896D73CAA8692493FACCE9004A87916FE84389E6DD7A89` | `js/hero-3d-reveal-match-v2.js` | Live visual renderer; do not edit V2 | checksum after integration | backed up |
| `css/hero-reveal-match-v2.css` | `8905CE0E4331DD8AAA707998C0731BD1A966CD5CD580037EC6B276137E67BECF` | `css/hero-reveal-match-v2.css` | Live visual baseline; do not edit V2 | checksum after integration | backed up |
| `css/hero-scroll.css` | `2EBE2C6B3FD1D8CA4720270BAA43D789C779AE303AEEC0B16A5C5B88E632E1D4` | `css/hero-scroll.css` | No planned edit; retained as active shared baseline | readback | backed up |
| `js/forge-frame-sequence.js` | preserved copy | `js/forge-frame-sequence.js` | No planned edit unless runtime proof exposes a defect | existing validator | backed up |
| `assets/forge-reveal/frame-manifest.json` | preserved copy | `assets/forge-reveal/frame-manifest.json` | No planned edit | existing validator | backed up |
| `scripts/validate-forge-frame-sequence.mjs` | reconstructed exact pre-V4 validator | `scripts/validate-forge-frame-sequence.pre-v4.mjs` | Replace stale V3 integration assertions with V4 recovery assertions | syntax and execution | validated |

## New files

| Path | Purpose | Rollback |
|---|---|---|
| `js/hero-3d-reveal-match-v4.js` | V2-derived calibrated renderer with lifecycle, single-scroll-owner and diagnostics | remove and restore `index.html` |
| `css/hero-reveal-match-v4.css` | Handoff-ready canvas and card presentation above the V2 stylesheet | remove and restore `index.html` |
| `preview-site.cmd` | One-click local HTTP preview | remove |
| `scripts/capture-reveal-match-v4.mjs` | Reproducible five-viewport reveal-path capture | remove |
| `scripts/verify-reveal-match-v4.py` | V4 source, manifest and static-match contract verification | remove |
| `artifacts/final-forge-v4/` | Calibration, capture and runtime-matrix evidence | remove if evidence is no longer required |

## Execution log

| Phase | Action | Evidence | Status |
|---|---|---|---|
| 0 | Created corrective recovery directory, recorded hashes, copied all planned existing targets before edits. | This tracker and file copies. | complete |
| 1 | Added local HTTP launcher and explicit direct-file limited-preview path. | `preview-site.cmd`; HTTP 200 at `127.0.0.1:4173`; `capture/desktop-1366x768-direct-file-limited.png`; `runtime-matrix.json` | complete |
| 2 | Preserved V2 unchanged and made V4 an actual V2-derived renderer with reveal lifecycle control. | V2 hashes remain `22FC...7A89` and `8905...CEF`; V4 syntax and runtime diagnostics pass. | complete |
| 3 | Added final-frame proxy, measured DOM-rectangle handoff, short final swap, settle delay and post-settle cards/motion. | Five-viewport automated capture; `desktop-1920x1080-spatial-midpoint.png`, `swap.png`, `settled.png`, and reverse evidence. | complete |
| 4 | Removed the independently progressing GSAP hero pin; reveal owns scroll through handoff and hero begins at progress zero. | `pinSpacerCount: 0`, hero `targetProgress: 0` at settled state in `automated-capture/diagnostics.json`. | complete |
| 5 | Calibrated the static V4 silhouette against production frame 64. | `calibration/static-match-metrics.json`: centre X `0.22%`, centre Y `1.38%`, width `1.99%`, height `2.69%`; overlay, difference and masks saved. | complete |
| 6 | Defined mobile as a live lower-cost WebGL continuation with the visible 3D stage before the copy. | 390×844 and 430×932 captures; mobile direct renderer, no post-processing, visible target canvas, no pin spacer. | complete |
| 7 | Validated reduced motion, manifest failure, WebGL context loss and direct-file limited mode. | `artifacts/final-forge-v4/runtime-matrix.json`; all paths fail open or degrade deliberately. | complete |
| 8 | Ran source checks and durable validation. | `node --check`, Python compile, frame validator, V4 verifier, five-viewport capture, `git diff --check`. | complete |
| 9 | Headed-user-browser visual approval and source-frame watermark decision. | CDP `127.0.0.1:9223` unavailable; headless system Chrome used. Frame 64 still contains the supplied lower-right star mark. | pending user review |

## Restore procedure

1. Stop the local preview server if it is running.
2. Restore each edited existing file from this directory using its matching relative path.
3. Remove only the new files listed above.
4. Run the validation commands recorded in the final execution log.
5. If the complete prior V3 state is required, restore from the earlier `backup/final-forge-hero-recovery_20260724/` directory or the Git backup ref; do not delete user untracked files.
