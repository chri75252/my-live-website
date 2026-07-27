# The Blacksmith Market

## V8 Unified Live 3D Reveal and Homepage Hero — Implementation PRD and Exact Patch Plan

**Date:** 26 July 2026  
**Status:** implementation specification only; no V8 production files have been created or activated  
**Repository:** `C:\idrive -carlo\Cloud-Drive_carloboul57@gmail.com\Cloud-Drive\Full\TBM\my-live-website`

---

## 1. Controlling decision

V8 must replace the active split system:

1. a 96-frame, pre-rendered V7 reveal canvas;
2. followed one viewport later by a separate static homepage PNG;

with one persistent WebGL canvas containing one Blender-authored model.

The same model, camera state, materials, lighting and renderer must:

- perform the complete scroll-controlled reveal;
- move from the centre toward the right side during the final reveal phase;
- become the settled homepage sculpture without a swap or scroll jump;
- continue moving slowly after the reveal;
- scrub backwards when the user scrolls upward;
- expose a stable sculpture root for later pointer and click interaction.

The current V7 image sequence remains available only as the low-performance, reduced-motion, WebGL-failure and model-load-failure fallback. It must not remain the normal desktop rendering path.

### 1.1 Superseded local decisions

The following older decisions are explicitly superseded:

- `TBM_V7_REVEAL_AND_CATEGORY_NETWORK_REFINEMENT_PRD_2026-07-25.md`, section 3.2, which required a pre-rendered reveal and prohibited a live Three.js model;
- `.sisyphus/notepads/handoff/session_handoff.md`, whose “authoritative current state” still describes V4;
- any earlier plan that gives the reveal and homepage separate scroll owners, separate canvases or independently composed 3D objects;
- any earlier plan that uses `phase-handoff.png` as the normal animated homepage sculpture.

Current V7 source and current localhost runtime are authoritative until V8 passes all approval gates.

---

## 2. Measurable result

V8 is complete only when all of the following are simultaneously true.

### 2.1 Handoff

- Exactly one WebGL canvas renders the normal reveal and homepage sculpture.
- The homepage copy appears while the reveal canvas is still pinned.
- No second homepage plate slides up from below.
- Object-centre displacement between the final reveal sample and the settled hero sample is no more than 2 CSS pixels.
- Apparent sculpture width changes by no more than 0.5% during the reveal-to-idle state change.
- Lighting, material response and rotation do not change at the state boundary.
- Reverse scrolling reconstructs every reveal phase.

### 2.2 Composition

At the primary 1904×900 desktop viewport:

- opening sphere height: 30–34% of available scene height;
- maximum mid-reveal sculpture height: 48–54% of available scene height;
- settled sculpture width: 46–52% of viewport width;
- settled sculpture centre X: 73–76% of viewport width;
- settled sculpture centre Y: 49–54% of available scene height;
- no important geometry crosses the top, bottom or right viewport edge;
- no important geometry overlaps the protected left copy area beyond 46% of viewport width;
- the complete headline, lead, buttons, promises and proof strip remain readable at 100% browser zoom.

These are acceptance ranges, not suggestions. Any required visual tuning must occur through the named V8 contract values rather than unrelated CSS transforms.

### 2.3 Lighting and contrast

- The black sphere must have a readable highlight-to-shadow gradient at every reveal phase after 12%.
- The silhouette must remain visible against the background without turning the background grey.
- A luminance audit at the opening reference frame must not report more than 80% of pixels below an 8-bit luminance value of 12.
- A luminance audit at the settled hero must not report more than 74% of pixels below 12.
- Gold highlights must retain detail; no more than 1% of pixels may clip to luminance 250–255.
- The browser must not apply `brightness(.94)` or another global darkening filter to the live canvas.

### 2.4 Motion

- Scroll progress is reversible and deterministic.
- Reveal motion is continuously interpolated from Blender animation tracks; it is not restricted to 96 discrete images.
- At least five visibly distinct camera stages exist.
- Outer bands, inner rings, cage edges and network nodes do not appear simultaneously.
- The complete reveal occupies 84% of the scroll timeline.
- The final 16% is an intentional hero readability/settle range.
- Settled motion remains slow and subordinate to the copy.

### 2.5 Runtime

- median rendered frame interval at 1904×900: ≤18 ms;
- p95 rendered frame interval: ≤28 ms;
- no long task above 150 ms after the GLB is decoded;
- desktop device-pixel-ratio cap: 1.5;
- mobile device-pixel-ratio cap: 1.25;
- total initial GLB target: ≤8 MB;
- total textures target: ≤5 MB;
- total V8 normal-path transfer target: ≤14 MB;
- the render loop pauses when the section and tab are not visible;
- loss of WebGL context exposes the fallback poster and usable page content.

---

## 3. Scope and non-goals

### 3.1 In scope

- Blender geometry hierarchy and export preparation;
- model materials;
- camera animation;
- reveal animation;
- lighting and colour direction;
- Three.js loading and rendering;
- one scroll owner;
- reveal-to-homepage continuity;
- settled idle motion;
- future pointer-interaction preparation;
- desktop and mobile composition;
- reduced-motion and failure fallbacks;
- visual, runtime and regression validation;
- backups and exact revert tracking.

### 3.2 Explicit non-goals

- Do not redesign Product Focus, How We Buy, Insights, footer or other sections in this pass.
- Do not change approved homepage wording.
- Do not add free-drag rotation.
- Do not activate click interaction in V8.
- Do not add sound.
- Do not introduce React, Vue, a bundler or a new application framework.
- Do not delete V6 or V7 files.
- Do not replace the entire site stylesheet.
- Do not render a final heavy asset batch before the prescribed previews pass.

---

## 4. Architecture

### 4.1 Normal rendering path

```text
Blender V8 source
    |
    +-- geometry hierarchy
    +-- PBR materials
    +-- desktop and mobile cameras
    +-- 192-frame ForgeReveal animation
    |
    v
tbm-armillary-v8.glb
    |
    v
GLTFLoader + MeshoptDecoder
    |
    v
one Three.js scene + one persistent canvas
    |
    +-- progress 0.00–0.84: reveal clip
    +-- progress 0.76–1.00: homepage UI reveal
    +-- progress 0.84–1.00: settled hero hold
    +-- settled state: low-amplitude idle motion
```

### 4.2 State model

The controller must expose only these lifecycle states:

```js
const SCENE_STATE = Object.freeze({
  LOADING: 'loading',
  REVEAL: 'reveal',
  HANDOFF: 'handoff',
  HERO_IDLE: 'hero-idle',
  SUSPENDED: 'suspended',
  FALLBACK: 'fallback',
});
```

State meanings:

| State | Entry condition | Rendering |
|---|---|---|
| `loading` | page parsed, GLB not ready | responsive poster visible |
| `reveal` | progress `< 0.76` | mixer time follows reveal progress |
| `handoff` | progress `0.76–0.92` | same mixer/canvas; UI and final camera settle |
| `hero-idle` | progress `≥ 0.92` | final reveal pose plus ambient offsets |
| `suspended` | page or section hidden | no animation frame scheduled |
| `fallback` | reduced motion, WebGL or GLB failure | poster and homepage copy remain usable |

There must be no `released` state that destroys, hides or replaces the canvas.

### 4.3 Scroll ownership

Use one GSAP ScrollTrigger attached to the V8 stage. CSS supplies the sticky layout; ScrollTrigger supplies progress only. It must not create a pin spacer.

```js
gsap.to(scrollProxy, {
  value: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: stage,
    start: () => `top top+=${headerOffset()}`,
    end: 'bottom bottom',
    scrub: 0.45,
    invalidateOnRefresh: true,
  },
});
```

Forbidden:

- a second ScrollTrigger inside the hero;
- wheel-delta or `ScrollTrigger.getVelocity()` multiplication;
- session storage that permanently skips the reveal;
- destroying the reveal after progress reaches 1;
- programmatic scrolling from the handoff into another hero section.

---

## 5. Art-direction contract

### 5.1 Colour system

| Role | Target |
|---|---|
| void background | `#030403` |
| lifted graphite atmosphere | `#071011` |
| core base | `#0b1113` |
| core cool reflection | `#9ec7cb` |
| forged copper base | `#63351f` |
| polished brass highlight | `#efad68` |
| restrained gold | `#d89138` |
| energy highlight | `#ffd3a0` |
| smoke | `#122022` |

The final look is warm metal against cool graphite/teal fill. Do not use orange as the scene’s ambient colour.

### 5.2 Lighting rig

Blender approval previews and the Three.js runtime must contain equivalent roles:

| Light | Purpose | Blender starting value | Browser role |
|---|---|---:|---|
| soft cool fill | reveal sphere and net shadow detail | area, 70 W, size 5.8 | rectangular area light, low intensity |
| warm key | define copper shape | area, 135 W, size 4.2 | rectangular area light |
| warm rim | separate right/rear silhouette | area, 155 W, size 3.0 | spot or rectangular area light |
| cool rim | separate black sphere from left background | area, 80 W, size 3.8 | rectangular area light |
| ground graze | show engraved floor | area, 44 W | low spot light |
| contact pulse | assembly contacts only | point, peak 95 W | exported emissive animation or point pulse |

Initial browser calibration:

```js
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.18;
scene.background = new THREE.Color(0x030403);
scene.fog = new THREE.FogExp2(0x071011, 0.018);
```

The Blender world strength begins at `0.045`, not `0.012`. Final acceptable range after preview testing is `0.035–0.060`.

Do not compensate for insufficient fill by:

- raising only gold emission;
- applying CSS brightness;
- making the background medium grey;
- increasing bloom until the silhouette is hidden.

### 5.3 Material families

The current single `metal_material()` treatment must become four material profiles.

| Profile | Roughness | Bump distance | Bump strength | Additional treatment |
|---|---:|---:|---:|---|
| `core` | `0.14–0.20` | `0.018` | `0.055` | coat `0.24`, coat roughness `0.16` |
| `polished` | `0.10–0.18` | `0.008` | `0.025` | anisotropy `0.18` |
| `network` | `0.16–0.23` | `0.006` | `0.018` | slightly darker than rings |
| `forged` | `0.28–0.38` | `0.070` | `0.16` | large-scale, non-uniform hammering |

Rules:

- polished rings must not use the current scale-7/high-detail roughness noise;
- network wires and nodes must be visually smooth at homepage distance;
- only the three large broken bands receive clearly visible forged relief;
- sphere imperfections must be broad and shallow, not grainy;
- material differences must remain visible after GLB export and browser lighting;
- no object may be pure `#000000`.

Blender procedural Noise/Bump nodes are not reliably reproduced as equivalent glTF materials. Therefore:

- polished and network profiles use exportable Principled base colour, metallic and roughness values;
- the core's broad imperfection uses its existing shallow geometry displacement;
- forged outer-band relief is applied as actual geometry before GLB export;
- no Blender-only procedural detail may pass approval unless it also appears in a GLB browser render.

### 5.4 Smoke and particles

Blender volumetrics do not export through standard glTF. Therefore:

- approval renders may retain volumetric smoke;
- normal web runtime uses exactly three transparent smoke sprites with two deterministic soft WebP textures;
- smoke cards sit behind or around the sculpture, never in front of homepage text;
- opacity remains within `0.035–0.07`;
- smoke drift is time based and independent from scroll;
- sparks remain sparse and concentrated around actual assembly contacts;
- bloom is permitted only on energy and selected spark materials.

---

## 6. Reveal storyboard and camera choreography

Blender timeline: 192 frames at 24 fps. Browser progress maps `0.00–0.84` to Blender frames `1–192`.

### Phase A — establish the forge, frames 1–34, page progress 0.00–0.15

- Sphere starts centred at approximately `52vw`.
- Sphere rises from below the floor but reaches readable size by frame 18.
- Opening sphere occupies 30–34% of scene height.
- Large broken bands are already partly visible near frame edges.
- Soft cool fill reveals the sphere before gold contact effects begin.
- Floor rings, smoke and sparse dust establish depth.
- Camera performs a restrained forward drift, not a zoom jump.

### Phase B — outer forged approach, frames 30–78, page progress 0.13–0.34

