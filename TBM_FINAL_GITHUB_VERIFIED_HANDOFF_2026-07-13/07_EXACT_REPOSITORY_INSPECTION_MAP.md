# Exact Repository Inspection Map

Retrieve all project files from `chri75252/my-live-website` using current `main` unless another historical ref is explicitly stated.

## Current production integration

- `index.html`
- `css/site-v2.css`
- `css/hero-scroll.css`
- `css/hero-reveal-match-v2.css`
- `css/forge-intro.css`
- `js/home-v2.js`
- `js/hero-3d.js`
- `js/hero-3d-reveal-match-v2.js`
- `js/forge-intro.js`
- `js/forge-frame-sequence.js`

## Current reveal source and assets

- `TEVEAL/ezgif-frame-001.jpg` through `TEVEAL/ezgif-frame-048.jpg`
- `assets/forge-reveal/desktop/frame_0001.webp` through `frame_0032.webp`
- `assets/forge-reveal/mobile/frame_0001.webp` through `frame_0032.webp`

## Current audit evidence committed by PR #11

- `artifacts/forge-frame-audit/all-48-contact-sheet.jpg`
- `artifacts/forge-frame-audit/selected-range-contact-sheet.jpg`
- `artifacts/forge-frame-audit/frame-manifest.json`
- `artifacts/forge-frame-audit/source-inventory.json`
- `artifacts/forge-frame-audit/performance-report.json`
- `artifacts/forge-frame-audit/workflow-status.json`

## Current build/audit/capture scripts

- `scripts/apply-forge-frame-integration.py`
- `scripts/audit-forge-frames.py`
- `scripts/build-forge-frame-assets.py`
- `scripts/capture-forge-intro.mjs`
- `scripts/validate-forge-frame-sequence.mjs`
- `scripts/build-reveal-match-contact-sheets.py`
- `scripts/capture-reveal-match-v2.mjs`
- `scripts/verify-reveal-match-v2.py`

## Current workflows

- `.github/workflows/forge-intro-visual.yml`
- `.github/workflows/reveal-match-v2-evidence.yml`

## Repository documentation and skills

Recursively inspect:

- `REFERENCE/`
- `docs/tbm-3d-handoff/`
- `skills/`

Verified REFERENCE helper index:

- `REFERENCE/scripts/README.md`

It names:

- `REFERENCE/scripts/verify_exact_pre_pr5.ps1`
- `REFERENCE/scripts/restore_exact_pre_pr5.ps1`
- `REFERENCE/scripts/create_reveal_worktree.ps1`
- `REFERENCE/scripts/verify_reveal_did_not_modify_baseline.ps1`
- `REFERENCE/scripts/serve_local_preview.ps1`
- `REFERENCE/scripts/collect_handoff_diagnostics.ps1`

Do not assume the above list is the complete `REFERENCE/` tree. Recursively enumerate it from GitHub and inspect all relevant reports/templates.

## Historical source retrieval

Retrieve historical files using exact refs:

### PR #7 surface shader

```text
Ref: a4b2632c31329a7f0e35be36435ba06ad9254d61
Path: js/forge-scene.js
```

### PR #8 surface glints and camera fitting

```text
Ref: 16e91af6e2ff2051e2fd76a424ff6f0e372da90b
Path: js/forge-scene.js
```

### Exact pre-PR5 baseline

```text
Ref: e234618f8dcc8283b69368b73f5b4537d228d0cb
Paths:
  index.html
  css/hero-scroll.css
  js/hero-3d.js
  js/home-v2.js
```

### Current PR #12 feature head for pre-squash history

```text
Ref: 7a154eea46fe0c810f08e22e120772ab732e44a2
Paths:
  js/hero-3d-reveal-match-v2.js
  css/hero-reveal-match-v2.css
  scripts/capture-reveal-match-v2.mjs
```

## PR changed-file inventories

PR #11 changed exactly the reveal workflow, seven audit artifacts, 64 production WebP assets, three reveal production files, `index.html`, and five audit/build/capture scripts. Retrieve its full changed-file list through GitHub before modifying reveal scope.

PR #12 changed exactly:

- `.github/workflows/reveal-match-v2-evidence.yml`
- `css/hero-reveal-match-v2.css`
- `index.html`
- `js/hero-3d-reveal-match-v2.js`
- `scripts/build-reveal-match-contact-sheets.py`
- `scripts/capture-reveal-match-v2.mjs`
- `scripts/validate-forge-frame-sequence.mjs`
- `scripts/verify-reveal-match-v2.py`
