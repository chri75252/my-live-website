# TBM Reveal + Persistent 3D Hero — Corrective Recovery Plan

**Prepared:** 2026-07-24  
**Repository:** `C:\idrive -carlo\Cloud-Drive_carloboul57@gmail.com\Cloud-Drive\Full\TBM\my-live-website`  
**Current branch:** `codex/final-forge-hero-recovery-v3`  
**Current HEAD:** `65cdf3c34ad6fc87837bee9969b1d382cf3bb762`  
**Existing rollback ref:** `backup/pre-final-forge-hero-recovery-20260724`  
**Status:** diagnosis and corrective plan only; no corrective production patch has been applied  

## 1. Outcome

The current V3 implementation must not be refined in place as the final hero. It contains two independent failures:

1. The user's actual `file://` preview intentionally deletes the reveal and cannot reliably load the ES-module Three.js hero. The object shown there is the simplified CSS fallback, not the intended WebGL sculpture.
2. The intended V3 WebGL sculpture is also visually inferior when the site is served correctly over HTTP: it is oversized, cropped, too dark, flatter than V2, and does not match the reveal's final pose or framing.

The recovery should therefore:

- make proper local HTTP previewing a one-click operation;
- stop silently deleting the reveal in direct-file mode;
- return the live hero to the visually stronger V2 rendering foundation;
- keep the technically improved 64-frame reveal runtime and assets;
- build a new V4 from V2, with lifecycle support added surgically;
- replace the current full-screen-to-right-column opacity crossfade with a spatial handoff;
- require visual-match evidence before motion or interaction is accepted.

## 2. Evidence reviewed

### Current user evidence

- `C:\Users\chris\AppData\Local\Temp\codex-clipboard-8b2a174e-e964-4db9-8261-8ddc7533f16f.png`
  - Address bar shows a local disk path.
  - Reveal remains on “Preparing the forge” because its module/manifest pipeline cannot complete reliably under `file://`.
- `C:\Users\chris\AppData\Local\Temp\codex-clipboard-702f4e7d-d3e0-4078-9645-48a055d6c486.png`
  - Address bar again shows a local disk path.
  - Reveal is absent.
  - Small black sphere and thin symmetric rings match the CSS `.armillary-fallback`, not the intended V3 WebGL output.

### Current code evidence

- `index.html:33-36` detects `file://`.
- `index.html:163-169` removes `#forge-intro` and releases the homepage under `file://`.
- `css/forge-intro.css:157-162` hides the reveal and restores interaction under that same mode.
- `js/forge-frame-sequence.js:63` loads the frame manifest using `fetch()`, which requires an HTTP-style origin for dependable behavior.
- `index.html:175` loads `js/hero-3d-reveal-match-v3.js` as an ES module.
- V3 imports Three.js using module imports and therefore does not provide a dependable full experience when `index.html` is opened directly from disk.
- `css/hero-reveal-match-v3.css:22-23` deliberately reduces the fallback to a dark core and one-pixel rings. That is the weak object visible in the current user screenshot.

### Correct HTTP runtime evidence

- `artifacts/final-forge-v3/final-capture/diagnostics.json`
  - 64/64 frames load.
  - Requested and rendered frame indices match.
  - No post-ready fallback is used.
  - Lifecycle transitions reach `suspended`, `prewarming`, `handoff-ready`, and `active`.
- `artifacts/final-forge-v3/final-capture/desktop-1366x768-active.png`
  - V3 is severely oversized and cropped.
  - Ring weight, geometry, lighting and composition diverge from the source.
  - Floating cards compete with and overlap the object.
- `artifacts/final-forge-v3/final-capture/desktop-1366x768-handoff.png`
  - The transition simultaneously shows two differently positioned, scaled and posed sculptures.
  - The current crossfade is therefore not a seamless continuation.

### V2 versus V3 rendering evidence

V2:

- camera FOV `30`, camera Z `11.55`;
- AgX tone mapping;
- generated studio environment/reflections;
- physical materials;
- `EffectComposer`, subtle bloom, SMAA and output pass.

V3:

- camera FOV `31`, camera Z `6.25`;
- outer rings remain approximately the same world-space scale;
- direct ACES rendering;
- no equivalent environment/composer stack;
- simplified lighting/material treatment.

