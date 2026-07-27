# TBM V10 Continuous Cinematic Handoff — Revert Tracking

**Created:** 2026-07-26
**Status:** implementation complete; automated/browser-capture verification passed. Headed Chrome review remains explicitly unavailable, not implied as approved.
**Authoritative baseline:** V9 Cycles image sequence as captured in `originals/` and `SHA256_BASELINE.json`.

## Restore procedure

- Restore an original V9 file by copying its explicitly mapped file from `originals/` back to its listed live path.
- V10 files are additive. To remove only a V10 patch, delete only the V10 paths stated in that patch's restore row after verifying no later V10 patch depends on them.
- Do not use `git reset`, `git checkout`, or a broad recursive deletion. All existing worktree changes are preserved.

## Immutable V9 references

| Live file | Baseline restore source | SHA-256 inventory | Rule |
|---|---|---|---|
| `index.html` | `originals/index.html` | `SHA256_BASELINE.json` | May receive only the V10 asset/controller wiring patch. |
| `js/tbm-reveal-v9.js` | `originals/tbm-reveal-v9.js` | `SHA256_BASELINE.json` | Never edit. |
| `css/tbm-reference-refinement-v9.css` | `originals/tbm-reference-refinement-v9.css` | `SHA256_BASELINE.json` | Never edit. |
| `blender/reference-match-v9/scripts/build_reference_match_v9.py` | `originals/build_reference_match_v9.py` | `SHA256_BASELINE.json` | Never edit. |
| `blender/reference-match-v9/config/scene-contract.json` | `originals/scene-contract-v9.json` | `SHA256_BASELINE.json` | Never edit. |
| `tests/test_tbm_v9_visual.py` | `originals/test_tbm_v9_visual.py` | `SHA256_BASELINE.json` | Never edit. |
| `assets/tbm-cinematic-v9/frame-manifest.json` | `originals/frame-manifest-v9.json` | `SHA256_BASELINE.json` | Never edit. |

## Patch register

| Patch | Exact paths / anchors | Backup or restore source | Required validation | Status |
|---|---|---|---|---|
| V10-R00 | V9 evidence only | `originals/`, hashes above | V9 syntax, visual, asset, browser gate | Complete; immutable V9 references retained. |
| V10-R01 | `blender/reference-match-v10/config/scene-contract.json`; `blender/reference-match-v10/scripts/build_reference_match_v10.py` | Additive; remove these V10 paths to reverse | JSON parse; `py_compile`; V9 byte parity before V10-only code | Complete; V10 source remains additive and compiles. |
| V10-R02 | V10 builder: `camera_keys`, `target_keys`, `mobile_camera_keys` | V10 builder prior copy in `working-originals/` before patch | checkpoint render/contact sheet | Complete; desktop/mobile opening, contact, network and handoff checkpoint boards regenerated. |
| V10-R03 | V10 builder: former `create_contact_arc`, retained `contact_events` | `working-originals/build_reference_match_v10.pre-v10-r03c-remove-arc-geometry.20260727.py` restores the pre-removal V10 builder | isolated Cycles contact checkpoint, then full-sequence contact-frame inspection | Complete; curve geometry is absent in final source/delivery; attached warm contact pulse plus ember events retained. Earlier rejected deliveries remain diagnostics only. |
| V10-R04 | V10 builder: `create_ember`, `build_embers` | V10 builder prior copy in `working-originals/` before patch | ember checkpoint render | Complete; ballistic ember streak source present and final contact delivery frame was visually checked. |
| V10-R05 | V10 builder: `create_smoke` | V10 builder prior copy in `working-originals/` before patch | smoke checkpoint render | Complete; source readback plus first/last idle seam measurements recorded below. |
| V10-R06 | V10 builder: `extend_idle`, `render_idle`, manifest build | V10 assets/additions only | frame counts, seam test, manifest parse | Complete; rendered-v10 manifest atomically published with 132 reveal and 72 idle frames per device. |
| V10-R07 | `js/tbm-cinematic-v10.js` | Additive; remove V10 controller | `node --check`; browser state tests | Complete; continuous canvas, idle and reverse browser assertions pass. |
| V10-R08 | `index.html`: V10 preload/CSS and `data-cinematic-stage`/`hero-v10` markup | `originals/index.html` | DOM/runtime/browser transition test | Complete; source reread confirms one V10 canvas and no normal-motion hero sculpture image. |
| V10-R09 | `css/tbm-cinematic-v10.css` | Additive; remove V10 stylesheet link and CSS | viewport snapshots desktop/mobile | Complete; desktop/mobile captures were regenerated and visually inspected. |
| V10-R10 | `tests/test_tbm_v10_visual.py`, capture/asset scripts | Additive | source, asset, browser, visual gates | Complete; validator, syntax/compile, contract, browser regression and approval-board generation pass. |
| V10-R11 | `artifacts/tbm-v10-approval/` and activation links | Remove V10 approval artifacts / revert wiring | final audit | Complete with caveat: headed Chrome/CDP was unavailable; automated captures and source boards were inspected instead. |
| V10-R12 | `.sisyphus/notepads/handoff/session_handoff.md` authoritative-state correction only | `working-originals/session_handoff.pre-v10-final-audit.20260727.md` | Readback, exact backup hash parity, Markdown diff check | Complete; stale V9-only handoff replaced with V10 evidence and caveat. |

