# Handoff scripts

Run from PowerShell in the TBM repository or pass `-Repo` explicitly.

- `verify_exact_pre_pr5.ps1` — confirms the approved hero files by Git blob hash.
- `restore_exact_pre_pr5.ps1` — restores the exact approved files from commit `e234618...`.
- `create_reveal_worktree.ps1` — creates an isolated reveal branch and worktree.
- `verify_reveal_did_not_modify_baseline.ps1` — protects the final hero from reveal experiments.
- `serve_local_preview.ps1` — runs a static local server.
- `collect_handoff_diagnostics.ps1` — produces a concise repository diagnostic report.
