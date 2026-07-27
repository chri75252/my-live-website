# START HERE

## What you are being asked to do
You must continue the TBM homepage work from the existing GitHub repository state and bring it to a final reviewable condition.

Your job is **not** only to "make something work". Your job is to:
1. inspect the repo and the current PR state,
2. identify what was already done correctly,
3. identify what regressed,
4. preserve the good parts,
5. fix the reveal/handoff smoothness,
6. rebuild or tune the persistent homepage 3D armillary so it matches the reveal target as closely as possible,
7. leave the work in a clean reviewable PR state with proof.

## Primary priorities
### Priority 1 — persistent homepage 3D component
The persistent armillary/globe on the homepage is the main visual problem. It must be brought much closer to the reveal target.

### Priority 2 — reveal smoothness and handoff
The reveal was previously functioning in a more acceptable way. In the latest state, the reveal scroll/handoff appears more laggy / less smooth and the final handoff frame is less clean. That must be corrected.

## Non-negotiables
- Use **GitHub repo only**.
- Inspect the `REFERENCE` folder and any existing reveal/hero docs committed in the repo.
- Inspect the current PRs/branches relevant to PR #11 and PR #12.
- Preserve the strongest earlier behavior where it was better.
- Do not keep degraded visuals just because they pass CI.
- Produce a clean PR with evidence.

## Output expectation
At the end, there should be one clean implementation path the user can review and then squash-merge.
