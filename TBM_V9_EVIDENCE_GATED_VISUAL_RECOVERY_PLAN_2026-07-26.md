# TBM V9 — Evidence-Gated Visual Recovery Plan

**Created:** 26 July 2026  
**Status:** investigation and implementation plan only — no V9 code is authorised by this document  
**Current production baseline:** restored V7  
**Failed implementation under investigation:** reverted V8  
**Primary objective:** address the user’s original reveal, framing, brightness, material, handoff and persistent-motion observations without replacing the last visually improving implementation wholesale.

---

## 1. Executive decision

V8 failed because it changed the rendering architecture, Blender geometry, material transport, camera ownership, reveal controller, hero handoff and validation system in one pass. It replaced a visually proven pre-rendered sequence with a live GLB before the GLB had demonstrated visual parity with either Blender or V7.

V9 must not “repair V8” in production. It must:

1. preserve V7 as the active and reversible baseline;
2. improve the reveal inside the V7 pre-rendered Blender/image-sequence pipeline;
3. make the reveal’s final frame the initial homepage visual, eliminating the visible scene boundary;
4. prototype any live homepage model separately;
5. permit a live model onto the homepage only after its browser render matches the approved final reveal frame;
6. require human visual approval at fixed checkpoints, not only automated functional success.

This is a recovery plan, not another redesign-from-scratch.

---

## 2. Sources inspected

### 2.1 Local authoritative evidence

- Complete Codex task transcript: `019f78fe-df5f-72c2-a506-c64611d64004`
- Current restored production file: `index.html`
- Current V7 reveal controller: `js/tbm-reveal-v7.js`
- Current V7 visual CSS: `css/tbm-reference-refinement-v7.css`
- Current V7 Blender source: `blender/reference-match-v7/scripts/build_reference_match_v7.py`
- Current V7 scene contract: `blender/reference-match-v7/config/scene-contract.json`
- Current V7 browser test: `tests/test_tbm_v7_visual.py`
- V6 implementation evidence: `backup/reference_match_v6_20260725/REVERT_TRACKING.md`
- V7 implementation evidence: `backup/reference_refinement_v7_20260725/REVERT_TRACKING.md`
- Reverted V8 implementation record: `backup/unified_live_3d_v8_20260726/REVERT_TRACKING.md`
- Archived V8 Blender builder:
  `backup/unified_live_3d_v8_20260726/reverted_generated/reference-match-v8/scripts/build_live_v8.py`
- Archived V8 contract:
  `backup/unified_live_3d_v8_20260726/reverted_generated/reference-match-v8/config/scene-contract.json`
- Archived failed browser renders:
  `backup/unified_live_3d_v8_20260726/reverted_generated/artifacts/tbm-v8-validation/`
- Reverted V8 plan: `TBM_V8_UNIFIED_LIVE_3D_REVEAL_HERO_PLAN_2026-07-26.md`
- Earlier corrective plan: `TBM_REVEAL_HERO_CORRECTIVE_RECOVERY_PLAN_2026-07-24.md`

### 2.2 Skill discovery

`find-skills` was run for Three.js, Blender-to-web, visual-regression and ScrollTrigger workflows.

High-confidence:

- `greensock/gsap-skills@gsap-scrolltrigger` — official GreenSock source and the only discovered skill recommended for this pass.

Reference-only pending individual audit:

- `freshtechbro/claudedesignskills@web3d-integration-patterns`
- `freshtechbro/claudedesignskills@blender-web-pipeline`
- `sfkislev/flue@blender`
- `vladmdgolam/agent-skills@blender-mcp`

No Blender MCP is required for this implementation. Blender’s command-line Python interface already builds and renders deterministically. An MCP may make interactive manipulation easier, but it does not solve geometry, art direction, material baking or visual validation.

### 2.3 Primary technical guidance

- GSAP ScrollTrigger documentation: reversible `scrub` maps scroll progress directly to animation progress; a numeric scrub value can add controlled catch-up smoothing.
- Three.js colour-management guidance: use glTF 2.0 and test models in viewers early; colour and non-colour textures require correct colour-space handling.
- Khronos glTF PBR guidance: base colour, metallic/roughness, normal and related maps are the portable material representation. Procedural Blender shading is not automatically equivalent in a browser renderer.
- Blender glTF export guidance: only export-compatible Principled material features should be treated as portable; unsupported procedural appearance must be baked.

