# Reveal Video and Scroll Pipeline Recovery Specification

## Source acquisition

The user will provide the original reveal video. Before implementation:

1. Run `ffprobe` and record:
   - codec;
   - resolution;
   - frame rate;
   - duration;
   - colour metadata;
   - total frames if available;
   - bit rate.
2. Extract a lossless PNG audit sequence from the video.
3. Generate numbered contact sheets.
4. Identify:
   - first usable frame;
   - final clean reveal frame;
   - first frame contaminated by synthetic homepage/UI;
   - duplicate frames;
   - compression artifacts;
   - abrupt exposure/scale changes.
5. Compare the video-derived clean range with repository frames 001–032.

## Production-format experiment

Create a reproducible benchmark comparing reasonable candidates, for example:

- WebP image sequence;
- AVIF image sequence where browser decoding is reliable;
- `ImageBitmap`-decoded images;
- carefully sampled higher-frame-count sequence;
- video scrubbing only if seeking behavior is proven reliable on target browsers.

Do not choose based on file size alone. Measure:

- first meaningful paint;
- time until scrub-ready;
- decoded memory;
- average/p95 draw time;
- scroll response latency;
- visual quality;
- mobile behavior;
- reverse scrub behavior.

## Current renderer sections to inspect

### `js/forge-frame-sequence.js`

Inspect and instrument:

- `DEFAULTS`;
- `loadFrame()`;
- `loadRemaining()`;
- `nearestLoaded()`;
- `ensureCanvasSize()`;
- `drawCoverBackground()`;
- `drawForeground()`;
- `draw()`;
- `requestDraw()`;
- `setProgress()`.

### `js/forge-intro.js`

Inspect and instrument:

- `measure()`;
- `render()`;
- `requestRender()`;
- `startSequence()`;
- `setInteractionSuppressed()`;
- handoff thresholds at 0.82 and 0.84;
- `window.__tbmForgeIntro` diagnostics.

## Required architecture properties

- same scroll position always yields the same visual state;
- reverse scroll is exact;
- no velocity-driven acceleration;
- no visible nearest-frame fallback after readiness;
- all selected frames are available before active scrubbing, or progress is safely gated;
- a single authoritative render scheduler where practical;
- no unnecessary full-resolution blur on every update;
- selected source variant only;
- explicit lifecycle for the hidden live Three.js renderer;
- source-video quality preserved as far as web delivery permits.

## Handoff lifecycle

Implement and expose a lifecycle such as:

```text
REVEAL_LOADING
REVEAL_READY
REVEAL_SCRUBBING
HERO_PREWARM
HANDOFF
HERO_ACTIVE
```

Recommended behavior:

- live hero does not continuously run full composer while the reveal is opaque;
- shortly before handoff, initialize/prewarm the live hero at a fixed target pose;
- freeze its scroll state until the crossfade begins;
- crossfade between aligned objects;
- after release, transfer control to normal hero scroll/ambient animation;
- reverse scrolling restores the corresponding fixed handoff state predictably.

## Frame count

Do not preserve 32 merely because it already exists. Do not jump blindly to 150–300 either.

Choose an evidence-based count from the source video's true motion. A likely range may be 60–96 for smoother scrubbing, but the final count must come from:

- source frame rate;
- clean-range duration;
- visual delta analysis;
- decoded-memory budget;
- real-device performance.

## Quality guard

The final clean frame shown during the handoff must not be a visibly compressed version of the source video. Compare crops of:

- black sphere edge;
- bronze ring highlights;
- wire network;
- dark background gradients;
- ember particles.
