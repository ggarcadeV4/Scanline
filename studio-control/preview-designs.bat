@echo off
title Arcade Studio - Design Preview
echo.
echo  ============================================
echo   ARCADE STUDIO - Stitch Design Preview v1
echo  ============================================
echo.
echo  Opening all design screens in your browser...
echo.

start "" "%~dp0web\dashboard-stitch-v1.html"
timeout /t 1 /nobreak >nul

start "" "%~dp0web\assets-stitch-v1.html"
timeout /t 1 /nobreak >nul

start "" "%~dp0web\teleprompter-stitch-v1.html"
timeout /t 1 /nobreak >nul

start "" "%~dp0web\sync-stitch-v1.html"
timeout /t 1 /nobreak >nul

start "" "%~dp0web\settings-stitch-v1.html"
timeout /t 1 /nobreak >nul

start "" "%~dp0web\chat-stitch-v1.html"

echo.
echo  6 screens opened:
echo    1. Dashboard
echo    2. Asset Management
echo    3. Teleprompter
echo    4. Sync Flash
echo    5. Settings
echo    6. Chat (deferred)
echo.
echo  Press any key to close this window.
pause >nul
