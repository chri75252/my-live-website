param(
  [string]$Repo = (Get-Location).Path,
  [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
Set-Location $Repo

if (Get-Command py -ErrorAction SilentlyContinue) {
  Write-Host "Serving http://localhost:$Port/ using Python launcher" -ForegroundColor Green
  py -m http.server $Port
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  Write-Host "Serving http://localhost:$Port/ using Python" -ForegroundColor Green
  python -m http.server $Port
} else {
  throw 'Python was not found. Use another static HTTP server; do not open index.html directly from file://.'
}
