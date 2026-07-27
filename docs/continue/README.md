# TBM Final Handoff Pack — Reveal + Persistent Hero Recovery

This pack is for a fresh agent/harness run against the **GitHub repository only**.

## Purpose
Bring the TBM homepage back onto the correct track by fixing **both**:
1. the **persistent homepage 3D armillary component**, and
2. the **Forge reveal / reveal-to-homepage handoff**.

The current state has partial progress but also regressions. The next agent must **not** start from scratch blindly. It must reuse the best parts of prior work, identify regressions, and then implement a corrected final version.

## Files in this pack
- `START_HERE.md` — shortest operational brief.
- `TBM_FINAL_IMPLEMENTATION_PROMPT.md` — full prompt to give the agent.
- `CURRENT_STATE_AND_REGRESSIONS.md` — what is wrong now.
- `PR_HISTORY_AND_KEEP_DROP.md` — what earlier work was better and what must be reused or avoided.
- `VISUAL_TARGET_AND_ACCEPTANCE.md` — exact visual and motion target.
- `SKILL_AND_RESOURCE_MATRIX.md` — which skills/resources to use and why.
- `REPO_FILES_TO_INSPECT.md` — mandatory repository files/folders to inspect.

## Core instruction
Use **only the GitHub repo** and files already committed there. Do **not** rely on Codex Bridge or any local path.

## Important user-provided context to preserve
- The user will provide the **video** used for the reveal. Treat that video as higher fidelity than the previously split JPG frames.
- The `REFERENCE` folder in the repo contains prior prompts/specs/reports/scripts that must be inspected and used selectively.
- The current persistent hero component is still visually off from the reveal target.
- The current reveal/handoff has become less smooth than earlier versions and needs correction.
