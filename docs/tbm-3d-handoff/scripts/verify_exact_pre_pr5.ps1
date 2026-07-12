param(
  [string]$Repo = (Resolve-Path "$PSScriptRoot\..\..\..").Path
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

$expected = [ordered]@{
  'index.html'          = '2d61fadc8a55124f32dd75dc599eb69b21244498'
  'css/hero-scroll.css' = '82070a5ead77c7d7926beb486553b8a657f872ed'
  'js/hero-3d.js'       = '8aa1390dc9fbb1a4ff06dcf2e796d17601de6f4b'
  'js/home-v2.js'       = '89b4ad5aa06cf425d71789c1917106c439ebe594'
  'css/site-v2.css'     = '730c2a3abf3e850a155287264d7107a37a4975a7'
}

$failed = $false
foreach ($path in $expected.Keys) {
  if (-not (Test-Path $path)) {
    Write-Host "MISSING  $path" -ForegroundColor Red
    $failed = $true
    continue
  }
  $actual = (git hash-object -- $path).Trim()
  if ($actual -eq $expected[$path]) {
    Write-Host "OK       $path  $actual" -ForegroundColor Green
  } else {
    Write-Host "MISMATCH $path" -ForegroundColor Red
    Write-Host "  expected: $($expected[$path])"
    Write-Host "  actual:   $actual"
    $failed = $true
  }
}

if ($failed) {
  throw 'The checkout does not match the exact approved pre-PR5 hero baseline.'
}

Write-Host 'Exact pre-PR5 hero baseline verified.' -ForegroundColor Green
