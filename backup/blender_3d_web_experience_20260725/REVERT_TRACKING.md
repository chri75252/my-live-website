# Blender 3D Web Experience Revamp — Revert Tracking

**Implementation date:** 2026-07-25  
**Branch at start:** `codex/final-forge-hero-recovery-v3`  
**Baseline commit:** `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`  
**Scope:** implement the approved Blender-led reveal, GLB hero, and connected homepage sections without altering existing V2/V4 source modules.

## Baseline protection

| Existing file to edit | Backup source | SHA-256 at backup | Intended scope | Restore action | Validation status |
|---|---|---|---|---|---|
| `index.html` | `backup/blender_3d_web_experience_20260725/index.html` | `A6BBCD6240E4EC8489CC198756F4C2358DE164E631F0608C48F150E5BBD35FFA` | load V5 assets and replace homepage markup | copy backup over `index.html` | verified |
| `js/forge-intro.js` | `backup/blender_3d_web_experience_20260725/forge-intro.js` | `328A614CC20959A6EF7BF40C03A60757CAB22BC3811C76B589D7CA249AF9BF21` | point the tested scroll controller at the Blender V5 frame manifest | copy backup over `js/forge-intro.js` | verified |

## New files (remove to revert V5)

| New file / directory | Purpose | Removal only after confirming no other change depends on it | Validation status |
|---|---|---|---|
| `blender/config/tbm-scene-contract.json` | master asset contract | yes | pending |
| `blender/scripts/build_tbm_armillary.py` | deterministic Blender scene builder/exporter | yes | pending |
| `blender/tbm-armillary-master.blend` | editable Blender source | yes | pending |
| `assets/forge-reveal-v5/` | Blender-rendered reveal frame sequence | yes | pending |
| `assets/armillary/tbm-armillary-v5.glb` | live hero GLB | yes | pending |
| `css/tbm-experience-v5.css` | scoped V5 presentation layer | yes | pending |
| `js/forge-intro-v5.js` | scroll-controlled frame reveal | yes | pending |
| `js/hero-3d-blender-v5.js` | GLB loader and interactive hero | yes | pending |
| `js/home-sections-v5.js` | category/process/insight interactions | yes | pending |

## Progress log

| Time | Phase | Change | Verification | Revert status |
|---|---|---|---|---|
| 2026-07-25 | 0 | Created backup directory and copied `index.html`. | SHA-256 of backup matches source. | baseline protected |
| 2026-07-25 | 1 | Added deterministic Blender contract/builder; generated `.blend`, GLB and 64 desktop + 64 mobile WebP frames. | Blender exited 0; manifest and frame counts verified; GLB is 729,420 bytes. | new-file removal path recorded |
| 2026-07-25 | 2 | Rebuilt `index.html` around the Blender reveal, V5 GLB hero, connected Product Focus, supplier journey and Commercial Insights section. Added scoped V5 CSS and interaction modules. | JS syntax checks and `git diff --check` passed. | restore `index.html`; remove new V5 files |
| 2026-07-25 | 3 | Corrected the live Three.js camera to view the Blender-converted depth axis and normalised Blender's per-mesh GLB scale conversion. | Chromium visual capture shows the full armillary; renderer reports 30,336 triangles. | restore changed controller / V5 files as applicable |
| 2026-07-25 | 4 | Ran desktop, mobile, interaction and reduced-motion browser validation. | 64/64 reveal frames loaded with 0 failures; no page errors; category selector updates; all 4 journey steps reveal; reduced motion bypasses the intro. | verified |

## Final validation evidence

- `artifacts/blender-v5-validation/desktop-reveal-motion-final.png`
- `artifacts/blender-v5-validation/desktop-handoff-final.png`
- `artifacts/blender-v5-validation/desktop-product-focus-final.png`
- `artifacts/blender-v5-validation/mobile-hero-visual-final.png`
- Browser state: 64 reveal frames loaded, 0 failures; GLB renderer reports 30,336 triangles; no console errors.
- Note: six diagnostic screenshots remain in the evidence directory because the environment blocked their deletion. They are not loaded by the website and can be safely deleted manually.

## Restore procedure

1. Stop the local preview server if it is running.
2. Restore `index.html` from the backup listed above.
3. Delete only the new V5 files/directories listed in the new-files table.
4. Reload through `preview-site.cmd` (not `file://`) and run the original frame-sequence validator.
5. Compare `git diff -- index.html` with the baseline before making any further recovery change.
