# The Blacksmith Market

## Reference-Match Cinematic Rebuild — Corrective PRD and Production Specification

**Date:** 25 July 2026  
**Status:** replacement plan; no implementation authorised by this document  
**Supersedes:** `TBM_BLENDER_3D_WEB_EXPERIENCE_PRD_2026-07-25.md` wherever that document permits a basic procedural armillary, Eevee-only output, generic runtime materials, or implementation before reference-quality art approval  
**Primary visual targets:** the four user-approved concept images listed in section 3  
**Required outcome:** the implemented website must reproduce the composition, apparent material quality, lighting, atmosphere, motion density, card hierarchy, and interaction language of the approved images—not merely reuse the same black/gold colour palette.

---

## 1. Executive correction

The current V5 implementation is not a reference match. It is a simple procedural model placed in a conventional split hero, followed by plain CSS content grids. Its deficiencies are structural, not a matter of minor colour or spacing adjustments.

The previous implementation made the wrong production choice:

- it treated Blender as a geometry generator rather than a cinematic art-production tool;
- it used primitive toruses, spheres, flat Principled materials, and Eevee;
- it exported a basic GLB, then discarded even those authored materials in the browser and replaced them with one generic `MeshStandardMaterial`;
- it expected live WebGL to reproduce volumetric smoke, electrical arcs, fine sparks, ground reflections, lens glow, depth of field, and complex metal highlights;
- it proceeded to web implementation before an approved Blender still existed;
- it treated the Product Focus reference as a generic six-tile grid rather than a staged, connected, image-led card system.

This replacement plan changes the order and the rendering architecture.

### Non-negotiable production decision

1. **The cinematic reveal is authored and rendered in Blender Cycles.**
2. **No homepage code is integrated until three static Blender keyframes match the approved reveal images and are explicitly approved.**
3. **The primary visual layer is pre-rendered.** This is how the smoke, sparks, electricity, reflections, motion blur, and compositing remain visually faithful.
4. **Three.js is secondary and conditional.** It may provide pointer parallax, a settled interactive sculpture, or a low-motion fallback only if it passes a separate visual-parity gate.
5. **The Product Focus cards use bespoke rendered imagery and a purpose-built network composition.** Generic gradients are prohibited.

The target is not “an armillary in roughly the same colours.” The target is the approved imagery.

---

## 2. Evidence-backed diagnosis of the current result

### 2.1 Current-code evidence

| Evidence | Current implementation | Why it cannot produce the approved result |
|---|---|---|
| `blender/scripts/build_tbm_armillary.py:124` | `scene.render.engine = "BLENDER_EEVEE"` | The approved imagery depends on high-quality reflections, indirect light, volume integration, depth, and compositing. Eevee is useful for preview, not the final master specified here. |
| `blender/scripts/build_tbm_armillary.py:36-47` | One helper builds flat Principled materials from colour, metallic, roughness, and optional emission | There are no roughness maps, anisotropy, micro-scratches, edge wear, fingerprints, hammered displacement, dust, clearcoat, or layered surface response. |
| `blender/scripts/build_tbm_armillary.py:58-80` | UV spheres and toruses are the principal building blocks | The reference has thick, open-ended forged bands, beveled rectangular sections, deliberate gaps, asymmetric construction, wire cages, and detailed junctions. |
| `blender/scripts/build_tbm_armillary.py:137-166` | One sphere, one wireframe icosphere, four toruses, and twenty simple nodes | The silhouette and hierarchy do not match any of the three approved reveal phases. |
| `blender/scripts/build_tbm_armillary.py:168-180` | Twenty-eight small emissive spheres are used as “embers” | The target contains multi-scale sparks, streaks, trails, bokeh, electrical filaments, and spatially varying density. |
| `js/hero-3d-blender-v5.js:41-52` | Every imported mesh material is replaced by a generic `MeshStandardMaterial` | Blender-authored metal variation is lost. The browser renders clean, plastic-looking copper tubes and a black sphere. |
| `js/hero-3d-blender-v5.js:18-26` | Four simple browser lights, no environment map or post-processing chain | There is no anisotropic studio reflection, selective bloom, filmic glare, volumetric integration, or cinematic highlight control. |
| `css/tbm-experience-v5.css` | Product Focus is a regular three-column grid using CSS gradients | It does not implement five tall art-directed cards, selected-card elevation, linked nodes, background topology, filters, or the criteria panel shown in Reference 4. |

### 2.2 Visual evidence

The current captured files:

- `artifacts/blender-v5-validation/desktop-handoff-final.png`
- `artifacts/blender-v5-validation/desktop-product-focus-final.png`

show the following measurable mismatches:

- smooth copper tubes instead of forged, hammered, open-ended bands;
- no electrical arcs;
- no visible smoke volume;
- almost no spark density or motion streaking;
- no reflective engraved ground;
- no strong rim lighting or starburst highlights;
- a much larger, flatter black core;
- no cinematic depth hierarchy;
- no approved phase-to-phase transformation;
- no image-led Product Focus cards;
- no active network topology connecting the cards;
- incorrect card count, aspect ratio, elevation, and selection hierarchy.

### 2.3 Root cause

This was not a failure to install one missing package or Blender MCP. It was a failure of production method and acceptance control. A Blender connection can automate commands; it cannot turn an unapproved primitive scene into production art.