- Three large bands travel on different curved paths.
- Start frames are staggered by at least 9 frames.
- Each band rotates on at least two axes.
- Each arrival has 2–3% overshoot followed by settle.
- Contact creates a local spark burst, one thin arc and a short light pulse.
- Sphere reaches final scale gradually.

### Phase C — orbital assembly and cinematic push, frames 68–122, page progress 0.30–0.53

- Inner rings grow along their own curves; they do not scale from zero as complete rings.
- Ring starts are staggered by 8–10 frames.
- At least one ring crosses in front and another behind the sphere.
- Camera reaches its closest position around frames 104–112.
- Maximum sculpture height remains within 48–54% of scene height.
- Depth of field remains subtle enough that the main rings stay legible.

### Phase D — network formation and lateral orbit, frames 110–158, page progress 0.48–0.69

- Cage edges draw progressively from three connection zones.
- Nodes appear only after their incoming edge reaches them.
- Every fourth or fifth node may pulse once.
- Camera performs a small lateral move and orbit to reveal parallax.
- Secondary smoke and particles move more slowly than the sculpture.

### Phase E — pull-back and rightward handoff, frames 150–192, page progress 0.66–0.84

- Camera pulls back.
- Camera target and sculpture composition move toward the right.
- Homepage copy begins appearing at page progress `0.76`.
- Sculpture reaches the specified settled size and position by `0.92`.
- Final network energy moves outward once.
- Electrical arcs become thinner and less frequent.
- Final pose contains no visual jump into the idle state.

### Phase F — homepage readability hold, page progress 0.84–1.00

- Reveal animation remains at frame 192.
- Homepage UI reaches full opacity by `0.94`.
- Proof strip is completely visible by `0.97`.
- Ambient motion gradually reaches full low-amplitude strength.
- Further downward scroll naturally reveals Product Focus.

### 6.1 Camera keys

The following values are starting values and must be placed in the V8 contract for controlled tuning:

```json
{
  "cameraDesktop": [
    {"frame": 1,   "location": [0.00, -15.40, 1.28], "target": [0.00, 0.00, 0.18], "lens": 46},
    {"frame": 34,  "location": [-0.18, -14.10, 1.18], "target": [0.00, 0.00, 0.20], "lens": 45},
    {"frame": 78,  "location": [0.12, -12.85, 1.02], "target": [0.02, 0.00, 0.20], "lens": 44},
    {"frame": 110, "location": [-0.32, -11.65, 1.05], "target": [0.12, 0.00, 0.22], "lens": 44},
    {"frame": 150, "location": [0.40, -13.30, 1.00], "target": [-0.34, 0.00, 0.20], "lens": 45},
    {"frame": 178, "location": [0.86, -15.25, 0.96], "target": [-1.02, 0.00, 0.18], "lens": 46},
    {"frame": 192, "location": [0.94, -15.70, 0.95], "target": [-1.22, 0.00, 0.18], "lens": 46}
  ],
  "cameraMobile": [
    {"frame": 1, "location": [0.00, -17.80, 1.40], "target": [0.00, 0.00, 0.25], "lens": 52},
    {"frame": 78, "location": [0.00, -15.20, 1.15], "target": [0.00, 0.00, 0.20], "lens": 50},
    {"frame": 110, "location": [-0.18, -14.10, 1.08], "target": [0.00, 0.00, 0.15], "lens": 50},
    {"frame": 150, "location": [0.16, -16.00, 1.02], "target": [0.00, 0.00, -0.05], "lens": 51},
    {"frame": 192, "location": [0.24, -18.40, 0.98], "target": [0.00, 0.00, -0.38], "lens": 52}
  ]
}
```

Mobile requires a separate camera named `Camera_Mobile`. It must be composed in Blender, not produced by cropping the desktop camera.

---

## 7. Target-file matrix

### 7.1 Existing files to edit

| File | Exact scope | Revert source |
|---|---|---|
| `index.html` | activate V8 stylesheet, import map, unified reveal/hero markup and scripts | `backup/unified_live_3d_v8_20260726/originals/index.html` |
| `.sisyphus/notepads/handoff/session_handoff.md` | record verified V8 state and explicitly supersede V4/V7 claims | `backup/unified_live_3d_v8_20260726/originals/session_handoff.md` |

No other existing production file is edited.

### 7.2 New authored files

| File | Purpose | Revert |
|---|---|---|
| `css/tbm-live-3d-v8.css` | unified sticky stage, canvas, UI and fallback styling | remove |
| `js/tbm-live-3d-v8.js` | one renderer, GLB loader, mixer, scroll owner and idle lifecycle | remove |
| `blender/reference-match-v8/config/scene-contract.json` | single V8 tuning contract | remove |
| `blender/reference-match-v8/scripts/build_live_v8.py` | Blender scene/build/export script | remove |
| `scripts/generate-tbm-v8-smoke.py` | deterministic transparent runtime smoke textures | remove |
| `tests/test_tbm_v8_live_3d.py` | HTTP, DOM, handoff, reverse and visual validation | remove |
| `scripts/audit-tbm-v8-luminance.py` | deterministic screenshot luminance audit | remove |

### 7.3 Generated files

| File | Generation |
|---|---|
| `blender/reference-match-v8/TBM_LIVE_V8.blend` | Blender build |
| `assets/tbm-live-v8/tbm-armillary-v8.glb` | Blender glTF export |
| `assets/tbm-live-v8/scene-contract.json` | copied from Blender contract |
| `assets/tbm-live-v8/poster-desktop.webp` | approved frame 192 |
| `assets/tbm-live-v8/poster-mobile.webp` | approved mobile frame 192 |
| `assets/tbm-live-v8/smoke/smoke-01.webp` | approved transparent smoke sprite |
| `assets/tbm-live-v8/smoke/smoke-02.webp` | approved transparent smoke sprite |

### 7.4 Files that must remain untouched

```text
js/tbm-reveal-v7.js
css/tbm-reference-refinement-v7.css
assets/tbm-cinematic-v7/**
blender/reference-match-v7/**
js/tbm-product-network-v7.js
css/tbm-reference-match-v6.css
assets/tbm-cinematic-v6/**
```

---

## 8. Exact implementation patches

These patches are implementation specifications. They are not applied by this document.

### Patch V8-R01 — create the V8 scene contract

Create `blender/reference-match-v8/config/scene-contract.json`:

```diff
--- /dev/null
+++ b/blender/reference-match-v8/config/scene-contract.json
@@
+{
+  "name": "TBM Unified Live 3D V8",
+  "fps": 24,
+  "frameStart": 1,
+  "frameEnd": 192,
+  "revealEndProgress": 0.84,
+  "heroCopyStartProgress": 0.76,
+  "heroIdleStartProgress": 0.92,
+  "desktop": {
+    "stageHeightSvh": 420,
+    "dprCap": 1.5,
+    "settledWidthVw": [46, 52],
+    "settledCentreX": [73, 76],
+    "settledCentreY": [49, 54],
+    "copySafeBoundaryVw": 46
+  },
+  "mobile": {
+    "stageHeightSvh": 360,
+    "dprCap": 1.25
+  },
+  "palette": {
+    "void": "#030403",
+    "atmosphere": "#071011",
+    "core": "#0b1113",
+    "coreReflection": "#9ec7cb",
+    "forgedCopper": "#63351f",
+    "polishedBrass": "#efad68",
+    "gold": "#d89138",
+    "energy": "#ffd3a0",
+    "smoke": "#122022"
+  },
+  "worldStrength": 0.045,
+  "toneMappingExposure": 1.18,
+  "cameraDesktop": [
+    {"frame": 1, "location": [0.0, -15.4, 1.28], "target": [0.0, 0.0, 0.18], "lens": 46},
+    {"frame": 34, "location": [-0.18, -14.1, 1.18], "target": [0.0, 0.0, 0.2], "lens": 45},
+    {"frame": 78, "location": [0.12, -12.85, 1.02], "target": [0.02, 0.0, 0.2], "lens": 44},
+    {"frame": 110, "location": [-0.32, -11.65, 1.05], "target": [0.12, 0.0, 0.22], "lens": 44},
+    {"frame": 150, "location": [0.4, -13.3, 1.0], "target": [-0.34, 0.0, 0.2], "lens": 45},
+    {"frame": 178, "location": [0.86, -15.25, 0.96], "target": [-1.02, 0.0, 0.18], "lens": 46},
+    {"frame": 192, "location": [0.94, -15.7, 0.95], "target": [-1.22, 0.0, 0.18], "lens": 46}
+  ],
+  "cameraMobile": [
+    {"frame": 1, "location": [0.0, -17.8, 1.4], "target": [0.0, 0.0, 0.25], "lens": 52},
+    {"frame": 78, "location": [0.0, -15.2, 1.15], "target": [0.0, 0.0, 0.2], "lens": 50},
+    {"frame": 110, "location": [-0.18, -14.1, 1.08], "target": [0.0, 0.0, 0.15], "lens": 50},
+    {"frame": 150, "location": [0.16, -16.0, 1.02], "target": [0.0, 0.0, -0.05], "lens": 51},
+    {"frame": 192, "location": [0.24, -18.4, 0.98], "target": [0.0, 0.0, -0.38], "lens": 52}
+  ],
+  "web": {
+    "root": "assets/tbm-live-v8",
+    "glb": "assets/tbm-live-v8/tbm-armillary-v8.glb",
+    "desktopPoster": "assets/tbm-live-v8/poster-desktop.webp",
+    "mobilePoster": "assets/tbm-live-v8/poster-mobile.webp"
+  }
+}
```

### Patch V8-R02 — split Blender materials by visual role

Copy the V7 builder to `blender/reference-match-v8/scripts/build_live_v8.py`. Replace the current `metal_material()` function with:

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
-def metal_material(name: str, base: str, roughness: float, *, bright: bool = False, black: bool = False):
+MATERIAL_PROFILES = {
+    "core": {
+        "metallic": 0.72, "roughness": 0.17, "noise_scale": 2.2,
+        "noise_detail": 2.0, "bump_strength": 0.055, "bump_distance": 0.018,
+        "rough_min": 0.14, "rough_max": 0.20, "coat": 0.24,
+        "coat_roughness": 0.16, "anisotropy": 0.0,
+    },
+    "polished": {
+        "metallic": 0.98, "roughness": 0.14, "noise_scale": 1.8,
+        "noise_detail": 1.5, "bump_strength": 0.025, "bump_distance": 0.008,
+        "rough_min": 0.10, "rough_max": 0.18, "coat": 0.08,
+        "coat_roughness": 0.12, "anisotropy": 0.18,
+    },
+    "network": {
+        "metallic": 0.96, "roughness": 0.19, "noise_scale": 2.4,
+        "noise_detail": 1.5, "bump_strength": 0.018, "bump_distance": 0.006,
+        "rough_min": 0.16, "rough_max": 0.23, "coat": 0.04,
+        "coat_roughness": 0.18, "anisotropy": 0.08,
+    },
+    "forged": {
+        "metallic": 0.95, "roughness": 0.33, "noise_scale": 4.0,
+        "noise_detail": 3.0, "bump_strength": 0.16, "bump_distance": 0.07,
+        "rough_min": 0.28, "rough_max": 0.38, "coat": 0.0,
+        "coat_roughness": 0.28, "anisotropy": 0.0,
+    },
+}
+
+def metal_material(name: str, base: str, profile_name: str, *, emission_colour=None, emission_strength=0.0):
+    profile = MATERIAL_PROFILES[profile_name]
     material = bpy.data.materials.new(name)
     material.use_nodes = True
     nodes = material.node_tree.nodes
     links = material.node_tree.links
     bsdf = nodes.get("Principled BSDF")
     node_input(bsdf, "Base Color").default_value = colour(base)
