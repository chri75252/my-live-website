# Confirmed Problems and Root-Cause Hypotheses

## User-confirmed current problems

### Reveal

- Scroll scrubbing now feels more laggy than earlier.
- Some images appear to be skipped.
- Reveal progression does not feel consistently proportional to scroll input.
- The final reveal state and transition into the homepage were better in earlier versions.
- The compressed reveal images look visibly lower fidelity than the homepage.

### Persistent live armillary

- Current component has only a slight improvement in colour tone.
- It remains too simple and less aesthetically rich than earlier preferred states.
- It does not match the reveal target closely enough in silhouette, rings, network, material, highlights and visual presence.
- The current deployed object is perceived as less premium.

## High-priority technical hypotheses to test

These are evidence-based hypotheses derived from the current source. Do not present them as proven until profiled.

### H1 — hidden WebGL hero is rendering underneath the reveal

`index.html` loads `js/hero-3d-reveal-match-v2.js` immediately. That module starts a continuous WebGL animation loop and may enable the composer on desktop. The homepage hero is physically under the full-screen reveal but can still be considered intersecting by its IntersectionObserver.

Possible result:

- full-resolution 2D Canvas frame drawing and blur;
- plus post-processed WebGL rendering;
- plus particles, embers, cards and ScrollTrigger bookkeeping;
- all during the reveal.

This simultaneous workload is a strong candidate for the new real-device lag after PR #12.

Required test:

- profile current production with hero rendering active;
- suspend the live hero during reveal and profile again;
- compare main-thread, GPU and frame timing.

### H2 — reveal uses two requestAnimationFrame stages

Current control path:

1. scroll event schedules `forge-intro.js` `render()`;
2. `render()` calls `sequence.setProgress()`;
3. `setProgress()` schedules a second requestAnimationFrame in `forge-frame-sequence.js`;
4. the canvas draw happens in that later callback.

This can introduce a one-frame delay and inconsistent response during bursty wheel/touch input.

Required test:

- instrument event time, controller render time and actual canvas draw time;
- compare with a single scheduler/direct draw architecture.

### H3 — expensive blur/filter compositing on every reveal draw

For portrait/aspect mismatch, current `draw()` can perform:

- full-canvas fill;
- blurred, scaled cover-background draw using `context.filter`;
- foreground draw A;
- foreground draw B for fractional blending.

At a high-DPR canvas this can be CPU/GPU expensive, especially while another WebGL composer is running.

Required test:

- pre-render/cache the blurred background or use CSS/background layers;
- compare draw cost;
- avoid recomputing expensive blur each progress update.

### H4 — only 32 motion samples

Thirty-two frames over the sequence portion of roughly 82% of an 820px minimum travel yields visibly coarse source motion under fast input. Fractional alpha blending creates a dissolve between frames, not true temporal interpolation.

Required test:

- inspect source-video frame rate and duration;
- compare 32, 48, 64, 72, 96 and other evidence-based sample counts;
- choose the lowest count that is visually smooth and within decoded-memory limits.

### H5 — nearest-loaded fallback can visibly jump

Before every frame is ready, `nearestLoaded()` substitutes another frame. If the user scrolls early, progress can move while the requested target frame is unavailable, producing apparent stalls and jumps.

Required correction:

- do not declare the reveal interactively ready until a suitable contiguous frame set is decoded;
- or block/clamp progress until the needed range is ready;
- record requested, resolved and rendered frame indices.

### H6 — source files are already compressed

Current WebPs were generated from 1280×720 JPG frames. Re-encoding cannot restore detail lost during the initial JPG extraction.

Required correction:

- extract directly from the user-provided source video;
- use lossless intermediates for audit/contact sheets;
- encode production assets only after the clean range and cadence are approved.

### H7 — handoff state is not centrally coordinated

The reveal controller and live hero use separate scroll models:

- reveal uses `window.scrollY` mapped to its own measured range;
- live hero installs a separate ScrollTrigger with `scrub: 0.55` on desktop and `0.4` mobile;
- live hero also eases `currentProgress` toward `targetProgress` in its own RAF loop.

When the overlay releases, the live object can already be in a different pose/progress state from the final reveal frame.

Required correction:

- define an explicit handoff pose/progress contract;
- freeze or externally control the live hero until handoff;
- pre-warm it at the exact target pose;
- activate normal hero scroll only after release.

### H8 — final crossfade may expose unequal image quality

The reveal is a compressed raster sequence while the live hero is crisp realtime WebGL. Even a geometrically close object will show a quality jump.

Required correction:

- regenerate reveal assets from source video at adequate quality;
- match tone mapping, black level, scale and sharpness;
- use a deliberate short handoff composite rather than an uncontrolled opacity reveal.