The corrective control is therefore:

> **Static art approval first, animation approval second, browser integration third.**

No implementation milestone may bypass that order.

---

## 3. Approved references and exact visual contracts

### Reference 1 — Forge ignition

**Source:** `C:\Users\chris\AppData\Local\Temp\codex-clipboard-a37a94b4-c56e-4cc9-bb21-0d127b9eb8e5.png`

Required visual features:

- near-black full-width cinematic frame beneath a restrained header;
- glossy black forged sphere at approximately the horizontal centre;
- three large, thick, open-ended forged bands separated from the sphere;
- rectangular/flattened band cross-section—not thin torus tubing;
- hammered, scratched, darkened copper/brass surface with bright hot cut faces;
- electrical tendrils bridging selected band ends to the core;
- dense local sparks around electrical contact points and sparse embers across the full frame;
- layered smoke/fog behind and around the sculpture;
- a black reflective floor with circular engraved/forged markings;
- strong, narrow copper rim highlights; broad cool highlights on the black core;
- shallow depth of field and foreground/background bokeh;
- the object occupies the cinematic stage; homepage copy is not yet visible.

### Reference 2 — Network assembly

**Source:** `C:\Users\chris\AppData\Local\Temp\codex-clipboard-335eecba-36d2-4b6c-bbdb-c57dc7cfce67.png`

Required visual features:

- compact glossy black core;
- three to five polished inner orbital rings with differentiated thickness;
- outer spherical network cage built from fine lines and visible gold nodes;
- asymmetric small orbital bodies;
- one separated forged band at the left still moving toward the sculpture;
- residual electricity and spark discharge at that band;
- dark smoke, dust, soft bokeh, and ground reflection;
- lower progress line with an illuminated marker;
- phase label: `STRUCTURING THE NETWORK`;
- the sculpture is refined and mechanically intentional, not a random collection of circles.

### Reference 3 — Settled hero / forged system

**Source:** `C:\Users\chris\AppData\Local\Temp\codex-clipboard-ad61e7b1-8617-414d-a8fe-57c6b3b56bbe.png`

Required visual features:

- composition moves to the right 52–96% region, preserving the left area for homepage copy;
- an energized outer halo dominates the silhouette;
- starburst nodes and outward spark trajectories create higher action density than the earlier concepts;
- multiple inner rings, network lines, junction nodes, small bodies, and a refined black core;
- halo, cage, and orbit groups rotate at distinct rates and axes;
- glow is selective and concentrated on energy sources, not a global orange fog;
- smoke remains visible without washing out the black background;
- phase label: `FORGED FOR CLEAR DECISIONS`;
- the image must work both as the final reveal frame and as the visual basis of the settled hero.

### Reference 4 — Product Focus network

**Source:** `C:\Users\chris\AppData\Local\Temp\codex-clipboard-9708e667-0640-4f33-b921-65c7d0fb151f.png`

Required visual features:

- left-aligned eyebrow, large editorial serif heading, restrained body copy, and one text link;
- five horizontal filter pills in a bordered rail at the top-right;
- five tall portrait cards, not a rectangular two-row grid;
- selected central card is taller, raised, brighter, and outlined more strongly;
- every card contains bespoke dark tactile imagery rather than a CSS gradient;
- gold line icons sit in circular medallions;
- card titles are large serif typography near the lower third;
- each card includes an `Explore sector` action;
- a network of fine gold lines and illuminated nodes sits behind and between cards;
- the network reroutes/energizes when selection changes;
- selected criteria panel appears beneath the selected card;
- explanatory callout is bottom-left; active-connection legend is bottom-right;
- the interaction is keyboard accessible and supports reduced motion.

---

## 4. Fidelity definition

Literal pixel identity across every responsive viewport is impossible because the approved images are fixed compositions while browser viewports crop and reflow. The correct, testable interpretation is:

- **At the approved 1680 × 945 desktop reference viewport:** the Blender render and final browser capture must visually match the approved composition within the tolerances below.
- **At other desktop widths:** preserve object scale, negative-space ratio, and focal hierarchy using controlled crops.
- **On mobile:** use a separately composed Blender camera and separate card layout; do not merely crop the desktop render.

### Acceptance tolerances at the reference viewport

| Property | Required tolerance |
|---|---:|
| Primary sculpture bounding box | within 2% of viewport width/height |
| Core centre | within 1.5% of viewport width/height |
| Large-band silhouette overlap | ≥ 0.90 intersection-over-union against an approved mask |
| Left/right negative-space split | within 3% |
| Key metal highlight position | within 4% of object bounding box |
| Header baseline and height | within 2 px after font load |
| Product card x/y/width/height | within 4 px at 1680 × 945 |
| Selected-card elevation | within 4 px |
| Text wrapping | exact at the reference viewport |

Image-difference tooling assists review; it does not replace human visual approval for smoke, perceived material quality, and cinematic balance.

---

## 5. Research findings and resulting technical decisions

### 5.1 The reference site does not prove that live Three.js is required

Live inspection of `https://www.swansonreservecapital.com/` on 25 July 2026 found:

- its main bundle contains GSAP and ScrollTrigger;
- it uses multiple MP4 video assets;
- a `.net-video` is drawn to a 2D canvas and pixel-processed;
- no `THREE`, `WebGLRenderer`, or Three.js signature was found in its current production bundle.

