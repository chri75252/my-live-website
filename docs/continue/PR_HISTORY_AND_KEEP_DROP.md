# PR History — What to Keep, What to Drop

## High-level summary
There were several iterations. Some later changes improved CI structure, but visually regressed either the persistent 3D component, the reveal smoothness, or both. The next agent must recover the strongest earlier characteristics instead of inheriting the weakest latest ones.

## Keep / recover from earlier states
The user repeatedly indicated that earlier versions had some qualities that were better. Those better qualities must be consciously recovered.

### A) Better persistent component characteristics seen in earlier iterations
Recover these characteristics where present in earlier PRs/commits/screenshots:
- **Larger, fuller hero occupancy**: the armillary should fill its assigned visual zone more confidently.
- **More convincing size and proportion**: not too tiny, not over-zoomed, not awkwardly cropped.
- **More attractive overall silhouette**: fewer awkward or tacky elements.
- **Better ring feel**: cleaner intersecting bronze rings, not oversized messy loops.
- **Moving surface lights / highlight glints** on or across the black sphere were previously liked more than some later floating-orb treatments.
- **A richer premium feel** with stronger cinematic polish.

### B) Better reveal behavior from earlier iterations
Recover these characteristics from earlier reveal implementations / states:
- smoother scroll scrubbing,
- more consistent frame progression,
- cleaner reveal-to-homepage handoff,
- better final settled frame before homepage exposure,
- less perceived lag/skipping.

## Drop / avoid from weaker later states
Avoid reintroducing these later regressions:
- simplified or under-designed homepage component,
- red/orange saturated ring treatment that looks cheap,
- wrong central sphere material or weak reflections,
- poor orbit/node placement,
- laggy or inconsistent reveal scroll behavior,
- degraded handoff between reveal and homepage.

## Practical interpretation
The next agent should inspect the existing PR/branch history and repository diffs to identify which exact code state most closely corresponds to the user's preferred earlier visual state, then selectively reuse that logic or geometry approach while still delivering the final target.
