# V7 implementation revert tracker

**Project:** The Blacksmith Market static website  
**Pass:** V7 reveal and Product Focus constellation refinement  
**Started:** 2026-07-25  
**Status:** implementation in progress  
**Source plan:** `TBM_V7_REVEAL_AND_CATEGORY_NETWORK_REFINEMENT_PRD_2026-07-25.md`

## Scope and rollback boundary

This tracker records every file introduced or edited by this pass. Existing V6 source files are reference-only and were copied into `reference-sources/`; they must remain unchanged. The only pre-existing production file approved for modification is `index.html`.

The exact pre-edit backup of `index.html` is:

```text
backup/reference_refinement_v7_20260725/originals/index.html
```

Reference copies used to derive V7 files are in:

```text
backup/reference_refinement_v7_20260725/reference-sources/
```

Pre-edit SHA-256 hashes and line counts are recorded in:

```text
backup/reference_refinement_v7_20260725/pre-edit-hashes.tsv
```

## Pre-edit evidence

| Path | Lines | SHA-256 before implementation |
|---|---:|---|
| `index.html` | 41 | `1AEC310CF58D26534A14E2DA030F0C5AA142349D30CB26B32E161A27A11B79C8` |
| `js/tbm-reveal-v6.js` | 152 | `0E78F5578852B6D45E475F3E99BE0E8D45ECB5226520D3A0FFC2D139586367B1` |
| `js/tbm-product-network-v6.js` | 76 | `371AA22492F3024729565886B0A15F80CCCB2CAAB52A08519CBE70153D580D43` |
| `css/tbm-reference-match-v6.css` | 14 | `95473859F86FEFFC20D4D3444F44411F4030CCA864B9F866BA7FEC58ADBAF40B` |
| `blender/reference-match/config/scene-contract.json` | 31 | `45389DB41333E811260EAC38E8028E21DF687C1F1941BE6F15C43730A6A257D1` |
| `blender/reference-match/scripts/build_reference_match.py` | 673 | `EF12208D27BB149A1168463EE9A5EE9F55204F02663FF177A26A5182BD7DAAB7` |

## Patch map