The camera-distance change alone makes the V3 sculpture dramatically larger. Dropping the V2 environment and restrained post-processing also explains much of the darker, flatter appearance.

### Source-frame issue

`assets/forge-reveal/desktop/frame_0064.webp` is the last frame before the underlying homepage begins to contaminate the video, but it still contains a small generator/star mark at the lower right. It is “last clean” only in the narrow homepage-contamination sense. It is not an unqualified clean master.

## 3. Root causes

### RC-1 — unsupported preview mode was treated as the user's normal preview

The implementation was validated over HTTP, while the user continued opening `index.html` directly. The emergency fail-open patch fixed the scroll trap by deleting the reveal, but that directly contradicted the expected experience.

### RC-2 — the fallback was allowed to represent the finished design

When WebGL cannot initialise, the current CSS fallback is visually too weak to be an acceptable hero. Its purpose should be graceful degradation, not a substitute for the approved composition.

### RC-3 — V3 discarded the strongest parts of V2

V3 changed camera distance, tone mapping, reflections, lighting, materials and post-processing at once. That was not surgical. It removed proven visual quality while adding geometry.

### RC-4 — state correctness was mistaken for visual correctness

The automated checks proved frame loading and lifecycle behavior. They did not measure silhouette, centre, scale, core/ring ratio, lighting, pose or overlap.

### RC-5 — the handoff model is geometrically impossible as implemented

The final reveal frame is a full-viewport video composition. The persistent hero is rendered only inside the right-side hero stage. Fading one over the other cannot make them appear to be the same object unless scale, position, crop and pose are first reconciled.

### RC-6 — mobile lifecycle is reported but not visually exercised

The current diagnostics report `active` on mobile while `stageVisible` and `rendering` remain false. This may be an intentional mobile simplification, but it is not yet an accepted visual design and must not be counted as a successful mobile 3D handoff.

## 4. What remains usable

The following work should be retained unless later evidence disproves it:

- source MP4 audit: 1280×720, 24 fps, 240 frames;
- homepage-contamination boundary: source frame 159 last uncontaminated, frame 160 first contaminated;
- 64-frame desktop/mobile inventory and manifest;
- one reveal scheduler;
- exact post-ready frame drawing;
- no dynamic canvas blur in the scroll hot path;
- reveal lifecycle event vocabulary;
- reverse-scroll suspension behavior;
- reduced-motion and manifest-failure fail-open logic;
- existing V2 hero JS/CSS as the quality and rollback baseline.

## 5. Minimum required correction

The next implementation pass is successful only if it produces all of the following:

1. Double-clickable local preview that opens an HTTP URL.
2. Direct-file mode no longer silently deletes a feature and pretends the result is the full experience.
3. The reveal runs and scrolls under the supported preview.
4. The persistent hero is at least as polished and well framed as V2.
5. The final reveal object moves into the hero-stage rectangle before WebGL replaces it.
6. The WebGL object matches the handoff image in scale, centre and pose at swap time.
7. No giant crop, double-object frame, card collision or unexpected fallback is visible.
8. Desktop and mobile behavior are separately defined and verified.

## 6. Explicit non-goals

- no approved homepage copy changes;
- no secondary-page changes;
- no redesign of navigation, sections or footer;
- no additional large 3D sculpture;
- no new framework;
- no refactor of unrelated homepage code;
- no deployment, merge or publication during the corrective implementation pass;
- no claim that the generator/star-marked final frame is an approved clean master without user acceptance.

## 7. Corrective implementation phases

### Phase 0 — preserve the failed V3 state

Before any correction:

- create `backup/reveal-hero-corrective-recovery_20260724/`;
- copy every file that will be edited before editing it;
- create `backup/reveal-hero-corrective-recovery_20260724/REVERT_TRACKING.md`;
- record current SHA-256 values;
- capture the current direct-file fallback and current HTTP V3 at the target viewports;
- label the existing V3 tracker's “Complete” statuses as technically validated but visually rejected, without erasing its history.

Planned tracker columns:

| File | Original SHA-256 | Backup path | Correction scope | Validation | Status |
|---|---|---|---|---|---|
| `index.html` | measured before edit | matching backup path | preview guidance, V2 recovery, handoff proxy | DOM and visual | pending |
| `css/forge-intro.css` | measured before edit | matching backup path | remove silent direct-file deletion styling; spatial handoff | visual | pending |
| `js/forge-intro.js` | measured before edit | matching backup path | spatial handoff controller | syntax, state, visual | pending |
| `js/hero-3d-reveal-match-v4.js` | new | n/a | V2-derived hero plus lifecycle | syntax, static overlay, runtime | pending |
| `css/hero-reveal-match-v4.css` | new | n/a | V2-derived calibrated presentation | responsive visual | pending |
| `preview-site.cmd` | new | n/a | supported one-click preview | launch/stop test | pending |
| visual verification scripts | measured/new | matching backup path | match gates | executable evidence | pending |

### Phase 1 — establish a supported one-click preview

Add `preview-site.cmd` at repository root. It should:

- change to its own directory;
- start `http://127.0.0.1:4173/index.html`;
- run `py -m http.server 4173 --bind 127.0.0.1`;
- keep the console open so its process owner and stop action are obvious;
- stop when that console is closed or interrupted.

Planned script:

```bat
@echo off
setlocal
cd /d "%~dp0"
start "" "http://127.0.0.1:4173/index.html"
py -m http.server 4173 --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo The TBM preview server could not start.
  pause
)
```

The browser may open just before the server is ready. If testing confirms that race is visible, use a small PowerShell readiness loop in the launcher rather than creating a persistent hidden process.

Direct-file behavior should become an explicit operational notice, not a silent feature deletion. Proposed behavior:

- do not initialise the reveal or 3D;
- keep the homepage usable;
- visibly state that this disk-opened view is a limited preview;
- direct the user to double-click `preview-site.cmd`;
- offer `http://127.0.0.1:4173/index.html` only as a second action.

The exact notice wording is new operational copy and must be approved before implementation. Existing approved marketing wording remains untouched.

### Phase 2 — restore the V2 visual baseline without discarding reveal improvements

Temporarily restore the active hero references from V3 to V2:

```diff
--- a/index.html
+++ b/index.html
@@
-  <link rel="stylesheet" href="css/hero-reveal-match-v3.css">
+  <link rel="stylesheet" href="css/hero-reveal-match-v2.css">
@@
-<script type="module" src="js/hero-3d-reveal-match-v3.js"></script>
+<script type="module" src="js/hero-3d-reveal-match-v2.js"></script>
```

This is a recovery baseline, not the final handoff. Retain:

- the 64-frame manifest;
- current reveal scheduler;
- current clean-cutoff mapping;
- lifecycle publishing in `forge-intro.js`.

Acceptance for this phase:

- supported HTTP preview reveals and releases correctly;
- hero looks like the prior V2 baseline;
- no V3 giant crop;
- no regression to the old 32-frame runtime;
- direct-file mode clearly identifies itself as limited.

### Phase 3 — create V4 from V2, not V3

Create:

- `js/hero-3d-reveal-match-v4.js` by copying the verified V2 implementation;
- `css/hero-reveal-match-v4.css` by copying the verified V2 presentation.

Preserve initially:

- camera FOV and distance;
- AgX tone mapping;
- studio environment;
- physical materials;
- composer;
- subtle bloom;
- SMAA/output pass;
- V2 renderer-quality and low-power branching.

Add only the required V3-era lifecycle contract:

- `suspended`;
- `prewarming`;
- `handoff-ready`;
- `active`;
- `offscreen`.

V4 must not add motion until its static handoff pose passes the visual-match gates.

### Phase 4 — calibrate a static V4 against the final reveal frame

Use `frame_0064.webp` as the provisional visual reference while separately tracking the lower-right source mark issue.

Calibration order:

1. camera distance and object scale;
2. object centre;
3. outer-ring silhouette;
4. core-to-outer-ring ratio;
5. ring Euler angles;
6. node/network density;
7. material brightness and bronze warmth;
8. background and highlight balance.

Do not tune cards, pointer motion or ambient rotation during this phase.

Required generated evidence:

- final reveal frame;
- V4 static frame;
- 50/50 overlay;
- absolute-difference image;
- silhouette masks and measured bounding boxes.