-    node_input(bsdf, "Metallic").default_value = 0.96 if not black else 0.67
-    node_input(bsdf, "Roughness").default_value = roughness
-    if black:
-        clearcoat = node_input(bsdf, "Coat Weight") or node_input(bsdf, "Clearcoat")
-        if clearcoat:
-            clearcoat.default_value = 0.16
-        coat_rough = node_input(bsdf, "Coat Roughness") or node_input(bsdf, "Clearcoat Roughness")
-        if coat_rough:
-            coat_rough.default_value = 0.22
+    node_input(bsdf, "Metallic").default_value = profile["metallic"]
+    node_input(bsdf, "Roughness").default_value = profile["roughness"]
+    coat = node_input(bsdf, "Coat Weight") or node_input(bsdf, "Clearcoat")
+    coat_rough = node_input(bsdf, "Coat Roughness") or node_input(bsdf, "Clearcoat Roughness")
+    anisotropy = node_input(bsdf, "Anisotropic IOR Level") or node_input(bsdf, "Anisotropic")
+    if coat:
+        coat.default_value = profile["coat"]
+    if coat_rough:
+        coat_rough.default_value = profile["coat_roughness"]
+    if anisotropy:
+        anisotropy.default_value = profile["anisotropy"]
     texture = nodes.new("ShaderNodeTexNoise")
-    texture.inputs["Scale"].default_value = 14.0 if black else 7.0
-    texture.inputs["Detail"].default_value = 6.0
-    texture.inputs["Roughness"].default_value = 0.72
+    texture.inputs["Scale"].default_value = profile["noise_scale"]
+    texture.inputs["Detail"].default_value = profile["noise_detail"]
+    texture.inputs["Roughness"].default_value = 0.52
     ramp = nodes.new("ShaderNodeValToRGB")
-    ramp.color_ramp.elements[0].position = 0.28
-    ramp.color_ramp.elements[1].position = 0.72
+    ramp.color_ramp.elements[0].position = 0.34
+    ramp.color_ramp.elements[1].position = 0.66
     bump = nodes.new("ShaderNodeBump")
-    bump.inputs["Strength"].default_value = 0.10 if black else 0.28
-    bump.inputs["Distance"].default_value = 0.09 if black else 0.14
+    bump.inputs["Strength"].default_value = profile["bump_strength"]
+    bump.inputs["Distance"].default_value = profile["bump_distance"]
     rough_map = nodes.new("ShaderNodeMapRange")
-    rough_map.inputs["From Min"].default_value = 0.12
-    rough_map.inputs["From Max"].default_value = 0.9
-    rough_map.inputs["To Min"].default_value = max(0.05, roughness - 0.11)
-    rough_map.inputs["To Max"].default_value = min(0.62, roughness + 0.18)
+    rough_map.inputs["From Min"].default_value = 0.18
+    rough_map.inputs["From Max"].default_value = 0.82
+    rough_map.inputs["To Min"].default_value = profile["rough_min"]
+    rough_map.inputs["To Max"].default_value = profile["rough_max"]
     links.new(texture.outputs["Fac"], ramp.inputs["Fac"])
     links.new(ramp.outputs["Color"], bump.inputs["Height"])
     links.new(bump.outputs["Normal"], node_input(bsdf, "Normal"))
     links.new(texture.outputs["Fac"], rough_map.inputs["Value"])
     links.new(rough_map.outputs["Result"], node_input(bsdf, "Roughness"))
-    if bright:
-        emission = node_input(bsdf, "Emission Color")
-        strength = node_input(bsdf, "Emission Strength")
-        if emission and strength:
-            emission.default_value = colour("#3d1004")
-            strength.default_value = 0.08
+    if emission_colour and emission_strength:
+        emission = node_input(bsdf, "Emission Color")
+        strength = node_input(bsdf, "Emission Strength")
+        if emission and strength:
+            emission.default_value = colour(emission_colour)
+            strength.default_value = emission_strength
     return material
@@
-    black = metal_material("M_Black_Forged_Core", "#030506", 0.21, black=True)
-    forged = metal_material("M_Hammered_Forged_Brass", PALETTE["brass"], 0.26, bright=True)
-    polished = metal_material("M_Polished_Brass", PALETTE["brassHighlight"], 0.17, bright=True)
+    black = metal_material("M_Core_Graphite", PALETTE["core"], "core")
+    forged = metal_material("M_Outer_Forged_Copper", PALETTE["forgedCopper"], "forged")
+    polished = metal_material("M_Orbit_Polished_Brass", PALETTE["polishedBrass"], "polished")
+    network = metal_material("M_Network_Brass", "#a86535", "network")
```

All network edges and nodes must use `network`; inner rings use `polished`; only the three large broken bands use `forged`.

### Patch V8-R02B — make forged detail survive GLB export

Add real, shallow geometry relief to the three outer bands. Do not depend on Blender-only procedural bump nodes:

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
+def add_forged_geometry_relief(item, seed):
+    subdivision = item.modifiers.new("Web_Forged_Subdivision", "SUBSURF")
+    subdivision.subdivision_type = "SIMPLE"
+    subdivision.levels = 2
+    subdivision.render_levels = 2
+    texture = bpy.data.textures.new(f"{item.name}_WebRelief_{seed}", type="CLOUDS")
+    texture.noise_scale = 0.34
+    texture.noise_depth = 2
+    texture.noise_basis = "IMPROVED_PERLIN"
+    displacement = item.modifiers.new("Web_Forged_Relief", "DISPLACE")
+    displacement.texture = texture
+    displacement.texture_coords = "GLOBAL"
+    displacement.strength = 0.035
+    displacement.mid_level = 0.5
+    return item
@@
     for index, (name, major, width, thick, start, end, rotation, initial) in enumerate(band_specs):
         band = add_band(name, major, width, thick, start, end, rotation, forged, geo_bands)
+        add_forged_geometry_relief(band, 20260726 + index)
```

After GLB export, inspect the bands at homepage distance. If the relief is invisible, raise `strength` only within `0.035–0.050`. If the silhouette becomes noisy or the GLB exceeds budget, reduce subdivision before increasing compression.

### Patch V8-R02C — replace non-exportable orbit trimming

glTF exports transform and shape-key animation, but not Blender curve `bevel_factor_end` animation. Replace each progressively trimmed orbit with sequential short arc segments whose transforms export normally:

Dependency: add the R03 rig-root declarations at the top of `build_scene()` before applying this call-site patch, so `orbit_rig` exists when `add_segmented_orbit()` is called. The final source order inside `build_scene()` is: collections → R03 rig roots → materials → geometry calls, including R02C.

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
+def add_segmented_orbit(name, major, rotation, material, target, parent, reveal_start):
+    group = bpy.data.objects.new(name, None)
+    target.objects.link(group)
+    group.parent = parent
+    group.rotation_euler = rotation
+    segment_count = 32
+    points_per_segment = 7
+    for segment_index in range(segment_count):
+        angle_start = math.tau * segment_index / segment_count
+        angle_end = math.tau * (segment_index + 1.04) / segment_count
+        absolute_points = []
+        for point_index in range(points_per_segment):
+            ratio = point_index / (points_per_segment - 1)
+            angle = angle_start + (angle_end - angle_start) * ratio
+            absolute_points.append(Vector((major * math.cos(angle), major * math.sin(angle), 0.0)))
+        origin = absolute_points[0]
+        local_points = [point - origin for point in absolute_points]
+        arc = add_curve(
+            f"{name}_Segment_{segment_index:02d}",
+            local_points,
+            material,
+            target,
+            bevel=0.055,
+        )
+        arc.location = origin
+        arc.parent = group
+        segment_start = reveal_start + segment_index // 2
+        keyframe_transform(arc, 1, scale=(.001, .001, .001))
+        keyframe_transform(arc, segment_start, scale=(.001, .001, .001))
+        keyframe_transform(arc, segment_start + 3, scale=(1.025, 1.025, 1.025))
+        keyframe_transform(arc, segment_start + 5, scale=(1.0, 1.0, 1.0))
+    return group
@@
     for index, (major, rotation) in enumerate(orbit_specs):
-        orbit = add_orbit_curve(f"Inner_Orbit_{index + 1}", major, rotation, polished, geo_orbits)
         reveal_start = 82 + index * 9
-        reveal_end = reveal_start + 24
-        orbit.data.bevel_factor_start = 0.0
-        orbit.data.bevel_factor_end = 0.0
-        keyframe_transform(orbit, 1, rotation=(rotation[0] - .24, rotation[1] + .18, rotation[2] - .22), scale=(.001, .001, .001))
-        orbit.data.keyframe_insert(data_path="bevel_factor_end", frame=reveal_start)
-        orbit.data.bevel_factor_end = 1.0
-        orbit.data.keyframe_insert(data_path="bevel_factor_end", frame=reveal_end)
-        keyframe_transform(orbit, reveal_start, rotation=(rotation[0] - .16, rotation[1] + .12, rotation[2] - .14), scale=(.86, .86, .86))
-        keyframe_transform(orbit, reveal_end - 4, rotation=(rotation[0] + .03, rotation[1] - .02, rotation[2] + .04), scale=(1.025, 1.025, 1.025))
-        keyframe_transform(orbit, reveal_end, rotation=rotation, scale=(1, 1, 1))
-        keyframe_transform(orbit, 192, rotation=(rotation[0] + .24 * (index + 1), rotation[1] - .17 * (index + 1), rotation[2] + .20 * (index + 1)), scale=(1, 1, 1))
+        orbit = add_segmented_orbit(
+            f"Inner_Orbit_{index + 1}",
+            major,
+            rotation,
+            polished,
+            geo_orbits,
+            orbit_rig,
+            reveal_start,
+        )
+        keyframe_transform(
+            orbit,
+            192,
+            rotation=(
+                rotation[0] + .24 * (index + 1),
+                rotation[1] - .17 * (index + 1),
+                rotation[2] + .20 * (index + 1),
+            ),
+            scale=(1, 1, 1),
+        )
```

Gate C must specifically verify that these segmented rings read as continuous polished rings and do not reveal seams or radial “popping.”

### Patch V8-R03 — create exportable hierarchy

Add named root empties and parent generated objects:

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
+def add_rig_empty(name, collection, parent=None):
+    item = bpy.data.objects.new(name, None)
+    collection.objects.link(item)
+    if parent:
+        item.parent = parent
+    return item
+
 def build_scene():
@@
+    sculpture_root = add_rig_empty("TBM_Sculpture", geo_core)
+    core_rig = add_rig_empty("CoreRig", geo_core, sculpture_root)
+    outer_rig = add_rig_empty("OuterBandRig", geo_bands, sculpture_root)
+    orbit_rig = add_rig_empty("OrbitRig", geo_orbits, sculpture_root)
+    cage_rig = add_rig_empty("CageRig", geo_cage, sculpture_root)
+    node_rig = add_rig_empty("NodeRig", geo_nodes, sculpture_root)
+    energy_rig = add_rig_empty("EnergyRig", vfx_electric, sculpture_root)
+    spark_rig = add_rig_empty("SparkRig", vfx_sparks, sculpture_root)
@@
     core = add_uv_sphere("Core_Black_Forged", 1.38, (0, 0, .16), black, geo_core, segments=96)
+    core.parent = core_rig
@@
     for index, (name, major, width, thick, start, end, rotation, initial) in enumerate(band_specs):
         band = add_band(name, major, width, thick, start, end, rotation, forged, geo_bands)
+        band.parent = outer_rig
@@
     progressive_edges = add_progressive_cage_edges(cage, network, geo_cage)
+    for edge in progressive_edges:
+        edge.parent = cage_rig
@@
         node = add_uv_sphere(f"Network_Node_{index:02d}", radius, point, network, geo_nodes, segments=24)
+        node.parent = node_rig
@@
     halo = add_torus("Energised_Outer_Halo", 3.08, .043, (math.radians(54), math.radians(-12), math.radians(24)), polished, geo_orbits)
+    halo.parent = orbit_rig
@@
         arc = add_curve(f"Electric_Arc_{arc_index + 1}", points, energy, vfx_electric, bevel=.011)
+        arc.parent = energy_rig
@@
         size = random.uniform(.25, 1.65)
+        spark.parent = spark_rig
```

The implementation must verify the exported GLB contains these exact names:

```text
TBM_Sculpture
CoreRig
OuterBandRig
OrbitRig
CageRig
NodeRig
EnergyRig
SparkRig
Camera_Desktop
Camera_Mobile
```