This is significant: the appropriate lesson from the reference site is its motion direction, staging, scroll choreography, and layered media—not an assumption that its cinematic assets are live 3D.

**Decision:** use Blender-rendered media where fidelity is paramount; use Three.js only for interaction that cannot be achieved with a rendered plate.

### 5.2 Blender final renderer

**Decision:** Cycles for final frames; Eevee only for look-development previews.

Cycles is the production path for:

- physically credible metal reflections;
- glossy black-core response;
- reflective ground;
- depth of field and motion blur;
- volumetric smoke integration;
- emissive-light interaction;
- multi-pass compositing.

Final outputs are 32-bit multilayer OpenEXR masters before web encoding.

### 5.3 Materials

Blender’s Principled BSDF is used as the physical base, but each principal surface must have authored variation:

- base colour;
- roughness;
- normal/bump;
- micro-scratch mask;
- edge wear;
- fingerprint/smudge layer where appropriate;
- anisotropic direction for brushed/forged metal;
- optional clearcoat for the black core;
- displacement or bump for hammered bands.

The browser version, if shipped, uses `MeshPhysicalMaterial`, which supports anisotropy, clearcoat, sheen, advanced reflectivity, and physical transmission. It must use an environment map; Three.js explicitly recommends one for this material.

### 5.4 Geometry Nodes and VFX

Geometry Nodes are appropriate for:

- network cage line generation;
- nodes instanced at vertices;
- spark and ember instancing;
- electrical branches built from curves;
- procedural variation with stable random seeds;
- outward streak fields in the settled phase.

Electricity is built as layered curves:

1. primary arc;
2. secondary branching;
3. fine high-frequency filaments;
4. point-light/contact glow;
5. composited bloom and streak.

Sparks require luminous geometry, lifetime/scale variation, motion blur, and fade—not stationary emissive spheres.

### 5.5 Scroll choreography

GSAP ScrollTrigger is retained because it provides:

- one pinned reveal stage;
- scroll-linked scrub;
- labelled timeline phases;
- responsive `matchMedia()` setups;
- velocity-aware handling;
- deterministic handoff into the hero.

There must be one scroll owner. No parallel `scroll` listener may independently calculate frame state.

### 5.6 Web delivery

Two delivery modes are required:

#### Primary fidelity mode

- Cycles-rendered image sequence or intraframe-friendly video;
- separately encoded desktop and mobile compositions;
- static poster shown immediately;
- progressive preload around the current scroll frame;
- no reveal startup dependency on a GLB.

#### Optional interactive mode

- optimized GLB with authored PBR maps;
- PMREM environment lighting;
- `MeshPhysicalMaterial` only where its cost is justified;
- `EffectComposer` with selective `UnrealBloomPass` and final output pass;
- KTX2/Basis textures;
- Draco or Meshopt geometry compression;
- strict disposal and visibility lifecycle.

The current behavior that replaces every imported material is prohibited.

---

## 6. Blender production specification

### 6.1 Scene collections

```text
TBM_MASTER
├── GEO_CORE
├── GEO_FORGED_BANDS
├── GEO_INNER_ORBITS
├── GEO_NETWORK_CAGE
├── GEO_NETWORK_NODES
├── GEO_GROUND
├── VFX_ELECTRICITY
├── VFX_CONTACT_FLASHES
├── VFX_SPARKS_NEAR
├── VFX_SPARKS_MID
├── VFX_EMBERS_FAR
├── VFX_SMOKE
├── LIGHTS
├── CAMERAS
└── COMPOSITING_CONTROLS
```

Every collection must be independently toggleable for render diagnostics.

### 6.2 Geometry contract

#### Black core

- high-resolution sphere with non-perfect macro shape;
- subtle procedural displacement, not enough to destroy the silhouette;
- bevel-safe topology and smooth shading;
- optional hairline fracture/contact marks at energy junctions;
- UVs suitable for baked web maps.

#### Forged bands

- open curves converted to meshes with flattened rectangular profiles;
- deliberate thickness and width variation;
- bevel modifier with enough segments to catch highlights;
- weighted/smooth normals;
- cut faces modeled separately so they can be hotter/brighter;
- asymmetric placement matching Reference 1;
- no complete torus may substitute for these bands.

#### Inner orbits

- three to five differentiated rings;
- mixed round and flattened profiles;
- controlled intersections, not accidental clipping;
- individual pivots for multi-axis rotation.

#### Network cage

- spherical geodesic or authored topology;
- fine curves-to-mesh lines;
- visible junction nodes;
- varied node scale;
- selected accent nodes with emissive cores;
- clean enough topology for optional web export.

#### Ground

- near-black reflective surface;
- circular engraved lines and subtle forged marks;
- roughness variation;
- local wet/oily reflection response;
- fades into darkness outside the light pool.

### 6.3 Material recipes

#### A. Black forged core

- Base: near-black neutral, not pure RGB zero;
- Metallic: 0.75–1.0 depending on final read;
- Roughness: spatially varied approximately 0.12–0.32;
- Clearcoat: subtle;
- Bump: micro-pits, hairline scratches, occasional smudges;
- Reflection target: one broad cool-white key, one narrow warm rim, small hot energy contacts.

