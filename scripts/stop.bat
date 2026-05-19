@echo off
chcp 65001 >nul 2>&1
title Cost Dashboard - Stop

echo ============================================
echo    Stopping Cost Dashboard
echo ============================================
echo.

if "%PORT%"=="" set "PORT=3113"
set /a STOP_PORT=%PORT%+1

set "FOUND=0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo [INFO] Found process on port %PORT%, PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel%==0 (
        echo [INFO] Process %%a terminated successfully.
        set "FOUND=1"
    ) else (
        echo [WARNING] Failed to terminate process %%a. Try running as administrator.
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%STOP_PORT% " ^| findstr "LISTENING"') do (
    echo [INFO] Found process on port %STOP_PORT%, PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel%==0 (
        echo [INFO] Process %%a terminated successfully.
        set "FOUND=1"
    ) else (
        echo [WARNING] Failed to terminate process %%a. Try running as administrator.
    )
)

if "%FOUND%"=="0" (
    echo [INFO] No process found on port %PORT% or %STOP_PORT%.
)

echo.
echo Done.
pause
