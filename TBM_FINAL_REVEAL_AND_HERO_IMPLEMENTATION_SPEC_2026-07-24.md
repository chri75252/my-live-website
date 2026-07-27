# TBM Homepage Final Reveal + Persistent Armillary

## Evidence-backed implementation specification and execution plan

**Prepared:** 2026-07-24  
**Repository:** `chri75252/my-live-website`  
**Local repository:** `C:\idrive -carlo\Cloud-Drive_carloboul57@gmail.com\Cloud-Drive\Full\TBM\my-live-website`  
**Verified baseline:** `main` at `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`  
**Purpose of this file:** define the final implementation pass. This document does not itself modify the website.

---

## 1. Decision summary

The correct final direction is:

1. **Keep the existing vanilla HTML/CSS/JavaScript and vanilla Three.js architecture.**
2. **Keep a frame-sequence reveal**, but regenerate it directly from the supplied MP4 rather than re-encoding the existing JPEGs.
3. **Rebuild the current persistent armillary selectively as V3**, retaining the useful V2 renderer, diagnostics, responsive layout, import map and disposal infrastructure.
4. **Use one explicit reveal/hero lifecycle and one handoff contract** so the hidden WebGL scene cannot run independently beneath the reveal and arrive at the wrong pose.
5. **Use one flagship live object**, not several competing large 3D elements.
6. **Do not add Spline, React Three Fiber, Blender/GLTF, Lenis, a new site layout, new copy, counters, marquees or unrelated animation systems.**

The current reveal is architecturally viable but uses low-density, second-generation assets and a costly two-stage render path. The current live hero is technically competent but visibly too simplified and does not reproduce the source video's ring hierarchy, internal cage, lacquer highlights, nodes, scale or pose closely enough.

The implementation must improve both systems together because the handoff is a visual and runtime contract, not merely a crossfade.

---

## 2. Authoritative evidence and source precedence

When sources disagree, use this order:

1. **Current repository code and runtime measurements.**
2. **User-supplied source video:** `Master_Execution_Prompt_—_TBM.mp4`.
3. **Verified final handoff package:** `TBM_FINAL_GITHUB_VERIFIED_HANDOFF_2026-07-13/`.
4. **Exact historical Git files/commits named in that package.**
5. **Current compressed `TEVEAL/` JPEGs and generated WebPs.**
6. **Older handoffs and descriptions.**

The old `REFERENCE/` handoff contains an earlier instruction to keep the pre-PR5 hero byte-identical. That instruction was valid for the earlier recovery stage but is **superseded for this final pass** by the later verified handoff, the current merged V2 state and the user's present requirement to improve or replace the current persistent element so it resembles the reveal object.

The pre-PR5 implementation remains a source of useful scale, motion and composition ideas. It is not the final geometry target.

---

## 3. Verified current state

### 3.1 Repository

- Branch: `main`
- HEAD and `origin/main`: `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`
- PR #11 reveal merge: `2b56fe29e3e5d4a059c0bbfa025243c77f6b49ce`
- PR #12 reveal-matched hero merge/current main: `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`
- Current working tree also contains untracked user inputs:
  - `Master_Execution_Prompt_—_TBM.mp4`
  - `TBM_FINAL_GITHUB_VERIFIED_HANDOFF_2026-07-13/`
  - `docs/continue/`
- The handoff package's SHA-256 manifest was checked: **zero mismatches**.
- The package and video are not currently tracked by Git.

### 3.2 Current integration

`index.html` currently loads:

```html
<link rel="stylesheet" href="css/site-v2.css">
<link rel="stylesheet" href="css/hero-scroll.css">
<link rel="stylesheet" href="css/hero-reveal-match-v2.css">
<link rel="stylesheet" href="css/forge-intro.css">

<script type="module" src="js/forge-intro.js"></script>
<script type="module" src="js/home-v2.js"></script>
<script type="module" src="js/hero-3d-reveal-match-v2.js"></script>
```

Three.js `0.180.0`, GSAP `3.13.0` and ScrollTrigger `3.13.0` are loaded from jsDelivr.

### 3.3 Current reveal

Active files:

- `js/forge-intro.js`
- `js/forge-frame-sequence.js`
- `css/forge-intro.css`
- 32 desktop WebPs at 1280×720
- 32 mobile WebPs at 800×450

Current behavior:

- initial batch: 10 frames;
- background concurrency: 4;
- scroll sequence completes at progress `0.82`;
- final hold is approximately `0.82–0.84`;
- crossfade/release is `0.84–1.0`;
- the controller schedules one `requestAnimationFrame`;
- the sequence schedules a second `requestAnimationFrame`;
- missing requested frames use `nearestLoaded()`;
- each high-DPR portrait/mismatched draw can include a dynamically blurred full-canvas background plus two foreground image draws.

Current encoded asset totals:

- desktop sequence: approximately 1.02 MB;
- mobile sequence: approximately 0.60 MB.

The current validation script passes, which proves the expected 32-frame files and protected integration exist. It does not prove the user's visual or smoothness acceptance.

### 3.4 Current persistent hero