## Verification log

| UTC time | Patch | Exact check | Result / artifact | Next action |
|---|---|---|---|---|
| 2026-07-26 | V10-R00 | V10 backup inventory created | `SHA256_BASELINE.json` | Run V9 baseline tests and captures before V10 build |
| 2026-07-26 | V10-R00 | V9 syntax, JSON, visual and Product Focus guards | Passed; `v9-baseline-checks.json` | V10 source permitted |
| 2026-07-26 | V10-R01 | V9 builder/contract copied to additive V10 paths; source parity recorded | Passed; V10 `.blend` saved by Blender 5.2 | Camera/VFX changes isolated in V10 builder |
| 2026-07-26 | V10-R02–R05 | Cycles desktop/mobile checkpoint render and manual desktop inspection | Passed; V10 opening/contact/close/network/handoff checkpoints; original first preview was retained only as diagnostic due to old artifact path, corrected in source for future renders | Full sequence render restarted with V9 staging manifest intact |
| 2026-07-26 | V10-R06 | Idle seam schedule changed to publish 241–335 only | Corrected before full delivery render; frame 336 remains a non-published seam witness | Full render restarted |
| 2026-07-26 | V10-R07–R10 | `node --check`, Python compile, manifest JSON, desktop/mobile browser flow | Passed; `tests/test_tbm_v10_visual.py`, `artifacts/tbm-v10-approval/browser/` | Await full V10 asset publication |
| 2026-07-26 | V10-R06 (seam correction) | `create_smoke` W keys now 240=2.4, 288=3.15, 336=2.4; deliverable frames are 241–335 | V10 source rebuild passed; incomplete delivery render stopped before publication and seam-corrected render started | Await full asset gate |
| 2026-07-26 | V10-R08–R09 (mobile + semantics) | `hero-v10` mobile copy narrowed; actions/promises hidden at mobile; cinematic stage restored inside `main#main-content` | `tests/test_tbm_v10_visual.py` passed desktop/mobile after each change | Await full V10 asset activation |
| 2026-07-26 | V10-R07 (responsive + staged seam) | Controller now reloads at the desktop/mobile breakpoint and starts the V9 staging idle at final reveal frame 120 | `node --check` and `tests/test_tbm_v10_visual.py` passed | Final V10 assets still gated by manifest |
| 2026-07-26 | V10-R10 (final asset assertion) | Browser test now asserts changing idle frame plus 132/72 decoded-frame counts when the rendered V10 manifest is active | `python tests/test_tbm_v10_visual.py` passed on staged V9 path | Run again immediately after atomic V10 publication |
| 2026-07-26 | V10-R03 visual gate | Inspected `assets/tbm-cinematic-v10/reveal-desktop/frame_0040.webp` during seam-corrected delivery render | **Rejected**: `Contact_B` appeared as an exposed white zig-zag. Render process 62676 was stopped; 45 partial frames were preserved under `diagnostics/seam-corrected-render-rejected-white-arc/`; staged V9 manifest remained unchanged | Correct arc duration, visible length, jitter and branch count; checkpoint render must pass before restart |
| 2026-07-26 | V10-R03b source correction | Backed up the builder before edit at `working-originals/build_reference_match_v10.pre-v10-r03b-short-contact-arcs.20260726.py`; reduced arc to 32% contact path, 11 points, 0.0022 bevel, 3-frame lifetime and two conditional forks | `python -m py_compile blender/reference-match-v10/scripts/build_reference_match_v10.py` passed | Render and inspect only `phase-contact-push` before a new delivery render |
| 2026-07-26 | V10-R03b isolated visual gate | Rendered `assets/tbm-cinematic-v10/keyframes/phase-contact-push.png` with Blender Cycles 5.2 after the correction | **Passed**: no exposed white zig-zag was present; preserved core, forged brass bands, polished bronze treatment, background grade and brightness were visually re-inspected | Full V10 Cycles render restarted as process 19892; still staged and unpublished |
| 2026-07-26 | V10-R11 pre-delivery checkpoint set | Full render regenerated `phase-opening`, `phase-contact-push`, `phase-material-close`, `phase-network-orbit`, `phase-handoff` under `assets/tbm-cinematic-v10/keyframes/` before delivery frame 1 | Files were regenerated with current V10 source; contact checkpoint manually reviewed | Inspect delivery contact frames after overwrite, then await 408-frame completeness gate |
| 2026-07-27 | V10-R03b delivery visual gate | Inspected regenerated `assets/tbm-cinematic-v10/reveal-desktop/frame_0040.webp` from full render process 19892 | **Rejected**: shortened curve no longer zig-zagged, but remained a detached near-white dash. Process stopped before manifest publication; evidence preserved at `diagnostics/r03b-rejected-detached-white-dash/` | Remove electric curve geometry entirely and use only attached warm contact light plus ballistic embers |
| 2026-07-27 | V10-R03c remove arc geometry | Backed up prior builder at `working-originals/build_reference_match_v10.pre-v10-r03c-remove-arc-geometry.20260727.py`; removed `create_contact_arc` and all arc creation; retained contact events for embers and contact-light pulse | `python -m py_compile blender/reference-match-v10/scripts/build_reference_match_v10.py` passed; regenerated and visually inspected `keyframes/phase-contact-push.png` | **Passed**: no detached white geometry; render full V10 delivery from this source |
| 2026-07-27 | V10-R06/R11 final delivery attempt | Blender 5.2 full Cycles delivery process 24832 started from R03c source; pre-existing staged manifest retained | Process confirmed running; V9 staging remains active until `publish_manifest()` sees all 408 V10 delivery frames | Inspect regenerated contact delivery frame and wait for exact desktop/mobile reveal/idle asset gate |
| 2026-07-27 | V10-R03c actual delivery visual gate | Inspected regenerated `assets/tbm-cinematic-v10/reveal-desktop/frame_0040.webp` (delivery index 40 / Blender source frame 72) after R03c removed all curve arc creation | **Passed**: no white zig-zag or detached dash; approved sphere, polished bronze, forged brass and grade remain intact | Continue full 408-frame Cycles delivery run; do not change manifest before exact asset gate |
| 2026-07-27 | V10-R06 final render completion | Inspected process table, manifest and each delivery directory | Blender process absent; manifest is `rendered-v10`; reveal desktop 132 at 1600x900, reveal mobile 132 at 900x1600, idle desktop 72 at 1600x900, idle mobile 72 at 900x1600; total 408 WebP assets | Publication is complete and no staged manifest remains active |
| 2026-07-27 | V10-R06 seam measurement | PIL absolute RGB comparison of final reveal to first idle and idle first to last | Desktop reveal-to-idle mean 1.06104; mobile 0.73593; desktop idle loop 1.14529; mobile 0.82541. The published idle seam witness is excluded by design. | Keep the published 72-frame loop unchanged |
| 2026-07-27 | V10-R07–R10 post-publication gate | `python scripts/validate-tbm-v10-assets.py`; `node --check js/tbm-cinematic-v10.js`; `python -m py_compile ...`; `python -m json.tool ...`; `python tests/test_tbm_v10_visual.py`; `python scripts/build-tbm-v10-approval-board.py`; `git diff --check` | **Passed**. Browser test asserts exact 132/72 decoded asset counts, one canvas, hero overlay at handoff, changing idle frame, reverse reveal return, desktop/mobile source reload, and no console/page/request failures. `git diff --check` passed with only pre-existing unrelated CRLF warnings. | Final source and visual review |
| 2026-07-27 | V10-R08–R11 final source/runtime/visual audit | Source reread of `index.html`, `css/tbm-cinematic-v10.css`, `js/tbm-cinematic-v10.js`, builder VFX anchors and regenerated boards/captures | **Passed**: one persistent canvas remains through handoff; no `.hero-v9__plate img` in normal motion; dynamic idle and reverse scroll are browser-proven; desktop/mobile opening/handoff/reverse captures manually inspected; final source contact frame contains no white arc/dash. Local HTTP preview returned 200. | Headed Chrome review cannot be performed: CDP port 9223 refused connection. This is recorded as unavailable, not as approval. |
| 2026-07-27 | V10-R12 state-handoff correction | Copied stale V9 handoff to `working-originals/session_handoff.pre-v10-final-audit.20260727.md`, verified identical pre-edit SHA-256, then replaced only the stale state text | Readback confirms V10 `rendered-v10` state, exact assets, checks, rollback paths and headed-review caveat. | Future sessions must treat this V10 handoff and this tracker as authoritative. |
