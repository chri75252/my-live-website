param(
  [string]$Repo = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

$baseline = [ordered]@{
  'css/hero-scroll.css' = '82070a5ead77c7d7926beb486553b8a657f872ed'
  'js/hero-3d.js'       = '8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b'
}

$failed = $false
foreach ($path in $baseline.Keys) {
  $actual = (git hash-object -- $path).Trim()
  if ($actual -ne $baseline[$path]) {
    Write-Host "PROTECTED FILE CHANGED: $path" -ForegroundColor Red
    Write-Host "expected $($baseline[$path])"
    Write-Host "actual   $actual"
    $failed = $true
  } else {
    Write-Host "PROTECTED OK: $path" -ForegroundColor Green
  }
}

$forbidden = @(
  'getVelocity(',
  'UnrealBloomPass',
  'RoomEnvironment',
  'createForgeComet',
  'sessionStorage.setItem'
)

$searchFiles = @('index.html','css/forge-intro.css','js/forge-intro.js','js/forge-intro-scene.js') |
  Where-Object { Test-Path $_ }
foreach ($term in $forbidden) {
  foreach ($file in $searchFiles) {
    if (Select-String -Path $file -SimpleMatch $term -Quiet) {
      Write-Host "FORBIDDEN TERM '$term' in $file" -ForegroundColor Red
      $failed = $true
    }
  }
}

if ($failed) { throw 'Reveal branch violates baseline or architecture guardrails.' }
Write-Host 'Reveal branch guardrails passed.' -ForegroundColor Green