#### B. Hammered aged copper/brass

- metallic 1.0;
- broad warm base with dark oxidation variation;
- anisotropic or directional micro-scratch response;
- hammered normal/displacement at two scales;
- cut-edge mask with lower roughness and higher brightness;
- dark crevice/oxidation mask;
- no uniform orange colour.

#### C. Polished inner rings

- cleaner and brighter than outer forged bands;
- lower roughness;
- controlled brushed direction;
- enough imperfection to avoid a plastic or chrome appearance.

#### D. Emissive energy

- white-hot core;
- amber/orange mid region;
- red/orange outer falloff;
- actual light contribution is constrained to contact areas;
- bloom is generated in compositing, not by overexposing the full scene.

### 6.4 Lighting rig

- low-strength dark studio/HDR environment for reflection continuity;
- broad cool area key above/front;
- narrow warm strip rim from right/rear;
- secondary warm strip from left for band separation;
- low ground grazing light to reveal engravings;
- small contact lights driven by electrical event intensity;
- optional gobo/cookie for broken smoke illumination;
- black flags to preserve negative space and prevent flat fill.

Lighting approval requires grayscale/value review in addition to colour review.

### 6.5 Atmosphere

- Principled Volume or imported VDB smoke;
- low density with heterogeneous noise;
- at least three depth layers: foreground wisps, sculpture volume, background haze;
- smoke must be backlit and readable without turning the background grey;
- volume samples and bounces set high enough to avoid obvious banding/noise.

### 6.6 Camera and composition

- desktop master: 1680 × 945, 16:9-safe composition;
- 50–65 mm equivalent starting range;
- modest depth of field focused at the front/core intersection;
- mobile camera authored separately at 9:16;
- subtle dolly/arc motion rather than a large zoom;
- final settled camera moves the sculpture right while maintaining its apparent scale.

### 6.7 Compositing

Required render passes:

- Combined;
- Diffuse/Glossy or equivalent light groups;
- Emission;
- Volume;
- Mist/Z;
- Motion Vector;
- Cryptomatte for core, bands, network, sparks, and ground.

Required compositor operations:

- exposure and contrast in AgX;
- selective Fog Glow;
- restrained Streaks for only the brightest nodes;
- energy-contact bloom;
- depth-based atmospheric separation;
- subtle vignette;
- restrained film grain;
- no global orange colour wash;
- no clipped metal highlights.

### 6.8 Render quality

Preview:

- Eevee or low-sample Cycles;
- 50% resolution;
- used only for animation and composition review.

Final:

- Cycles GPU if supported;
- 256–512 samples as a starting range, raised if volume noise remains;
- adaptive sampling;
- OpenImageDenoise with albedo/normal guidance where appropriate;
- motion blur enabled for sparks and moving bands;
- 32-bit multilayer OpenEXR;
- no direct final render to WebP.

---

## 7. Reveal storyboard and motion density

The reveal is approximately 7–9 seconds when played linearly and maps to a pinned scroll distance of roughly 260–340 vh on desktop.

### Phase 0 — blackout / latent energy (0–8%)

- black stage;
- faint smoke drift;
- one or two distant embers;
- low subvisual reflection on the floor;
- no early exposure of the final sculpture.

### Phase 1 — core ignition (8–28%)

- black core rises/settles into frame;
- three forged bands enter from different depth planes;
- contact tips heat;
- first electric arcs strike;
- sparks recoil with directional motion blur;
- camera performs a restrained dolly-in;
- action must feel forceful, not decorative.

### Phase 2 — orbital lock (28–55%)

- forged bands partially separate or transform into the ring system;
- inner rings rotate into distinct axes;
- cage lines assemble in successive regions rather than appearing at once;
- nodes travel or flare at junctions;
- left band creates residual discharge;
- `STRUCTURING THE NETWORK` appears only after its visual phase is readable.

### Phase 3 — system charge (55–78%)

- outer halo grows/locks;
- energy travels around the halo;
- selected nodes flare in sequence;
- a controlled radial spark burst occurs;
- smoke reacts visually through light, not a full fluid blast;
- core, rings, cage, and halo rotate at different velocities.

### Phase 4 — forged handoff (78–100%)

- sculpture shifts right;
- left copy region darkens and clears;
- spark density decays but does not stop completely;
- outer halo retains slow energy travel;
- progress label becomes `FORGED FOR CLEAR DECISIONS`;
- final frame aligns with Reference 3;
- homepage copy and calls to action reveal in a controlled sequence.

### Ambient hero motion after handoff

- core rotation: extremely slow;
- inner orbit group: slow, differing axes;
- cage: slower counter-rotation;
- nodes: occasional pulse/travel;
- embers: sparse drift;
- pointer movement: no more than 2–3° perceived parallax;
- no constant high-speed spinning.

---

## 8. Homepage and section design

### 8.1 Header

- black/transparent header with 1 px low-contrast divider;
- logo and existing approved wording preserved;
- restrained uppercase navigation;
- outlined gold CTA matching the references;
- no oversized filled yellow button;
- desktop and mobile states validated separately.

### 8.2 Settled hero

- copy occupies the left 40–44%;
- sculpture occupies the right 52–96%;
- no four floating information boxes around the sculpture;
- headline and approved body wording remain unchanged unless separately authorised;
- progress/phase rail remains visually subordinate;
- motion-pause control remains accessible but visually integrated.