| Patch ID | Exact path(s) | Change boundary / identifiable anchors | Backup or revert action | Validation |
|---|---|---|---|---|
| V7-R01 | `blender/reference-match-v7/config/scene-contract.json` | New file; `name`, `frameEnd`, `render.reveal`, `render.revealMobile`, `render.revealFrameCount`, `web.root` | Delete the V7 file | `python -m json.tool`; contract assertions |
| V7-R02A | `blender/reference-match-v7/scripts/build_reference_match_v7.py` | New file; `CONTRACT` import and `metal_material()` quality values | Delete the V7 script | `python -m py_compile` |
| V7-R02B | Same V7 Blender script | New `apply_smooth_fcurves()` immediately after `keyframe_transform()` and its call at the end of `build_scene()` | Delete V7 script | Blender background build; inspect F-curves |
| V7-R02C | Same V7 Blender script | Core and `band_specs` keyframes in `build_scene()` | Delete V7 script | Approval keyframes; frame timing review |
| V7-R02D | Same V7 Blender script | Orbit construction and `bevel_factor_end` animation | Delete V7 script | Blender scene inspection; motion preview |
| V7-R02E | Same V7 Blender script | `add_progressive_cage_edges()` and hidden source cage | Delete V7 script | Rendered network frames; no cage pop |
| V7-R02F | Same V7 Blender script | Node, halo, arc and spark keyframes | Delete V7 script | Low-resolution motion preview |
| V7-R02G | Same V7 Blender script | Camera target, camera keyframes and named light energies | Delete V7 script | 100% zoom safe-area stills |
| V7-R02H | Same V7 Blender script | V7 outputs, manifest version and V7 blend path | Delete V7 script and generated V7 assets | 96+96 asset audit |
| V7-R03 | `blender/reference-match-v7/TBM_REFERENCE_MATCH_V7.blend` | Generated Blender scene output | Delete the V7 blend file | File exists and opens in Blender |
| V7-R04 | `assets/tbm-cinematic-v7/**` | Generated keyframes, reveal sequences, manifest and product assets | Delete only `assets/tbm-cinematic-v7` | Counts, sizes, paths, HTTP 200 |
| V7-R05 | `js/tbm-reveal-v7.js` | New controller; `updateTarget`, `renderLoop`, `decodeWithConcurrency`, `closestDecodedIndex` | Delete V7 controller and restore V6 script tag | `node --check`; Playwright reverse scrub |
| V7-R06 | `js/tbm-product-network-v7.js` | New controller; `select`, `applyFilter`, card `viewTransitionName` | Delete V7 controller and restore V6 script tag | `node --check`; click/filter test |
| V7-R07A | `css/tbm-reference-refinement-v7.css` | New file; reveal stage, brightness grade, reduced-motion rules | Delete V7 stylesheet and its link | CSS readback; browser computed styles |
| V7-R07B | Same V7 CSS | Product Focus desktop constellation, card offsets, 76px detail gap, exposed SVG area | Delete V7 stylesheet and its link | 1904×900 screenshot and geometry assertions |
| V7-R07C | Same V7 CSS | Post-visual-QA correction at lines 71-79, 130-153, 158-185: separate heading link, fit three detail columns without clipping, move/compact callout, hide live-region text with `.sr-only` | Restore `originals/tbm-reference-refinement-v7.css.precloseout` over the V7 stylesheet, or remove this V7-R07C block only | Fresh `product-constellation.png`; callout/detail/legend viewport assertions |
| V7-R08A | `index.html`, `js/tbm-reveal-v7.js` | `index.html`: V7 stylesheet/preload, body class, reveal-stage wrapper and V7 script tags; controller: settled hero image source | Copy `originals/index.html` over `index.html`; delete V7 controller | Readback + HTML load + hero source assertion |
| V7-R08B | `js/tbm-product-network-v7.js` | `syncGeometry()`: V7 SVG viewBox, five anchor points, hub and runtime `data-route` attributes | Delete V7 product controller and restore V6 script tag | Route-path readback + click test |
| V7-R09 | `tests/test_tbm_v7_visual.py` | New test; reveal midpoint/end/reverse and Product Focus geometry checks | Delete the test file | `python tests/test_tbm_v7_visual.py` |
| V7-R10 | This tracker | Append progress, hashes, validation output and close-out status | Retain permanently | Final tracker audit |

## Exact index.html anchors

The activation edit is intentionally limited to these anchors:

1. `<link rel="stylesheet" href="css/tbm-reference-match-v6.css">` and the following preload line.
2. `<body class="home-v2 tbm-v6-pending">`.
3. The reveal block beginning `<div class="tbm-reveal-v6" id="tbm-reveal-v6">`.
4. The reveal controller’s `document.querySelector('.hero-v6__plate img')` source assignment.
5. The Product Focus `syncGeometry()` anchor array, hub coordinates and SVG path updates.
6. The runtime `card.dataset.route` assignment for the five category buttons.
7. The final V6 script tags immediately before `</body>`.

No navigation text, approved copy, category labels, form links, footer content or unrelated section markup may be changed.

## Progress log

### 2026-07-25 — preflight and backup

- Confirmed active baseline files and V6 contract.
- Created `originals/index.html` before editing.
- Copied V6 reference sources into `reference-sources/`.
- Recorded pre-edit hashes and line counts in `pre-edit-hashes.tsv`.
- Created this tracker before any implementation edit.

### 2026-07-25 — V7 implementation and verification

- Created V7 contract, Blender source and V7 Blender scene.
- Added 192-frame animation, progressive orbit/cage curves, smoother F-curves, farther camera path and brighter lights.
- Rendered three 1920×1080 Cycles approval stills.
- Rendered 96 desktop and 96 mobile V7 WebP frames and generated the V7 manifest.
- Added reversible scroll-scrub controller and decoded-frame rendering with no unrelated-frame fallback.
- Added asymmetric Product Focus constellation, longer routes, 76px card-to-detail separation and one-shot desktop geometry.
- Added Playwright test coverage for forward/reverse reveal progress, mobile load, card selection, route updates and viewport fit.

Validation completed so far:

```text
python -m py_compile blender/reference-match-v7/scripts/build_reference_match_v7.py   PASS
python -m json.tool blender/reference-match-v7/config/scene-contract.json              PASS
node --check js/tbm-reveal-v7.js                                                       PASS
node --check js/tbm-product-network-v7.js                                              PASS
python tests/test_tbm_v7_visual.py                                                     PASS
Mobile Playwright smoke (390x844)                                                      PASS
Asset audit: 96 desktop, 96 mobile, 3 keyframes, no V6 manifest paths               PASS
```

The sequence renderer uses Blender's available `BLENDER_EEVEE` engine for local frame generation time; approval stills use Cycles. This is recorded as a supporting implementation choice, not a V6 edit.

### Implementation updates

Append one entry after each logical phase. Each entry must include:

```text
Date/time:
Patch IDs:
Files changed:
Exact anchors/line ranges after edit:
Validation command(s):
Result:
New SHA-256 hashes:
Open issue or next action:
```

### 2026-07-25 — final visual-QA correction

- Patch ID: V7-R07C.
- Backup created before edit: `backup/reference_refinement_v7_20260725/originals/tbm-reference-refinement-v7.css.precloseout` (SHA-256 before R07C: `8606001A7C0A8F1F67FE92C383E627E733800F5009B437C2CE24A99A31771811`).
- Exact changed anchors in the post-edit file: `css/tbm-reference-refinement-v7.css:71-77` (`.v6-heading__link`), `:130-153` (`.sector-detail` sizing/columns), `:158-170` (`.sector-network__callout`), and `:175-185` (`.sr-only`).
- Purpose: keep the “How we evaluate” link on its own line, expose all three descriptive metrics in the one-shot viewport, keep the callout inside the viewport, and prevent the live-region status (“All sectors shown.”) from rendering visually.
- Exact diff shape:

```diff
@@ .v6-heading__link @@
+display: flex;
+width: fit-content;
+margin-top: 14px;
@@ .sector-detail @@
-min-height: 96px; max-height: 102px; padding: 16px 24px;
+min-height: 112px; max-height: 112px; padding: 12px 20px;
@@ .sector-detail span @@
-padding: 6px 10px;
+padding: 4px 8px; font-size: .61rem; line-height: 1.25;
@@ .sector-network__callout @@
-bottom: 2px; width: 330px; padding: 10px 14px; max-height: 75px;
+bottom: 12px; width: 360px; padding: 9px 12px; max-height: 62px;
@@ Product Focus live region @@
+#product-focus .sr-only { position:absolute !important; width:1px; height:1px; ... }
```

- Validation: `python tests/test_tbm_v7_visual.py` PASS; refreshed `artifacts/reference-match-v7/product-constellation.png` visually inspected and shows staggered cards, exposed routes, complete detail panel, contained callout and no stray status text.
- Open issue or next action: none for the requested V7 scope.

## Verification requirements before close-out

- V6 reference files still match every pre-edit hash.
- `index.html` has only the seven approved activation areas changed.
- Every V7 JavaScript file passes `node --check`.
- Blender script passes `python -m py_compile` and the generated contract passes `python -m json.tool`.
- V7 manifest has exactly 96 desktop and 96 mobile frame records with no V6 paths.
- All generated V7 assets are non-empty and within the PRD budgets.
- Browser test proves progress at approximately 0%, 50%, 100%, then approximately 25% again after reverse scrolling.
- Product Focus test proves at least three distinct card top positions, the longer route geometry and the detail block remains inside the 1904×900 shot.
- Browser console and page-error logs are empty.
- Final changed-file readback is complete and the final hashes are appended below.

## Final close-out

Do not mark this tracker complete until every patch row has a validation result and the Definition of Done in the PRD is satisfied. If a gate fails, record the failing command and exact corrective patch before continuing.

**Final status:** implementation complete; local verification passed  
**Final validation timestamp:** 2026-07-25 (Asia/Dubai)  
**Final V7 hashes:**

