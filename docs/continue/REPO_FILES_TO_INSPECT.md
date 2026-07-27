# Repository Files and Folders to Inspect

Use **GitHub repo only**. Do not rely on local machine paths.

## Mandatory repository inspection
Inspect the current repository tree and locate all relevant files, especially:

### Current implementation files
- `index.html`
- current hero / homepage scripts
- current reveal scripts
- current relevant CSS files
- current GitHub workflows related to reveal/hero validation

Specifically inspect any of the following if present:
- `js/hero-3d.js`
- `js/forge-intro.js`
- `js/forge-frame-sequence.js`
- `js/home-v2.js`
- `css/hero-scroll.css`
- `css/site-v2.css`

### REFERENCE folder
Recursively inspect the `REFERENCE` folder and use it as a source of prior context. Important likely files include things like:
- `PATCH_SPEC_V2.md`
- `REFERENCE_ANALYSIS.md`
- `SKILL_APPLICATION_MATRIX.md`
- prior handoff prompts / continuation prompts
- scripts in `REFERENCE/scripts/`
- templates in `REFERENCE/templates/`

### Reveal assets
Inspect the repo folder containing the reveal video and/or extracted TEVEAL/REVEAL frames.

The agent must:
- identify the best-quality reveal source,
- prefer the provided video over low-quality compressed JPG extractions where applicable,
- determine the correct usable frame range,
- exclude accidental extra end frames that show the homepage if they are not part of the intended pure reveal sequence.

### PR/branch state
Inspect the relevant PRs/branches, especially:
- PR #11
- PR #12
- any related feature branches for reveal and hero tuning

The goal is to preserve the best earlier logic/behavior while fixing the visual mismatch and regressions.
