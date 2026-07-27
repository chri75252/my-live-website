# TBM V8 Surgical Implementation — Exact Revert Tracking

Date: 2026-07-26  
Plan: `TBM_V8_UNIFIED_LIVE_3D_REVEAL_HERO_PLAN_2026-07-26.md`  
Status: **fully reverted on user request**

## Revert execution record

- Restored `index.html` from `originals/index.html`; SHA-256 matches the recorded pre-edit hash.
- Restored `.sisyphus/notepads/handoff/session_handoff.md` from `originals/session_handoff.md`; SHA-256 matches the recorded pre-edit hash.
- Removed all V8 runtime, CSS, tests and support scripts from their active paths.
- Moved the V8 Blender source, web assets and validation artifacts into `reverted_generated/` inside this backup instead of destroying them.
- Restarted the restored site on port 4173 and verified HTTP 200.
- Verified the served page contains no `tbm-live-3d-v8` import and restores `js/tbm-reveal-v7.js`.

## Pre-edit evidence

- The worktree already contained extensive V3–V7 and unrelated changes.
- `index.html` was modified before this pass.
- `.sisyphus/notepads/handoff/session_handoff.md` was untracked before this pass.
- GitNexus was not indexed for this repository.
- Both affected pre-existing files were copied before editing and verified byte-identical by SHA-256.

| Existing file | Original SHA-256 | Exact backup | Backup SHA-256 |
|---|---|---|---|
| `index.html` | `E101843444FF44B29804D264DAEA23A6BF9C05939A4DCCCDA5FB27A2B1D9F0A4` | `originals/index.html` | `E101843444FF44B29804D264DAEA23A6BF9C05939A4DCCCDA5FB27A2B1D9F0A4` |
| `.sisyphus/notepads/handoff/session_handoff.md` | `CAFE6BAE0DE4345B7D94DB012B52341D7A4BCDF3E6D7ADFDBD7B2509534F7288` | `originals/session_handoff.md` | `CAFE6BAE0DE4345B7D94DB012B52341D7A4BCDF3E6D7ADFDBD7B2509534F7288` |

## Exact patch ledger

| ID | File and exact final section | Change | Direct revert |
|---|---|---|---|
| V8-R01 | `blender/reference-match-v8/config/scene-contract.json:1-65` | Added authoritative 192-frame choreography, cameras, color/lighting, performance limits and optimized GLB route. | Remove the file with the V8 directory. |
| V8-R02 | `blender/reference-match-v8/scripts/build_live_v8.py:1-984` | Added complete Blender 5.2 builder: graphite core, segmented polished orbits, forged bands, mesh cage, nodes, energy/sparks, two cameras, animation, still/poster rendering and GLB/Meshopt export. | Remove the file with the V8 directory. |
| V8-R03 | `scripts/generate-tbm-v8-smoke.py:1-61` | Added deterministic transparent smoke textures with edge-fade validation. | Remove the file. |
| V8-R04 | `index.html:17`, `index.html:31-40`, `index.html:50` | Replaced V7 reveal/hero imports and markup with one V8 sticky live-scene stage, one canvas, one hero UI, proof strip, controls and module runtime. | Restore `originals/index.html` using the command below. |
| V8-R05 | `css/tbm-live-3d-v8.css:1-353` | Added V8 scroll stage, sticky scene, transparent-canvas atmosphere, progressive copy/proof transitions, responsive sizing, fallback and reduced-motion rules. | Remove the file. |
| V8-R06 | `js/tbm-live-3d-v8.js:1-576` | Added one renderer/GLB/mixer/ScrollTrigger owner, reversible scrub, material normalization, progressive formation visibility, cinematic camera relief, right-side settled composition, idle movement, DPR/visibility lifecycle and fallbacks. | Remove the file. |
| V8-R07 | `tests/test_tbm_v8_live_3d.py:1-180` | Added four-viewport forward/reverse/layout tests and reduced-motion, optimized-GLB failure and context-loss tests. | Remove the file. |
| V8-R08 | `scripts/audit-tbm-v8-luminance.py:1-43` | Added deterministic dark/clipping thresholds for opening, handoff and final captures. | Remove the file. |
| V8-R09 | `.sisyphus/notepads/handoff/session_handoff.md:1-52` | Replaced stale V4 status with verified V8 runtime, evidence, limits and rollback state. | Restore `originals/session_handoff.md`. |

## Generated output ledger