### Patch V8-R04 — replace the three-key camera with the full path

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
+def add_contract_camera(name, keys, collection):
+    camera_data = bpy.data.cameras.new(name)
+    camera_data.sensor_width = 36
+    camera_data.dof.use_dof = False
+    camera = bpy.data.objects.new(name, camera_data)
+    collection.objects.link(camera)
+    target = bpy.data.objects.new(f"{name}_Target", None)
+    collection.objects.link(target)
+    for key in keys:
+        frame = key["frame"]
+        camera.location = key["location"]
+        camera.data.lens = key["lens"]
+        target.location = key["target"]
+        direction = Vector(target.location) - Vector(camera.location)
+        camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
+        camera.keyframe_insert(data_path="location", frame=frame)
+        camera.keyframe_insert(data_path="rotation_euler", frame=frame)
+        camera.data.keyframe_insert(data_path="lens", frame=frame)
+        target.keyframe_insert(data_path="location", frame=frame)
+    return camera, target
@@
-    target = bpy.data.objects.new("Camera_Target", None)
-    cameras.objects.link(target)
-    target.location = (0, 0, .2)
-    target.keyframe_insert(data_path="location", frame=1)
-    target.location = (-1.28, 0, .15)
-    target.keyframe_insert(data_path="location", frame=192)
-    bpy.ops.object.camera_add(location=(0, -11.4, 1.15))
-    camera = bpy.context.object
-    camera.name = "Camera_Desktop"
-    camera.data.lens = 58
-    camera.data.sensor_width = 36
-    camera.data.dof.use_dof = True
-    camera.data.dof.focus_object = core
-    camera.data.dof.aperture_fstop = 3.2
-    move_to(camera, cameras)
-    scene.camera = camera
-    look_at(camera, target)
-    keyframe_transform(camera, 1, location=(0, -14.20, 1.25))
-    keyframe_transform(camera, 96, location=(.20, -12.35, .92))
-    keyframe_transform(camera, 192, location=(.82, -15.85, .92))
+    camera, desktop_target = add_contract_camera(
+        "Camera_Desktop", CONTRACT["cameraDesktop"], cameras
+    )
+    mobile_camera, mobile_target = add_contract_camera(
+        "Camera_Mobile", CONTRACT["cameraMobile"], cameras
+    )
+    scene.camera = camera
+    apply_smooth_fcurves()
```

The desktop and mobile cameras are separately authored, exported and selected at runtime. Camera rotation is keyed at every camera position. A one-time Euler rotation calculated before the camera keys is not sufficient. Approval still rendering must explicitly select `Camera_Desktop` or `Camera_Mobile`; it must not rely on whichever camera is currently active.

### Patch V8-R05 — lighting and atmosphere

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
-    world_background.inputs["Strength"].default_value = 0.012
+    world_background.inputs["Strength"].default_value = CONTRACT["worldStrength"]
@@
-    volume.inputs["Density"].default_value = 0.12
+    volume.inputs["Density"].default_value = 0.055
@@
-    key = add_area("Key_Cool", (-3.1, -4.2, 5.4), 88, 5.2, "#c9e8ed", lights)
+    fill = add_area("Fill_Cool", (-3.4, -4.8, 3.8), 70, 5.8, "#a8d0d2", lights)
+    look_at(fill, core)
+    key = add_area("Key_Warm", (-2.2, -3.8, 5.2), 135, 4.2, "#efb276", lights)
     look_at(key, core)
-    rim = add_area("Rim_Warm", (4.4, .4, 3.8), 160, 3.4, "#ff9f58", lights)
+    rim = add_area("Rim_Warm", (4.4, .4, 3.8), 155, 3.0, "#ef8d48", lights)
     look_at(rim, core)
-    left_rim = add_area("Rim_Amber", (-4.4, .6, 1.5), 66, 2.6, "#e67335", lights)
-    look_at(left_rim, core)
-    floor_light = add_area("Ground_Graze", (0, -1.2, -.5), 40, 3.0, "#e58b42", lights, shape="RECTANGLE")
+    cool_rim = add_area("Rim_Cool", (-4.2, .8, 2.2), 80, 3.8, "#8fc6ca", lights)
+    look_at(cool_rim, core)
+    floor_light = add_area("Ground_Graze", (0, -1.2, -.5), 44, 3.2, "#d89138", lights, shape="RECTANGLE")
```

### Patch V8-R05B — deterministic web smoke textures

Create `scripts/generate-tbm-v8-smoke.py`. This produces soft alpha textures locally; it does not introduce a downloaded stock asset or an image-generation dependency:

```diff
--- /dev/null
+++ b/scripts/generate-tbm-v8-smoke.py
@@
+from pathlib import Path
+import numpy as np
+from PIL import Image, ImageFilter
+
+ROOT = Path(__file__).resolve().parents[1]
+OUTPUT = ROOT / "assets" / "tbm-live-v8" / "smoke"
+SIZE = 1024
+
+def multiscale_noise(seed):
+    rng = np.random.default_rng(seed)
+    result = np.zeros((SIZE, SIZE), dtype=np.float32)
+    weights = ((24, .45), (48, .28), (96, .17), (192, .10))
+    for grid, weight in weights:
+        sample = (rng.random((grid, grid)) * 255).astype(np.uint8)
+        layer = Image.fromarray(sample, "L").resize((SIZE, SIZE), Image.Resampling.BICUBIC)
+        result += (np.asarray(layer, dtype=np.float32) / 255.0) * weight
+    return result
+
+def write_smoke(seed, name, stretch, drift):
+    y, x = np.mgrid[-1:1:complex(SIZE), -1:1:complex(SIZE)]
+    warped_x = x + np.sin((y + drift) * 4.2) * .12
+    radial = np.exp(-((warped_x / stretch) ** 2 + (y / .58) ** 2) * 2.4)
+    detail = np.clip((multiscale_noise(seed) - .30) * 1.8, 0, 1)
+    alpha = np.clip(radial * detail * 128, 0, 96).astype(np.uint8)
+    alpha_image = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(9))
+    rgba = Image.new("RGBA", (SIZE, SIZE), (142, 166, 168, 0))
+    rgba.putalpha(alpha_image)
+    rgba.save(OUTPUT / name, "WEBP", lossless=True, method=6)
+
+OUTPUT.mkdir(parents=True, exist_ok=True)
+write_smoke(20260726, "smoke-01.webp", .82, .10)
+write_smoke(20260727, "smoke-02.webp", .68, -.18)
```

Validation: both images must be `1024×1024`, RGBA, transparent at every edge, and under 300 KB each. If either texture reads as a rectangular card in-browser, reject it and adjust the alpha mask; do not hide the edge by increasing scene darkness.

### Patch V8-R06 — GLB export

Add:

```diff
--- a/blender/reference-match-v7/scripts/build_reference_match_v7.py
+++ b/blender/reference-match-v8/scripts/build_live_v8.py
@@
+def select_export_objects():
+    bpy.ops.object.select_all(action="DESELECT")
+    allowed_collections = {
+        "GEO_CORE", "GEO_FORGED_BANDS", "GEO_INNER_ORBITS",
+        "GEO_NETWORK_CAGE", "GEO_NETWORK_NODES", "VFX_ELECTRIC",
+        "VFX_SPARKS", "CAMERAS",
+    }
+    for collection_name in allowed_collections:
+        collection = bpy.data.collections.get(collection_name)
+        if not collection:
+            continue
+        for item in collection.all_objects:
+            item.select_set(True)
+
+def export_web_glb(scene, *, optimize=False):
+    configured = ROOT / CONTRACT["web"]["glb"]
+    output = configured if not optimize else configured.with_name("tbm-armillary-v8.optimized.glb")
+    output.parent.mkdir(parents=True, exist_ok=True)
+    select_export_objects()
+    bpy.ops.export_scene.gltf(
+        filepath=str(output),
+        export_format="GLB",
+        use_selection=True,
+        export_apply=True,
+        export_animations=True,
+        export_frame_range=True,
+        export_frame_step=1,
+        export_animation_mode="SCENE",
+        export_nla_strips_merged_animation_name="ForgeReveal",
+        export_anim_scene_split_object=False,
+        export_bake_animation=True,
+        export_force_sampling=True,
+        export_materials="EXPORT",
+        export_cameras=True,
+        export_lights=False,
+        export_yup=True,
+        export_meshopt_compression_enable=optimize,
+        export_meshopt_extension="EXT_meshopt_compression",
+    )
+    shutil.copy2(
+        CONTRACT_PATH,
+        ROOT / CONTRACT["web"]["root"] / "scene-contract.json",
+    )
@@
 def main():
     scene, camera, core = build_scene()
@@
+    if MODE in {"glb", "all"}:
+        export_web_glb(scene, optimize=False)
+    elif MODE == "glb-optimized":
+        export_web_glb(scene, optimize=True)
```

The installed Blender 5.2 exporter exposes `SCENE` animation mode, a merged animation name, scene-object splitting control and built-in Meshopt compression. Use those verified local exporter options instead of installing another optimization package.

After optimized export:

```powershell
Move-Item -LiteralPath "assets\tbm-live-v8\tbm-armillary-v8.optimized.glb" `
  -Destination "assets\tbm-live-v8\tbm-armillary-v8.glb" -Force
```

This replacement is permitted only after the optimized file has been copied into the pass backup and:

- animation count and duration match;
- all required named nodes remain present;
- browser visual comparison shows no material or geometry regression.

### Patch V8-R07 — unified HTML structure

Modify `index.html`:

Because the active HTML is minified into one line per section, perform two exact DOM-block removals before inserting the new block:

1. delete the complete element matched by `[data-reveal-stage]`;
2. delete the complete element matched by `main > section.hero-v6#top`.

Do not delete `main`, `#product-focus` or any following section.

```diff
--- a/index.html
+++ b/index.html
@@
-  <link rel="stylesheet" href="css/tbm-reference-refinement-v7.css">
-  <link rel="preload" as="image" href="assets/tbm-cinematic-v7/keyframes/phase-handoff.png" type="image/png">
-  <noscript><style>.tbm-reveal-v7-stage{display:none!important}</style></noscript>
+  <link rel="stylesheet" href="css/tbm-live-3d-v8.css">
+  <link rel="preload" as="image" href="assets/tbm-live-v8/poster-desktop.webp" type="image/webp" media="(min-width:701px)">
+  <link rel="preload" as="image" href="assets/tbm-live-v8/poster-mobile.webp" type="image/webp" media="(max-width:700px)">
+  <script type="importmap" id="tbm-three-importmap">
+  {
+    "imports": {
+      "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
+      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
+    }
+  }
+  </script>
+  <noscript><style>.tbm-live-v8{min-height:auto!important}.tbm-live-v8__poster{opacity:1!important}.tbm-live-v8__hero-ui{opacity:1!important}</style></noscript>
@@ immediately after `<main id="main-content">`
+  <section class="tbm-live-v8" id="top" data-tbm-live-stage aria-labelledby="hero-title">
+    <div class="tbm-live-v8__sticky">
+      <canvas class="tbm-live-v8__canvas" id="tbm-live-v8-canvas" aria-hidden="true"></canvas>
+      <picture class="tbm-live-v8__poster" aria-hidden="true">
+        <source media="(max-width:700px)" srcset="assets/tbm-live-v8/poster-mobile.webp">
+        <img src="assets/tbm-live-v8/poster-desktop.webp" alt="">
+      </picture>
+      <div class="tbm-live-v8__atmosphere" aria-hidden="true"></div>
+      <div class="tbm-live-v8__hero-ui shell">
+        <div class="hero-copy">
+          <p class="eyebrow"><span></span>Premium wholesale partnerships</p>
+          <h1 id="hero-title">We forge value.<br>You grow <em>together.</em></h1>
+          <p class="hero-lead">A focused UK wholesale buyer for branded and excess consumer stock. Clear evaluation, commercially grounded offers and a straightforward supplier process.</p>
+          <div class="hero-actions">
+            <a class="button button-gold" href="contact.html"><span>Sell to Us</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
+            <a class="button button-outline" href="#product-focus"><span>Explore Product Focus</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
+          </div>
+          <ul class="hero-promises" aria-label="Supplier process highlights">
+            <li><span class="promise-icon">✓</span><span><strong>Clear review</strong><small>Structured product evaluation</small></span></li>
+            <li><span class="promise-icon">£</span><span><strong>Commercial focus</strong><small>Data-led buying decisions</small></span></li>
+            <li><span class="promise-icon">↗</span><span><strong>Direct process</strong><small>One clear supplier route</small></span></li>
+          </ul>
+        </div>
+      </div>
+      <div class="tbm-live-v8__hud">
+        <div>
+          <p>The Blacksmith Market</p>
+          <span data-tbm-live-status role="status" aria-live="polite">Preparing the forge</span>
+        </div>
+        <div class="tbm-live-v8__meter" aria-hidden="true"></div>
+        <button type="button" data-tbm-live-skip>Skip reveal</button>
+      </div>
+      <div class="tbm-live-v8__phase" aria-hidden="true">Forged for clear decisions</div>
+      <button class="tbm-live-v8__motion" type="button" data-tbm-live-motion aria-pressed="true">Pause ambient motion</button>
+      <div class="proof-strip shell" aria-label="Operating principles">
+        <span class="proof-label">Built for practical supplier conversations</span>
+        <div class="proof-item"><strong>UK-focused</strong><small>Consumer stock sourcing</small></div>
+        <div class="proof-item"><strong>Multi-category</strong><small>Selected product sectors</small></div>
+        <div class="proof-item"><strong>Data-led</strong><small>Commercial evaluation</small></div>
+        <div class="proof-item"><strong>Direct contact</strong><small>Supplier-first process</small></div>
+      </div>
+    </div>
+  </section>
@@
-<script type="module" src="js/tbm-reveal-v7.js"></script><script type="module" src="js/home-v2.js"></script><script type="module" src="js/tbm-product-network-v7.js"></script>
+<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
+<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
+<script type="module" src="js/tbm-live-3d-v8.js"></script>
+<script type="module" src="js/home-v2.js"></script>
+<script type="module" src="js/tbm-product-network-v7.js"></script>
```