Initial acceptance tolerances at the swap pose:

- sculpture centre differs by no more than 2% of hero-stage width/height;
- outer silhouette width and height differ by no more than 5%;
- core-to-outer-ring diameter ratio differs by no more than 4 percentage points;
- no principal ring has an obviously opposite tilt in the 50/50 overlay;
- no clipping at 1920×1080, 1680×900 or 1366×768;
- user-visible static comparison is approved before motion work starts.

### Phase 5 — replace opacity-only handoff with a spatial handoff

Add a dedicated handoff proxy that displays the exact final reveal frame.

Required sequence:

1. Scroll-driven reveal reaches and holds production frame 64.
2. Homepage begins to appear beneath it.
3. A proxy of frame 64 starts at the reveal's exact viewport rectangle.
4. The proxy's rectangle, crop and scale interpolate toward `#hero-stage`.
5. V4 prewarms behind the proxy at the calibrated static pose.
6. Only after the proxy reaches the stage rectangle does a short proxy-to-WebGL opacity swap occur.
7. WebGL remains motionless for a short settle interval.
8. Ambient and pointer motion are then enabled.

The geometry must be calculated from actual DOM rectangles, not hard-coded screen coordinates:

```js
const viewportRect = {
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight
};
const targetRect = document.getElementById('hero-stage').getBoundingClientRect();
```

The controller should expose the current source rectangle, target rectangle, interpolation progress and swap state in the existing diagnostics object.

An opacity crossfade is allowed only for the final proxy-to-WebGL swap after spatial matching. It is not the primary transition.

### Phase 6 — reintroduce restrained motion and interaction

Only after static continuity passes:

- resume V2-style slow ambient rotation;
- add restrained pointer response;
- keep maximum pointer displacement small enough that the sculpture never collides with the stage edge or cards;
- ensure pause freezes the current pose rather than resetting;
- suspend rendering when offscreen;
- preserve reduced-motion behavior.

The floating cards should remain hidden until the object has settled. Their positions must be checked against the final sculpture silhouette at each desktop viewport.

### Phase 7 — define mobile intentionally

Choose and verify one explicit mobile behavior:

- a performant V4 WebGL hero with simplified post-processing; or
- a polished static/video-derived continuation that does not pretend WebGL is active.

The current state—lifecycle `active` while the stage remains invisible and not rendering—must not pass automatically.

Mobile acceptance:

- no invisible “successful” hero state;
- no scroll trap;
- no crop that hides the sculpture's identifying silhouette;
- reduced-motion path remains usable;
- no unsupported direct-file behavior is mistaken for mobile degradation.

### Phase 8 — objective verification and user review

Required viewports:

- 1920×1080;
- 1680×900;
- 1366×768;
- 390×844;
- 430×932.

Required runtime matrix:

| Runtime | Expected result |
|---|---|
| HTTP, normal motion | complete reveal, spatial handoff, persistent hero |
| HTTP, reverse scroll | deterministic reverse reveal and lifecycle |
| HTTP, reduced motion | usable polished bypass/settled state |
| HTTP, forced manifest failure | fail open without trapping interaction |
| HTTP, forced WebGL failure | deliberate polished fallback |
| Direct file | explicit limited-preview guidance; no fake “full” result |

Required browser evidence:

- headed Chrome on the user's actual machine;
- screenshots at opening, mid-reveal, final-frame hold, spatial midpoint, swap, settled hero and reverse;
- short screen recording of normal and reverse scroll;
- console and network error capture;
- lifecycle and frame-index diagnostics;
- overlay/difference artifacts.

The headed Chrome CDP endpoint `127.0.0.1:9223` was unavailable during this planning pass. Headed-browser acceptance therefore remains unverified and mandatory during implementation.

## 8. Planned file scope

### Minimum required edits/new files

- `index.html`
- `css/forge-intro.css`
- `js/forge-intro.js`
- `js/hero-3d-reveal-match-v4.js` — new, V2-derived
- `css/hero-reveal-match-v4.css` — new, V2-derived
- `preview-site.cmd` — new
- `scripts/capture-reveal-match-v4.mjs` — new or V3 capture copied and corrected
- `scripts/verify-reveal-match-v4.py` — new or V3 verifier copied and corrected
- `backup/reveal-hero-corrective-recovery_20260724/REVERT_TRACKING.md` — new