### 8.3 Product Focus

#### Card imagery to create in Blender

1. **Beauty & Personal Care:** near-black glossy cosmetic gel/cream fold with subtle copper reflection.
2. **Home & Kitchen:** nested matte graphite arcs/plates with copper edge light.
3. **Toys & Games:** dark woven fabric and sculptural black spheres.
4. **Consumer Electronics:** black honeycomb field with a polished curved device edge.
5. **General Merchandise:** layered black fabric/bands with geometric overlays.

Each is rendered as a bespoke 4:5 or 3:4 portrait still, not sourced from a generic stock image.

#### Interaction

- filter pills update the available/active category set;
- clicking, tapping, or keyboard-selecting a card:
  - raises it;
  - brightens its border;
  - adds the selected badge;
  - reroutes the SVG network;
  - moves active node light along the new path;
  - updates the criteria panel;
  - updates accessible live text without stealing focus;
- hover may add 1–2° tilt and highlight travel only on fine-pointer devices;
- reduced-motion mode uses opacity/border changes without travel animation.

#### Structural implementation

- semantic buttons or links for cards;
- SVG topology layer behind the cards;
- CSS custom properties for node coordinates;
- one JS state store for active filter and selected sector;
- no canvas required unless SVG performance is proven inadequate.

### 8.4 How We Buy

Use the same connected-system language:

- four sequential stages;
- a single active route travels from submission to evaluation to offer to completion;
- each stage has one strong visual panel and concise copy;
- progress line energizes as the section enters;
- cards are staggered in depth/height, not a uniform four-column box grid;
- selected/hovered stage reveals its criteria without shifting the entire page.

### 8.5 Insights

- dark editorial composition;
- one primary insight/graph panel and two supporting cards;
- fine network lines continue through the section;
- data movement uses SVG stroke drawing and numeric count-up only where it communicates meaning;
- no generic dashboard aesthetic and no invented metrics.

### 8.6 Final CTA

- visual closure using the halo/network motif;
- restrained ember field;
- no second heavyweight Three.js scene;
- CTA wording preserved;
- motion can be a pre-rendered loop or CSS/SVG treatment.

---

## 9. Technical architecture

```text
Blender Cycles master
├── approved keyframe stills
├── desktop reveal EXR sequence
├── mobile reveal EXR sequence
├── settled poster/ambient loop
├── five Product Focus stills
└── optional web GLB + baked texture maps

Browser
├── immediate poster
├── GSAP/ScrollTrigger reveal controller
├── progressive frame/video loader
├── optional Three.js enhancement
├── SVG card network controller
├── section interactions
└── reduced-motion/static fallbacks
```

### Reveal controller state

```js
{
  phase: "latent" | "ignition" | "assembly" | "charge" | "handoff" | "hero",
  progress: 0.0,
  frameIndex: 0,
  assetsReady: false,
  reducedMotion: false,
  interactionMode: "rendered" | "webgl" | "static"
}
```

Only this controller may translate scroll progress to reveal progress.

### Primary asset selection

The implementation milestone must benchmark both:

1. compressed image sequence with deterministic frame scrub;
2. pre-rendered video with tested seeking/keyframe cadence.

Selection criteria:

- visual quality;
- startup time;
- deterministic reverse scrub;
- Safari/Chrome/Firefox behavior;
- memory consumption;
- total bytes;
- no blank frames during fast scroll.

Do not select a format by assumption.

### Performance budgets

| Asset/metric | Desktop budget | Mobile budget |
|---|---:|---:|
| Immediate poster | ≤ 350 KB | ≤ 220 KB |
| Initial reveal preload | ≤ 1.5 MB | ≤ 900 KB |
| Full reveal, progressively loaded | target ≤ 12 MB | target ≤ 6 MB |
| Optional GLB geometry | ≤ 4 MB | not required |
| Optional KTX2 textures | ≤ 6 MB total | ≤ 3 MB total |
| Product Focus initial imagery | ≤ 1.2 MB total | ≤ 750 KB total |
| Long-task budget during scroll | no task > 50 ms | no task > 50 ms |
| Steady animation | 55–60 fps target | ≥ 30 fps target |

If the exact visual target exceeds the full-reveal byte target, fidelity and loading strategy must be reviewed explicitly; quality must not be silently reduced.

---

## 10. Skills and tools discovered with `find-skills`

No skill was installed during this research/PRD pass.

### 10.1 Recommended skills

| Skill | Evidence at review time | Use | Decision |
|---|---|---|---|
| `anthropics/skills@frontend-design` | approximately 698K installs, approximately 164K GitHub stars, multiple audit passes | art direction, composition, typography, avoiding generic layouts | **Recommended** |
| `cloudai-x/threejs-skills@threejs-materials` | approximately 5.9K installs, 2.7K stars, audit passes | PBR material implementation | **Recommended if live GLB proceeds** |
| `cloudai-x/threejs-skills@threejs-shaders` | approximately 6.5K installs, 2.7K stars | energy, mask, and bespoke shader reasoning | **Recommended if live WebGL proceeds** |
| `cloudai-x/threejs-skills@threejs-postprocessing` | approximately 5.1K installs, 2.7K stars | composer/bloom/post effects | **Recommended if live WebGL proceeds** |
| `cloudai-x/threejs-skills@threejs-animation` | approximately 10K installs, 2.7K stars, audit passes | animation loop and state patterns | **Recommended if live WebGL proceeds** |
| `microsoft/playwright-cli@playwright-cli` | official Microsoft source | deterministic browser validation and screenshots | **Recommended** |
| `anthropics/skills@webapp-testing` | approximately 120K installs | interaction and regression workflow | **Recommended** |