These sources support the plan’s core rule: the browser must not reconstruct approved Blender materials through ad hoc JavaScript overrides.

---

## 3. What previously produced real progress

### 3.1 V4 recovery pattern

The earlier recovery did not replace the stronger renderer. It preserved the existing render and changed only lifecycle and spatial handoff. Static overlay checks measured approximately:

- centre X difference: 0.22%;
- centre Y difference: 1.38%;
- width difference: 1.99%;
- height difference: 2.69%.

That was progress because the change surface was constrained and visual equivalence was measured.

### 3.2 V6 pattern

V6 rendered keyframes and inspected them before closing the implementation:

- a bright studio background was caught and corrected;
- smoke scattering that masked the black background was caught;
- a Principled-node material mismatch was caught;
- a camera crop into the copy column was caught;
- empty category renders caused by inherited animation curves were caught;
- mobile readability was checked in a browser.

The important behaviour was not that every first attempt was correct. It was that each visual defect stopped the pass and caused one isolated correction.

### 3.3 V7 pattern

V7 preserved V6 and added a bounded refinement layer:

- 192-frame source animation;
- 96 desktop and 96 mobile delivery frames;
- reversible reveal;
- progressive orbit and cage formation;
- farther camera;
- brighter lighting;
- Product Focus constellation refinements;
- browser screenshots at forward, end and reverse progress;
- immutable V6 reference copies and parity checks.

V7 still has issues, but it is the last evidence-backed improving lineage.

---

## 4. Root-cause register for V8

### RC-01 — Architectural substitution before visual proof

**Evidence:** V8 replaced the V7 pre-rendered canvas with one live Three.js GLB scene in `index.html`.

**Why it mattered:** the approved look depended on Blender’s renderer, lighting, noise, reflections, colour management and post effects. A live browser renderer is a different rendering environment. Visual parity was assumed, not demonstrated.

**Result:** flatter materials, weaker contrast, incorrect bronze, grey-looking core, simplified atmosphere and a visibly different composition.

**Corrective rule:** the reveal remains pre-rendered until a live render passes side-by-side parity independently.

### RC-02 — V8 was a new model, not a surgical refinement of V7

**Evidence:** V8 introduced `build_live_v8.py`, new segmented orbits, new formation behaviours, a new hierarchy and a new GLB export.

**Why it mattered:** model silhouette, cage density, ring proportions and assembly timing all changed. The plan promised continuity but the implementation constructed a materially different object.

**Result:** the cage looked incorrectly assembled, outer bands appeared detached, ring hierarchy was visually confused and the object no longer resembled the stronger concept imagery.

**Corrective rule:** duplicate the approved V7 `.blend`/builder and adjust named objects; do not reconstruct the sculpture from a blank scene.

### RC-03 — Procedural Blender appearance did not survive glTF export

**Evidence:** both V7/V8 Blender scripts create procedural noise/roughness node treatments. Standard glTF carries PBR parameters and textures, not arbitrary Blender node graphs. V8 then normalised materials in JavaScript.

**Why it mattered:** procedural roughness, micro-normal response and forged surface variation were lost or altered. Browser overrides flattened role-specific materials into uniform brown/peach tubes.

**Result:** “no texture”, plastic-like bronze and loss of the intended smooth-versus-forged material balance.

**Corrective rule:** bake approved base-colour, roughness, normal and metallic/AO maps; validate the GLB in the Khronos Sample Viewer before Three.js.

### RC-04 — Browser-side material overrides invalidated Blender approval

**Evidence:** the V8 runtime introduced material normalisation after GLB load.

**Why it mattered:** even if Blender stills looked acceptable, the live page was not rendering those same material values.

**Result:** Blender approval stills were not evidence for the final browser output.

**Corrective rule:** browser code may configure renderer, environment and exposure, but it must not replace approved material maps/values. Any exception requires a new browser parity capture.

### RC-05 — Camera and composition had multiple owners

**Evidence:** V8 contained Blender camera animation plus browser-side camera relief and settled root transforms.

