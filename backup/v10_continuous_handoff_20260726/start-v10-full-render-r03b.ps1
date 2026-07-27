$ErrorActionPreference = 'Stop'
$renderRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location -LiteralPath $renderRoot
$log = Join-Path $PSScriptRoot 'v10-full-render-r03b.log'
$err = Join-Path $PSScriptRoot 'v10-full-render-r03b.err.log'
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python 'blender/reference-match-v10/scripts/build_reference_match_v10.py' -- --render all 1> $log 2> $err
exit $LASTEXITCODE
