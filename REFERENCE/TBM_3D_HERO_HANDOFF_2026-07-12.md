# The Blacksmith Market — 3D Hero / Forge Reveal Handoff Report

**Prepared:** 12 July 2026  
**Repository:** `chri75252/my-live-website`  
**Live site:** `https://www.theblacksmithmarket.com/`  
**Primary restore target:** commit `e234618f8dcc8283b69368b73f5b4537d228d0cb`  
**Restore reason:** This is the exact repository state immediately before PR #5 and is the closest match to the user-approved older visual shown in `reference_1_desired_pre_pr5.png`.

---

## 1. Executive decision

The live homepage hero must be restored from the exact pre-PR5 Git blobs. It must **not** be recreated from memory, reinterpreted, or rebuilt with a new shader/material stack.

The approved immediate action is:

1. Restore the pre-PR5 homepage structure and 3D implementation exactly.
2. Remove the later Forge Gate runtime from the live page.
3. Keep the rest of the site and secondary-page Premium V2 work intact.
4. Do not attempt another reveal animation until the restored baseline is visually confirmed by the user.
5. Any future reveal must be implemented as a separate intro layer that hands off to the untouched baseline hero.

This report exists because multiple later attempts described as “restores” were actually new recreations. Those recreations materially changed the globe, rings, nodes, lighting, scale, framing, and scroll behaviour.

---

## 2. Exact user requirements accumulated during the project

### 2.1 Overall website quality

- The website must look like a premium custom agency build rather than a template.
- The desired visual level was repeatedly described as a “$10,000 website”.
- UI must be creative, animated, eye-catching, but still implementable in HTML/CSS/JavaScript.
- GitHub Pages compatibility must be preserved.
- The UI must remain consistent across secondary pages.
- The actual TBM logo must be used in the header.
- The logo must not be pasted into the middle of the 3D scene.

### 2.2 Final hero composition — baseline visual

The immediate required hero is the older pre-PR5 version represented by:

- `reference_1_desired_pre_pr5.png`
- Git commit `e234618f8dcc8283b69368b73f5b4537d228d0cb`
- `js/hero-3d.js` blob `8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b`
- `css/hero-scroll.css` blob `82070a5ead77c7d7926beb486553b8a657f872ed`

Important characteristics of that baseline:

- Large black metallic globe.
- Bronze/gold geometric wireframe.
- Five elegant rings with strong but controlled warm highlights.
- Eighteen small orbital nodes in the original implementation.
- Subtle particles.
- Three-part metallic pedestal under the armillary.
- Four dark floating information cards.
- Continuous ambient movement.
- Pointer interaction/parallax.
- Scroll-controlled additive assembly/camera/card movement.
- No centre logo badge.
- Actual logo in the site header.

The current instruction is to restore this exact version first. Do not combine it with later “fewer nodes”, shader-glint, comet, halo, bloom, or Forge Gate experiments during the restore.

### 2.3 Reveal animation — future requirement, not part of the restore

The user’s intended reveal was misunderstood several times.

The desired interaction is:

1. A distinct full-screen introductory visual starts before the normal homepage.
2. Scrolling advances a cinematic reveal.
3. By the end of the reveal, the normal homepage is exposed.
4. The restored baseline 3D armillary remains on the right side of the homepage.
5. Normal document scrolling begins immediately after the reveal.
6. The normal homepage itself must not remain pinned while only the 3D object changes.

Reference behaviour: `https://www.swansonreservecapital.com/`

The future reveal must be storyboarded and visually approved before implementation.

---

## 3. Exact restore manifest

These files are restored from commit `e234618f8dcc8283b69368b73f5b4537d228d0cb`:

| Path | Exact Git blob |
|---|---|
| `index.html` | `2d61fadc8a55124f32dd75dc599eb69b21244498` |
| `css/hero-scroll.css` | `82070a5ead77c7d7926beb486553b8a657f872ed` |
| `js/hero-3d.js` | `8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b` |
| `js/home-v2.js` | `89b4ad5aa06cf425d71789c1917106c439ebe594` |

`css/site-v2.css` does not need restoration because its current blob already matches the pre-PR5 blob:

`730c2a3abf3e850a155287264d7107a37a4975a7`

The following later Forge Gate files should be removed because they did not exist at the restore point and can confuse future work:

