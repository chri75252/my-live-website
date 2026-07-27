# Skill and Resource Matrix

Use the following as a **selective skill stack**. Do not blindly paste or follow every line of every skill. Extract only what is relevant to the current vanilla Three.js + reveal pipeline.

## Mandatory high-level orchestration
### 1. 3D Web Experience
Use as the high-level orchestration guide.
- Source: `https://github.com/davila7/claude-code-templates/blob/main/cli-tool/components/skills/creative-design/3d-web-experience/SKILL.md`
- Use for: choosing the correct Three.js approach, scroll-controlled 3D, performance considerations, implementation strategy.
- Constraint: keep the current **vanilla Three.js** implementation. Do not rewrite to React Three Fiber or Spline.

## Mandatory technical references
### 2. Three.js WebGL
- Source: `https://github.com/freshtechbro/claudedesignskills/blob/main/.claude/skills/threejs-webgl/SKILL.md`
- Use for: renderer config, colour space, scene organisation, physical materials, lighting baseline, GLTF loading patterns if needed, post-processing integration, performance/resource management.

### 3. Three.js Geometry
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-geometry/SKILL.md`
- Use for: reconstructing the ring silhouette, outer cage, internal wire network, nodes, procedural geometry approaches.

### 4. Three.js Materials
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-materials/SKILL.md`
- Use for: glossy black sphere, muted bronze rings, clearcoat, roughness/metalness tuning, physically plausible specular response.

### 5. Three.js Textures
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-textures/SKILL.md`
- Use for: environment mapping, correct colour spaces, reflection sharpness, map handling, texture filtering.

### 6. Three.js Lighting
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-lighting/SKILL.md`
- Use for: cinematic studio lighting, restrained warm rim light, dark ambient mood, highlight placement, avoiding oversaturated point-light clutter.

### 7. Three.js Post-Processing
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-postprocessing/SKILL.md`
- Use for: restrained bloom, subtle grading, vignette/grain/SSAO only if they genuinely help. Keep it restrained.

### 8. Three.js Animation
- Source: `https://github.com/CloudAI-X/threejs-skills/blob/main/skills/threejs-animation/SKILL.md`
- Use for: frame-rate-independent motion, damping, subtle oscillation, independent ring axes, reduced-motion behavior.

### 9. Premium 3D Website
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/premium-3d-website/SKILL.md`
- Use for: performance budgets, device optimisation, pixel-ratio limits, premium quality gates.

## Optional / use only if needed
### 10. Three.js Shaders
- Source: `https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/threejs-shaders/SKILL.md`
- Use only if built-in material + lighting + post-processing cannot achieve the target.

### 11. GSAP ScrollTrigger
- Source: `https://github.com/freshtechbro/claudedesignskills/blob/main/.claude/skills/gsap-scrolltrigger/SKILL.md`
- Use only where needed for reveal scrubbing / handoff / pinning refinement.

### 12. Video to Website skill
- Source: repository skill file already discussed / committed in the repo (inspect the relevant `skills/video to website/skill.md` or equivalent path if present).
- Use for: converting the reveal video into the correct website motion pipeline, choosing the right frame range, interpreting motion/handoff behavior, and avoiding bad usage of low-quality extracted JPGs.

## Other inspiration resources previously discussed
Use selectively for implementation ideas or component treatment, not as blind copy sources:
- `https://www.getsmoothie.ai/`
- `https://particles.casberry.in/`
- `https://horizonx.so/explore/personal`
- `https://astrodither.robertborghesi.is/`
- `https://string-tune.fiddle.digital/`
- `https://framer.university/resources`
- `https://www.framer.com/community/marketplace/components/`
