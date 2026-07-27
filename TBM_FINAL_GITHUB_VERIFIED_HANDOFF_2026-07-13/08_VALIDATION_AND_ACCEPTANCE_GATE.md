# Validation and Acceptance Gate

## Baseline capture before changes

Capture current production behavior at current `main` before modifying it:

- desktop 1920×1080;
- desktop 1680×900;
- desktop 1366×768;
- mobile 390×844;
- mobile 430×932.

For each, record:

- slow scroll down;
- rapid scroll down;
- small incremental scroll;
- reverse scroll;
- reveal final-frame hold;
- reveal-to-homepage handoff;
- persistent hero initial state;
- persistent hero motion.

## Reveal assertions

- rendered frame index is monotonic when scrolling down;
- exact reverse mapping when scrolling up;
- no unresolved nearest-frame substitution after ready;
- no frame above selected clean cutoff;
- no large draw latency spikes;
- no source-video quality regression beyond approved encoding tolerance;
- reveal controller and canvas renderer update within the same intended frame budget;
- live WebGL workload is suspended or reduced while fully hidden;
- fail-open works;
- no-JS works;
- reduced-motion policy is explicit and does not require changing OS settings to see the persistent component.

## Handoff assertions

- final reveal object and initial live object have close centre/diameter;
- ring orientation does not jump visibly;
- sphere black level and highlight placement do not jump abruptly;
- no one-frame blank/flash;
- no sudden card/header overlap;
- live hero does not appear at a mismatched independent scroll progress;
- reverse crossing restores the correct state.

## Persistent hero assertions

- object is larger/more present than current simplified state without clipping;
- sphere reads as black lacquer;
- moving highlights remain on the sphere surface;
- ring hierarchy matches source;
- network is fine and subordinate;
- small restrained node count;
- no external light balls;
- no pedestal, comet or yellow halo;
- pause freezes without pose jump;
- reduced motion remains visually polished;
- mobile layout does not hide or obstruct the main object.

## Performance evidence

Report before/after:

- average frame interval;
- p95/p99 frame interval;
- long tasks;
- canvas draw time;
- WebGL render time;
- decoded frame memory estimate;
- network asset totals;
- time to first frame;
- time to scrub-ready;
- draw calls/triangles/textures/programs;
- desktop and mobile DPR.

Do not use SwiftShader timing as a claim of real-device FPS. Use it only for deterministic regression checks.

## GitHub workflow gate

Both reveal and hero workflows must pass on the same final head. Update tests carefully to test real behavior; do not weaken allowlists/assertions merely to obtain green CI.

## Human visual gate

The agent must open and inspect all final comparison sheets and recordings. It must explicitly state what remains different from the source video.

The user must only need to:

1. review the artifact;
2. test the draft deployment/live preview;
3. squash-merge if approved.
