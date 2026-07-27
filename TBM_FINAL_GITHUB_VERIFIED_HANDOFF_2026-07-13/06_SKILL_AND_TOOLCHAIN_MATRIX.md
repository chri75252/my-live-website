# Skill and Toolchain Matrix

Read each skill directly from its exact GitHub URL. Use the guidance selectively; do not rewrite the site into another framework.

## Mandatory skills

### 3D Web Experience — orchestration

`https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/skills/creative-design/3d-web-experience/SKILL.md`

Use for approach selection, scroll-driven 3D architecture, asset pipeline and performance planning. Retain vanilla Three.js.

### Three.js WebGL — technical baseline

`https://github.com/freshtechbro/claudedesignskills/blob/main/.claude/skills/threejs-webgl/SKILL.md`

Use for renderer, colour space, scene lifecycle, physical materials, resource reuse, resizing and disposal.

### Three.js Geometry

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-geometry/SKILL.md`

Use for TorusGeometry, TubeGeometry, Icosahedron/BufferGeometry, custom ring paths, wire network and node instancing.

### Three.js Materials

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-materials/SKILL.md`

Use for black lacquer, bronze PBR, clearcoat, roughness, metalness, anisotropy and environment response.

### Three.js Textures

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-textures/SKILL.md`

Use for environment maps, colour spaces, filtering, roughness/normal data and compressed texture strategy.

### Three.js Lighting

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-lighting/SKILL.md`

Use for broad studio lighting, controlled reflections, cool fill and restrained warm rim.

### Three.js Post-Processing

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-postprocessing/SKILL.md`

Use only after static match. Keep effects selective and budgeted.

### Three.js Animation

`https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-animation/SKILL.md`

Use for delta-time motion, damping, independent axes, pausing and reduced-motion behavior.

### Premium 3D Website

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/premium-3d-website/SKILL.md`

Use as the visual/performance quality gate.

### GSAP ScrollTrigger

`https://github.com/freshtechbro/claudedesignskills/blob/main/.claude/skills/gsap-scrolltrigger/SKILL.md`

Use only for deterministic scroll integration and handoff coordination. Avoid nested/competing scroll controllers.

### Repository video-to-website skill

Retrieve from current repo:

`skills/video to website/skill.md`

Use relevant sections for video analysis, extraction, responsive canvas, preloading, scroll mapping and testing. Do not apply generic full-site rebuild instructions, mandatory Lenis, giant 800vh layouts, counters or marquees.

## Optional skill

### Three.js Shaders

`https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-shaders/SKILL.md`

Use only if the source-video black-lacquer/glint response cannot be matched with built-in materials and a controlled environment. PR #7 provides a concrete historical shader technique to evaluate.

## Required production tools

### Video and image analysis

- `ffprobe`
- `ffmpeg`
- Pillow, Sharp or ImageMagick for deterministic contact sheets and production encoding
- hash manifests for source/production assets

### Runtime/profile tools

- Chrome DevTools Performance and Rendering panels
- Playwright Chromium for deterministic screenshots/recordings
- real Chrome/Edge hardware test
- at least one physical or emulated mobile touch/scroll test

### Code validation

Reuse/extend current repo scripts:

- `scripts/audit-forge-frames.py`
- `scripts/build-forge-frame-assets.py`
- `scripts/capture-forge-intro.mjs`
- `scripts/validate-forge-frame-sequence.mjs`
- `scripts/capture-reveal-match-v2.mjs`
- `scripts/verify-reveal-match-v2.py`
- `scripts/build-reveal-match-contact-sheets.py`

### Baseline/diagnostic helpers

Read `REFERENCE/scripts/README.md` and use:

- `REFERENCE/scripts/verify_exact_pre_pr5.ps1`
- `REFERENCE/scripts/restore_exact_pre_pr5.ps1`
- `REFERENCE/scripts/create_reveal_worktree.ps1`
- `REFERENCE/scripts/verify_reveal_did_not_modify_baseline.ps1`
- `REFERENCE/scripts/serve_local_preview.ps1`
- `REFERENCE/scripts/collect_handoff_diagnostics.ps1`

## Optional authored-model escalation

Do not start with Blender/GLTF. Procedural geometry is likely sufficient. Consider a small authored GLTF only if repeated procedural attempts cannot reproduce the source silhouette and the runtime/performance cost is justified.

Do not use Spline or React Three Fiber for this task.