**Why it mattered:** browser-only `translateZ`, lateral transforms or root scaling are not represented in Blender approval frames.

**Result:** framing, apparent size, crop and resting position diverged from the approved render.

**Corrective rule:** reveal camera choreography has one owner: Blender. The persistent live hero has one static approved camera. No post-mixer camera translation.

### RC-06 — Formation was patched after export rather than authored coherently

**Evidence:** V8 runtime added progressive formation visibility after the live asset existed.

**Why it mattered:** opacity/scale fixes cannot replace a properly staged hierarchy and assembly animation. Shared materials can also make visibility mutations affect unrelated parts.

**Result:** sudden cage appearance, incomplete/overcomplete structures and visually incoherent assembly states.

**Corrective rule:** object formation is keyed in Blender. Browser code only selects timeline time. Materials are never used as shared visibility state.

### RC-07 — Validation gates measured proxies instead of design

**Evidence:** V8 reported:

- 7 automated browser tests passed;
- luminance thresholds passed;
- syntax and asset checks passed;
- “automated design review” passed;
- headed human approval remained pending.

**Why it mattered:** a whole-image dark-pixel ratio can pass a visually poor teal/black gradient. DOM state, WebGL readiness and frame time do not measure texture, silhouette, material balance or resemblance to the approved target.

**Result:** technically valid but visibly unacceptable output was declared complete.

**Corrective rule:** automated gates are necessary but never sufficient. Every visual milestone requires an approval board and explicit user acceptance before activation.

### RC-08 — No browser-to-Blender parity gate

**Evidence:** there was no required aligned overlay, perceptual difference image or material swatch comparison between Blender frame 192 and the live browser pose.

**Why it mattered:** renderer drift was not detected before integration.

**Corrective rule:** browser and source renders must use the same viewport/aspect/composition and pass:

- silhouette overlap ≥ 97%;
- centre delta ≤ 1.5% viewport;
- bounding-box width/height delta ≤ 3%;
- no material family with visibly swapped roughness class;
- user approval of an A/B/overlay board.

Pixel metrics are diagnostic; user approval remains the final visual gate.

### RC-09 — Too many simultaneous variables

**Evidence:** V8 changed geometry, renderer, lighting, materials, animation, camera, handoff, page markup and tests.

**Why it mattered:** when the output regressed, there was no isolated causal comparison.

**Corrective rule:** one visual variable family per phase, with immutable captures before/after.

### RC-10 — Generated concepts were treated as production specifications

**Evidence:** concept images established an art direction but not an exact mesh, camera, texture map or physically reproducible lighting setup.

**Why it mattered:** “identical” was promised without a production-grounded asset and comparison process.

**Corrective rule:** concepts remain target references. The implementation specification is an approved Blender/browser reference board with named frames and measurable composition.

---

## 5. User observations translated into acceptance criteria

### O-01 Reveal must be reversible

- Scroll from 0% → 100% → 25% → 0%.
- Canvas must display the corresponding earlier frames.
- Reveal must never be destroyed at completion.
- No one-way state flag may suppress reverse access.

### O-02 Reveal must feel smoother

- Compare 96-, 120- and 144-frame delivery candidates from the same 192-frame Blender source.
- Use exact scroll progress as the target; smoothing must not block reverse movement.
- No nearest-decoded fallback after the reveal becomes interactive.
- The stage must remain in a loading/poster state until a minimum contiguous frame window is decoded.
- At the target desktop viewport, median rendered update ≤ 18 ms and p95 ≤ 28 ms during scrub.

### O-03 Camera must be slightly farther, not excessively zoomed out

At 1904×900 and browser zoom 100%:

- the assembled object occupies approximately 44–52% of viewport width during the final reveal;
- final hero occupies approximately 48–55% of the page width and is positioned on the right;
- no primary outer band is cropped on all four sides simultaneously;
- left copy safe area begins no farther right than 46% viewport width;
- camera framing is approved at opening, closest push, network formation and final rest.

No browser zoom compensation is permitted.

### O-04 Scene, not only object colours, must be brighter

- Maintain a near-black background.
- Add readable smoke separation behind the object, not a flat teal gradient.
- The black core must retain a visible rim and two controlled specular regions.
- Bronze rings must separate from the core at all approval frames.
- Exposure changes must be authored and reviewed in Blender, then matched in browser.
- Whole-frame luminance alone is not an acceptance test.

