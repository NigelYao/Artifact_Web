@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22.13 or newer is required.
  pause
  exit /b 1
)
if not exist node_modules\@colyseus\core (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm start
pause