Active files:

- `js/hero-3d-reveal-match-v2.js`
- `css/hero-reveal-match-v2.css`

Current technical baseline:

- physical black core with clearcoat;
- studio PMREM environment;
- bronze physical materials;
- five ring structures;
- internal shell/network;
- particles and embers;
- optional `EffectComposer`;
- continuous RAF loop;
- its own ScrollTrigger progression and easing;
- IntersectionObserver;
- desktop DPR cap 1.5, mobile cap 1.25;
- diagnostics at `window.__tbmRevealMatchHero`;
- resource disposal on page hide.

Current visual problem:

- the core/ring ratio and overall silhouette do not sufficiently match the source;
- ring hierarchy reads as simplified geometry rather than the video's three dominant machined rings plus fine cage;
- network shape and density are too generic;
- node placement is not sufficiently intentional;
- the sphere's highlights do not yet reproduce the source's elongated surface reflections;
- scale/presence remains weaker than the target;
- the hero can independently progress while hidden behind the reveal.

---

## 4. Supplied source-video audit

### 4.1 Verified media facts

File:

`Master_Execution_Prompt_—_TBM.mp4`

SHA-256:

`3EB0FFA03AA261677087F781354429373240BF48CEA34FAE10307A618384BB95`

`ffprobe` reports:

```text
container:     MP4/MOV family
video codec:   H.264 High
video size:    1280 × 720
pixel format:  yuv420p
frame rate:    24 fps
video frames:  240
duration:      10.005 seconds
audio:         AAC-LC
file size:     2,623,282 bytes
overall rate:  approximately 2.10 Mbps
```

### 4.2 Visual timeline

The source contains:

1. an initial storyboard/key-frame slate;
2. split forged-gate components;
3. gate assembly and closure;
4. aperture opening;
5. emergence of a black-sphere armillary;
6. camera advance toward the armillary;
7. a clean full-screen armillary phase;
8. a synthetic/example homepage beginning to appear beneath the armillary;
9. an extended example-homepage state.

The source is therefore both an animation source and a design reference. It is **not** valid to use all 240 frames as the production reveal because its final section embeds a different, synthetic homepage.

### 4.3 Preliminary clean cutoff

Visual inspection at 24 fps shows the synthetic homepage beginning to appear at roughly **6.7 seconds**. The exact production cutoff must be determined frame-by-frame during implementation, but the likely boundary is near source frames **160–162**.

Required implementation audit:

```powershell
ffprobe -v error `
  -show_entries format=duration,size,bit_rate `
  -show_entries stream=index,codec_name,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames `
  -of json `
  "Master_Execution_Prompt_—_TBM.mp4"

ffmpeg -i "Master_Execution_Prompt_—_TBM.mp4" `
  -vf "select='lte(n,170)'" `
  -vsync 0 `
  "<audit-temp>\source_%04d.png"
```

Generate a lossless, numbered contact sheet for frames around the transition and manually mark:

- last fully clean reveal frame;
- first frame with any synthetic homepage pixel;
- selected handoff reference frame;
- exact source time and source frame number.

Do not commit lossless audit PNGs. Publish them as CI/PR artifacts.

### 4.4 Visual target extracted from the clean armillary phase

The target armillary contains:

- a deep near-black lacquer sphere;
- broad elongated white/cool reflections constrained to the sphere;
- one strong outer circular silhouette;
- approximately three dominant intersecting bronze rings;
- a fine irregular polygonal/wire network around the core;
- a small set of deliberately placed metallic nodes, including a clustered group near one lower-left ring crossing;
- muted copper/rose-bronze metal;
- restrained warm particles;
- no pedestal;
- no broad yellow halo;
- no comet heads or trails;
- no external glowing balls.

---

## 5. Product and experience objective

### 5.1 User-visible objective

Create one coherent homepage experience in which:

1. the reveal responds deterministically to scroll in either direction;
2. the sequence does not visibly stall, skip or substitute the wrong frame after it is ready;
3. the last clean video-derived pose is held long enough to read;
4. the persistent live armillary appears as the same object continuing into the real TBM homepage;
5. the live object has subtle ambient motion and pointer response after activation;
6. the rest of the homepage proceeds in normal document flow;
7. desktop and mobile remain polished, performant and accessible.

### 5.2 Quality objective

The visual quality target is the source video's clean armillary phase and the interaction quality target is the deterministic pinned image-sequence behavior used by premium scroll-reveal sites such as the previously reviewed Swanson Reserve Capital reference.

The implementation should imitate the **approach and quality characteristics**, not copy that site's assets, layout or source code.

### 5.3 Explicit non-goals

- no full-site redesign;
- no approved-copy changes;
- no new homepage sections;
- no Spline;
- no React or React Three Fiber;
- no mandatory Blender/GLTF model;
- no Lenis installation;
- no second competing large 3D object;
- no pedestal, comet, giant halo or external light-ball treatment;
- no indiscriminate bloom;
- no permanent storage of skip/reveal state;
- no deployment or merge without user review;
- no large generated evidence files committed to the repository.

---

## 6. Final technical architecture

### 6.1 Components

```text
window scroll
    |
    v