### O-05 Formation must be longer and more intricate

Suggested progress allocation:

- 0.00–0.18: latent forge, core emergence, floor energy;
- 0.12–0.36: three large forged bands approach on staggered paths;
- 0.28–0.58: polished inner orbits draw sequentially;
- 0.48–0.78: cage edges draw in three waves and nodes ignite;
- 0.70–0.90: pull-back, rightward composition and atmosphere settle;
- 0.88–1.00: seamless homepage handoff and readability hold.

No complete ring or cage may appear in a single frame transition.

### O-06 Reveal final pose must merge into homepage

- The hero initially displays the exact final reveal frame.
- Reveal stage and hero overlap for a controlled 8–12% progress interval.
- Position, crop, scale, exposure and background must be identical at the transition.
- No document jump to a separately composed scene.
- Static-to-live crossfade is forbidden until the live canvas passes the parity gate.

### O-07 Material balance

- Core: black lacquer/graphite, smooth, low roughness, clear readable highlight.
- Inner orbits: polished warm bronze, smooth reflection, subtle roughness variation.
- Network/cage: finer bronze/gold, smoother than outer forged bands.
- Outer bands: darker forged copper/bronze with restrained roughness/normal detail.
- Not every component is smooth, and not every component is rough.
- No uniform runtime colour override.

### O-08 Homepage composition and motion

- The hero visual should primarily occupy the right half and may extend slightly beyond its boundary.
- It must not overwhelm headline, body, buttons or promises at 100% browser zoom.
- Initial V9 handoff may be a static final frame.
- Slow live idle motion is phase 5, not a prerequisite for approving phases 1–4.
- Future mouse interaction is accommodated by a separate `HeroLiveController`, but is not implemented now.

---

## 6. V9 architecture

```text
Blender V7-derived source
  ├─ approved keyframes and material swatches
  ├─ desktop reveal sequence
  ├─ mobile reveal sequence
  └─ exact final hero plate

One ScrollTrigger progress owner
  └─ reversible image-sequence reveal

Exact final reveal plate
  └─ first homepage hero state (zero visual discontinuity)

Separate live-hero laboratory
  ├─ baked glTF PBR maps
  ├─ static camera
  ├─ browser/source parity board
  └─ only after approval: crossfade + idle rotation
```

The live laboratory is isolated from `index.html` until it passes its own gate.

---

## 7. Proposed file scope

### Minimum required files

| File | Purpose | Production activation |
|---|---|---|
| `blender/reference-match-v9/scripts/build_reference_match_v9.py` | V7-derived scene refinements and renders | no |
| `blender/reference-match-v9/config/scene-contract.json` | exact frames, cameras, lights, material roles and budgets | no |
| `assets/tbm-cinematic-v9/**` | approved reveal frames and final hero plate | only after approval |
| `js/tbm-reveal-v9.js` | one reversible ScrollTrigger/frame owner | only after approval |
| `css/tbm-reference-refinement-v9.css` | composition/handoff corrections only | only after approval |
| `tests/test_tbm_v9_visual.py` | behavioural and geometry checks | no |
| `scripts/build-tbm-v9-approval-board.py` | source/browser/contact-sheet comparison | no |
| `index.html` | switch imports/anchors after all earlier gates | last file edited |

### Optional live-hero laboratory files

| File | Purpose |
|---|---|
| `blender/reference-match-v9-live/**` | browser-compatible duplicated asset source |
| `assets/tbm-live-v9-lab/**` | GLB and baked textures |
| `lab/tbm-live-v9.html` | isolated renderer comparison |
| `js/tbm-hero-live-v9-lab.js` | no production import |

### Explicit non-goals

- no full-page redesign;
- no Product Focus rewrite;
- no replacement of approved wording;
- no React/Vue/bundler;
- no Blender MCP dependency;
- no mouse interaction in this pass;
- no WebGPU migration;
- no V8 source copied into production;
- no automatic activation based only on test success.

---

## 8. Implementation phases and stop/go gates

### Phase 0 — immutable baseline and evidence board

