# Current State and Regressions

## 1) Persistent homepage 3D component is still not close enough to the reveal target
The current homepage component has improved slightly in colour tone, but is still materially wrong versus the reveal target.

### Main visual gaps
- It is **too simple** / stripped down compared with the reveal component.
- The **overall silhouette/composition** is wrong.
- The **ring system** is not close enough to the target structure.
- The **wire cage/network** is not matching the target density and shape.
- The **glossy black central sphere** and its reflections/highlights are not convincingly matched.
- The **metallic nodes/orbital endpoints** are not placed or sized correctly.
- The component feels **less premium and less cinematic** than the target.

## 2) Reveal scrubbing / reveal-to-homepage handoff regressed
The reveal currently appears less smooth than in earlier working states.

### Observed symptoms
- While scrolling, the reveal feels **laggier** than before.
- It appears that **frames may be skipping** or that the frame progression is not synchronised cleanly with scroll progress.
- The **reveal rate vs scroll rate** does not feel consistently smooth.
- The **transition from reveal to homepage** was better in earlier versions and has regressed.
- The final frame/handoff no longer lands as cleanly as before.

## 3) Visual mismatch between reveal and persistent hero remains
The persistent component is supposed to feel like the live continuation / settled state of the reveal object.

Current problem:
- the reveal object and the persistent homepage object still do not match tightly enough in geometry, material response, and perceived quality.

## 4) Quality issue with frame source
Previously extracted JPG frames appear compressed and lower quality.

Action implication:
- The next agent should prefer the **source reveal video** when analysing the target motion/appearance.
- Existing extracted frames can still be used as a guide, but the video should be treated as the better source of truth.