ForgeIntroController (single scroll owner for intro)
    |-- maps scroll to exact reveal frame
    |-- draws through ForgeFrameSequence in the same scheduled tick
    |-- controls final-frame hold and DOM release
    `-- broadcasts lifecycle/progress to HeroLifecycle

HeroLifecycle
    suspended -> prewarming -> handoff-ready -> active -> offscreen
                         |            |
                         ` exact calibrated pose

PersistentArmillaryV3
    |-- Three.js scene and renderer
    |-- geometry/material/light presets
    |-- external handoff progress
    |-- normal post-handoff scroll progress
    `-- diagnostics/disposal
```

### 6.2 Scroll ownership

During the intro:

- `forge-intro.js` is the only source of reveal progress.
- The hero must not run an independent ScrollTrigger animation.
- The hero receives lifecycle and a fixed handoff pose from the intro controller.

After release:

- the intro becomes inert/hidden;
- the hero may activate its normal homepage scroll choreography;
- its initial active state must equal the handoff state;
- reverse crossing must restore the calibrated handoff state rather than showing a stale independent state.

Do not add nested or competing ScrollTriggers. For scrubbed state, use linear mapping (`ease: "none"` or equivalent exact progress mapping). Ambient time-based motion remains separate and low amplitude.

### 6.3 Hero lifecycle contract

Required states:

```js
const HERO_STATE = Object.freeze({
  SUSPENDED: 'suspended',
  PREWARMING: 'prewarming',
  HANDOFF_READY: 'handoff-ready',
  ACTIVE: 'active',
  OFFSCREEN: 'offscreen'
});
```

Behavior:

| State | Renderer | Composer | Motion | Pose |
|---|---|---|---|---|
| suspended | no continuous rendering | off | frozen | calibrated handoff pose |
| prewarming | one/few bounded renders | optional only if selected | frozen | calibrated handoff pose |
| handoff-ready | render on demand | selected path | frozen | exact handoff pose |
| active | normal RAF while visible | budget-dependent | ambient + pointer + homepage scroll | starts from handoff pose |
| offscreen | paused | off | phase preserved | last valid pose |

Suggested public API:

```js
window.__tbmHeroV3 = {
  setLifecycle(state),
  setHandoffProgress(progress),
  setHomepageProgress(progress),
  renderOnce(),
  getState(),
  getMetrics(),
  dispose()
};
```

Production code should use a module-level controller/event interface; the `window` API is for diagnostics and deterministic tests.

---

## 7. Reveal asset strategy

### 7.1 Do not keep the current 32-frame source as the final answer

Thirty-two frames over the clean motion span are too coarse for a premium scrubbed reveal. Crossfading between adjacent frames creates dissolves, not true temporal interpolation.

### 7.2 Do not decode all 162 clean 1280×720 frames by default

Approximate decoded RGBA memory:

```text
54 frames  × 1280 × 720 × 4 = ~190 MiB
68 frames  × 1280 × 720 × 4 = ~239 MiB
81 frames  × 1280 × 720 × 4 = ~285 MiB
102 frames × 1280 × 720 × 4 = ~359 MiB
162 frames × 1280 × 720 × 4 = ~570 MiB
```

The production decision must balance cadence, dimensions and decoded memory rather than merely minimizing encoded file size.

### 7.3 Candidate matrix to benchmark

Start with:

| Candidate | Clean-range samples | Intended role |
|---|---:|---|
| A | 48 | lower-memory comparison |
| B | 64 | recommended first production candidate |
| C | 80 | higher-smoothness desktop comparison |

Rules:

- sample by **source time/frame**, not from the existing JPEGs;
- preserve the selected first and last frames exactly;
- use an explicit frame manifest mapping production index to source frame/time;
- build desktop and mobile variants separately;
- load only the active variant;
- require a contiguous decoded set before declaring `scrub-ready`;
- after `scrub-ready`, never use nearest-loaded substitution;
- benchmark WebP and AVIF only if browser decode behavior is measured; WebP is the conservative baseline;
- do not increase dimensions above the 1280×720 source.

Recommended first dimensions to test:

- desktop: 1280×720 and 1152×648;
- mobile: source-derived 800×450 or evidence-based lower landscape variant rendered with a cheap background treatment.

The supplied source is landscape. Do not invent portrait content by generative expansion.

### 7.4 Background/aspect treatment

Remove per-scroll full-canvas `context.filter = blur(...)`.

Preferred options, in order:

1. prebuild the blurred cover background into each mobile/alternate-aspect production frame;
2. use a separate CSS background image/layer updated only when the integer frame changes;
3. use one precomputed average/edge-matched background if it remains visually acceptable.

The foreground object must not be dynamically blurred.

### 7.5 Loading and readiness

Recommended state:

```js
{
  firstFrameDecoded: false,
  contiguousDecodedThrough: -1,
  scrubReady: false,
  requestedIndex: 0,
  renderedIndex: -1,
  fallbackUsed: false
}
```

For a short intro sequence, the strongest default is:

- decode first frame immediately;
- decode the selected active variant in controlled parallel batches;
- show the first frame/loading state while preparation continues;
- enable scroll scrubbing only after all selected frames are decoded, unless profiling proves that a contiguous progressive gate is preferable;
- fail open to the homepage if the source cannot be prepared within the defined timeout.

### 7.6 Single render scheduler

Replace:

```text
scroll -> intro RAF -> sequence RAF -> canvas draw
```

with:

```text
scroll -> one controller RAF -> sequence.drawProgress(progress)
```

Suggested interface:

```js
const drawResult = sequence.drawProgress(sequenceProgress, {
  allowFallback: !sequence.isScrubReady()
});
```

`drawProgress()` should:

- calculate the exact integer frame index;
- avoid redundant redraws when the index is unchanged;
- draw synchronously in the current controller RAF;
- return requested/rendered indices and timing;
- never schedule another RAF.

Default production approach: integer frame snapping, not alpha blending, if the chosen sequence density is sufficient. Test alpha blending as a controlled candidate only if it measurably improves appearance without ghosting or excessive draw cost.

---

## 8. Persistent armillary V3 specification

### 8.1 File strategy

Create a new isolated implementation:

- `js/hero-3d-reveal-match-v3.js`
- `css/hero-reveal-match-v3.css`

Retain V2 files in the repository during review for immediate rollback, but load only V3 from `index.html`.

This is safer and clearer than repeatedly mutating V2 while evaluating visual hypotheses.

### 8.2 Geometry hierarchy

Use one `THREE.Group` with named subgroups:

```text
armillaryRoot
  core
  dominantRings
    outerSilhouette
    diagonalRingA
    diagonalRingB
    verticalRing
  wireCage
  nodes
  atmosphere
```

Required visual hierarchy:

- exactly three dominant intersecting moving rings in addition to a restrained outer silhouette if the selected reference pose requires it;
- any extra cage lines must be thinner, darker and visually subordinate;
- no five equally dominant rings;
- no large pedestal/base;
- no decorative geometry outside the target silhouette.

Use:

- `TorusGeometry` for clean circular major rings;
- `TubeGeometry` with a low-complexity curve only where a noncircular path is directly justified by the reference;
- shared geometries/materials;
- `InstancedMesh` for repeated small nodes/joints where practical;
- explicit names and deterministic transforms for comparison tests.

### 8.3 Core

Starting physical-material direction:

```js
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x030506,
  metalness: 0.15,
  roughness: 0.18,
  clearcoat: 1.0,
  clearcoatRoughness: 0.12,
  specularIntensity: 1.0,
  specularColor: new THREE.Color(0xdde5e4),
  envMapIntensity: 1.1
});
```

These are starting values, not acceptance values.

The core must:

- remain predominantly black;
- preserve a readable spherical contour;
- show two or three elongated surface reflections;
- avoid a chrome lower hemisphere;
- avoid flat painted white patches;
- avoid emissive glow.

### 8.4 Surface reflections

Implementation order:

1. tune studio PMREM panels and area lights;
2. tune `MeshPhysicalMaterial`;
3. evaluate the PR #8 surface-bound glint trajectories;
4. use a controlled `onBeforeCompile`/shader layer only if built-in reflection control cannot reproduce the source.

Do not use screen-facing external sprites that visibly detach from the sphere.

If a shader is required:

- extend `MeshPhysicalMaterial` rather than replacing the entire PBR model;
- constrain highlights using world/view normals;
- expose intensity, width, length and path as test presets;
- keep the shader optional behind a diagnostic flag;
- verify shader compilation and fallback behavior.

### 8.5 Bronze materials

Target:

- muted copper/rose bronze;
- controlled roughness variation;
- brighter edge response without neon emission;
- dominant rings brighter than cage/network;
- minimal or no emissive contribution.

Starting range:

```text
metalness:           0.88–1.0
roughness:           0.24–0.40
clearcoat:           0.20–0.45
clearcoatRoughness:  0.14–0.28
envMapIntensity:     0.75–1.20
```

Use a small deterministic roughness texture only if it survives comparison and does not sparkle under motion.

### 8.6 Wire network

The network should be:

- irregular and polygonal;
- fine;
- wrapped around the core;
- lower contrast than the rings;
- deterministic;
- free of dense grid/moiré behavior.

Recommended construction:

- fixed seed;
- 18–30 anchor points distributed on a shell;
- a curated sparse edge list rather than all-neighbor triangulation;
- one line-segment geometry or a small number of shared tube segments;
- 20–40% opacity equivalent, depending on material path.

Do not add geometry merely to make the object “more complex.” Complexity must reproduce the source hierarchy.

### 8.7 Nodes

Start from six intentional nodes because PR #6/#7/#8 already established a restrained six-node candidate and the source visibly uses a small set of anchors.

Place nodes at ring crossings/reference positions, including:

- upper-left outer silhouette;
- lower-right dominant-ring endpoint;
- clustered lower-left crossing;
- one or two cage anchors only if visible in the source pose.

Nodes:

- metallic, not glowing bulbs;
- small enough to remain secondary;
- use shared/instanced geometry;
- no pulse animation unless nearly imperceptible and source-consistent.

### 8.8 Lighting and environment

Use a compact studio environment:

- broad cool/neutral key panel for the main sphere reflection;
- narrower secondary panel for the second elongated reflection;
- subtle cool fill;
- restrained warm rim for bronze separation;
- dark background matching the last clean reveal frame.

No visible light meshes in the camera scene.

Use PMREM for the environment, dispose intermediate render targets and confirm color management:

```js
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
```

Exposure must be calibrated against the source reference, not chosen in isolation.

### 8.9 Motion and interaction

After activation:

- low-amplitude independent ring rotation;
- slow root yaw;
- very subtle root breathing, if retained;
- surface highlight response driven by actual orientation/light or a constrained material layer;
- pointer parallax on fine pointers only;
- no chaotic wobble;
- no scale pumping;
- no scroll-velocity multiplier.

Use delta-time movement:

```js
const delta = Math.min(clock.getDelta(), 0.05);
phase += motionEnabled ? delta : 0;
```

Pause:

- freezes at the current phase;
- does not reset the pose;
- resumes without a jump.

Reduced motion:

- shows the calibrated static handoff pose;
- disables ambient rotation and pointer response;
- still renders a premium static object;
- intro behavior must be explicit: either a static first/final state with immediate accessible release, or a very short non-scrub transition.

### 8.10 Camera and framing

Do not rely only on a fixed magic camera Z.

Use:

- source-reference bounding measurements;
- geometry bounds;
- target DOM rectangle;
- separate desktop/mobile fit factors;
- a calibrated handoff preset.

The live object's first visible frame must match:

- center;
- outer diameter;
- core diameter;
- ring crossing angles;
- background tone;
- highlight locations.

The object should fill the right hero zone confidently without clipping or covering critical text/cards.

### 8.11 Post-processing

Build and approve geometry/material/lighting first.

Then compare:

- direct renderer;
- restrained composer.

Composer may include:

- anti-aliasing if necessary;
- thresholded selective bloom only for the brightest small highlights;
- subtle grade/vignette only if measurable and visually beneficial.

Desktop composer must not run under the full reveal. Mobile should default to direct rendering unless evidence proves otherwise.

---

## 9. Handoff calibration

### 9.1 Calibration reference

Choose the last clean video frame immediately before synthetic homepage contamination. Record:

```json
{
  "sourceFileSha256": "3EB0FFA03AA261677087F781354429373240BF48CEA34FAE10307A618384BB95",
  "sourceFrame": 0,
  "sourceTimeSeconds": 0,
  "objectCenterNormalized": [0, 0],
  "outerDiameterNormalized": 0,
  "coreDiameterNormalized": 0,
  "backgroundSamples": [],
  "notes": ""
}
```

The zeros are mandatory placeholders to replace with measured values during implementation. They must not survive into the completed manifest.

### 9.2 Comparison method

For desktop and mobile:

1. render selected source frame;
2. capture live V3 in handoff-ready state with all ambient motion frozen;
3. align canvases to the same viewport;
4. produce:
   - 50/50 overlay;
   - difference image;
   - side-by-side;
   - bounding-box metrics.

Use these comparisons to tune geometry/camera/material, not only subjective memory.

### 9.3 Release phases

Recommended starting ranges:

```text
reveal motion:       0.00–0.78
final clean hold:    0.78–0.86
hero prewarm:        begins near 0.74
crossfade/handoff:   0.86–1.00
hero active:         at 1.00
```

These replace the current `0.82/0.84` split only after measured visual testing. The important requirement is a meaningful final-frame hold and bounded prewarm, not these exact numbers.

During crossfade:

- reveal and live object must remain in the same pose;
- cards/header/homepage content should fade according to the approved composition;
- no large translation should attempt to hide a mismatch;
- no one-frame blank;
- reverse progress must be deterministic.

---

## 10. Exact proposed repository changes

### 10.1 Minimum required production files

| File | Change |
|---|---|
| `index.html` | load V3 CSS/JS, update frame count/manifest integration, preserve all approved copy and unrelated markup |
| `js/forge-intro.js` | single scheduler, readiness gate, lifecycle coordination, calibrated hold/release |
| `js/forge-frame-sequence.js` | source-manifest support, synchronous draw API, contiguous decode readiness, diagnostics, remove post-ready nearest fallback |
| `css/forge-intro.css` | remove/limit expensive dynamic visual treatment, preserve accessibility/fail-open states |
| `js/hero-3d-reveal-match-v3.js` | new persistent armillary geometry/material/lighting/lifecycle implementation |
| `css/hero-reveal-match-v3.css` | V3 stage/background/responsive integration |
| `assets/forge-reveal/desktop/*` | replace with video-derived selected production sequence |
| `assets/forge-reveal/mobile/*` | replace with video-derived selected production sequence |
| `assets/forge-reveal/frame-manifest.json` | new exact source-to-production mapping, hashes, dimensions, cutoff |

### 10.2 Required build/audit/test updates