| Output | Bytes | SHA-256 / verification |
|---|---:|---|
| `blender/reference-match-v8/TBM_LIVE_V8.blend` | generated binary | Blender 5.2 build and readback passed |
| `assets/tbm-live-v8/tbm-armillary-v8.glb` | 5,273,672 | `0426C5F3C9F94291DDCF57AA08F2DE897C5699027A590156E89097F32B1A97BB` |
| `assets/tbm-live-v8/tbm-armillary-v8.optimized.glb` | 2,343,796 | `23E90B13E1C22BE4B86932CF9C215240B5F7466681BAF75255589B87E1265527` |
| `assets/tbm-live-v8/poster-desktop.webp` | 147,120 | `D5A6E6F241C976209EF68D0DAA4965D74F324DECFBF6D8FF3AB95087A3BFEDC8` |
| `assets/tbm-live-v8/poster-mobile.webp` | 110,150 | `C3C1D2B723F45DABACF4F1D6F20C15A1709847CA90EC6CEB289C16209637BFA1` |
| `assets/tbm-live-v8/smoke/smoke-01.webp` | 53,686 | `5DA296A8ECA1C3ABC3526869A2BE39E888C3B0837A3407610D1B95708DEA8454` |
| `assets/tbm-live-v8/smoke/smoke-02.webp` | 46,004 | `0202FB536356E6C2A4679C769F18CEAC08CC72A9CB094DD237A773F064A00D32` |
| `artifacts/reference-match-v8/approval/` | 14 PNG stills | desktop/mobile frames 1, 34, 78, 110, 150, 178 and 192 rendered successfully |
| `artifacts/tbm-v8-validation/` | screenshots + JSON | forward/reverse captures and runtime records for all four viewports |

## Validation log

| Phase | Command/evidence | Result |
|---|---|---|
| Backup | SHA-256 comparison of both original files and backups | Passed; byte-identical |
| Smoke | `python scripts/generate-tbm-v8-smoke.py` plus alpha/edge inspection | Passed; two 1024×1024 transparent WebP assets |
| Blender build | Blender 5.2 background build | Passed |
| Approval | Blender `--mode approval-stills` | Passed; 14 stills regenerated after final scene work |
| GLB export | Blender `--mode glb` | Passed; required rigs, cameras and `ForgeReveal` present |
| Optimization | Blender `--mode glb-optimized` | Passed; 5.27 MB reduced to 2.34 MB using `EXT_meshopt_compression` |
| JS/Python/JSON | `node --check`; `python -m py_compile`; `python -m json.tool` | Passed |
| Browser suite | `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python -m pytest tests/test_tbm_v8_live_3d.py -q` | Passed: `7 passed in 249.36s` |
| Final desktop visual rerun | `test_v8_handoff_reverse_and_layout[viewport0]` after final camera framing | Passed: `1 passed in 49.84s` |
| Luminance | `python scripts/audit-tbm-v8-luminance.py` | Passed; dark ratios 0.560 / 0.533 / 0.521, clipped ratio 0.00042 |
| Diff hygiene | `git diff --check` on modified tracked files | Passed; only Git line-ending notice |
| Visual inspection | opening, 53%, 84% and final screenshots opened at original resolution | Passed automated design review; headed human approval remains pending |

## Exact full revert

Run these from the repository root:

```powershell
Copy-Item -LiteralPath 'backup\unified_live_3d_v8_20260726\originals\index.html' -Destination 'index.html' -Force
Copy-Item -LiteralPath 'backup\unified_live_3d_v8_20260726\originals\session_handoff.md' -Destination '.sisyphus\notepads\handoff\session_handoff.md' -Force
Remove-Item -LiteralPath 'css\tbm-live-3d-v8.css' -Force
Remove-Item -LiteralPath 'js\tbm-live-3d-v8.js' -Force
Remove-Item -LiteralPath 'tests\test_tbm_v8_live_3d.py' -Force
Remove-Item -LiteralPath 'scripts\audit-tbm-v8-luminance.py' -Force
Remove-Item -LiteralPath 'scripts\generate-tbm-v8-smoke.py' -Force
Remove-Item -LiteralPath 'blender\reference-match-v8' -Recurse -Force
Remove-Item -LiteralPath 'assets\tbm-live-v8' -Recurse -Force
Remove-Item -LiteralPath 'artifacts\reference-match-v8' -Recurse -Force
Remove-Item -LiteralPath 'artifacts\tbm-v8-validation' -Recurse -Force
```

Then run `preview-site.cmd` and confirm the restored V7 imports and runtime. Do not remove this backup directory.

## Partial reverts

- Runtime behavior only: remove the V8 JS import from `index.html`, restore the matching V7 script/import block from `originals/index.html`, then remove `js/tbm-live-3d-v8.js`.
- Layout only: restore the V7 markup and stylesheet links from `originals/index.html`, then remove `css/tbm-live-3d-v8.css`.
- 3D source/assets only: remove `blender/reference-match-v8` and `assets/tbm-live-v8`, but first restore `index.html`; otherwise the active page will intentionally enter fallback.
- Documentation only: restore `originals/session_handoff.md`; no runtime files are affected.