### Retained unless a test proves a defect

- `js/forge-frame-sequence.js`
- `assets/forge-reveal/desktop/frame_0001.webp..frame_0064.webp`
- `assets/forge-reveal/mobile/frame_0001.webp..frame_0064.webp`
- `assets/forge-reveal/frame-manifest.json`
- `scripts/build-forge-frame-assets.py`

### Historical/rollback files not to overwrite

- `js/hero-3d-reveal-match-v2.js`
- `css/hero-reveal-match-v2.css`
- `js/hero-3d-reveal-match-v3.js`
- `css/hero-reveal-match-v3.css`
- existing backup directory and tracker

## 9. Exact edit order

1. Capture Git status and hashes.
2. Create the new backup directory and tracker.
3. Back up each target before its first edit.
4. Add and validate the one-click HTTP launcher.
5. Replace silent direct-file deletion with limited-preview guidance.
6. Restore active V2 references as the recovery baseline.
7. Validate the 64-frame reveal plus V2 over HTTP.
8. Copy V2 to isolated V4 files.
9. Add lifecycle support to V4.
10. Freeze all V4 motion.
11. Calibrate the static V4 swap pose.
12. Generate and inspect overlay/difference evidence.
13. Implement the spatial handoff proxy.
14. Validate forward and reverse handoff.
15. Reintroduce restrained motion.
16. Resolve card timing/collisions.
17. Implement and validate the chosen mobile behavior.
18. Run the full runtime/viewports matrix.
19. Re-read every edited section and run syntax checks.
20. Update every tracker row with evidence and status.
21. Stop for user visual review before merge or deployment.

## 10. Validation commands

Minimum executable checks:

```powershell
node --check js/forge-intro.js
node --check js/forge-frame-sequence.js
node --check js/hero-3d-reveal-match-v4.js
node --check scripts/capture-reveal-match-v4.mjs
python -m py_compile scripts/verify-reveal-match-v4.py
node scripts/validate-forge-frame-sequence.mjs
python scripts/verify-reveal-match-v4.py
```

Preview:

```powershell
.\preview-site.cmd
```

Visual capture:

```powershell
node scripts/capture-reveal-match-v4.mjs
```

Final source checks:

```powershell
git diff --check
git status --short
```

Every non-trivial JS edit requires `node --check`. Every changed section requires readback. Visual acceptance must use the generated images and recordings, not lifecycle JSON alone.

## 11. Rollback

There are two rollback levels:

### Corrective-pass rollback

- restore each edited file from `backup/reveal-hero-corrective-recovery_20260724/`;
- remove only the V4/launcher/verification files listed as new in its tracker;
- rerun the current V3 validators to confirm the failed-but-preserved state is restored.

### Full V3 rollback

- use `backup/pre-final-forge-hero-recovery-20260724`;
- restore reveal assets and modified files from `backup/final-forge-hero-recovery_20260724/`;
- retain user-supplied untracked handoff/video files;
- run the original V2 validations.

No broad `git reset`, destructive clean, or removal of user untracked files is permitted.

## 12. Decision required before final implementation approval

The source frame used at the handoff contains the lower-right generator/star mark. Before the final visual pass, choose one:

1. accept that source frame as supplied;
2. provide a clean source render/video;
3. approve an alternate last frame/crop only after seeing its effect on composition.

This does not block restoring the preview workflow or V2 visual baseline. It does block calling the final reveal master fully approved.

## 13. Final acceptance gate

Do not call the recovery complete unless:

- the user launches the supported preview successfully;
- reveal motion works in the user's headed browser;
- direct-file mode clearly states its limitation;
- the persistent object is not the weak CSS fallback during the supported experience;
- V4 is at least as polished as V2;
- no giant crop or double-object handoff remains;
- spatial handoff reaches the measured hero-stage rectangle;
- static pose/scale match passes the stated tolerances and user review;
- mobile behavior is real and intentional;
- approved marketing copy is unchanged;
- all affected files have backups and completed tracker rows;
- all edited files have been re-read and executable checks pass.
