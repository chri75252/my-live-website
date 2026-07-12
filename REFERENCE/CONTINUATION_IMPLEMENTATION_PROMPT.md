# Fresh Chat Implementation Prompt — TBM Forge Gate Reveal

Work on the local repository and GitHub repository:

- Local project: `C:\Users\chris\Chatgpt-bridge\TBM website`
- GitHub: `https://github.com/chri75252/my-live-website`

Fully continue the project from the handoff. Do not merely generate another plan.

## Mandatory reading and inspection

Before changing code:

1. Read `docs/tbm-3d-handoff/TBM_3D_HERO_HANDOFF_2026-07-12.md` in full.
2. Read `docs/tbm-3d-handoff/baseline_manifest.json`.
3. Inspect the reference images in the local handoff package, especially `reference_1_desired_pre_pr5.png`.
4. Inspect GitHub PRs #3, #4, #5, #6, #7, #8, and #9. Identify exactly what succeeded and failed.
5. Run `scripts/verify_exact_pre_pr5.ps1`.
6. Confirm that the current hero matches the exact pre-PR5 baseline before proceeding.

## Source of truth

Approved hero commit:

`e234618f8dcc8283b69368b73f5b4537d228d0cb`

Expected Git blob hashes:

- `index.html` → `2d61fadc8a55124f32dd75dc599eb69b21244498`
- `css/hero-scroll.css` → `82070a5ead77c7d7926beb486553b8a657f872ed`
- `js/hero-3d.js` → `8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b`
- `js/home-v2.js` → `89b4ad5aa06cf425d71789c1917106c439ebe594`
- `css/site-v2.css` → `730c2a3abf3e850a155287264d7107a37a4975a7`

If any hash differs, restore the exact baseline using `scripts/restore_exact_pre_pr5.ps1` and stop to report the discrepancy before reveal work.

## Implementation objective

Implement the full-screen Forge Gate reveal from start to finish on an isolated feature branch. The reveal must be a separate introductory layer that exposes the approved homepage hero underneath. It must not replace, rebuild, recolour, resize, or otherwise mutate the final hero scene.

Reference interaction behaviour:

`https://www.swansonreservecapital.com/`

Use the reference for interaction architecture only, not branding, assets, or copied code.

## Required architecture

- Keep `js/hero-3d.js` and `css/hero-scroll.css` byte-identical.
- Add a new wrapper/layer dedicated to the intro.
- The intro starts full-screen with its own graphic.
- Scroll progress deterministically advances the reveal.
- The approved homepage hero is already underneath and is revealed through opacity/mask/aperture choreography.
- At completion, the intro layer becomes non-interactive and the website continues scrolling normally.
- Do not use `ScrollTrigger.getVelocity()` or wheel velocity as a motion multiplier.
- Do not use the final hero's rings, nodes, globe, camera, materials, or animation loop as the intro timeline.
- Do not create a replacement final hero.

Recommended files:

```text
css/forge-intro.css
js/forge-intro.js
js/forge-intro-scene.js     # only if a separate lightweight Three.js intro is justified
```

## Reveal behaviour to implement

1. **Opening frame:** near-black full-screen field, restrained bronze atmosphere, “Scroll to forge”.
2. **Gate formation:** 3–5 heated bronze segments form a circular/elliptical gate; subtle sparks only at intersections.
3. **Passage:** camera/gate depth moves forward and an aperture opens to reveal the real homepage behind it.
4. **Homepage exposure:** header, copy, CTAs, cards, and the existing approved armillary become visible as one coherent page—not as a rebuilt scene.
5. **Release:** intro overlay reaches opacity 0, `pointer-events: none`, and normal document scrolling continues.

## Explicitly forbidden

- Modifying `js/hero-3d.js`.
- Modifying `css/hero-scroll.css`.
- Replacing the final hero with a second Three.js implementation.
- Comet balls, comet trails, yellow Fresnel shell, broad bloom, external moving point lights, chrome environment reflections, thick new base ring, scroll-velocity acceleration.
- Merging based only on syntax or CI.
- Claiming visual success without branch screenshots or a recording.

## Git workflow

1. Run `scripts/create_reveal_worktree.ps1` or create an equivalent isolated worktree.
2. Create a backup reference/tag if needed.
3. Implement on `feature/forge-intro-reveal-v2`.
4. Run `scripts/verify_reveal_did_not_modify_baseline.ps1` after each meaningful commit.
5. Run syntax/build checks and serve the site locally.
6. Capture the reveal at 1920×1080, 1680×900, 1366×768, and one mobile viewport.
7. Open a PR with the visual evidence.
8. **Stop before merge** and request user review.

Proceed with implementation in the feature branch after the exact baseline verification succeeds. Do not stop at a storyboard or written plan. Do not merge without explicit user approval.