Installation commands, only after approval:

```powershell
npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/cloudai-x/threejs-skills --skill threejs-materials
npx skills add https://github.com/cloudai-x/threejs-skills --skill threejs-shaders
npx skills add https://github.com/cloudai-x/threejs-skills --skill threejs-postprocessing
npx skills add https://github.com/cloudai-x/threejs-skills --skill threejs-animation
npx skills add https://github.com/microsoft/playwright-cli --skill playwright-cli
npx skills add https://github.com/anthropics/skills --skill webapp-testing
```

### 10.2 Blender skill findings

The search found:

- `roble3/cc-blender-skill@blender-materials`;
- `roble3/cc-blender-skill@blender-lighting`;
- `roble3/cc-blender-skill@blender-animation`;
- `roble3/cc-blender-skill@blender-cameras`;
- generic Blender bundles and low-install Geometry Nodes skills.

These had far lower adoption than the frontend/Three.js candidates. They may be audited as optional working references, but they are **not authoritative enough to replace Blender’s official documentation or visual review**.

### 10.3 Rejected or unnecessary

- Blender MCP: not required for deterministic `bpy` builds and batch renders; it may make interactive scene inspection more convenient but does not improve art quality by itself.
- Spline: not appropriate for the final master.
- React Three Fiber: the existing site is not React; introducing it is unnecessary.
- generic AI-video tools: unsuitable for a deterministic, reversible, brand-specific reveal.
- stock 3D-asset packs: likely to reduce reference fidelity.
- low-install generic “3D website” skills: not accepted without source/audit review.

---

## 11. Required toolchain

### Already suitable

- Blender 5.2;
- Blender Python (`bpy`);
- Three.js already used by the site;
- GSAP/ScrollTrigger already used by the reveal implementation;
- Python/Pillow frame tooling;
- Playwright browser validation.

### Straightforward additions

- `gltf-transform` for GLB inspection and optimization;
- `toktx` or equivalent KTX2 pipeline if a live GLB is approved;
- `ffmpeg` for lossless intermediate assembly and web encodes;
- `pixelmatch` or Playwright snapshot comparison for layout regression;
- optional `sharp` for deterministic poster/thumbnail generation.

### Blender add-ons

No paid or heavy add-on is mandatory. Use built-in:

- Node Wrangler;
- Geometry Nodes;
- Cycles;
- compositor;
- glTF exporter;
- Python scripting.

Optional third-party material/VDB assets require licence and provenance review before use.

---

## 12. File-level implementation plan

No listed file is to be modified until Milestone 0 is approved.

### Create

```text
blender/reference-match/
├── TBM_REFERENCE_MATCH_MASTER.blend
├── scene_contract.json
├── scripts/
│   ├── build_geometry.py
│   ├── build_materials.py
│   ├── build_vfx.py
│   ├── build_lighting.py
│   ├── build_animation.py
│   ├── render_keyframes.py
│   ├── render_sequences.py
│   └── export_web.py
├── textures/
├── vdb/
└── renders/

assets/tbm-cinematic-v6/
├── posters/
├── reveal-desktop/
├── reveal-mobile/
├── product-focus/
├── glb/
└── manifests/

js/tbm-reveal-v6.js
js/tbm-hero-enhancement-v6.js
js/tbm-product-network-v6.js
js/tbm-sections-v6.js
css/tbm-reference-match-v6.css
scripts/validate-tbm-v6.mjs
scripts/capture-tbm-v6.mjs
```

### Modify after asset approval

- `index.html`
- `js/forge-intro.js` or retire its active ownership in favour of `tbm-reveal-v6.js`
- import map only if module paths require it
- CI visual workflow

### Retire from active loading, preserve for rollback

- `js/hero-3d-blender-v5.js`
- `js/home-sections-v5.js`
- `css/tbm-experience-v5.css`
- `assets/forge-reveal-v5/`
- `assets/armillary/tbm-armillary-v5.glb`

They are not deleted during the first pass.

### Illustrative `index.html` activation diff

This is a planning snippet, not an instruction to apply now:

```diff
- <link rel="stylesheet" href="css/tbm-experience-v5.css">
+ <link rel="stylesheet" href="css/tbm-reference-match-v6.css">

- <script type="module" src="js/home-sections-v5.js"></script>
- <script type="module" src="js/hero-3d-blender-v5.js"></script>
+ <script type="module" src="js/tbm-reveal-v6.js"></script>
+ <script type="module" src="js/tbm-hero-enhancement-v6.js"></script>
+ <script type="module" src="js/tbm-product-network-v6.js"></script>
+ <script type="module" src="js/tbm-sections-v6.js"></script>
```

Activation occurs only after the new files pass desktop, mobile, reduced-motion, and fallback validation.

---

