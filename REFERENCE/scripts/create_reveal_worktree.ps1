param(
  [string]$Repo = (Resolve-Path "$PSScriptRoot\..\..").Path,
  [string]$Branch = 'feature/forge-intro-reveal-v2',
  [string]$Worktree = "$env:USERPROFILE\Chatgpt-bridge\TBM-website-forge-intro-v2"
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

if ((git status --porcelain).Length -gt 0) {
  throw 'Main checkout is not clean. Commit or stash changes first.'
}

git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }

if (Test-Path $Worktree) {
  throw "Worktree destination already exists: $Worktree"
}

$branchExists = git show-ref --verify --quiet "refs/heads/$Branch"; $existsCode = $LASTEXITCODE
if ($existsCode -eq 0) {
  git worktree add $Worktree $Branch
} else {
  git worktree add -b $Branch $Worktree origin/main
}
if ($LASTEXITCODE -ne 0) { throw 'git worktree add failed.' }

Write-Host "Worktree created: $Worktree" -ForegroundColor Green
Write-Host "Branch: $Branch" -ForegroundColor Green