The approved copy above is copied unchanged from the current page.

### Patch V8-R08 — unified stage CSS

Create `css/tbm-live-3d-v8.css`. The implementation must include these exact structural rules:

```diff
--- /dev/null
+++ b/css/tbm-live-3d-v8.css
@@
+:root {
+  --tbm-v8-header: 92px;
+  --tbm-v8-progress: 0;
+  --tbm-v8-hero: 0;
+  --tbm-v8-proof: 0;
+}
+
+.tbm-live-v8 {
+  position: relative;
+  height: 420svh;
+  background: #030403;
+}
+
+.tbm-live-v8__sticky {
+  position: sticky;
+  top: var(--tbm-v8-header);
+  height: calc(100svh - var(--tbm-v8-header));
+  overflow: hidden;
+  isolation: isolate;
+  background: #030403;
+}
+
+.tbm-live-v8__canvas,
+.tbm-live-v8__poster,
+.tbm-live-v8__poster img,
+.tbm-live-v8__atmosphere {
+  position: absolute;
+  inset: 0;
+  width: 100%;
+  height: 100%;
+}
+
+.tbm-live-v8__canvas {
+  z-index: 1;
+  display: block;
+  touch-action: pan-y;
+}
+
+.tbm-live-v8__poster {
+  z-index: 0;
+  margin: 0;
+  opacity: 1;
+  transition: opacity .4s ease;
+}
+
+.tbm-live-v8__poster img {
+  object-fit: cover;
+  object-position: center;
+}
+
+.tbm-v8-ready .tbm-live-v8__poster {
+  opacity: 0;
+}
+
+.tbm-live-v8__atmosphere {
+  z-index: 2;
+  pointer-events: none;
+  background:
+    linear-gradient(90deg, rgba(3,4,3,.98) 0%, rgba(3,4,3,.92) 27%, rgba(3,4,3,.46) 48%, rgba(3,4,3,.03) 72%),
+    radial-gradient(circle at 72% 48%, rgba(30,64,65,.12), transparent 38%);
+}
+
+.tbm-live-v8__hero-ui {
+  position: relative;
+  z-index: 3;
+  min-height: 100%;
+  display: grid;
+  grid-template-columns: minmax(410px, .84fr) minmax(500px, 1.16fr);
+  align-items: center;
+  pointer-events: none;
+  opacity: var(--tbm-v8-hero);
+  transform: translate3d(calc((1 - var(--tbm-v8-hero)) * -22px), 0, 0);
+}
+
+.tbm-live-v8__hero-ui .hero-copy {
+  grid-column: 1;
+  max-width: 660px;
+  padding: 54px 0 132px;
+  pointer-events: auto;
+}
+
+.tbm-live-v8__hero-ui h1 {
+  max-width: 590px;
+  margin: 0 0 26px;
+  color: #f1ede3;
+  font: 600 clamp(4.7rem, 7.4vw, 8.5rem)/.76 var(--v6-display);
+  letter-spacing: -.065em;
+}
+
+.tbm-live-v8__hero-ui h1 em {
+  color: var(--v6-hot);
+  font-style: normal;
+}
+
+.tbm-live-v8__hero-ui .hero-lead {
+  max-width: 520px;
+  color: #d0cdc4;
+  font-size: 1.03rem;
+  line-height: 1.72;
+}
+
+.tbm-live-v8__hud {
+  position: absolute;
+  z-index: 4;
+  left: clamp(28px, 6vw, 100px);
+  right: clamp(28px, 6vw, 100px);
+  bottom: clamp(24px, 5vw, 70px);
+  display: flex;
+  align-items: end;
+  justify-content: space-between;
+  gap: 24px;
+  opacity: calc(1 - var(--tbm-v8-hero));
+  pointer-events: none;
+}
+
+.tbm-live-v8__hud p {
+  margin: 0 0 9px;
+  color: var(--v6-gold);
+  font: 700 .64rem/1 var(--v6-sans);
+  letter-spacing: .26em;
+  text-transform: uppercase;
+}
+
+.tbm-live-v8__hud span {
+  display: block;
+  font: 600 clamp(1.15rem, 2vw, 1.7rem)/1 var(--v6-display);
+  letter-spacing: .04em;
+}
+
+.tbm-live-v8__hud button,
+.tbm-live-v8__motion {
+  border: 1px solid var(--v6-line);
+  border-radius: 999px;
+  padding: 10px 15px;
+  color: var(--v6-ink);
+  background: rgba(3,4,3,.54);
+  font: 700 .62rem var(--v6-sans);
+  letter-spacing: .11em;
+  text-transform: uppercase;
+  cursor: pointer;
+  pointer-events: auto;
+}
+
+.tbm-live-v8__meter {
+  width: min(36vw, 540px);
+  height: 1px;
+  margin-bottom: 8px;
+  background: rgba(255,255,255,.18);
+}
+
+.tbm-live-v8__meter::before {
+  content: "";
+  display: block;
+  width: calc(var(--tbm-v8-progress) * 100%);
+  height: 100%;
+  background: var(--v6-hot);
+  box-shadow: 0 0 16px rgba(255,189,110,.72);
+}
+
+.tbm-live-v8__phase,
+.tbm-live-v8__motion,
+.tbm-live-v8 .proof-strip {
+  position: absolute;
+  z-index: 4;
+  opacity: var(--tbm-v8-proof);
+}
+
+.tbm-live-v8__phase {
+  right: 4vw;
+  bottom: 11%;
+  color: rgba(236,231,219,.66);
+  font: 600 .64rem var(--v6-sans);
+  letter-spacing: .12em;
+  text-transform: uppercase;
+}
+
+.tbm-live-v8__motion {
+  right: 4vw;
+  bottom: 17%;
+}
+
+.tbm-live-v8 .proof-strip {
+  left: 50%;
+  bottom: 22px;
+  width: min(1320px, 92vw);
+  transform: translate3d(-50%, calc((1 - var(--tbm-v8-proof)) * 18px), 0);
+  background: rgba(4,5,4,.72);
+  backdrop-filter: blur(12px);
+}
+
+.tbm-v8-fallback .tbm-live-v8__poster {
+  opacity: 1;
+}
+
+@media (max-width: 840px) {
+  :root { --tbm-v8-header: 76px; }
+  .tbm-live-v8 { height: 360svh; }
+  .tbm-live-v8__hero-ui {
+    grid-template-columns: 1fr;
+    align-items: start;
+  }
+  .tbm-live-v8__hero-ui .hero-copy {
+    padding: 54px 0 210px;
+  }
+  .tbm-live-v8__atmosphere {
+    background: linear-gradient(180deg, rgba(3,4,3,.90), rgba(3,4,3,.60) 46%, rgba(3,4,3,.84));
+  }
+}
+
+@media (max-width: 640px) {
+  .tbm-live-v8__hero-ui h1 {
+    font-size: clamp(4.25rem, 18vw, 5.8rem);
+  }
+  .tbm-live-v8__hud {
+    align-items: flex-start;
+    flex-direction: column;
+  }
+  .tbm-live-v8__meter {
+    width: min(70vw, 320px);
+  }
+  .tbm-live-v8 .proof-strip {
+    position: absolute;
+    grid-template-columns: 1fr 1fr;
+  }
+}
+
+@media (prefers-reduced-motion: reduce) {
+  .tbm-live-v8 {
+    height: calc(100svh - var(--tbm-v8-header));
+  }
+  .tbm-live-v8__hero-ui,
+  .tbm-live-v8__phase,
+  .tbm-live-v8 .proof-strip {
+    opacity: 1;
+    transform: none;
+  }
+  .tbm-live-v8__hud,
+  .tbm-live-v8__motion {
+    display: none;
+  }
+}
```

After implementation, mobile proof-strip placement must be visually tested. Do not ship a horizontal overflow or cover the buttons.

### Patch V8-R09 — live controller

Create `js/tbm-live-3d-v8.js`. Required imports and control flow:

