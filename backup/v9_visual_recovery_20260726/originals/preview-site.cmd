@echo off
setlocal
cd /d "%~dp0"
start "" "http://127.0.0.1:4173/index.html"
py -m http.server 4173 --bind 127.0.0.1
if errorlevel 1 (
  echo.
  echo The TBM preview server could not start.
  pause
)
