# Current Repository State — GitHub Verified

## Current production

```text
Repository: chri75252/my-live-website
Default branch: main
Current main commit: 65cdf3c34ad6fc87837bee9969b1d382cf3bb762
Commit message: Reveal-matched live armillary: lacquer, bronze and mobile handoff (#12)
```

## Merged PRs controlling the current experience

### PR #11 — reveal

```text
PR: https://github.com/chri75252/my-live-website/pull/11
Title: Add audited 32-frame Forge Gate reveal above the approved homepage
Merged: yes
Merge commit: 2b56fe29e3e5d4a059c0bbfa025243c77f6b49ce
Feature head: 7459cd37c5f660a48564e370613fe99307b2a7e1
```

PR #11 added the current 32-frame reveal architecture.

### PR #12 — persistent live hero

```text
PR: https://github.com/chri75252/my-live-website/pull/12
Title: Reveal-matched live armillary: lacquer, bronze and mobile handoff
Merged: yes
Merge commit/current main: 65cdf3c34ad6fc87837bee9969b1d382cf3bb762
Feature head: 7a154eea46fe0c810f08e22e120772ab732e44a2
```

PR #12 activated the current live Three.js armillary and its responsive/evidence layer.

## Current `index.html` integration

Current production loads:

```html
<script type="importmap" id="tbm-three-importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"
  }
}
</script>
<link rel="stylesheet" href="css/site-v2.css">
<link rel="stylesheet" href="css/hero-scroll.css">
<link rel="stylesheet" href="css/hero-reveal-match-v2.css">
<link rel="stylesheet" href="css/forge-intro.css">
```

The page loads scripts in this order near the end:

```html
<script type="module" src="js/forge-intro.js"></script>
<script type="module" src="js/home-v2.js"></script>
<script type="module" src="js/hero-3d-reveal-match-v2.js"></script>
```

## Current key blob SHAs on `main`

```text
index.html                         1c4bc59fc6f676dccd10a7f43c204a6e560e4c21
js/forge-frame-sequence.js        a1b195d27e091aa28f0f2b2bcc05c212f4b813b7
js/forge-intro.js                 2329e52efcb7fd9c2ecc2c0821cd39a6bd001095
css/forge-intro.css               44aff9d3e4f201fcb40ce403202426872633b0e5
js/hero-3d-reveal-match-v2.js     384755d3e1f08366ba74208b94bd90a5c0d769d5
css/hero-reveal-match-v2.css      278d637db515d41b815907780b61c379f80cdf79
js/hero-3d.js                     8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b
```

The original user-preferred baseline files remain present as rollback/history references:

```text
css/hero-scroll.css  82070a5ead77c7d7926beb486553b8a657f872ed
js/hero-3d.js        8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b
js/home-v2.js        89b4ad5aa06cf425d71789c1917106c439ebe594
css/site-v2.css      730c2a3abf3e850a155287264d7107a37a4975a7
```

## Current reveal implementation

`js/forge-frame-sequence.js` currently uses:

```text
frameCount: 32
initialBatchSize: 10
backgroundConcurrency: 4
firstFrameTimeoutMs: 5500
mobileBreakpoint: 700
2D canvas: alpha false, desynchronized true
```

Production assets:

```text
assets/forge-reveal/desktop/frame_0001.webp … frame_0032.webp
assets/forge-reveal/mobile/frame_0001.webp … frame_0032.webp
```

Current source audit:

```text
TEVEAL/ezgif-frame-001.jpg … ezgif-frame-048.jpg
selected clean range: 001–032
first contaminated/synthetic-homepage frame: 033
excluded: 033–048
```

`js/forge-intro.js` currently maps:

```text
sequence completes: progress / 0.82
final-clean hold: approximately 0.82–0.84
DOM handoff: smooth(0.84, 1.0, progress)
desktop scroll travel: max(1.08 × viewport height, 820px)
mobile scroll travel: max(0.92 × viewport height, 640px)
```

## Current live hero implementation

`js/hero-3d-reveal-match-v2.js` currently uses:

```text
Three.js 0.180.0
PerspectiveCamera FOV: 30
Camera Z: 11.55 → 11.35
Core radius: 0.88
Outer ring radius: 2.20
Shell radius: 1.22
Core/outer ratio: 0.40
Five ring structures
Desktop dust: 180
Mobile dust: 95
Desktop embers: 18
Mobile embers: 9
Desktop DPR cap: 1.5
Mobile DPR cap: 1.25
```

Core material currently:

```text
color: 0x06090a
metalness: 0.12
roughness: 0.25
clearcoat: 1.0
clearcoatRoughness: 0.20
envMapIntensity: 0.94
```

The hero uses a continuous `requestAnimationFrame` loop, optional `EffectComposer`, ScrollTrigger and an IntersectionObserver.
