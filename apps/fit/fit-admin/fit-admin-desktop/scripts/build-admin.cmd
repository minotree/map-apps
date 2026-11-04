@echo off
setlocal
cd /d "%~dp0.."
set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
call pnpm.cmd run tauri:build
exit /b %errorlevel%