```diff
--- /dev/null
+++ b/js/tbm-live-3d-v8.js
@@
+import * as THREE from 'three';
+import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
+import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
+import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
+import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
+
+const stage = document.querySelector('[data-tbm-live-stage]');
+const sticky = stage?.querySelector('.tbm-live-v8__sticky');
+const canvas = document.getElementById('tbm-live-v8-canvas');
+const status = stage?.querySelector('[data-tbm-live-status]');
+const skip = stage?.querySelector('[data-tbm-live-skip]');
+const motionButton = stage?.querySelector('[data-tbm-live-motion]');
+const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
+
+const SCENE_STATE = Object.freeze({
+  LOADING: 'loading',
+  REVEAL: 'reveal',
+  HANDOFF: 'handoff',
+  HERO_IDLE: 'hero-idle',
+  SUSPENDED: 'suspended',
+  FALLBACK: 'fallback',
+});
+
+const clamp = (value, minimum = 0, maximum = 1) =>
+  Math.min(maximum, Math.max(minimum, value));
+
+const smoothstep = (start, end, value) => {
+  const progress = clamp((value - start) / Math.max(0.0001, end - start));
+  return progress * progress * (3 - 2 * progress);
+};
+
+if (!stage || !sticky || !canvas || reducedMotion.matches) {
+  enableFallback('reduced-motion');
+} else {
+  initialise().catch(error => enableFallback(error?.message || 'initialisation-failed'));
+}
+
+async function initialise() {
+  const [contractResponse] = await Promise.all([
+    fetch('assets/tbm-live-v8/scene-contract.json', { cache: 'force-cache' }),
+  ]);
+  if (!contractResponse.ok) throw new Error(`contract-${contractResponse.status}`);
+  const contract = await contractResponse.json();
+
+  const renderer = new THREE.WebGLRenderer({
+    canvas,
+    antialias: true,
+    alpha: false,
+    powerPreference: 'high-performance',
+  });
+  renderer.outputColorSpace = THREE.SRGBColorSpace;
+  renderer.toneMapping = THREE.AgXToneMapping;
+  renderer.toneMappingExposure = contract.toneMappingExposure;
+  renderer.setClearColor(0x030403, 1);
+
+  const scene = new THREE.Scene();
+  scene.background = new THREE.Color(0x030403);
+  scene.fog = new THREE.FogExp2(0x071011, 0.018);
+
+  const pmrem = new THREE.PMREMGenerator(renderer);
+  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
+  scene.environment = environment;
+  pmrem.dispose();
+  RectAreaLightUniformsLib.init();
+  addRuntimeLights(scene);
+
+  const loader = new GLTFLoader();
+  loader.setMeshoptDecoder(MeshoptDecoder);
+  const gltf = await loader.loadAsync(contract.web.glb);
+  const sculpture = gltf.scene.getObjectByName('TBM_Sculpture');
+  if (!sculpture) throw new Error('missing-TBM_Sculpture');
+  scene.add(gltf.scene);
+  const smokeSprites = await addRuntimeSmoke(scene, contract).catch(() => []);
+  const energyMaterials = collectEnergyMaterials(gltf.scene);
+
+  const mobile = window.matchMedia('(max-width: 700px)');
+  const selectCamera = () => {
+    const name = mobile.matches ? 'Camera_Mobile' : 'Camera_Desktop';
+    const result = gltf.scene.getObjectByName(name) || gltf.cameras[0];
+    if (!result?.isCamera) throw new Error(`missing-${name}`);
+    return result;
+  };
+  let camera = selectCamera();
+
+  const revealClip = THREE.AnimationClip.findByName(gltf.animations, 'ForgeReveal');
+  if (!revealClip) throw new Error('missing-ForgeReveal');
+  const mixer = new THREE.AnimationMixer(gltf.scene);
+  const revealAction = mixer.clipAction(revealClip);
+  revealAction.play();
+  revealAction.paused = true;
+
+  const rigs = {
+    sculpture,
+    core: gltf.scene.getObjectByName('CoreRig'),
+    orbit: gltf.scene.getObjectByName('OrbitRig'),
+    cage: gltf.scene.getObjectByName('CageRig'),
+    nodes: gltf.scene.getObjectByName('NodeRig'),
+  };
+  const settled = captureSettledTransforms(mixer, revealClip.duration, rigs);
+
+  let state = SCENE_STATE.LOADING;
+  let scrollProgress = 0;
+  let motionEnabled = true;
+  let sectionVisible = true;
+  let pageVisible = !document.hidden;
+  let raf = 0;
+  let previousTime = performance.now();
+  const clock = new THREE.Clock();
+  const frameIntervals = [];
+  window.__TBM_V8_DEBUG__ = {
+    version: 'v8',
+    get progress() { return scrollProgress; },
+    get state() { return state; },
+    get frameIntervals() { return frameIntervals.slice(); },
+    get renderer() {
+      return {
+        calls: renderer.info.render.calls,
+        triangles: renderer.info.render.triangles,
+        textures: renderer.info.memory.textures,
+        geometries: renderer.info.memory.geometries,
+        pixelRatio: renderer.getPixelRatio(),
+      };
+    },
+  };
+
+  function applyProgress(progress) {
+    scrollProgress = clamp(progress);
+    const revealProgress = clamp(scrollProgress / contract.revealEndProgress);
+    mixer.setTime(revealClip.duration * revealProgress);
+
+    const hero = smoothstep(contract.heroCopyStartProgress, 0.94, scrollProgress);
+    const proof = smoothstep(0.88, 0.97, scrollProgress);
+    stage.style.setProperty('--tbm-v8-progress', scrollProgress.toFixed(4));
+    stage.style.setProperty('--tbm-v8-hero', hero.toFixed(4));
+    stage.style.setProperty('--tbm-v8-proof', proof.toFixed(4));
+
+    if (scrollProgress < contract.heroCopyStartProgress) state = SCENE_STATE.REVEAL;
+    else if (scrollProgress < contract.heroIdleStartProgress) state = SCENE_STATE.HANDOFF;
+    else state = SCENE_STATE.HERO_IDLE;
+    stage.dataset.sceneState = state;
+
+    updateStatus(scrollProgress);
+    requestFrame();
+  }
+
+  function render(time) {
+    raf = 0;
+    const elapsed = Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
+    previousTime = time;
+    const idleStrength = motionEnabled
+      ? smoothstep(contract.heroIdleStartProgress, 1, scrollProgress)
+      : 0;
+    applyIdleMotion(rigs, settled, clock.getElapsedTime(), idleStrength);
+    updateRuntimeAtmosphere(
+      smokeSprites,
+      energyMaterials,
+      clock.getElapsedTime(),
+      scrollProgress,
+      idleStrength,
+    );
+    renderer.render(scene, camera);
+    if (elapsed > 0 && frameIntervals.length < 240) frameIntervals.push(elapsed * 1000);
+    if (shouldAnimate(idleStrength)) raf = requestAnimationFrame(render);
+  }
+
+  function requestFrame() {
+    if (!raf && sectionVisible && pageVisible) raf = requestAnimationFrame(render);
+  }
+
+  function shouldAnimate(idleStrength) {
+    return sectionVisible && pageVisible && motionEnabled && idleStrength > 0.001;
+  }
+
+  function resize() {
+    const bounds = sticky.getBoundingClientRect();
+    const cap = mobile.matches ? contract.mobile.dprCap : contract.desktop.dprCap;
+    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
+    renderer.setSize(bounds.width, bounds.height, false);
+    camera = selectCamera();
+    camera.aspect = bounds.width / Math.max(1, bounds.height);
+    camera.updateProjectionMatrix();
+    requestFrame();
+  }
+
+  createSingleScrollOwner(applyProgress);
+  const visibilityObserver = new IntersectionObserver(entries => {
+    sectionVisible = entries.some(entry => entry.isIntersecting);
+    if (sectionVisible) requestFrame();
+    else if (raf) {
+      cancelAnimationFrame(raf);
+      raf = 0;
+    }
+  }, { rootMargin: '100px' });
+  visibilityObserver.observe(stage);
+
+  document.addEventListener('visibilitychange', () => {
+    pageVisible = !document.hidden;
+    if (pageVisible) requestFrame();
+  });
+  window.addEventListener('resize', resize, { passive: true });
+  mobile.addEventListener('change', resize);
+
+  skip?.addEventListener('click', () => {
+    const destination = stage.offsetTop + stage.offsetHeight - window.innerHeight;
+    window.scrollTo({ top: destination, behavior: 'smooth' });
+  });
+
+  motionButton?.addEventListener('click', () => {
+    motionEnabled = !motionEnabled;
+    motionButton.setAttribute('aria-pressed', String(motionEnabled));
+    motionButton.textContent = motionEnabled ? 'Pause ambient motion' : 'Resume ambient motion';
+    requestFrame();
+  });
+
+  canvas.addEventListener('webglcontextlost', event => {
+    event.preventDefault();
+    enableFallback('webgl-context-lost');
+  }, { once: true });
+
+  window.addEventListener('pagehide', () => {
+    visibilityObserver.disconnect();
+    cancelAnimationFrame(raf);
+    mixer.stopAllAction();
+    environment.dispose();
+    renderer.dispose();
+    delete window.__TBM_V8_DEBUG__;
+  }, { once: true });
+
+  resize();
+  applyProgress(currentNativeProgress());
+  document.documentElement.classList.add('tbm-v8-ready');
+  stage.dataset.sceneState = state;
+  if (status) status.textContent = 'Scroll to forge';
+}
+
+function createSingleScrollOwner(onProgress) {
+  const gsap = window.gsap;
+  const ScrollTrigger = window.ScrollTrigger;
+  if (!gsap || !ScrollTrigger) {
+    window.addEventListener('scroll', () => onProgress(currentNativeProgress()), { passive: true });
+    onProgress(currentNativeProgress());
+    return;
+  }
+  gsap.registerPlugin(ScrollTrigger);
+  const proxy = { value: currentNativeProgress() };
+  gsap.to(proxy, {
+    value: 1,
+    ease: 'none',
+    onUpdate: () => onProgress(proxy.value),
+    scrollTrigger: {
+      id: 'tbm-v8-unified-owner',
+      trigger: stage,
+      start: () => `top top+=${headerOffset()}`,
+      end: 'bottom bottom',
+      scrub: true,
+      invalidateOnRefresh: true,
+    },
+  });
+}
+
+function currentNativeProgress() {
+  if (!stage) return 0;
+  const start = stage.offsetTop - headerOffset();
+  const end = stage.offsetTop + stage.offsetHeight - window.innerHeight;
+  return clamp((window.scrollY - start) / Math.max(1, end - start));
+}
+
+function headerOffset() {
+  return window.innerWidth <= 840 ? 76 : 92;
+}
+
+function addRuntimeLights(scene) {
+  const fill = new THREE.RectAreaLight(0xa8d0d2, 1.7, 6.2, 6.2);
+  fill.position.set(-4.0, -4.8, 4.0);
+  fill.lookAt(0, 0, 0.2);
+  const key = new THREE.RectAreaLight(0xefb276, 2.5, 4.4, 4.4);
+  key.position.set(-2.2, -3.8, 5.2);
+  key.lookAt(0, 0, 0.2);
+  const rim = new THREE.SpotLight(0xef8d48, 34, 18, Math.PI / 5, 0.65, 1.2);
+  rim.position.set(4.4, 0.4, 3.8);
+  rim.target.position.set(0, 0, 0.2);
+  const coolRim = new THREE.SpotLight(0x8fc6ca, 20, 18, Math.PI / 4, 0.7, 1.2);
+  coolRim.position.set(-4.2, 0.8, 2.2);
+  coolRim.target.position.set(0, 0, 0.2);
+  scene.add(fill, key, rim, rim.target, coolRim, coolRim.target);
+}
+
+async function addRuntimeSmoke(scene, contract) {
+  const loader = new THREE.TextureLoader();
+  const [textureA, textureB] = await Promise.all([
+    loader.loadAsync(`${contract.web.root}/smoke/smoke-01.webp`),
+    loader.loadAsync(`${contract.web.root}/smoke/smoke-02.webp`),
+  ]);
+  for (const texture of [textureA, textureB]) {
+    texture.colorSpace = THREE.SRGBColorSpace;
+  }
+  const specs = [
+    { texture: textureA, position: [-2.8, 1.4, 0.6], scale: [6.8, 3.4], phase: 0.0 },
+    { texture: textureB, position: [2.9, 1.8, 0.2], scale: [7.4, 3.8], phase: 2.1 },
+    { texture: textureA, position: [0.5, 2.6, -1.6], scale: [8.0, 4.0], phase: 4.0 },
+  ];
+  return specs.map(spec => {
+    const material = new THREE.SpriteMaterial({
+      map: spec.texture,
+      color: 0x456064,
+      transparent: true,
+      opacity: 0,
+      depthWrite: false,
+      blending: THREE.NormalBlending,
+    });
+    const sprite = new THREE.Sprite(material);
+    sprite.position.fromArray(spec.position);
+    sprite.scale.set(spec.scale[0], spec.scale[1], 1);
+    sprite.userData.basePosition = sprite.position.clone();
+    sprite.userData.baseScale = sprite.scale.clone();
+    sprite.userData.phase = spec.phase;
+    scene.add(sprite);
+    return sprite;
+  });
+}
+
+function collectEnergyMaterials(root) {
+  const result = new Map();
+  root.traverse(item => {
+    if (!item.isMesh) return;
+    const materials = Array.isArray(item.material) ? item.material : [item.material];
+    for (const material of materials) {
+      if (!material || !/energy|spark|electric/i.test(material.name)) continue;
+      if (!result.has(material.uuid)) {
+        result.set(material.uuid, {
+          material,
+          base: Number(material.emissiveIntensity || 0),
+        });
+      }
+    }
+  });
+  return [...result.values()];
+}
+
+function updateRuntimeAtmosphere(sprites, energyMaterials, time, progress, idleStrength) {
+  const smokeStrength = smoothstep(0.06, 0.28, progress) *
+    (1 - smoothstep(0.78, 0.96, progress) * 0.45);
+  sprites.forEach((sprite, index) => {
+    const phase = sprite.userData.phase;
+    sprite.material.opacity = (0.035 + index * 0.008) * smokeStrength;
+    sprite.position.set(
+      sprite.userData.basePosition.x + Math.sin(time * 0.035 + phase) * 0.16,
+      sprite.userData.basePosition.y + Math.cos(time * 0.028 + phase) * 0.10,
+      sprite.userData.basePosition.z,
+    );
+    const breathe = 1 + Math.sin(time * 0.04 + phase) * 0.018;
+    sprite.scale.copy(sprite.userData.baseScale).multiplyScalar(breathe);
+  });
+  const pulse = 1 + Math.sin(time * 0.72) * 0.08 * idleStrength;
+  for (const entry of energyMaterials) {
+    entry.material.emissiveIntensity = entry.base * pulse;
+  }
+}
+
+function captureSettledTransforms(mixer, duration, rigs) {
+  mixer.setTime(duration);
+  const result = {};
+  for (const [name, item] of Object.entries(rigs)) {
+    if (item) {
+      result[name] = {
+        rotation: item.rotation.clone(),
+        scale: item.scale.clone(),
+      };
+    }
+  }
+  mixer.setTime(0);
+  return result;
+}
+
+function applyIdleMotion(rigs, settled, time, strength) {
+  if (strength <= 0) return;
+  if (rigs.orbit && settled.orbit) {
+    rigs.orbit.rotation.set(
+      settled.orbit.rotation.x + Math.sin(time * 0.22) * 0.012 * strength,
+      settled.orbit.rotation.y + Math.sin(time * 0.08) * 0.12 * strength,
+      settled.orbit.rotation.z + Math.sin(time * 0.17) * 0.018 * strength,
+    );
+  }
+  if (rigs.cage && settled.cage) {
+    rigs.cage.rotation.set(
+      settled.cage.rotation.x,
+      settled.cage.rotation.y - Math.sin(time * 0.055) * 0.07 * strength,
+      settled.cage.rotation.z + Math.sin(time * 0.11) * 0.006 * strength,
+    );
+  }
+  if (rigs.core && settled.core) {
+    const breathing = 1 + Math.sin(time * 0.48) * 0.006 * strength;
+    rigs.core.rotation.copy(settled.core.rotation);
+    rigs.core.scale.copy(settled.core.scale).multiplyScalar(breathing);
+  }
+}
+
+function updateStatus(progress) {
+  if (!status) return;
+  status.textContent = progress < 0.15 ? 'Preparing the forge'
+    : progress < 0.34 ? 'Forging the outer system'
+      : progress < 0.53 ? 'Aligning the orbits'
+        : progress < 0.69 ? 'Structuring the network'
+          : 'Forged for clear decisions';
+}
+
+function enableFallback(reason) {
+  document.documentElement.classList.add('tbm-v8-fallback');
+  document.documentElement.classList.remove('tbm-v8-ready');
+  if (stage) {
+    stage.dataset.sceneState = SCENE_STATE.FALLBACK;
+    stage.dataset.fallbackReason = String(reason);
+    stage.style.setProperty('--tbm-v8-hero', '1');
+    stage.style.setProperty('--tbm-v8-proof', '1');
+  }
+}
```

