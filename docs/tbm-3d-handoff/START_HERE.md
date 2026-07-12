# START HERE — TBM 3D Hero and Full-Screen Reveal

This handoff continues work on `chri75252/my-live-website` after the exact pre-PR5 homepage hero was restored.

## Source of truth

- Approved hero commit: `e234618f8dcc8283b69368b73f5b4537d228d0cb`
- Restore merge: `0eac81fbda1a7c54855efef7c9604683bba17291`
- Primary visual reference: `reference_1_desired_pre_pr5.png` in the downloadable package
- Full history and failure analysis: `TBM_3D_HERO_HANDOFF_2026-07-12.md`

## Intended next action

The next implementer must:

1. Verify that the current checkout still contains the exact approved hero blobs.
2. Review PRs #3–#9 and the failure analysis before writing code.
3. Create an isolated worktree and feature branch.
4. Implement a separate full-screen Forge Gate intro layer that reveals the existing hero underneath.
5. Keep the approved hero files byte-identical.
6. Test and capture the branch visually at desktop and mobile sizes.
7. Stop before merge and present the branch and visual evidence to the user.

Use `FRESH_CHAT_CONTINUATION_PROMPT.md` as the fresh-chat implementation prompt.