## 13. Mandatory implementation order and approval gates

### Milestone 0 — evidence freeze and rollback setup

Deliver:

- copy the four approved references into a versioned, immutable reference folder;
- record SHA-256 hashes;
- capture current desktop/mobile website screenshots;
- create `backup/reference_match_v6_20260725/REVERT_TRACKING.md`;
- back up every file expected to change;
- record exact restore paths;
- create visual masks/guides for the three reveal compositions and Product Focus layout.

**Gate:** evidence and rollback tracker reviewed. No art or code change before this.

### Milestone 1 — geometry clay renders

Deliver exactly:

- Reference 1 clay render;
- Reference 2 clay render;
- Reference 3 clay render;
- front/three-quarter diagnostic turntable;
- silhouette overlay against each reference.

No final materials, sparks, or smoke are used to conceal geometry errors.

**Gate:** user approves silhouette, scale, gaps, ring count, cage density, and composition.

### Milestone 2 — material look development

Deliver:

- black core shader ball and in-scene close-up;
- forged band material close-up;
- polished ring close-up;
- ground material close-up;
- full Reference 1 still with final materials and neutral atmosphere.

**Gate:** user approves metal quality, imperfection level, reflections, and colour.

### Milestone 3 — lighting, atmosphere, and VFX keyframes

Deliver:

- final-quality Reference 1 keyframe;
- final-quality Reference 2 keyframe;
- final-quality Reference 3 keyframe;
- VFX-isolated passes for electricity, sparks, and smoke;
- compositing before/after comparisons.

**Gate:** all three stills approved. This is the first point at which animation may proceed.

### Milestone 4 — motion animatic

Deliver:

- low-resolution 7–9 second animatic;
- phase-labelled version;
- scroll-mapped browser prototype using temporary media;
- normal, fast-scroll, reverse-scroll, and reduced-motion demonstrations.

**Gate:** user approves movement, action density, pacing, and handoff.

### Milestone 5 — final Cycles render and web encode

Deliver:

- desktop EXR master sequence;
- mobile EXR master sequence;
- tested image-sequence and video encodes;
- artifact-size/performance comparison;
- chosen delivery format with evidence.

**Gate:** no blank frames, acceptable scrub, approved quality, approved byte cost.

### Milestone 6 — web integration

Deliver:

- exact header and hero composition;
- single ScrollTrigger owner;
- poster and progressive loader;
- reveal-to-hero handoff;
- pause/reduced-motion/fallback behavior;
- optional live Three.js enhancement only if it passes visual review.

**Gate:** reference-viewport screenshots approved before proceeding to lower sections.

### Milestone 7 — Product Focus

Deliver:

- five approved Blender card stills;
- exact card composition;
- filters;
- active/selected states;
- SVG network rerouting;
- criteria panel;
- keyboard and reduced-motion behavior.

**Gate:** Reference 4 screenshot and interaction recording approved.

### Milestone 8 — remaining sections

Deliver:

- How We Buy;
- Insights;
- CTA;
- responsive variants;
- final regression suite.

**Gate:** full-page desktop/mobile review.

### Milestone 9 — final reinspection

Reopen every changed file and verify:

- intended diff is complete;
- no V5 active imports remain;
- all referenced assets exist;
- manifests contain exact frame counts and paths;
- no placeholder copy;
- no missing mobile source;
- no console/network errors;
- all backup mappings are current;
- `REVERT_TRACKING.md` status is updated file by file.

---

## 14. Validation contract

### Blender validation

- open `.blend` successfully in Blender 5.2;
- all external assets packed or manifest-addressed;
- no missing textures/VDBs;
- render three keyframes headlessly;
- compare outputs to approved references;
- verify frame-range and camera selection;
- inspect noisy volume/metal regions at 100%.

### Static code validation

- `node --check` for every modified JS file;
- parse JSON manifests;
- validate all asset paths;
- no duplicate reveal scroll owners;
- no generic material replacement traversal;
- no stale V5 imports after activation.

### Browser matrix

- Chrome desktop: 1680 × 945 and 1440 × 900;
- Chrome desktop: 1920 × 1080;
- mobile: 390 × 844;
- mobile: 430 × 932;
- Safari-compatible media fallback;
- Firefox media/fallback behavior;
- 1× and 2× device pixel ratio where practical;
- reduced motion;
- WebGL disabled;
- slow network;
- fast forward/reverse scroll.

### Visual regression artifacts

For each target, store:

```text
reference.png
actual.png
overlay-50.png
difference.png
mask.png
metrics.json
review.md
```

Automated metrics never override a visibly inferior result.

### Interaction validation

- reveal does not trap scrolling;
- progress is reversible;
- header remains usable;
- pause control works;
- card selection works by mouse, touch, Enter, and Space;
- arrow navigation is predictable;
- filter state and selected state remain synchronized;
- focus ring is visible;
- reduced motion removes travel/tilt/scrub motion;
- fallback content remains understandable.

---

## 15. Failure modes and controls

