@echo off
chcp 65001 >nul 2>&1
title Cost Dashboard

setlocal enabledelayedexpansion

echo ============================================
echo    Cost Dashboard
echo ============================================
echo.

netstat -ano | findstr ":3113 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [ERROR] Port 3113 is already in use. Please stop the existing process first.
    echo         Run stop.bat to stop the running instance.
    pause
    exit /b 1
)

netstat -ano | findstr ":3114 " | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [WARNING] Port 3114 is in use.
)

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%app"
set "DATA_DIR=%SCRIPT_DIR%data"
set "UPLOADS_DIR=%SCRIPT_DIR%uploads"
set "NODE_DIR=%SCRIPT_DIR%node\win-x64"

if not exist "%NODE_DIR%\node.exe" (
    echo [ERROR] Node.js runtime not found at: %NODE_DIR%\node.exe
    echo         Please run build-portable.js first to download Node.js.
    pause
    exit /b 1
)

if not exist "%APP_DIR%\server.bundle.js" (
    echo [ERROR] Application file not found: %APP_DIR%\server.bundle.js
    echo         Please run build-portable.js first.
    pause
    exit /b 1
)

if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%UPLOADS_DIR%" mkdir "%UPLOADS_DIR%"

set DB_MODE=sqljs
set DB_PATH=%DATA_DIR%\cost_dashboard.db
set UPLOADS_DIR=%UPLOADS_DIR%
set NODE_ENV=production
set PORT=3113

echo.
echo [INFO] Starting Cost Dashboard...
echo [INFO] DB Mode: %DB_MODE%
echo [INFO] DB Path: %DB_PATH%
echo [INFO] Uploads: %UPLOADS_DIR%
echo [INFO] Port: %PORT%
echo.
echo [INFO] Open your browser and visit: http://localhost:%PORT%
echo [INFO] Press Ctrl+C to stop the server.
echo.

"%NODE_DIR%\node.exe" "%APP_DIR%\server.bundle.js"

pause