1. Create `backup/v9_visual_recovery_20260726/`.
2. Copy every planned affected file before editing.
3. Create `backup/v9_visual_recovery_20260726/REVERT_TRACKING.md`.
4. Record SHA-256 hashes, byte counts and restore paths.
5. Capture restored V7 at:
   - 1904×900: 0%, 18%, 36%, 58%, 78%, 90%, 100%, reverse 50%, reverse 0%;
   - 1366×768: 0%, 50%, 100%;
   - 390×844: 0%, 50%, 100%.
6. Record DOM geometry, canvas dimensions, scroll progress, frame index, errors and performance.

**Gate 0:** no V9 work begins unless V7 is confirmed active, HTTP 200, reversible and byte-identical to the restored baseline.

### Phase 1 — Blender stills only

Duplicate V7 source; do not edit V7 files.

Change only these visual families, in this order:

1. camera framing;
2. scene/background lighting and exposure;
3. material balance;
4. formation timing;
5. atmosphere/sparks.

After each family:

- render the fixed approval frames;
- build a contact sheet against V7 and target concepts;
- record the exact changed parameters;
- stop for visual review.

**Gate 1:** user approves four stills—opening, close push, network formation and final right-side composition.

### Phase 2 — reveal sequence candidate

Render the same approved scene at 96, 120 and 144 delivery samples using identical endpoints.

Measure:

- total transfer size;
- maximum frame size;
- decode duration;
- memory estimate;
- scrub p50/p95;
- visual stepping at slow and rapid scroll.

Select the lowest frame count that is visually smooth. Do not assume 144 is automatically better.

**Gate 2:** approved desktop and mobile forward/reverse screen recordings or sequential screenshots.

### Phase 3 — exact static handoff

The homepage hero plate must use the V9 final reveal asset, not a separately rendered or cropped image.

Overlay reveal final and homepage first state. Require:

- centre delta ≤ 1.5%;
- width/height delta ≤ 3%;
- no visible exposure change;
- no background seam;
- no scroll jump.

**Gate 3:** exact overlay board and browser handoff approved.

### Phase 4 — production activation

Only now:

- add V9 CSS and JS imports;
- update reveal class/data anchors;
- point hero plate to V9 final frame;
- preserve V7 files and backup;
- run full browser matrix.

**Gate 4:** user reviews the actual headed browser at 100% zoom.

### Phase 5 — optional live persistent hero

Build separately after phase 4 approval.

Requirements:

- V7/V9 geometry duplicated, not rebuilt from V8;
- UV unwrap;
- bake baseColor, roughness, normal, metallic/AO;
- export compatible Principled PBR;
- test in Khronos Sample Viewer;
- test in isolated Three.js lab with AgX and approved environment;
- no material normalisation override;
- static browser frame passes source parity;
- then add subtle idle movement.

**Gate 5:** static live parity approval before any crossfade. Idle motion approval before production import.

---

## 9. Blender specification

### 9.1 Geometry preservation

- Start from V7 object names and hierarchy.
- Preserve core radius, principal orbit count and cage topology unless a still review explicitly approves a change.
- Do not use V8’s segmented-orbit rebuild.
- Inner orbits use smooth bevelled curves with sufficient resolution.
- Outer forged bands remain open rectangular bands with bevelled edges.
- Cage uses sparse intentional geodesic connections; remove duplicate/coplanar lines.
- Apply transforms before export-only duplication.

### 9.2 Material roles

Proposed starting values, subject to still approval:

| Role | Base | Metallic | Roughness | Clearcoat | Detail |
|---|---:|---:|---:|---:|---|
| core | near-black graphite | 0.25–0.45 | 0.14–0.22 | 0.75–1.0 | subtle baked micro-normal |
| polished orbit | warm bronze | 0.90–1.0 | 0.16–0.26 | 0.25–0.5 | restrained roughness variation |
| cage/network | gold-bronze | 0.85–1.0 | 0.20–0.32 | 0.1–0.3 | fine, mostly smooth |
| forged band | dark copper bronze | 0.85–1.0 | 0.34–0.48 | 0.05–0.2 | visible but restrained normal |

These are calibration ranges, not acceptance by numbers. The material swatch board controls.

### 9.3 Lighting and atmosphere

