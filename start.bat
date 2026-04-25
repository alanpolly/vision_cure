@echo off
title VisionCure — Starting Servers
color 0A

echo.
echo  =====================================================
echo     VisionCure — Starting Development Servers
echo  =====================================================
echo.

REM ── Check API keys in .env ──────────────────────────
set ENV_FILE=%~dp0server\.env

echo  [CHECK] Verifying API keys in server\.env ...
echo.

if not exist "%ENV_FILE%" (
  echo  [ERROR] server\.env file NOT FOUND!
  echo          Please create it with your API keys before starting.
  echo.
  pause
  exit /b 1
)

REM Check each required key
set MISSING=0

findstr /i "GEMINI_API_KEY" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 ( echo  [MISSING]  GEMINI_API_KEY & set MISSING=1 ) else ( echo  [OK]       GEMINI_API_KEY )

findstr /i "GROQ_API_KEY" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 ( echo  [MISSING]  GROQ_API_KEY & set MISSING=1 ) else ( echo  [OK]       GROQ_API_KEY )

findstr /i "ELEVENLABS_API_KEY" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 ( echo  [MISSING]  ELEVENLABS_API_KEY & set MISSING=1 ) else ( echo  [OK]       ELEVENLABS_API_KEY )

findstr /i "MONGODB_URI" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 ( echo  [MISSING]  MONGODB_URI & set MISSING=1 ) else ( echo  [OK]       MONGODB_URI )

findstr /i "JWT_SECRET" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 ( echo  [MISSING]  JWT_SECRET & set MISSING=1 ) else ( echo  [OK]       JWT_SECRET )

findstr /i "TELEGRAM_BOT_TOKEN" "%ENV_FILE%" >nul 2>&1
if errorlevel 1 ( echo  [WARNING]  TELEGRAM_BOT_TOKEN ^(optional^) ) else ( echo  [OK]       TELEGRAM_BOT_TOKEN )

echo.

if "%MISSING%"=="1" (
  echo  [ERROR] One or more required API keys are missing from server\.env
  echo          Please add them and try again.
  echo.
  pause
  exit /b 1
)

echo  [OK] All required keys found!
echo.
echo  =====================================================
echo.

REM ── Start Backend ────────────────────────────────────
echo  [1/2] Starting Backend Server ^(port 3001^)...
start "VisionCure Backend" cmd /k "cd /d %~dp0server && npm run dev"

REM Brief pause so backend gets a head start
timeout /t 2 /nobreak >nul

REM ── Start Frontend ───────────────────────────────────
echo  [2/2] Starting Frontend Server ^(port 5173^)...
start "VisionCure Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo  =====================================================
echo     Both servers are starting in separate windows!
echo.
echo     Backend  →  http://localhost:3001
echo     Frontend →  https://localhost:5173
echo  =====================================================
echo.

REM Open the app in the default browser after a short wait
timeout /t 4 /nobreak >nul
start "" "https://localhost:5173"

exit