| File | Change |
|---|---|
| `scripts/audit-forge-frames.py` | accept source-video manifest and assert clean cutoff |
| `scripts/build-forge-frame-assets.py` | extract from MP4/lossless intermediates, build candidate variants deterministically |
| `scripts/capture-forge-intro.mjs` | capture slow/fast/reverse and expose requested/rendered indices |
| `scripts/validate-forge-frame-sequence.mjs` | validate manifest, contiguous readiness, no post-ready fallback, protected homepage |
| `scripts/capture-reveal-match-v2.mjs` | supersede or copy to a V3 capture script; retain V2 historical script |
| `scripts/verify-reveal-match-v2.py` | add V3 verifier rather than weakening V2 assertions |
| `scripts/build-reveal-match-contact-sheets.py` | add source-video final-frame overlays and V3 comparison sheets |
| `.github/workflows/forge-intro-visual.yml` | publish video audit, sequence and performance artifacts |
| `.github/workflows/reveal-match-v2-evidence.yml` | create/rename V3 evidence workflow; keep clear V2 history |

### 10.3 Preferred new files

```text
js/hero-3d-reveal-match-v3.js
css/hero-reveal-match-v3.css
scripts/capture-reveal-match-v3.mjs
scripts/verify-reveal-match-v3.py
assets/forge-reveal/frame-manifest.json
```

### 10.4 Files that must not be changed unless evidence requires it

- `css/site-v2.css`
- `js/home-v2.js`
- secondary-page HTML/CSS/JS
- approved homepage wording
- legal/contact/product page content

The historical `js/hero-3d.js` and `css/hero-scroll.css` may remain as rollback/reference files. Do not delete them in the V3 pass.

---

## 11. Patch design snippets

These snippets define interfaces and patch shape. They are not a request to paste code blindly.

### 11.1 One scheduler

```js
// forge-intro.js
function render() {
  frameRequest = 0;
  const progress = readProgress();
  const sequenceProgress = clamp(progress / revealMotionEnd);

  const result = sequence.drawProgress(sequenceProgress, {
    allowFallback: !sequence.isScrubReady()
  });

  updateIntroDom(progress, result);
  updateHeroLifecycle(progress);
}
```

### 11.2 No post-ready nearest fallback

```js
// forge-frame-sequence.js
function resolveFrame(index, allowFallback) {
  if (loadedFlags[index]) return index;
  if (!allowFallback || scrubReady) return null;
  return nearestLoaded(index);
}
```

If `null` occurs after ready, treat it as an invariant failure and fail open/report diagnostics. Do not silently substitute.

### 11.3 Explicit hero coordination

```js
function updateHeroLifecycle(progress) {
  if (progress < prewarmStart) {
    heroController.setLifecycle('suspended');
  } else if (progress < handoffStart) {
    heroController.setLifecycle('prewarming');
  } else if (progress < 1) {
    heroController.setLifecycle('handoff-ready');
    heroController.setHandoffProgress(
      smooth(handoffStart, 1, progress)
    );
  } else {
    heroController.setLifecycle('active');
  }
}
```

### 11.4 Deterministic ring definitions

```js
const dominantRingDefinitions = [
  {
    id: 'diagonal-a',
    radius: 1.62,
    tube: 0.026,
    rotation: [0.86, 0.22, 0.68]
  },
  {
    id: 'diagonal-b',
    radius: 1.66,
    tube: 0.024,
    rotation: [-0.62, 0.38, -0.88]
  },
  {
    id: 'vertical',
    radius: 1.58,
    tube: 0.021,
    rotation: [Math.PI / 2, 0.08, 0.04]
  }
];
```

The numeric transforms above are placeholders to calibrate against the selected source frame. Final code must record the measured/tuned values in diagnostics and tests.

### 11.5 Diagnostics

```js
getState() {
  return {
    lifecycle,
    revealProgress,
    homepageProgress,
    renderPath,
    motionEnabled,
    reducedMotion: reducedMotion.matches,
    camera: {
      fov: camera.fov,
      position: camera.position.toArray()
    },
    sculptureBounds: readCanvasBounds(),
    ringQuaternions: rings.map(ring => ring.quaternion.toArray()),
    renderer: renderer.info.render,
    memory: renderer.info.memory
  };
}
```

---

## 12. Implementation phases and exact order

### Phase 0 — user review of this plan

No production edits before approval.

Confirm:

- one flagship armillary;
- video-derived reveal;
- isolated V3 hero;
- no new framework/site redesign;
- proposed visual direction.

### Phase 1 — branch, backup and baseline evidence

Create from updated `main`:

```text
backup/pre-final-forge-hero-recovery-20260724
codex/final-forge-hero-recovery-v3
```

Before edits, create:

```text
backup/final-forge-hero-recovery_20260724/REVERT_TRACKING.md
```

Back up every planned changed file into that directory and record:

- original absolute path;
- backup path;
- original Git blob/hash;
- intended change;
- planned validation;
- validation status;
- exact restore command.

Do not copy the entire repository.

Capture current behavior at:

- 1920×1080;
- 1680×900;
- 1366×768;
- 390×844;
- 430×932.