- World remains near-black.
- One warm key defines bronze.
- One cooler/neutral rim separates the black core.
- A weak frontal fill makes cage topology readable.
- Smoke exists behind and around the object, never as a full-frame grey/teal wash.
- Sparks concentrate near assembly contacts and frame edges.
- Bloom is restrained to energy/sparks; it must not blur ring edges.

### 9.4 Camera

- One desktop reveal camera.
- One independently composed mobile reveal camera.
- No crop-derived mobile version.
- Opening camera shows core emergence with readable scale.
- Midpoint push is cinematic but keeps essential orbit context.
- Final camera pulls back and shifts composition right.
- All keys use smooth Bézier interpolation with velocity inspection.

---

## 10. Proposed code patches

The following diffs are implementation specifications. Exact line numbers must be recalculated after copying V7 to V9. They must not be applied before Gates 0–2.

### Patch V9-R01 — scene contract

```diff
--- /dev/null
+++ b/blender/reference-match-v9/config/scene-contract.json
@@
+{
+  "name": "TBM Evidence-Gated Visual Recovery V9",
+  "sourceBaseline": "reference-match-v7",
+  "fps": 24,
+  "frameStart": 1,
+  "frameEnd": 216,
+  "approvalFrames": {
+    "opening": 18,
+    "outerFormation": 70,
+    "cinematicPush": 124,
+    "network": 168,
+    "handoff": 216
+  },
+  "progressWindows": {
+    "latent": [0.00, 0.18],
+    "outerForge": [0.12, 0.36],
+    "orbits": [0.28, 0.58],
+    "network": [0.48, 0.78],
+    "settle": [0.70, 0.90],
+    "handoff": [0.88, 1.00]
+  },
+  "deliveryCandidates": [96, 120, 144],
+  "composition": {
+    "finalObjectViewportWidthMin": 0.44,
+    "finalObjectViewportWidthMax": 0.52,
+    "copySafeRight": 0.46
+  },
+  "handoffTolerance": {
+    "centerViewport": 0.015,
+    "sizeViewport": 0.03,
+    "silhouetteOverlap": 0.97
+  }
+}
```

