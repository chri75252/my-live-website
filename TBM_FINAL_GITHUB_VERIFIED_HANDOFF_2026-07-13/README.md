# The Blacksmith Market — Final GitHub-Verified Handoff Pack

This package is the controlling handoff for the next implementation pass on:

- Repository: `https://github.com/chri75252/my-live-website`
- Current production `main`: `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`
- PR #11 merge: `2b56fe29e3e5d4a059c0bbfa025243c77f6b49ce`
- PR #12 merge: `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`

The pack was regenerated after inspecting the current GitHub repository, merged PRs #1–#12, current production files, current reveal renderer, current live Three.js renderer, and the earlier implementations that contained useful visual/motion ideas.

## Read order

1. `00_FINAL_EXECUTION_PROMPT.md`
2. `01_CURRENT_REPOSITORY_STATE.md`
3. `02_CONFIRMED_PROBLEMS_AND_ROOT_CAUSE_HYPOTHESES.md`
4. `03_PR_HISTORY_AND_REUSE_MAP.md`
5. `04_REVEAL_VIDEO_AND_SCROLL_PIPELINE_SPEC.md`
6. `05_PERSISTENT_HERO_RECONSTRUCTION_SPEC.md`
7. `06_SKILL_AND_TOOLCHAIN_MATRIX.md`
8. `07_EXACT_REPOSITORY_INSPECTION_MAP.md`
9. `08_VALIDATION_AND_ACCEPTANCE_GATE.md`
10. `09_SOURCE_REFERENCE_MANIFEST.md`

## Controlling scope

The next agent must improve both:

1. the **scroll-controlled Forge reveal and its handoff**, and
2. the **persistent live Three.js armillary on the homepage**.

The persistent hero is the primary visual-design problem. The reveal is already architecturally functional, but the user now observes a real-world smoothness regression and a weaker handoff after the heavier live hero was merged.

## Source policy

All project code, prior implementations, scripts, workflows, frames, manifests and documentation must be retrieved from the GitHub repository or the exact historical Git commit/PR ref named in this pack.

The only permitted non-repository source is the **original reveal video supplied directly by the user**. Treat that video as the higher-fidelity visual/motion source than the compressed JPG sequence currently in `TEVEAL/`.