Record slow, fast, incremental and reverse reveal plus handoff and live hero.

### Phase 2 — source-video asset audit

1. verify source SHA-256 and metadata;
2. extract lossless transition-window frames;
3. mark last clean frame/first contaminated frame;
4. create 48/64/80 sample candidates;
5. build desktop/mobile variants;
6. record encoded sizes and decoded-memory estimates;
7. inspect contact sheets;
8. choose the lowest count that passes smoothness on desktop and mobile.

Output:

- frame manifest;
- hash manifest;
- source audit report;
- candidate comparison evidence.

Do not integrate assets until the selected candidate passes visual inspection.

### Phase 3 — reveal runtime correction

Edit in order:

1. `js/forge-frame-sequence.js`;
2. `js/forge-intro.js`;
3. `css/forge-intro.css`;
4. reveal validation/capture scripts;
5. `index.html` frame manifest/count references.

Verify after each step:

- `node --check`;
- manifest validation;
- requested index equals rendered index after ready;
- deterministic reverse;
- fail-open;
- reduced motion;
- no live composer workload beneath most of reveal.

### Phase 4 — static V3 geometry match

Create `hero-3d-reveal-match-v3.js` with:

1. core;
2. major rings;
3. outer silhouette;
4. cage/network;
5. six candidate nodes;
6. camera fitting;
7. static diagnostic renderer.

No ambient motion, pointer, particles or post-processing yet.

Tune against source overlays until silhouette, center, scale and ring crossings are acceptably close.

### Phase 5 — materials and lighting

In order:

1. black-lacquer physical core;
2. dominant/subordinate bronze materials;
3. PMREM studio panels;
4. elongated surface reflection test;
5. shader extension only if still necessary;
6. restrained atmosphere.

Produce direct-render comparison before enabling any composer.

### Phase 6 — lifecycle, handoff and motion

1. implement lifecycle states;
2. suspend under reveal;
3. bounded prewarm;
4. handoff-ready frozen pose;
5. exact crossfade;
6. activate homepage progress;
7. add delta-time ambient motion;
8. add pointer damping;
9. verify pause and reduced motion;
10. verify reverse crossing.

### Phase 7 — optional post-processing

Compare direct and composer paths.

Keep composer only if:

- screenshots show a real improvement;
- it does not obscure geometry/material errors;
- performance budgets pass;
- mobile has a safe direct path.

### Phase 8 — complete evidence and PR

Run all relevant workflows on the same final head.

Create one draft PR. Do not merge.

The PR must include:

- exact changed-file list;
- source video audit;
- frame manifest and hashes;
- desktop/mobile recordings;
- reverse and fast-scroll recordings;
- source/live overlay sheets;
- before/after performance;
- reduced-motion/failure evidence;
- explicit remaining differences.

---

## 13. Performance and memory budgets

Final budgets must be measured, but use these initial gates:

### Reveal

- no hidden continuous composer rendering for most of the intro;
- one controller RAF per scroll update;
- no dynamic full-resolution canvas blur in the hot path;
- zero nearest-frame substitutions after `scrub-ready`;
- no large draw-latency spikes attributable to decode/load;
- only active desktop or mobile variant loaded;
- time to first frame and time to scrub-ready recorded;
- decoded memory reported, not inferred from encoded size.

### Hero

- DPR cap remains budget-based and at or below current conservative limits unless measurement justifies a change;
- renderer pauses when hidden/offscreen;
- direct mobile path available;
- shared geometry/materials;
- instanced repeated nodes/joints where useful;
- draw calls, triangles, textures and programs exposed in diagnostics;
- no allocation of geometry/materials in the animation loop.

### Required reported metrics

- average frame interval;
- p95/p99 frame interval;
- long tasks;
- reveal canvas draw time;
- WebGL render time;
- decoded frame memory estimate;
- encoded/network total;
- first-frame time;
- scrub-ready time;
- draw calls/triangles/textures/programs;
- desktop/mobile DPR;
- direct versus composer comparison.

Do not use SwiftShader timings as claims about real-device FPS.

---

## 14. Accessibility, resilience and failure behavior

Preserve:

- no-JavaScript release to normal homepage;
- source-load timeout and fail-open;
- `inert`/focus suppression while intro is active;
- restored focusability after release;
- page visibility pause;
- WebGL context-loss fallback;
- motion pause button;
- responsive mobile layout.

Define reduced motion explicitly:

- no ambient rotation or pointer motion;
- no requirement to change OS settings to see the persistent object;
- static calibrated hero remains visually complete;
- reveal does not trap the user in a long scroll animation.

The normal homepage must remain usable if:

- any reveal frame fails;
- all reveal frames fail;
- WebGL fails;
- GSAP/ScrollTrigger fails;
- JavaScript is disabled.

---

## 15. Validation matrix

### 15.1 Static code and asset checks

```powershell
node --check js/forge-intro.js
node --check js/forge-frame-sequence.js
node --check js/hero-3d-reveal-match-v3.js
node scripts/validate-forge-frame-sequence.mjs
python scripts/verify-reveal-match-v3.py
```