### Patch V9-R02 — derive, do not rebuild

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v9/scripts/build_reference_match_v9.py
@@
-"""Build the V7 reference refinement."""
+"""Build V9 by preserving the approved V7 scene and applying bounded refinements."""
@@
-CONTRACT_PATH = ... "reference-match-v7" ...
+CONTRACT_PATH = ... "reference-match-v9" ...
@@
+# V9 invariant:
+# Preserve the V7 sculpture hierarchy. Camera, light, material and timing
+# refinements are isolated below and recorded in the approval manifest.
```

The implementation must copy the working V7 builder first. It must not copy V8’s `add_segmented_orbit()` or its live-GLB hierarchy.

### Patch V9-R03 — smooth frame controller with one progress owner

```diff
--- a/js/tbm-reveal-v7.js
+++ b/js/tbm-reveal-v9.js
@@
-let targetProgress = 0;
-let displayProgress = 0;
+let targetProgress = 0;
+let displayProgress = 0;
+let revealInteractive = false;
@@
-await decodeWithConcurrency(sources, frames, 6, count => {
+await decodeContiguousWindowFirst(sources, frames, {
+  initialWindow: 18,
+  concurrency: 6,
+  onProgress(count) {
     reveal.style.setProperty('--load-progress', String(count / sources.length));
-});
+  }
+});
+revealInteractive = hasContiguousWindow(frames, 0, 18);
@@
-targetProgress = clamp((window.scrollY - stageTop) / available, 0, 1);
+targetProgress = clamp(self.progress, 0, 1);
@@
-displayProgress += (targetProgress - displayProgress) * alpha;
+displayProgress = damp(displayProgress, targetProgress, 0.12, deltaSeconds);
@@
-const frame = frames[index] || frames[closestDecodedIndex(frames, index)];
+const frame = frames[index];
+if (!frame) return drawPosterUntilReady(index);
```

Implementation notes:

- Use one official ScrollTrigger.
- `scrub` candidate values: `true`, `0.08`, `0.12`; select by recorded feel/performance.
- Do not combine ScrollTrigger catch-up with a second excessive custom lag.
- On reverse scroll, progress and frame indices must decrease immediately.
- Keep native sticky CSS if it is already stable; do not add a second pin spacer.

### Patch V9-R04 — exact final-frame hero plate

```diff
--- a/index.html
+++ b/index.html
@@
-<img src="assets/tbm-cinematic-v6/keyframes/phase-handoff.png" alt="">
+<img
+  src="assets/tbm-cinematic-v9/keyframes/phase-handoff.webp"
+  width="1920"
+  height="1080"
+  decoding="async"
+  fetchpriority="high"
+  alt="">
```

This patch is applied last. The V9 frame must be the exact final reveal render—same pixels, aspect and grade.

### Patch V9-R05 — composition-only CSS

```diff
--- /dev/null
+++ b/css/tbm-reference-refinement-v9.css
@@
+.tbm-reveal-v9-stage {
+  --tbm-final-object-width: clamp(720px, 50vw, 1040px);
+}
+
+.hero-v9__plate {
+  inset: 0;
+  overflow: hidden;
+  pointer-events: none;
+}
+
+.hero-v9__plate img {
+  width: 100%;
+  height: 100%;
+  object-fit: cover;
+  object-position: center center;
+}
+
+.hero-v9 .hero-copy {
+  position: relative;
+  z-index: 3;
+  max-width: min(43vw, 720px);
+}
```

Do not use CSS scale to compensate for a wrongly framed Blender camera. CSS only preserves the approved full-frame composition.

### Patch V9-R06 — visual parity test

```diff
--- /dev/null
+++ b/tests/test_tbm_v9_visual.py
@@
+def test_reveal_forward_reverse(page):
+    set_progress(page, 0.00)
+    assert_frame_near(page, 1)
+    set_progress(page, 1.00)
+    end_frame = current_frame(page)
+    set_progress(page, 0.25)
+    assert current_frame(page) < end_frame
+    set_progress(page, 0.00)
+    assert_frame_near(page, 1)
+
+def test_handoff_geometry(page):
+    reveal_box = reveal_subject_box(page, progress=1.0)
+    hero_box = hero_subject_box(page)
+    assert normalized_center_delta(reveal_box, hero_box) <= 0.015
+    assert normalized_size_delta(reveal_box, hero_box) <= 0.03
+
+def test_no_visual_completion_without_approval_manifest():
+    manifest = load_approval_manifest()
+    assert manifest["humanApproval"]["status"] == "approved"
```

Production activation scripts must refuse to switch `index.html` unless the approval manifest records an explicit approval timestamp and artifact hashes.

### Patch V9-R07 — optional live laboratory, never production-first

```diff
--- /dev/null
+++ b/js/tbm-hero-live-v9-lab.js
@@
+renderer.outputColorSpace = THREE.SRGBColorSpace;
+renderer.toneMapping = THREE.AgXToneMapping;
+renderer.toneMappingExposure = LAB_CONTRACT.exposure;
+
+const gltf = await loader.loadAsync(LAB_CONTRACT.glb);
+scene.add(gltf.scene);
+
+// Forbidden: traversing meshes to replace approved colour/roughness/metalness.
+// Permitted: texture colour-space verification and diagnostic warnings.
+gltf.scene.traverse(object => {
+  if (!object.isMesh) return;
+  validatePortablePbrMaterial(object.material);
+});
```

No live runtime is added to `index.html` in the minimum V9 pass.

---

## 11. Approval board specification

For every visual gate generate one 1920×1080 board containing:

1. target concept crop;
2. current V7;
3. proposed V9 Blender render;
4. browser render;
5. 50% opacity overlay;
6. absolute-difference heat map;
7. object bounding boxes and centre coordinates;
8. material swatches: core, polished orbit, cage, forged band;
9. written parameter delta since the previous board.

File naming:

```text
artifacts/tbm-v9-approval/
  gate-01-camera/
  gate-02-lighting/
  gate-03-materials/
  gate-04-formation/
  gate-05-browser-handoff/
  approval-manifest.json
