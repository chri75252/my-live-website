param(
  [string]$Repo = (Resolve-Path "$PSScriptRoot\..\..").Path,
  [switch]$Commit
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

$sourceCommit = 'e234618f8dcc8283b69368b73f5b4537d228d0cb'
$paths = @(
  'index.html',
  'css/hero-scroll.css',
  'js/hero-3d.js',
  'js/home-v2.js'
)

if ((git status --porcelain).Length -gt 0) {
  throw 'Working tree is not clean. Commit or stash current work before restoring.'
}

git fetch origin
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed.' }

git restore --source=$sourceCommit -- $paths
if ($LASTEXITCODE -ne 0) { throw 'git restore failed.' }

$obsolete = @(
  'css/forge-gate.css',
  'js/forge-gate.js',
  'js/forge-scene.js',
  'scripts/validate-forge-gate.mjs',
  '.github/workflows/validate-forge-gate.yml'
)
foreach ($path in $obsolete) {
  if (Test-Path $path) { git rm -f -- $path | Out-Null }
}

& "$PSScriptRoot\verify_exact_pre_pr5.ps1" -Repo $Repo

if ($Commit) {
  git add -- $paths
  git commit -m 'Restore exact pre-PR5 homepage hero baseline'
}

Write-Host 'Exact approved baseline restored. Review git diff before pushing.' -ForegroundColor Yellow
