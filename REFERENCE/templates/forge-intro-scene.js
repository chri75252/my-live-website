/*
 * Optional lightweight intro-scene contract.
 * This must remain independent from js/hero-3d.js and must never reconstruct
 * or replace the approved final armillary.
 *
 * Suggested scene content:
 * - 3–5 segmented bronze arcs forming a gate;
 * - one dark aperture/void;
 * - restrained intersection sparks;
 * - deterministic transformations derived only from setProgress(progress).
 */
export async function createForgeIntroScene(canvas) {
  if (!canvas) return null;

  // Implement only on the feature branch after the storyboard is approved.
  // Do not use scroll velocity, persistent skip state, broad bloom, comets,
  // external light balls, or the final hero's geometry/materials.

  return {
    setProgress(progress) {
      const p = Math.min(1, Math.max(0, progress));
      // Every object transform must be a pure function of p.
      void p;
    },
    resize() {},
    dispose() {}
  };
}