| Path | Post-edit lines | SHA-256 |
|---|---:|---|
| `index.html` | 44 | `E101843444FF44B29804D264DAEA23A6BF9C05939A4DCCCDA5FB27A2B1D9F0A4` |
| `js/tbm-reveal-v7.js` | 184 | `EAC2441E352756CE027D864C16D6AA3509AE1C85EC5C3184B36FE5BB2DEABE0A` |
| `js/tbm-product-network-v7.js` | 119 | `D9F38658DEE9701C0921F71DFC215579A7987789274F944E1D8441D8D91B7D12` |
| `css/tbm-reference-refinement-v7.css` | 192 | `9AF9496F97656EB931A8FC0028EDB946214581657A5EDB4A58AC6054C92B5A77` |
| `blender/reference-match-v7/config/scene-contract.json` | 33 | `71DE7F3696733F298E7641D790ABB2EDDCDCFBA28BCD9AFB3620711F1EE86CB8` |
| `blender/reference-match-v7/scripts/build_reference_match_v7.py` | 775 | `9D4FD51B819867839C920329658A909C003F0B78952487ADF3E66EA64D805B27` |
| `tests/test_tbm_v7_visual.py` | 76 | `2B4C6CAFC86496FBC53530E37C9DA3A388617B35BC4110F7DF4FA2EDC3B3FE40` |

The first `index.html` hash above is the exact current file hash; if a hash comparison is needed, use `Get-FileHash -Algorithm SHA256 <path>` rather than copying this table. The V6 source files remain unchanged and match their pre-edit hashes listed at the top of this tracker.

### Revert commands (surgical)

Run from the repository root. These commands restore only the files changed by this pass; they do not reset the worktree or touch unrelated prior changes.

```powershell
# Restore the pre-pass index activation surface.
Copy-Item -LiteralPath 'backup/reference_refinement_v7_20260725/originals/index.html' -Destination 'index.html' -Force

# Remove V7-only runtime/style/test/Blender outputs if a full V7 rollback is required.
Remove-Item -LiteralPath 'js/tbm-reveal-v7.js','js/tbm-product-network-v7.js','css/tbm-reference-refinement-v7.css','tests/test_tbm_v7_visual.py' -Force
Remove-Item -LiteralPath 'blender/reference-match-v7','assets/tbm-cinematic-v7' -Recurse -Force

# Restore the only pre-existing V6 source files from immutable reference copies.
Copy-Item -LiteralPath 'backup/reference_refinement_v7_20260725/reference-sources/tbm-reveal-v6.js' -Destination 'js/tbm-reveal-v6.js' -Force
Copy-Item -LiteralPath 'backup/reference_refinement_v7_20260725/reference-sources/tbm-product-network-v6.js' -Destination 'js/tbm-product-network-v6.js' -Force
Copy-Item -LiteralPath 'backup/reference_refinement_v7_20260725/reference-sources/tbm-reference-match-v6.css' -Destination 'css/tbm-reference-match-v6.css' -Force
Copy-Item -LiteralPath 'backup/reference_refinement_v7_20260725/reference-sources/scene-contract.json' -Destination 'blender/reference-match/config/scene-contract.json' -Force
Copy-Item -LiteralPath 'backup/reference_refinement_v7_20260725/reference-sources/build_reference_match.py' -Destination 'blender/reference-match/scripts/build_reference_match.py' -Force
```

For only the final visual-QA patch, restore `backup/reference_refinement_v7_20260725/originals/tbm-reference-refinement-v7.css.precloseout` over `css/tbm-reference-refinement-v7.css`; this reverts V7-R07C without removing the V7 implementation.

### Final verification evidence

| Gate | Command/artifact | Result |
|---|---|---|
| V7 browser regression | `python tests/test_tbm_v7_visual.py` | PASS; forward 50%, end, reverse 25%, Product Focus geometry, electronics route, no console/page errors |
| Mobile load | Playwright 390×844 smoke | PASS; ready reveal, 390×768 canvas, 2700.8px stage, 5 cards, no console errors |
| JavaScript syntax | `node --check js/tbm-reveal-v7.js`; `node --check js/tbm-product-network-v7.js` | PASS |
| Blender source/contract | `python -m py_compile ...build_reference_match_v7.py`; `python -m json.tool ...scene-contract.json` | PASS |
| Asset completeness | V7 manifest plus filesystem audit | PASS; 96 desktop + 96 mobile WebP frames, 3 keyframes, 19.08 MB total sequences, max frame 184,688 bytes |
| V6 parity | SHA-256 comparison against `reference-sources/` | PASS; all five pre-existing V6/reference files unchanged |
| Visual QA | `artifacts/reference-match-v7/reveal-50.png`, `reveal-reversed-25.png`, `product-constellation.png` | PASS; images inspected after final CSS correction |
