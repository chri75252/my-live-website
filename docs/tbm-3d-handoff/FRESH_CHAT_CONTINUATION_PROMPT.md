# Fresh Chat Continuation Prompt — TBM Website 3D Hero and Reveal

Work on the GitHub repository:

`https://github.com/chri75252/my-live-website`

Before doing anything:

1. Read `docs/tbm-3d-handoff/TBM_3D_HERO_HANDOFF_2026-07-12.md` in full.
2. Inspect the reference images in the downloadable handoff package.
3. Treat `reference_1_desired_pre_pr5.png` as the primary visual target.
4. Treat Git commit `e234618f8dcc8283b69368b73f5b4537d228d0cb` as the source of truth for the approved hero.
5. Confirm whether the current live homepage matches that exact baseline.
6. Do not start the reveal animation until the user confirms the restored hero.

Non-negotiable constraints:

- Do not recreate the hero from memory.
- Do not change the approved `js/hero-3d.js` or `css/hero-scroll.css` while implementing the reveal.
- Do not add comet balls, trails, yellow halos, broad bloom, external moving lights, or scroll-velocity acceleration.
- Do not pin the normal homepage hero.
- The future reveal must be a separate full-screen intro layer.
- The intro must hand off to the existing homepage hero.
- The same scroll position must always produce the same reveal frame.
- Create a backup branch and feature branch.
- Provide branch screenshots/video before merging.
- Do not claim visual success without inspecting the rendered branch.

Immediate task:

- Verify the exact restore.
- Report any mismatch between the live homepage and Reference A.
- If the restore is correct, generate a 4–6 frame storyboard for the separate Forge Gate intro.
- Wait for explicit approval before implementing the reveal.
