param(
  [string]$Repo = (Get-Location).Path,
  [string]$Output = 'tbm-handoff-diagnostics.txt'
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

$lines = @()
$lines += "Generated: $(Get-Date -Format o)"
$lines += "Repo: $Repo"
$lines += "Branch: $((git branch --show-current).Trim())"
$lines += "HEAD: $((git rev-parse HEAD).Trim())"
$lines += ''
$lines += '--- git status ---'
$lines += git status --short --branch
$lines += ''
$lines += '--- protected file hashes ---'
foreach ($path in @('index.html','css/hero-scroll.css','js/hero-3d.js','js/home-v2.js','css/site-v2.css')) {
  if (Test-Path $path) { $lines += "$(git hash-object -- $path)  $path" }
}
$lines += ''
$lines += '--- recent commits ---'
$lines += git log -12 --oneline --decorate

$lines | Set-Content -Path $Output -Encoding UTF8
Write-Host "Wrote $Output" -ForegroundColor Green