Implementation corrections required during coding:

1. Confirm ambient rotation preserves Blender’s final rotation order.
2. Validate the smoke sprites after the basic handoff passes; they are part of V8, but they must never be used to disguise a handoff or lighting defect.
3. Pointer variables may be added, but pointer motion remains disabled in V8.

Future pointer work must be possible by applying offsets to `TBM_Sculpture`, not by altering individual exported animation tracks.

### Patch V8-R10 — visual/runtime test

Create `tests/test_tbm_v8_live_3d.py` with the following test groups:

```diff
--- /dev/null
+++ b/tests/test_tbm_v8_live_3d.py
@@
+from pathlib import Path
+import json
+import time
+from playwright.sync_api import sync_playwright
+
+ROOT = Path(__file__).resolve().parents[1]
+URL = "http://127.0.0.1:4173/index.html"
+VIEWPORTS = [
+    {"width": 1904, "height": 900},
+    {"width": 1366, "height": 768},
+    {"width": 2560, "height": 1440},
+    {"width": 390, "height": 844},
+]
+PROGRESS_POINTS = [0.00, 0.15, 0.34, 0.53, 0.69, 0.84, 1.00]
+
+def stage_metrics(page):
+    return page.locator("[data-tbm-live-stage]").evaluate(
+        """stage => {
+          const canvas = stage.querySelector('#tbm-live-v8-canvas');
+          const hero = stage.querySelector('.tbm-live-v8__hero-ui');
+          const proof = stage.querySelector('.proof-strip');
+          const rect = stage.getBoundingClientRect();
+          return {
+            state: stage.dataset.sceneState,
+            canvasCount: document.querySelectorAll('#tbm-live-v8-canvas').length,
+            revealCanvasCount: document.querySelectorAll('#tbm-reveal-v6-canvas').length,
+            plateCount: document.querySelectorAll('.hero-v6__plate').length,
+            heroOpacity: Number(getComputedStyle(hero).opacity),
+            proofOpacity: Number(getComputedStyle(proof).opacity),
+            stageTop: rect.top,
+            scrollTriggers: window.ScrollTrigger
+              ? window.ScrollTrigger.getAll().map(item => item.vars.id).filter(Boolean)
+              : [],
+          };
+        }"""
+    )
+
+def set_progress(page, value):
+    page.locator("[data-tbm-live-stage]").evaluate(
+        """(stage, progress) => {
+          const available = stage.offsetHeight - innerHeight;
+          scrollTo(0, stage.offsetTop + available * progress);
+        }""",
+        value,
+    )
+    page.wait_for_timeout(700)
+
+def test_v8_desktop_handoff_and_reverse():
+    with sync_playwright() as p:
+        browser = p.chromium.launch(headless=True)
+        page = browser.new_page(viewport=VIEWPORTS[0])
+        errors = []
+        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
+        page.goto(URL, wait_until="networkidle")
+        page.wait_for_function(
+            "document.documentElement.classList.contains('tbm-v8-ready') || "
+            "document.documentElement.classList.contains('tbm-v8-fallback')"
+        )
+        assert page.locator("[data-tbm-live-stage]").count() == 1
+        assert page.locator("#tbm-live-v8-canvas").count() == 1
+        assert page.locator("#tbm-reveal-v6-canvas").count() == 0
+        assert page.locator(".hero-v6__plate").count() == 0
+
+        captures = ROOT / "artifacts" / "tbm-v8-validation"
+        captures.mkdir(parents=True, exist_ok=True)
+        records = []
+        for progress in PROGRESS_POINTS:
+            set_progress(page, progress)
+            records.append({"progress": progress, **stage_metrics(page)})
+            page.screenshot(path=captures / f"progress-{int(progress * 100):03d}.png")
+
+        for progress in reversed(PROGRESS_POINTS[:-1]):
+            set_progress(page, progress)
+            records.append({"reverse": progress, **stage_metrics(page)})
+
+        ids = records[-1]["scrollTriggers"]
+        assert ids.count("tbm-v8-unified-owner") == 1
+        assert not errors
+        (captures / "runtime.json").write_text(json.dumps(records, indent=2))
+        browser.close()
```

The final test file must additionally:

- run all four viewports;
- capture browser 100% zoom only;
- assert no horizontal overflow;
- assert hero copy opacity is `<0.05` before progress `0.69`;
- assert hero copy opacity is `>0.95` at progress `1`;
- assert the motion button changes `aria-pressed`;
- emulate reduced motion and assert the poster/copy are visible;
- abort the GLB request and assert fallback;
- dispatch `webglcontextlost` and assert fallback;
- measure canvas bounding rectangle at `0.84`, `0.92` and `1.00`;
- record renderer calls, triangles, textures and device pixel ratio through a debug-only `window.__TBM_V8_DEBUG__` interface;
- store results in `artifacts/tbm-v8-validation/`.

### Patch V8-R11 — luminance audit

Create `scripts/audit-tbm-v8-luminance.py`:

```diff
--- /dev/null
+++ b/scripts/audit-tbm-v8-luminance.py
@@
+from pathlib import Path
+import json
+import numpy as np
+from PIL import Image
+
+ROOT = Path(__file__).resolve().parents[1]
+CAPTURES = ROOT / "artifacts" / "tbm-v8-validation"
+TARGETS = {
+    "progress-000.png": {"max_dark": 0.80, "max_clipped": 0.01},
+    "progress-084.png": {"max_dark": 0.76, "max_clipped": 0.01},
+    "progress-100.png": {"max_dark": 0.74, "max_clipped": 0.01},
+}
+
+results = {}
+failed = []
+for name, limits in TARGETS.items():
+    image = np.asarray(Image.open(CAPTURES / name).convert("RGB"), dtype=np.float32)
+    luminance = image[..., 0] * 0.2126 + image[..., 1] * 0.7152 + image[..., 2] * 0.0722
+    dark = float(np.mean(luminance < 12))
+    clipped = float(np.mean(luminance > 249))
+    results[name] = {
+        "mean": float(np.mean(luminance)),
+        "median": float(np.median(luminance)),
+        "dark_below_12": dark,
+        "clipped_above_249": clipped,
+    }
+    if dark > limits["max_dark"] or clipped > limits["max_clipped"]:
+        failed.append(name)
+
+output = CAPTURES / "luminance-audit.json"
+output.write_text(json.dumps(results, indent=2))
+if failed:
+    raise SystemExit(f"Luminance gates failed: {', '.join(failed)}")
```

The screenshots must be named consistently. If the validation test uses `progress-100.png`, it must also generate `progress-084.png` explicitly even though the broader phase list includes 0.84.

### Patch V8-R12 — authoritative handoff update

Only after Gates A–G pass, replace the stale V4 body in `.sisyphus/notepads/handoff/session_handoff.md`. The implementation must not declare V8 complete before those gates pass:

```diff
--- a/.sisyphus/notepads/handoff/session_handoff.md
+++ b/.sisyphus/notepads/handoff/session_handoff.md
@@
-# Session Handoff
+# Session Handoff — TBM Unified Live 3D V8
+
+## Authoritative current state
+
+V8 is the active homepage reveal and hero implementation. The V4 handoff and
+the V7 image-sequence architecture are superseded for active-runtime claims.
+V6 and V7 remain intact as revert sources.
+
+## Active runtime
+
+- HTML owner: `index.html`, `[data-tbm-live-stage]`
+- CSS owner: `css/tbm-live-3d-v8.css`
+- JavaScript owner: `js/tbm-live-3d-v8.js`
+- Scene contract: `assets/tbm-live-v8/scene-contract.json`
+- Live model: `assets/tbm-live-v8/tbm-armillary-v8.glb`
+- Reveal/hero owner: one WebGL canvas and one `tbm-v8-unified-owner`
+  ScrollTrigger
+
+## Rollback and evidence
+
+The exact pre-edit hashes, backup paths, patch ranges, generated-asset hashes,
+commands, screenshot paths and Gate A–G results are recorded in
+`backup/unified_live_3d_v8_20260726/REVERT_TRACKING.md`. That tracker is the
+authoritative implementation and revert record.
+
+## Superseded claims
+
+- V4 implementation notes are historical only.
+- V7's 96-frame image sequence is fallback/revert material, not the active reveal.
+- The V7 static hero handoff plate is not active in V8.
+
+## Required next check
+
+Before any later visual change, re-run the V8 reverse-scroll, handoff,
+luminance, reduced-motion, GLB-failure, context-loss and headed-browser gates.
```

If any gate remains open, update the same file with `V8 implementation incomplete` and list the exact open gates instead of applying the completion wording above.

---

## 9. Backup and revert contract

Before any implementation edit, create:

```text
backup/unified_live_3d_v8_20260726/
├── originals/
│   ├── index.html
│   └── session_handoff.md
├── manifests/
│   ├── pre-edit-git-status.txt
│   ├── pre-edit-sha256.txt
│   └── planned-files.txt
└── REVERT_TRACKING.md
```

### 9.1 Initial `REVERT_TRACKING.md` requirements

It must list V8-R01 through V8-R12 before code changes begin.

For every patch, record:

- patch ID;
- exact file;
- exact symbol, selector or HTML block;
- backup source;
- pre-edit SHA-256 for existing files;
- intended post-edit behavior;
- validation command;
- status;
- timestamp;
- exact revert instruction.

Example:

