@echo off
setlocal
cd /d "%~dp0.."
if not exist package.json (
  echo Copy this scripts folder into the generated admin project first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Dependencies are missing. Run pnpm.cmd install --frozen-lockfile first.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:5176 after Vite starts.
call pnpm.cmd run dev
endlocal