Also verify:

- frame numbering contiguous;
- every manifest hash matches;
- selected cutoff does not include synthetic homepage frames;
- only one hero module is loaded;
- no V2/V3 selector collision;
- backup copies/hash tracker match;
- all prompt-defined placeholders were replaced.

### 15.2 Browser viewports

- 1920×1080;
- 1680×900;
- 1366×768;
- 390×844;
- 430×932.

At each viewport:

- initial load;
- slow scroll down;
- rapid scroll down;
- incremental wheel/touch-equivalent;
- reverse scroll;
- final-frame hold;
- handoff close-up;
- hero initial state;
- ambient motion;
- pointer behavior where applicable;
- pause/resume;
- offscreen pause.

### 15.3 Reveal assertions

- requested and rendered indices monotonic down;
- exact deterministic reverse;
- no unresolved fallback after ready;
- no contaminated frame;
- no double-RAF delay;
- no expensive dynamic blur hot path;
- hero lifecycle is suspended/prewarmed as specified;
- no blank/flash.

### 15.4 Handoff assertions

- centers match closely;
- outer and core diameters match closely;
- ring crossing angles do not visibly jump;
- black level/background do not flash;
- highlight placement does not jump abruptly;
- cards/header do not suddenly collide;
- hero does not appear mid-way through independent progress;
- reverse crossing restores the expected state.

### 15.5 Hero assertions

- larger and more present than current V2 without clipping;
- sphere reads as lacquered black;
- highlights remain on the surface;
- three dominant-ring hierarchy is clear;
- cage/network is fine and subordinate;
- nodes are sparse and intentional;
- no pedestal/comets/halo/external bulbs;
- pause has no pose jump;
- static reduced-motion state is polished;
- mobile object remains visible and coherent.

### 15.6 Human visual gate

The implementer must open and inspect every final comparison sheet and recording.

The final report must state:

- what now matches the source;
- what remains different;
- whether each difference is due to procedural geometry, source-video compression, responsive composition or performance compromise.

The user approves or rejects the draft PR. CI alone is not acceptance.

---

## 16. Acceptance criteria

The pass is complete only when all are true:

1. the reveal uses assets derived directly from the supplied MP4;
2. the clean cutoff is recorded and synthetic homepage frames are excluded;
3. the reveal is deterministic in both directions;
4. no post-ready nearest-frame fallback occurs;
5. the double-RAF path and dynamic blur hot path are removed or proven not to be the active bottleneck;
6. hidden WebGL/composer work is suspended or bounded during the reveal;
7. the V3 live armillary is materially closer to the source in silhouette, core, rings, cage, nodes, material and presence;
8. handoff pose/size/background/highlights are explicitly calibrated;
9. mobile and desktop evidence pass;
10. reduced-motion and failure fallbacks pass;
11. all workflows pass on one final head without weakened assertions;
12. unrelated site behavior and approved wording remain unchanged;
13. a draft PR and evidence are ready for the user's visual review;
14. the PR remains unmerged until explicit approval.

---

## 17. Rollback plan

Before implementation:

- create the backup Git ref;
- create the scoped backup directory and `REVERT_TRACKING.md`;
- copy each affected file before editing;
- record asset directory manifests/hashes.

Rollback options:

1. switch `index.html` back from V3 CSS/JS to V2;
2. restore reveal files/assets from the backup directory;
3. restore individual files using recorded paths;
4. delete only newly introduced V3 files after targets are verified;
5. abandon the unmerged feature branch;
6. use the backup Git ref if a full branch reset is required.

Do not use `git reset --hard` against a working tree containing untracked user assets.

---

## 18. Risks and mitigations

| Risk | Mitigation |
|---|---|
| More frames improve cadence but exhaust decoded memory | benchmark 48/64/80 candidates and variant dimensions; load one variant |
| Source video embeds a synthetic homepage near the end | frame-accurate cutoff and manifest assertion |
| Live object cannot perfectly reproduce an AI/video-generated object | calibrate measurable silhouette/pose and state remaining differences honestly |
| Shader highlights look painted or detach from the core | built-in PBR/PMREM first; shader only as constrained optional layer |
| V3 changes regress existing layout | isolated V3 files, protected-file checks and viewport captures |
| Composer causes reveal regression again | lifecycle suspension and direct mobile path |
| Mobile landscape frames need costly blur/cover treatment | prebuild aspect treatment; no dynamic blur in scroll hot path |
| GSAP and manual progress compete | intro owns progress until release; hero's ScrollTrigger disabled/frozen during intro |
| CI passes but visual result remains weak | mandatory human comparison sheets and user approval |

---

## 19. Recommended immediate next action

Review and approve this specification before implementation.

After approval, execute **Phase 1 only**:

1. create the backup ref and `codex/final-forge-hero-recovery-v3` branch;
2. create `backup/final-forge-hero-recovery_20260724/REVERT_TRACKING.md`;
3. back up the exact affected files;
4. capture the current production baseline and performance trace;
5. report the evidence before changing production code.

This keeps the next pass surgical, measurable and fully reversible.

