@echo off
setlocal
title Operation Thunderbolt - Game Server
cd /d "%~dp0"
if errorlevel 1 exit /b 1

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required. Install it, then double-click this file again.
  pause
  exit /b 1
)
node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)"
if errorlevel 1 (
  echo Please update Node.js to version 20 or newer.
  pause
  exit /b 1
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo npm is missing. Reinstall Node.js, then try again.
  pause
  exit /b 1
)
if not defined PORT set "PORT=8083"

rem Reuse a running copy of this game instead of starting a second server.
powershell.exe -NoProfile -Command "$url = 'http://127.0.0.1:' + $env:PORT; try { $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if ($r.Content -match 'Operation Thunderbolt' -and $r.Content -match 'Isometric battlefield') { Start-Process $url; exit 0 } } catch {}; exit 1"
if not errorlevel 1 exit /b 0

echo Starting Operation Thunderbolt. Your browser will open when it is ready.
echo Keep this window open while playing. Close it or press Ctrl+C to stop.
rem Wait for startup before opening the browser; the watcher exits after 30 attempts.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "$url = 'http://127.0.0.1:' + $env:PORT; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if ($r.Content -match 'Operation Thunderbolt' -and $r.Content -match 'Isometric battlefield') { Start-Process $url; exit } } catch {}; Start-Sleep -Milliseconds 500 }"
call npm.cmd start
if errorlevel 1 (
  echo.
  echo The game server could not start. Check the error above or QUICKSTART.md.
  pause
)
