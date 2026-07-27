# Reference Match V6 — Revert Tracking

**Implementation pass:** 25 July 2026  
**Purpose:** replace the active V5 hero/reveal and Product Focus presentation with the approved cinematic reference-match implementation.  
**Rule:** no existing V5 asset or source file is deleted in this pass. Reversion restores the backed-up `index.html` and removes only files created by this pass.

## Pre-edit snapshot

| Target | Backup / restore source | Intended change | Validation | Status |
|---|---|---|---|---|
| `index.html` | `originals/index.html` | activate V6 stylesheet/modules, V6 reveal markup, hero composition and Product Focus network markup | HTML inspection, browser capture, console/network checks | complete |
| `css/tbm-reference-match-v6.css` | new file; remove it to revert | cinematic reference-match layout, responsive fallback, Product Focus art direction | CSS load + desktop/mobile screenshots | complete |
| `js/tbm-reveal-v6.js` | new file; remove it to revert | single owner for pre-rendered reveal and handoff | syntax check + scroll capture + reduced-motion check | complete |
| `js/tbm-product-network-v6.js` | new file; remove it to revert | card selection, filters, keyboard controls and SVG network state | syntax check + interaction test | complete |
| `blender/reference-match/scripts/build_reference_match.py` | new file; remove it to revert | Cycles scene, keyframes, cards and web-ready render outputs | Blender headless build + render artifact review | complete |
| `blender/reference-match/config/scene-contract.json` | new file; remove it to revert | V6 scene/output contract | JSON parse + script read | complete |
| `assets/tbm-cinematic-v6/**` | new outputs; remove directory to revert | posters, reveal frames, Product Focus stills and manifests | path/size manifest verification | complete |

## Progress log

- 2026-07-25: Created backup directory and copied `index.html` before any modification. Hash comparison completed.
- 2026-07-25: First headless Blender build stopped before rendering because Blender 5.2 no longer exposes `Scene.node_tree`. The new V6-only build script was corrected to avoid that stale compositor API; no existing website file changed.
- 2026-07-25: Second headless build stopped before rendering due to an invalid V6 smoke-volume tuple. Corrected the new script to pair each volume location with a scale explicitly.
- 2026-07-25: A CPU Cycles render was stopped after timing evidence showed an available RTX 3070 Ti was not in use. The V6 script now explicitly selects an available OptiX/CUDA device and supports rendering one keyframe per command for bounded validation.
- 2026-07-25: Reviewed the first rendered V6 keyframe. It failed the visual gate because the world and area-light intensities produced a bright studio background instead of the required near-black cinematic scene. Corrected only the new V6 scene script: explicit black world/backdrop, reduced key/rim/ground lights, and darker core response before rerender.
- 2026-07-25: Corrected a V6-only Python indentation error introduced while adjusting the core clearcoat setting. Blender compilation is rerun before rendering.
- 2026-07-25: Second keyframe review showed the smoke-volume shader was scattering the area lights across the entire frame, masking the required black background. Added an explicit low-density multiplier to the new V6 volume node graph before rerender.
- 2026-07-25: Follow-up inspection isolated the remaining bright backdrop to a Blender node-material mismatch: `diffuse_color` did not change the Principled node used for final rendering. Replaced it with an explicit near-black node material in the V6-only scene script.
- 2026-07-25: Replaced active `index.html` from the verified backup with a V6-only homepage surface. The page now loads the V6 reveal, rendered hero plate, five-card network, and V6 lower sections. Legacy V5 files are preserved and the backup restoration path remains valid.
- 2026-07-25: Reduced the V6 web sequence from 48 to 24 denoised Cycles frames at 8 samples. High-sample Cycles keyframes remain the visual-approval outputs; the lower-sample sequence is a measured web-delivery derivative to keep render and transfer cost bounded.
- 2026-07-25: Reviewed the V6 handoff keyframe. The scene is now correctly black-backed and materially richer, but the sculpture still used too much of the left copy area. Shifted the final camera target further left in the V6-only scene so the final rendered object moves right, matching the settled-hero composition.
- 2026-07-25: Product-card renders completed but failed visual inspection: the card camera inherited the hero framing and produced near-empty black images. Corrected the V6 card render path to reset the target and use a close macro camera on the rendered sculptural material.
- 2026-07-25: Browser hero capture showed the final image still cropped the sculpture into the copy column. The V6 final camera is now pulled back while retaining the right-shifted target; the high-quality handoff still will be rerendered before final browser validation.
- 2026-07-25: Re-rendered all three high-sample Cycles keyframes, five Product Focus plates, and all 24 desktop plus 24 mobile sequence frames after the final dark-exposure correction. All assets are served from the V6 delivery directory.
- 2026-07-25: Browser review identified card renders that were visually too similar/empty. Root cause was the hero animation F-curves reapplying during card renders. The V6-only card path now clears those curves after evaluating the hero end pose, uses category-specific macro geometry/materials, and has been rerendered and visually checked.
- 2026-07-25: Browser review identified the mobile hero plate competing with copy. The V6 mobile-only plate now uses reduced opacity/brightness and a stronger dark text-safe gradient; a fresh 390x844 capture confirmed readable copy.
- 2026-07-25: Final verification passed: Python compilation for the Blender script; Node syntax checks for both V6 modules; JSON parse for the scene contract; 57 expected V6 assets present and non-empty; all four sampled local HTTP paths returned 200; no active V5 imports in `index.html`; fresh desktop/mobile browser run recorded no console errors. Reveal progressed to “Structuring the network”, released correctly, and reduced-motion released automatically. Product filtering, selection, visible-card count, and keyboard selection were verified.

## Revert procedure

1. Replace `index.html` with `originals/index.html`.
2. Remove the V6 files/directories listed as new-file targets above.
3. Start the local preview and verify the V5 imports and assets are active again.
4. Do not delete the prior `assets/forge-reveal-v5/`, `assets/armillary/`, `blender/`, `js/hero-3d-blender-v5.js`, or `css/tbm-experience-v5.css` files.