| Failure | Control |
|---|---|
| Primitive scene accepted because it “technically runs” | Clay-render gate against silhouettes before materials or code |
| Materials look plastic | Dedicated material close-ups, roughness/normal/anisotropy maps, studio reflection targets |
| Web GLB looks worse than Cycles | Pre-rendered layer remains primary; live GLB cannot replace it without approval |
| Sparks look like dots | Multi-scale instancing, trails, lifetime fade, motion blur, VFX isolation review |
| Smoke disappears or greys the scene | Light-group control, layered density, volume-only review |
| Reveal feels bland | Required distinct action events per phase and motion animatic gate |
| Page becomes too heavy | poster-first loading, progressive prefetch, mobile composition, measured delivery-format bake-off |
| Scroll becomes fragile | one ScrollTrigger timeline and one progress state |
| Product cards regress to boxes | five approved Blender stills and Reference 4 geometry gate |
| Third-party skill quality is weak | official documentation remains authoritative; skills are audited before installation |
| Implementation overwrites prior work | versioned backup plus per-file `REVERT_TRACKING.md` |

---

## 16. External research and sources

### Primary / official

- Blender glTF 2.0 exporter documentation:  
  `https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html`  
  Used to define portable PBR maps and to recognise that Blender physics, compositing, volumes, and many procedural effects do not become equivalent live-web effects automatically.

- Blender Principled BSDF:  
  `https://docs.blender.org/manual/en/3.1/render/shader_nodes/shader/principled.html`

- Blender Principled Volume:  
  `https://docs.blender.org/manual/en/4.5/render/shader_nodes/shader/volume_principled.html`

- Blender Bevel modifier:  
  `https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/bevel.html`

- Blender Geometry Nodes:  
  `https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/`

- Three.js `PMREMGenerator`:  
  `https://threejs.org/docs/pages/PMREMGenerator.html`

- Three.js `MeshPhysicalMaterial`:  
  `https://threejs.org/docs/pages/MeshPhysicalMaterial.html`

- Three.js `GLTFLoader`:  
  `https://threejs.org/docs/pages/GLTFLoader.html`

- Three.js `EffectComposer`:  
  `https://threejs.org/docs/pages/EffectComposer.html`

- Three.js `UnrealBloomPass`:  
  `https://threejs.org/docs/pages/UnrealBloomPass.html`

- Three.js `KTX2Loader`:  
  `https://threejs.org/docs/pages/KTX2Loader.html`

- GSAP ScrollTrigger:  
  `https://gsap.com/docs/v3/Plugins/ScrollTrigger/`

- MDN web video codec guide:  
  `https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs`

- web.dev lazy-loading video guidance:  
  `https://web.dev/articles/lazy-loading-video`

- Swanson Reserve Capital reference site, inspected live on 25 July 2026:  
  `https://www.swansonreservecapital.com/`

### Practitioner tutorials / secondary references

- Blender Guru, spark construction, fade, and motion blur:  
  `https://www.blenderguru.com/posts/how-to-make-sparks`

- 3DSinghVFX, volumetric and surface lightning using Geometry Nodes shortest paths:  
  `https://www.blendernation.com/2022/09/02/creating-lightning-effect-with-shortest-edge-path-nodes-of-geometry-nodes/`

- Blender Made Easy, procedural brushed-metal workflow:  
  `https://blender.fi/2021/10/31/blender-tutorial-creating-realistic-procedural-brushed-metal/`

- Creative Shrimp, cinematic lighting in Cycles/Eevee:  
  `https://www.creativeshrimp.com/cinematic-lighting-teaser.html`

- Skills directory evidence:  
  `https://skills.sh/anthropics/skills/frontend-design`  
  `https://skills.sh/cloudai-x/threejs-skills/threejs-materials`  
  `https://skills.sh/cloudai-x/threejs-skills/threejs-shaders`  
  `https://skills.sh/cloudai-x/threejs-skills/threejs-postprocessing`  
  `https://skills.sh/cloudai-x/threejs-skills/threejs-animation`  
  `https://skills.sh/microsoft/playwright-cli/playwright-cli`

### Confidence

- **High confidence:** current-result diagnosis, because it is verified against current source files and captured browser artifacts.
- **High confidence:** hybrid pre-rendered reveal plus optional live enhancement, because Blender export limits, Three.js material/runtime capabilities, ScrollTrigger behavior, and the live reference-site bundle all support it.
- **High confidence:** the Product Focus layout requirements, because they are directly visible in the approved reference.
- **Medium confidence until render tests:** exact samples, byte sizes, and frame/video delivery choice; these must be benchmarked against the actual final scene.
- **Requires user visual approval:** all subjective art decisions, including exact smoke density, amount of surface wear, spark density, and motion aggressiveness.

---

## 17. Definition of done

The rebuild is complete only when:

1. all three reveal keyframes have been approved against References 1–3;
2. the reveal’s movement and action density have been approved in an animatic;
3. the browser reveal uses those approved Blender outputs without visible quality regression;
4. the settled hero aligns with Reference 3 at the reference viewport;
5. Product Focus aligns with Reference 4 and has all specified interactions;
6. the remaining sections use the same coherent material/network system;
7. mobile has separately authored visual composition;
8. reduced-motion and failure fallbacks work;
9. performance budgets are measured and any exception is explicitly accepted;
10. all changed files have backups and current revert mappings;
11. every changed file has been reopened and verified after implementation;
12. no current result is accepted merely because it loads, animates, or contains a 3D model.

The first implementation deliverable is therefore **not another website patch**. It is the three Blender clay renders required by Milestone 1.