- `css/forge-gate.css`
- `js/forge-gate.js`
- `js/forge-scene.js`
- `scripts/validate-forge-gate.mjs`
- `.github/workflows/validate-forge-gate.yml`

---

## 4. Implementation chronology

## PR #1 — Premium homepage, 3D hero and shared V2 UI

**Result:** Successful foundation.

Introduced:

- Premium black/gold homepage.
- Procedural Three.js armillary.
- Pointer parallax.
- Visibility pausing.
- Reduced-motion support.
- CSS fallback.
- Shared Premium V2 UI system.

This created the correct architectural and visual base.

## PR #2 — Secondary-page completion

**Result:** Successful and should remain.

Added consistent styling for:

- Product category pages.
- About and partnership pages.
- Testimonial layouts.
- Blog/article layouts.
- Contact, FAQ, and legal pages.
- Responsive behaviour.

It was scoped away from `body.home-v2`, so it did not need to alter the homepage hero.

## PR #3 — Scroll animation and actual header logo

**Partly successful.**

Successful:

- Removed the flat centre logo from the scene.
- Added the actual TBM header mark.
- Replaced the non-working renderer path with `requestAnimationFrame`.
- Restored visible WebGL movement.

Problem introduced:

- The normal homepage hero was pinned during the scroll sequence.
- This later became a source of user confusion because the whole page appeared frozen.

## PR #4 — Immediate visible motion and larger composition

**Visually the closest successful state.**

Successful:

- Movement began immediately.
- Pause no longer forced a different reveal state.
- Full-size composition appeared from the first frame.
- Rings, core, wireframe, nodes, particles, and lights moved independently.
- This produced the user-preferred older state.

The resulting repository state immediately before PR #5 is commit:

`e234618f8dcc8283b69368b73f5b4537d228d0cb`

## PR #5 — Camera fitting, comets, bloom, node pulses

**Failed visually.**

Added:

- Geometry-aware camera fitting.
- Smaller centred stage.
- Faster movement.
- Three forge comets.
- Trails.
- Node pulse wave.
- Bloom.
- Scroll-velocity acceleration.

What went wrong:

- The object was zoomed out too far.
- The heavier post-processing and extra objects made the design look tacky.
- Visible comet balls and trails competed with the globe.
- New pedestal/base treatments were disliked.
- Scroll velocity made motion appear erratic or nearly invisible between frames.
- Too many changes were introduced simultaneously, making it difficult to isolate defects.

Critical lesson:

> Do not combine framing, new geometry, new lights, bloom, material changes, node changes, and scroll-speed changes in one PR.

## PR #6 — Forge Gate reveal

**Failed structurally and visually.**

Attempted:

- Full-screen intro.
- Sticky scrollytelling.
- New procedural scene.
- Reduced node count.
- Surface reflections.
- Separate scene orchestration.

What went wrong:

- The final hero was rebuilt rather than handed off to the approved hero.
- The user saw a different globe and ring system after the reveal.
- The reveal was not reliably visible.
- The normal homepage experience did not match the requested reference.
- The new scene became the dominant implementation instead of an intro layer.

## PR #7 — Forge Gate correction

**Failed to recover the target visual.**

Attempted:

- Remove persistent skip state.
- Remove `RoomEnvironment` chrome reflections.
- Add black-metal shader.
- Add exactly three shader reflections.
- Darken the rings.
- Add replay control.

What went wrong:

- The shader-generated result did not match the old approved physical-material scene.
- The globe and rings still looked like a new design.
- Fixing technical causes did not restore the visual baseline.

## PR #8 — “Restore” direct hero

**Failed because it was another recreation, not a revert.**

Attempted:

- Park the reveal.
- Show the hero directly.
- Rebuild a glossy globe.
- Use five rings, six nodes, and three glints.

What went wrong:

- It did not restore the exact old blobs.
- It changed the number of nodes.
- It replaced the old materials and lighting with new code.
- It retained the new scene architecture.
- The result remained visibly different from the screenshot the user identified as correct.

Critical lesson:

> When a known-good Git commit exists, restore that commit’s files. Do not write a “similar” replacement.

---

## 5. Root causes of repeated failure

### 5.1 Visual recreation was treated as equivalent to restoration

It is not equivalent. Exact restoration must use original Git blobs.

### 5.2 No browser screenshot gate before merge

Syntax validation and CI passed, but those checks cannot determine whether the design is attractive or matches the user’s screenshot.

Future rule:

- No hero PR is merged until a screenshot or short recording of the branch is reviewed by the user.

### 5.3 Too many variables changed per iteration

Material, geometry, camera, scale, lighting, post-processing, particle count, node count, and motion were repeatedly changed together.

Future rule:

- One visual hypothesis per branch.

### 5.4 The reveal and final hero were coupled

The reveal experiments replaced or mutated the final hero. The correct architecture is a separate intro layer that hands off to an untouched final hero.

### 5.5 “Passed checks” was overstated as visual success

CI proves syntax and guardrails only. It does not prove:

- visual fidelity;
- good motion;
- correct framing;
- acceptable materials;
- browser rendering quality.

### 5.6 Scroll velocity was used as an animation multiplier

Wheel velocity can spike sharply and cause perceived strobing, skipped rotations, or objects appearing to return to nearly the same position.

Future rule:

- Scroll controls deterministic timeline progress only.
- Ambient motion remains time-based.
- Do not multiply ring/orb rotation by `ScrollTrigger.getVelocity()`.

---

## 6. Required next steps after restoration

### Phase 0 — Confirm the restored baseline

Do not start reveal work until the user confirms:

- Globe appearance matches Reference A.
- Ring thickness/material/brightness match.
- Scale and framing match.
- Node count and behaviour match.
- Cards and stage composition match.
- Pointer interaction works.
- Ambient motion works.
- Pause/resume works.

Required screenshots:

- 1920 × 1080 desktop.
- 1680 × 900 desktop.
- 1366 × 768 laptop.
- One mobile screenshot.

### Phase 1 — Freeze the hero baseline

Create a tag or branch:

`baseline/pre-pr5-approved-hero`

Do not modify the following files on reveal branches:

- `js/hero-3d.js`
- `css/hero-scroll.css`

The future reveal must reference the final hero, not rewrite it.

### Phase 2 — Storyboard the reveal before coding

Generate and approve 4–6 frames:

1. Intro black screen / forge contour.
2. Metal fragments form a gate.
3. Gate opens or camera moves through it.
4. Homepage becomes visible behind the gate.
5. Final handoff to the unchanged homepage hero.
6. Normal scrolling resumes.

The frames must include exact viewport composition and content visibility.

### Phase 3 — Implement reveal as a separate layer

Recommended file structure:

```text
index.html
css/hero-scroll.css          # approved final hero — untouched
js/hero-3d.js                # approved final hero — untouched

css/forge-intro.css          # new intro layer only
js/forge-intro.js            # scroll timeline only
js/forge-intro-scene.js      # optional separate intro scene
```

Recommended DOM structure:

```html
<section class="forge-intro" aria-label="The Blacksmith Market introduction">
  <canvas id="forge-intro-canvas" aria-hidden="true"></canvas>
  <div class="forge-intro-copy">
    <p>Premium wholesale partnerships</p>
    <strong>Scroll to forge</strong>
  </div>
  <button type="button" id="skip-forge-intro">Skip intro</button>
</section>

<section class="hero hero-scroll-sequence" id="top">
  <!-- Exact pre-PR5 hero markup -->
</section>
```

The normal hero must remain in ordinary page flow.

### Phase 4 — Deterministic reveal timeline

Do not use scroll velocity.

Example:

```js
const intro = document.querySelector('.forge-intro');

function readProgress() {
  const rect = intro.getBoundingClientRect();
  const distance = Math.max(1, intro.offsetHeight - window.innerHeight);
  return Math.min(1, Math.max(0, -rect.top / distance));
}

function renderIntro(progress) {
  // The same progress must always produce the same frame.
  introScene.setProgress(progress);
}
```

The intro can use a sticky viewport:

```css
.forge-intro {
  height: 220svh;
}

.forge-intro__sticky {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: hidden;
}
```

Only the intro is sticky. The normal homepage hero must not be pinned.

### Phase 5 — Handoff without mutating the hero

At the end of the intro:

```js
const handoff = smoothstep(0.82, 1, progress);

introCanvas.style.opacity = String(1 - handoff);
homepageHero.style.opacity = String(handoff);
homepageHero.style.transform =
  `translateY(${(1 - handoff) * 24}px)`;
```

The final hero’s Three.js scene must start in its normal approved state.

### Phase 6 — User review before merge

Before merge, provide:

- Branch URL.
- Screenshot or video of intro.
- Screenshot of final hero.
- Exact file list.
- Confirmation that `js/hero-3d.js` and `css/hero-scroll.css` match the approved baseline blobs.

---

## 7. Guardrails for future AI/LLM work

The next model must follow these rules:

1. Read this report first.
2. Use `reference_1_desired_pre_pr5.png` as the primary visual reference.
3. Treat commit `e234618...` as the source of truth.
4. Do not modify the approved hero while building the reveal.
5. Do not merge without visual review.
6. Never claim “confirmed visually” unless an actual deployed/branch screenshot was inspected.
7. Do not add:
   - comet balls;
   - comet trails;
   - yellow Fresnel shells;
   - broad bloom;
   - external moving point-light balls;
   - thick pedestal rings;
   - scroll-velocity acceleration;
   - replacement globe shaders.
8. Do not reduce or change node count unless the user explicitly approves a separate visual.
9. Do not substitute a new scene for a Git restoration.
10. Keep every experiment on a feature branch with a backup branch.

---

## 8. Recommended validation script

A future baseline validation script should assert:

```js
const index = read('index.html');
const hero = read('js/hero-3d.js');
const css = read('css/hero-scroll.css');

assert(index.includes('css/hero-scroll.css'));
assert(index.includes('js/hero-3d.js'));
assert(!index.includes('forge-gate.css'));
assert(!index.includes('forge-gate.js'));

assert(hero.includes("SphereGeometry(1.08, 64, 64)"));
assert(hero.includes("[2.28, 0.014, 0.48, 1.38, 0.82, 0.10]"));
assert(hero.includes("for (let index = 0; index < 18; index += 1)"));
assert(hero.includes("CylinderGeometry(top, bottom, height, 96)"));

assert(!hero.includes('createForgeComet'));
assert(!hero.includes('UnrealBloomPass'));
assert(!hero.includes('RoomEnvironment'));
```

This does not prove visual quality. It only prevents accidental architecture drift.

---

## 9. Git and rollback instructions

### Restore branch

```powershell
git fetch origin
git checkout -b restore/exact-pre-pr5-hero origin/main

git checkout e234618f8dcc8283b69368b73f5b4537d228d0cb -- `
  index.html `
  css/hero-scroll.css `
  js/hero-3d.js `
  js/home-v2.js

git rm -f `
  css/forge-gate.css `
  js/forge-gate.js `
  js/forge-scene.js `
  scripts/validate-forge-gate.mjs `
  .github/workflows/validate-forge-gate.yml

git commit -m "Restore exact pre-PR5 homepage hero baseline"
git push -u origin restore/exact-pre-pr5-hero
```

### Rollback if required

Backup branch:

`backup/pre-exact-pre-pr5-restore-2026-07-12`

Or revert the restore merge commit:

```powershell
git revert -m 1 <RESTORE_MERGE_COMMIT>
git push origin main
```

---

## 10. Files and references in this handoff

- `TBM_3D_HERO_HANDOFF_2026-07-12.md` — this report.
- `FRESH_CHAT_CONTINUATION_PROMPT.md` — ready prompt for a new conversation.
- `baseline_manifest.json` — exact blobs and commits.
- `reference_1_desired_pre_pr5.png` — primary target.
- `reference_2_current_incorrect.png` — state to avoid.
- `reference_3_chat_context.png` — conversation context.
- `tbm_3d_handoff_reference_sheet.png` — labelled comparison sheet.

---

## 11. Local Codex ChatGPT Bridge placement

This chat does not have access to the local Codex ChatGPT Bridge filesystem. The repository package should be copied into the local TBM folder after download.

Suggested location:

```text
C:\Users\chris\Chatgpt-bridge\TBM website\handoff\2026-07-12\
```

PowerShell:

```powershell
$src = "$env:USERPROFILE\Downloads\tbm_3d_handoff"
$dst = "$env:USERPROFILE\Chatgpt-bridge\TBM website\handoff\2026-07-12"

New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$src\*" $dst -Recurse -Force
```

The same files are also stored in the GitHub repository under:

```text
docs/tbm-3d-handoff/
```

---

## 12. Final instruction to the next implementer

First verify that the live homepage matches `reference_1_desired_pre_pr5.png`.

If it does not match, stop reveal work and fix the restoration only.

After the baseline is approved, implement the reveal on a separate branch and keep the approved hero files byte-identical. The reveal should end by exposing the existing hero, not by replacing it.
