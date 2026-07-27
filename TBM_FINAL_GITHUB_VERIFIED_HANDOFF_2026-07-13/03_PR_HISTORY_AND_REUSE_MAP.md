# PR History and Selective Reuse Map

Do not restore an entire historical PR. Retrieve the named files at the exact ref and extract only the useful concepts/sections.

## PR #3 — scroll-driven foundation

```text
PR: #3 — Fix the 3D hero with a scroll-scrubbed reveal and correct header logo
Head: 038af7c8369803ab3125394510a135cd96cac9c6
```

Useful:

- standard requestAnimationFrame loop;
- GSAP ScrollTrigger plus native fallback;
- offscreen/tab pausing;
- pointer parallax;
- explicit context-loss fallback.

Do not reuse its final appearance blindly.

## PR #4 — full-size initial presence

```text
PR: #4 — Guarantee visible 3D hero motion and full-size first-frame composition
Head: 2506f266d8a9b7e8a4edc4c0c0eb38e8943f481e
```

Useful:

- initial visible object starts near full size rather than growing from an undersized state;
- ambient motion starts immediately;
- independent motion for sculpture, rings, core, wireframe, nodes, particles and lighting;
- pause freezes current phase without forcing another pose;
- stage was enlarged to a 770px maximum.

This matches the user's preference for stronger size/presence.

## PR #5 — use only camera fitting and restrained post-processing concepts

```text
PR: #5 — Refine 3D hero fit, motion and visual energy
Head: 5bab5fb34a927c4c74deebe81a454ada1a4efe85
```

Potentially useful:

- geometry-aware camera fitting;
- responsive framing;
- restrained desktop bloom and DPR budgets.

Reject:

- comets;
- additive trails;
- travelling node pulses;
- scroll-velocity energy boost;
- any visual that the user previously rejected.

## PR #6 — key design constraints

```text
PR: #6 — Implement the Forge Gate cinematic homepage reveal
Head: d234524fd47c056d9983e0ffc607a36b67dcb4c0
Historical files:
  js/forge-scene.js
  js/forge-gate.js
  css/forge-gate.css
```

Useful concepts:

- deterministic scroll progression with no velocity acceleration;
- exactly six restrained non-glowing bronze nodes;
- exactly three elongated reflections constrained to the globe surface;
- no pedestal;
- no yellow Fresnel shell;
- no comet system;
- no external light balls;
- post-reveal ambient motion and pointer parallax.

## PR #7 — strongest historical surface-light implementation

```text
PR: #7 — Correct the Forge Gate reveal and restore the premium black-bronze globe
Head: a4b2632c31329a7f0e35be36435ba06ad9254d61
File: js/forge-scene.js
Blob at that ref: d9c7003a7776e19c1132130815e53badbfd7e964
```

Inspect in particular:

- `globeUniforms`;
- `globeMaterial` custom `ShaderMaterial`;
- fragment-shader function `elongatedGlint(...)`;
- the three glints `g1`, `g2`, `g3`;
- `uGlintLongitudes` and `uGlintLatitudes`;
- dark bronze `ringBaseMaterial` / `ringAccentMaterial`;
- six `nodeCoordinates`.

Why it matters:

The user explicitly remembers the earlier light moving over the globe surface as better than later floating lights. PR #7 is the most direct implementation of that idea: three elongated glints generated on the sphere surface, not visible external sprites.

Do not copy its shader unchanged. Its orange Fresnel and glint colours may still be too saturated. Reuse the technique and recalibrate it to the reveal's cooler black lacquer and muted bronze.

## PR #8 — useful direct-hero framing and glint path logic

```text
PR: #8 — Restore the premium black-and-bronze 3D hero
Head: 16e91af6e2ff2051e2fd76a424ff6f0e372da90b
File: js/forge-scene.js
Blob at that ref: cb735174d22f96b2e12beca207b531931de8fa9e
```

Inspect in particular:

- `MAX_RENDER_PIXELS`, `MOBILE_RENDER_PIXELS`, `SCULPTURE_DIAMETER`;
- `calculateTarget()` geometry-aware fitting;
- `screenPointToWorld()`;
- six `nodeCoordinates`;
- `glintConfigs`;
- `createGlintTexture()`;
- `updateGlints()`;
- `scaleForTarget`.

Useful:

- strong object occupancy within the designated hero area;
- geometry-aware fitting to a target element;
- exactly three elongated surface-following glints;
- six restrained nodes;
- subtle particle budget;
- no pedestal, halo or comets.

Caution:

PR #8 implemented glints as sprites. The user liked the effect, but the final implementation should avoid obvious flat sprites or floating external balls. Compare this with PR #7's shader-bound glints.

## PR #9 — exact user-preferred baseline reference

```text
PR: #9 — Restore the exact pre-PR5 homepage hero and add handoff documentation
Head: 4d546fab948810b4294c17fa816fa26d4c3a214a
Source commit: e234618f8dcc8283b69368b73f5b4537d228d0cb
```

Important exact blobs:

```text
index.html          2d61fadc8a55124f32dd75dc599eb69b21244498
css/hero-scroll.css 82070a5ead77c7d7926beb486553b8a657f872ed
js/hero-3d.js       8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b
js/home-v2.js       89b4ad5aa06cf425d71789c1917106c439ebe594
```

Use it to understand the earlier accepted size, presence and page integration. Do not restore its pedestal, 18 nodes or oversaturated lighting.

## PR #10 — repository handoff toolkit

```text
PR: #10 — Add implementation-ready Forge Gate continuation toolkit
Head: 423212fbbc7ad3056455607329371fb4998176d0
```

Read `REFERENCE/scripts/README.md` and the files it names. Use baseline-protection and diagnostics concepts.

## PR #11 — current reveal foundation

```text
PR: #11
Merge: 2b56fe29e3e5d4a059c0bbfa025243c77f6b49ce
```

Keep unless evidence requires a focused change:

- audited clean range concept;
- deterministic progress;
- desktop/mobile variants;
- fail-open behavior;
- inert interaction control;
- reverse scroll;
- no-JS and reduced-motion paths;
- artifact-driven evidence.

Change where evidence shows regression:

- source quality;
- frame count/cadence;
- loading readiness;
- render scheduling;
- blur cost;
- handoff coordination.

## PR #12 — current live renderer and validation foundation

```text
PR: #12
Feature head: 7a154eea46fe0c810f08e22e120772ab732e44a2
Merge/current main: 65cdf3c34ad6fc87837bee9969b1d382cf3bb762
```

Keep:

- import map;
- isolated new JS/CSS layer;
- explicit disposal;
- composer/direct/mobile/reduced-motion paths;
- diagnostics API;
- resource budgets;
- mobile non-overlapping card layout;
- automated captures.

Rework:

- visual geometry and richness;
- surface reflections;
- overall presence;
- lifecycle during reveal;
- exact initial handoff pose;
- any workload causing reveal regression.
