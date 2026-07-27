# Persistent Live Hero Reconstruction Specification

## Current object is not the final design target

The current PR #12 implementation improved black/bronze tone and mobile layout but remains too simplified and visually distinct from the reveal.

The agent must treat the source video/reveal frames as the target, not PR #12's self-description.

## Target hierarchy

### 1. Central core

- deep near-black lacquer;
- premium rounded depth;
- limited, elongated moving/reflected highlights;
- most of the sphere remains black;
- no chrome lower hemisphere;
- no flat painted white patches;
- no visible external light sprites.

Compare two historical techniques:

- PR #7 custom shader-bound `elongatedGlint()` implementation;
- PR #8 `updateGlints()` surface-following glint trajectories.

Preferred final direction:

- physically grounded base material/environment;
- optional custom shader/onBeforeCompile layer for controlled surface highlights only if built-in lighting cannot match the video;
- highlights constrained to the sphere surface and visually integrated.

### 2. Armillary rings

- approximately three visually dominant intersecting rings;
- strong outer circular silhouette only if present in source;
- any additional ring/cage geometry must be subordinate;
- muted copper/rose-bronze, not bright yellow and not pale silver;
- deliberate crossing angles matching source-video stills;
- enough thickness to read as premium machined metal without becoming heavy tubes.

### 3. Internal network

- irregular, fine and secondary;
- less technical/grid-like than current;
- controlled density;
- neutral bronze/cool metallic tone;
- no visual competition with major rings.

### 4. Nodes

- use a small number of intentional nodes;
- inspect PR #6/#7/#8 six-node coordinates as historical candidates;
- do not restore the original 18-node orbit cloud;
- no emissive floating bulbs.

### 5. Scale and framing

Recover the stronger visual presence from PR #4/#8/#9:

- object should confidently occupy the right-hand hero zone;
- no awkward tiny atom appearance;
- no clipping;
- use geometry-aware fitting rather than fixed magic zoom alone;
- calibrate separately for desktop and mobile.

## Current source sections to inspect

In `js/hero-3d-reveal-match-v2.js`:

- `createStudioEnvironment()`;
- `coreMaterial`;
- `agedBronze`, `secondaryBronze`, `jointMaterial`;
- `shellLineMaterial`, `shellJointMaterial`;
- `coreRadius`, `outerRingRadius`, `shellRadius`;
- `ringDefinitions`;
- area-light setup;
- composer/bloom setup;
- `applyScene()`;
- `installGsapScroll()`;
- RAF `frame()`;
- `window.__tbmRevealMatchHero` diagnostics;
- disposal code.

In `css/hero-reveal-match-v2.css`:

- stage/background atmosphere;
- canvas sizing;
- card positioning;
- mobile grid and fixed-header clearance;
- reduced-motion rules.

## Motion target

- subtle independent ring motion;
- controlled sphere highlight movement;
- low-amplitude pointer parallax;
- no chaotic wobble;
- no strong scale pumping;
- frame-rate independent;
- pause should freeze current phase without pose jump;
- reduced motion should show a beautiful static object.

## Post-processing

Use restrained post-processing only after static geometry/material/lighting are correct.

Acceptable:

- very selective bloom for brightest highlights/embers;
- anti-aliasing;
- subtle vignette/grade if measurable and affordable.

Avoid:

- broad bloom;
- orange haze covering all rings;
- chromatic aberration;
- heavy grain;
- effects used to hide incorrect geometry.

## Handoff calibration data

Add test-only diagnostics exposing:

- world/canvas bounding box of sculpture;
- core radius in pixels;
- outer ring diameter in pixels;
- ring orientations/quaternions;
- camera pose;
- current material/light preset;
- handoff lifecycle state.

Use this to align the first visible live frame with the final clean video frame.