```markdown
| ID | File | Exact target | Backup | Validation | Status | Revert |
|---|---|---|---|---|---|---|
| V8-R07 | index.html | head stylesheet/preloads/importmap; `[data-reveal-stage]`; `.hero-v6`; final script block | originals/index.html; record its actual SHA-256 before editing | HTML readback, HTTP 200, DOM selector assertions | planned | restore originals/index.html byte-for-byte |
```

Do not insert guessed line numbers into the tracker before implementation. Record exact before/after line numbers after each patch and update them again after the final file readback.

### 9.2 Revert procedure

To revert V8:

1. restore `index.html` byte-for-byte from the backup;
2. restore `.sisyphus/notepads/handoff/session_handoff.md` byte-for-byte from the backup;
3. remove only the V8 authored/generated files listed in section 7;
4. retain `backup/unified_live_3d_v8_20260726/`;
5. restart `preview-site.cmd`;
6. verify the active imports again reference V7;
7. verify the 96-frame V7 reveal and V7 Product Focus still operate;
8. record the revert validation in `REVERT_TRACKING.md`.

Do not delete V6 or V7 assets during a V8 revert.

---

## 10. Exact implementation order

Implementation must occur in this order.

1. Capture `git status --short` and current hashes.
2. Create the V8 backup directory and complete the planned tracker rows.
3. Copy V7 Blender source into the new V8 directory.
4. Create V8-R01 contract.
5. Apply V8-R02 through V8-R06 to Blender source only.
6. Run Python syntax and Blender build validation.
7. Render only the seven desktop approval stills corresponding to section 6.
8. Generate desktop contact sheet.
9. Pass Gate A: composition, lighting and material balance.
10. Render only the seven mobile approval stills.
11. Pass Gate B: mobile composition.
12. Render a low-resolution 192-frame MP4 motion preview.
13. Pass Gate C: choreography.
14. Export the uncompressed GLB.
15. Validate node names, animation duration, cameras and material count.
16. Generate and validate the two R05B smoke textures.
17. Create V8 CSS and JavaScript without activating them.
18. Run `node --check js/tbm-live-3d-v8.js`.
19. Back up and patch `index.html`.
20. Start the local HTTP preview.
21. Run HTTP, DOM and fallback smoke tests.
22. Run the full Playwright viewport/reversal suite.
23. Run luminance audit.
24. Inspect all seven desktop and mobile screenshots manually.
25. Tune only the named V8 contract/browser-light values.
26. Repeat gates after every visual change.
27. Run GLB optimisation.
28. Repeat the full browser suite against the optimized GLB.
29. Re-read every modified/new authored file.
30. Confirm generated asset hashes and counts.
31. Complete exact post-edit line ranges and validation results in `REVERT_TRACKING.md`.
32. Update `.sisyphus/notepads/handoff/session_handoff.md` using R12.

No final activation is complete before step 32.

---

## 11. Approval gates

### Gate A — desktop Blender stills

Pass only when:

- all phase compositions fit their safe areas;
- opening sphere is clearly visible;
- the mid-reveal push is materially closer than the opening;
- the final sculpture fits predominantly in the right half;
- the sphere is graphite-black but readable;
- rings and network look polished;
- large exterior bands retain forged texture;
- shadows contain cool detail;
- gold highlights retain texture rather than becoming flat white;
- contact sheet resembles the agreed generated images in composition and tonal hierarchy.

### Gate B — mobile Blender stills

Pass only when:

- mobile uses a separately authored camera;
- sphere and main rings remain uncropped;
- homepage copy can occupy its own protected region;
- outer bands do not create confusing partial arcs at viewport edges.

### Gate C — Blender motion preview

Pass only when:

- five camera stages are visibly distinguishable;
- no complete ring or cage pops into existence;
- large bands follow different paths;
- camera push, lateral move, pull-back and rightward settle are readable;
- animation uses anticipation, stagger, overshoot and settle without appearing elastic;
- final 16% feels calm enough to read the homepage.

### Gate D — browser handoff

Pass only when:

- one canvas remains from start to finish;
- no static plate replaces it;
- no extra viewport exists between reveal and homepage;
- no crop/scale/lighting jump is visible at progress `0.84–0.92`;
- reverse scroll works;
- a single ScrollTrigger owner exists;
- idle motion begins gradually;
- the homepage object does not crowd the copy.

### Gate E — lighting and materials in browser

Pass only when:

- luminance audit passes;
- sphere silhouette is readable;
- polished and forged profiles remain distinguishable;
- CSS does not globally darken the scene;
- browser render remains acceptably close to Blender EEVEE approval stills.

### Gate F — performance and fallback

Pass only when:

- frame-time and transfer budgets pass;
- reduced motion works;
- WebGL loss works;
- GLB failure works;
- offscreen and hidden-tab rendering pauses;
- mobile does not exhaust GPU memory or show a black canvas.

### Gate G — headed-browser visual approval

Automated tests are not final artistic approval.

Open the site at 100% zoom in the user’s headed Chrome and review:

- opening;
- strongest push-in;
- network formation;
- final handoff;
- homepage hold;
- reverse scroll;
- mobile emulation or a real mobile device.

Record the approved screenshots and their exact viewport sizes in the tracker.

---

## 12. Validation commands

Commands may be adjusted only for the installed Blender executable path.

```powershell
python -m py_compile blender\reference-match-v8\scripts\build_live_v8.py
python -m json.tool blender\reference-match-v8\config\scene-contract.json > $null
node --check js\tbm-live-3d-v8.js
```

Blender build/export:

```powershell
$blenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $blenderExe --background --python blender\reference-match-v8\scripts\build_live_v8.py -- --mode build
& $blenderExe --background blender\reference-match-v8\TBM_LIVE_V8.blend --python blender\reference-match-v8\scripts\build_live_v8.py -- --mode approval-stills
& $blenderExe --background blender\reference-match-v8\TBM_LIVE_V8.blend --python blender\reference-match-v8\scripts\build_live_v8.py -- --mode glb
python scripts\generate-tbm-v8-smoke.py
```

Preview:

```powershell
.\preview-site.cmd
```

Tests:

```powershell
python -m pytest tests\test_tbm_v8_live_3d.py -q
python scripts\audit-tbm-v8-luminance.py
git diff --check
```

Optimized export, after the uncompressed browser gates pass:

```powershell
$blenderExe = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $blenderExe --background blender\reference-match-v8\TBM_LIVE_V8.blend --python blender\reference-match-v8\scripts\build_live_v8.py -- --mode glb-optimized
```

Asset inspection:

```powershell
Get-FileHash -Algorithm SHA256 assets\tbm-live-v8\tbm-armillary-v8.glb
Get-ChildItem assets\tbm-live-v8 -Recurse -File | Measure-Object Length -Sum
```

Browser truth:

- attach Playwright to the headed Chrome at `http://127.0.0.1:9223` when available;
- if port 9223 is unavailable, use installed system Chrome headless and explicitly record the fallback;
- do not use Chrome DevTools for navigation, screenshots or selector verification;
- use Chrome DevTools only for performance trace, network response, console and GPU diagnostics.

---

## 13. Performance strategy

### 13.1 Initial-load order

1. HTML and CSS.
2. responsive poster.
3. Three.js and GSAP.
4. V8 contract.
5. GLB.
6. decode and compile materials.
7. render first WebGL frame behind poster.
8. fade poster out.

The homepage copy must remain available even if steps 3–7 fail.

### 13.2 GPU controls

- cap DPR as defined in the contract;
- no full-screen multisampled postprocessing chain in the first implementation;
- introduce bloom only after base lighting passes;
- use no more than five principal browser lights;
- prefer merged/instanced spark geometry;
- use `IntersectionObserver` and `visibilitychange`;
- dispose renderer, environment and geometries on `pagehide`;
- do not allocate new vectors, materials or tweens per animation frame.

### 13.3 Asset optimisation

- GLB is optimized after visual approval, not before;
- use Meshopt for geometry;
- use KTX2 only if material textures make the GLB exceed budget;
- texture maximum: 2048 px for forged normal/roughness;
- smoke sprites maximum: 1024 px;
- test optimized and unoptimized GLBs for animation/name parity.

---

## 14. Future pointer and click interaction accommodation

V8 does not activate object interaction, but it must preserve the following extension points:

- `TBM_Sculpture` remains the single user-transform root;
- reveal animation occurs below this root or can be combined without overwriting it;
- canvas receives pointer events only after homepage progress exceeds `0.92`;
- normalized pointer state is kept separate from scroll state;
- future hover limit: ±4–6°;
- future click impulse: 12–18° with damping;
- raycasting may target named nodes without changing the export hierarchy;
- pointer interaction is disabled for coarse pointers and reduced motion.

Do not bake the final settled sculpture into a single uneditable mesh if doing so removes the named rig groups.

---

## 15. Skills, libraries and evidence sources

### 15.1 Skills

The refreshed `find-skills` research identified:

- `freshtechbro/claudedesignskills@blender-web-pipeline` — useful reference for Blender-to-web delivery;
- `freshtechbro/claudedesignskills@threejs-webgl` — useful reference for Three.js rendering and optimization;
- `leonxlnx/taste-skill@design-taste-frontend` — useful for composition and visual restraint;
- Microsoft `playwright-cli` — preferred for browser verification.

Installation is not required before writing the V8 code because the required workflow is fully specified here. If installed, it requires separate user authorisation.

Rejected:

- `manutej/luxor-claude-marketplace@playwright-visual-testing`, because the available skills listing reported a failed Snyk audit.

### 15.2 Libraries

| Library | Version | Purpose |
|---|---:|---|
| Three.js | `0.180.0` | WebGL renderer and scene |
| GLTFLoader | Three.js `0.180.0` | GLB import |
| MeshoptDecoder | Three.js `0.180.0` | optimized geometry decode |
| RoomEnvironment/PMREM | Three.js `0.180.0` | readable metal reflections |
| GSAP | `3.13.0` | smoothed deterministic scroll proxy |
| ScrollTrigger | `3.13.0` | one reveal/hero progress owner |
| Playwright | installed environment | browser truth and screenshots |
| Blender | installed environment | scene, animation and GLB creation |

### 15.3 Technical sources

- Three.js loading glTF models:  
  https://threejs.org/manual/en/loading-3d-models.html
- Three.js animation system:  
  https://threejs.org/manual/en/animation-system.html
- Three.js GLTFLoader:  
  https://threejs.org/docs/pages/GLTFLoader.html
- Three.js colour management:  
  https://threejs.org/manual/en/color-management.html
- Three.js PMREMGenerator:  
  https://threejs.org/docs/pages/PMREMGenerator.html
- Blender glTF export:  
  https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- Blender colour management:  
  https://docs.blender.org/manual/en/latest/render/color_management.html
- Blender Principled BSDF:  
  https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html
- Blender light objects:  
  https://docs.blender.org/manual/en/latest/render/lights/light_object.html
- GSAP ScrollTrigger:  
  https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Blender camera path + Three.js + GSAP example:  
  https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/
- key, fill and rim lighting:  
  https://www.creativebloq.com/3d/how-to-use-key-fill-and-rim-lighting-in-3d-art
- Playwright visual comparison:  
  https://playwright.dev/docs/test-snapshots

### 15.4 Reference limitation

The current live Swanson Reserve Capital site reports that it is under development. It must not be treated as the only pixel-accurate technical reference. The user-supplied screenshots, video and approved generated TBM images are the controlling visual references.

---

## 16. Final definition of done

V8 may be called complete only when:

- every patch row is completed in `REVERT_TRACKING.md`;
- every affected original file has a backup and recorded hash;
- every authored file has been re-read after editing;
- Python and JavaScript syntax checks pass;
- Blender build and GLB export pass;
- required GLB nodes, cameras and animation exist;
- one canvas and one scroll owner are proven in the DOM;
- reveal, handoff, idle and reverse behavior pass;
- desktop and mobile screenshots pass all composition gates;
- lighting and material audits pass;
- frame-time and transfer budgets pass;
- reduced-motion and failure fallbacks pass;
- headed-browser visual approval is recorded;
- no V6/V7 file was unintentionally changed;
- no approved wording was changed;
- no implementation TODO, placeholder asset or temporary debug artifact remains.

Until all conditions pass, the implementation status must be reported as incomplete.
