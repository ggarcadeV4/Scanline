@echo off
REM ===========================================================================
REM  Studio Control - launcher
REM  Launch order matters: OBS must be up WITH obs-websocket listening BEFORE
REM  the app connects. We start OBS first, give it a moment, then start the
REM  server. The server itself also retries the websocket (see server/index.js),
REM  so this delay is a courtesy, not the safety net.
REM ===========================================================================

REM --- 1. Edit these two paths for your machine ---------------------------------
set "OBS_DIR=C:\Program Files\obs-studio\bin\64bit"
set "OBS_EXE=obs64.exe"
REM -----------------------------------------------------------------------------

echo [Studio Control] Starting OBS...
REM OBS insists on being launched from its own bin dir, hence the /d push.
start "" /d "%OBS_DIR%" "%OBS_EXE%" --startreplaybuffer

echo [Studio Control] Waiting for OBS to come up...
REM Give OBS a head start so obs-websocket is listening. The server's retry
REM loop handles the rest if this isn't quite long enough.
timeout /t 6 /nobreak >nul

echo [Studio Control] Starting control app...
REM Run from this script's own folder regardless of where it was invoked.
cd /d "%~dp0"
node server\index.js

REM If the server exits, keep the window open so you can read any error.
echo.
echo [Studio Control] Server exited. Press any key to close.
pause >nul