```

No board may be overwritten. Each correction creates a new numbered revision.

---

## 12. Verification matrix

### Source and asset checks

- `python -m py_compile blender/reference-match-v9/scripts/build_reference_match_v9.py`
- `python -m json.tool blender/reference-match-v9/config/scene-contract.json`
- Blender background build exits 0.
- Expected object names and camera names exist.
- All approval frames are non-empty and have recorded hashes.
- Desktop/mobile frame counts match the selected candidate.

### JavaScript checks

- `node --check js/tbm-reveal-v9.js`
- no second scroll-progress owner;
- no completion-time destruction;
- no runtime material replacement;
- no browser-only reveal camera transforms.

### Browser checks

Use Playwright attached to headed Chrome on port 9223 when available.

- HTTP 200;
- no console/page errors;
- no failed frame requests;
- forward/reverse progress;
- 100% browser zoom;
- 1904×900, 1366×768, 2560×1440, 390×844;
- exact final-frame/hero handoff;
- headline/button/promise readability;
- p50/p95 frame cadence;
- reduced motion;
- resize and refresh;
- direct revisit after scrolling away and back.

If headed Chrome is unavailable, headless captures are diagnostic only and cannot close a visual gate.

### Visual checks

- opening formation readable;
- bands move distinctly and remain visible;
- orbit/cage formation is progressive;
- scene separation is brighter without washing black;
- black core visible;
- smooth-versus-forged material balance;
- final object does not crowd copy;
- no teal fallback gradient;
- no detached or duplicated cage components;
- no visual jump at handoff.

---

## 13. Exact rollback design

Before implementation create:

`backup/v9_visual_recovery_20260726/REVERT_TRACKING.md`

Each patch row must record:

- patch ID;
- exact file;
- pre-edit SHA-256;
- backup source path;
- exact anchors/functions/selectors changed;
- generated assets;
- validation commands;
- status;
- direct restore command.

Only `index.html` and any existing active file require restoration. All V9 files are additive and revert by removal.

The restore command must be explicit, for example:

```powershell
Copy-Item -LiteralPath `
  'backup\v9_visual_recovery_20260726\originals\index.html' `
  -Destination 'index.html' -Force

Remove-Item -LiteralPath `
  'js\tbm-reveal-v9.js', `
  'css\tbm-reference-refinement-v9.css', `
  'tests\test_tbm_v9_visual.py' -Force
```

Generated directories are moved into the backup instead of destroyed if a revert is requested.

---

## 14. Required implementation order

1. Verify restored V7 and capture baseline.
2. Create backup and revert tracker.
3. Copy V7 source into V9.
4. Camera-only still iteration and approval.
5. Lighting-only still iteration and approval.
6. Material-only still iteration and approval.
7. Formation/atmosphere still iteration and approval.
8. Render 96/120/144 candidates.
9. Select one candidate through browser forward/reverse review.
10. Implement V9 reveal controller in isolation.
11. Implement exact static handoff.
12. Run parity board and obtain approval.
13. Modify `index.html` last.
14. Run full browser/performance/accessibility matrix.
15. Re-read every changed file and compare tracker coverage.
16. Only after separate approval, begin the optional live-hero laboratory.

Any failed visual gate returns to the immediately preceding bounded phase. It does not authorise compensating changes elsewhere.

---

## 15. Definition of done

The minimum V9 pass is complete only when:

- V7 remains recoverable byte-for-byte;
- reveal works forward and backward repeatedly;
- motion is smoother at 100% zoom;
- camera framing shows the whole essential sculpture without excessive distance;
- scene contrast makes the core, rings and cage readable;
- material roles show the approved smooth/forged balance;
- formation is longer, staggered and visibly progressive;
- final reveal frame and homepage hero are the same visual state;
- homepage object is right-weighted and does not crowd copy;
- all automated checks pass;
- headed-browser screenshots have been inspected;
- the user has approved the actual visual result;
- revert tracking identifies every exact change and restore source.

Automated success without visual approval is explicitly not completion.

---

## 16. Investigation conclusion

The latest result was not a small tuning failure. It was a process and architecture failure: the implementation abandoned the improving V7 rendering path, rebuilt the object and renderer, and used functional proxies as permission to ship an unapproved visual result.

The corrected plan is deliberately conservative:

- preserve what improved;
- change one visual family at a time;
- compare source and browser output directly;
- make handoff identical before adding live motion;
- stop at every visual gate;
- activate production only after the actual browser result is approved.

