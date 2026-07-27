# Fresh Agent Prompt — TBM Final Reveal + Persistent Hero Recovery

Work only from the **GitHub repository**. Do **not** use Codex Bridge, local machine paths, or any external local folders. Retrieve all required files directly from the repository.

## Project
Repository: `https://github.com/chri75252/my-live-website`

## Goal
Complete the TBM homepage work correctly by fixing the two remaining problem areas together:

1. **Persistent homepage Three.js armillary / globe component**
   - It must visually match the reveal target as closely as possible.
   - This is the primary focus.

2. **Forge reveal smoothness and reveal-to-homepage handoff**
   - It must be smoother and cleaner than the current regressed state.
   - Do not degrade the existing reveal sequence merely because the persistent hero is being improved.

## Before changing anything
### 1. Inspect repository files and history
Inspect the current implementation files, the current PR(s), and the `REFERENCE` folder.

Mandatory actions:
- inspect `index.html`, relevant JS/CSS files, and existing workflows,
- inspect the `REFERENCE` folder recursively,
- inspect current PR #11 and PR #12 or their successor branches if still open,
- inspect the reveal asset folder(s), including the user-provided reveal video and any extracted frames.

### 2. Use the reveal video as the higher-fidelity source of truth
The previously extracted JPG frames appear compressed. Use the **video** for primary appearance/motion analysis where needed.

### 3. Read and apply the right skill sections
Use the following skills/resources selectively and intelligently:
- 3D Web Experience
- Three.js WebGL
- Three.js Geometry
- Three.js Materials
- Three.js Textures
- Three.js Lighting
- Three.js Post-Processing
- Three.js Animation
- Premium 3D Website
- GSAP ScrollTrigger (if needed)
- the repository’s video-to-website skill file

Do **not** blindly copy every pattern. Extract the relevant sections and apply them to the current vanilla Three.js + reveal architecture.

## Problems to solve
### A. Persistent homepage component is still wrong
Current issues include:
- too simple / not close enough to the reveal object,
- wrong silhouette / proportions,
- ring system not matched well enough,
- weak or incorrect cage/network treatment,
- sphere reflections/highlights not convincing enough,
- node/orb placement not correct enough,
- overall feel not premium enough.

### B. Reveal/handoff regressed
Current issues include:
- scrolling feels less smooth than before,
- possible frame skipping or poor synchronisation,
- reveal-to-homepage transition is weaker than earlier versions,
- final handoff frame is less clean.

## Better characteristics from earlier states that you must preserve/recover
There were earlier states that, while still imperfect, had some better characteristics. You must identify and preserve/recover those better traits where useful.

Recover/keep:
- smoother reveal scrubbing and cleaner reveal-to-homepage handoff,
- fuller/larger armillary occupancy within the hero zone,
- better component size/proportion,
- cleaner and more premium ring composition,
- more convincing surface highlight / moving-light feel on the sphere,
- stronger premium/cinematic overall impression.

Avoid reintroducing:
- oversaturated red/orange cheap-looking rings,
- overly simplified component,
- weak sphere material,
- messy or tacky geometry,
- laggy or inconsistent reveal behavior.

## Concrete target for the persistent hero component
The persistent homepage component should match the reveal object as closely as possible.

Target characteristics:
- glossy near-black central sphere,
- approximately three dominant intersecting bronze/copper rings,
- restrained outer circular/spherical cage,
- subtle irregular wire network,
- small metallic nodes placed sparingly,
- cinematic studio lighting,
- muted bronze/copper metal tone rather than loud emissive orange,
- realistic environment reflections,
- restrained post-processing,
- elegant premium motion.

## Concrete target for the reveal/handoff
- smooth scroll-linked reveal progression,
- no obvious frame skipping,
- clean synchronisation between scroll distance and reveal progression,
- final reveal frame landing cleanly before homepage exposure,
- smoother handoff to the homepage than the current state,
- the persistent hero should feel like the settled continuation of the reveal object.

## Implementation constraints
- Keep the architecture in the existing repo unless there is a very strong reason to change it.
- Do not rewrite to another 3D framework.
- Preserve reduced-motion support.
- Keep performance reasonable on desktop and mobile.
- Do not bloat the repo with unnecessary artifacts.

## Required process
1. Audit the current implementation and identify the exact regressions.
2. Compare current output against the reveal video and best earlier states.
3. Produce the minimal but sufficient implementation changes to:
   - improve the persistent component toward the reveal target,
   - fix the reveal smoothness/handoff regressions.
4. Validate visually and technically.
5. Leave the work in a clean PR state with evidence.

## Required deliverables
- updated implementation in a branch/PR,
- concise report of what was changed and why,
- evidence/screenshots showing:
  - reveal progression,
  - final reveal-to-homepage handoff,
  - persistent hero on desktop and mobile,
  - side-by-side comparison against target reveal imagery,
- explicit note of any remaining limitations.

## Final acceptance gate
Do not call the task complete unless:
1. the persistent hero is materially closer to the reveal target,
2. the reveal/handoff is smoother than the current regressed state,
3. the result looks more premium and coherent overall,
4. the branch/PR is ready for review and possible squash-merge.
