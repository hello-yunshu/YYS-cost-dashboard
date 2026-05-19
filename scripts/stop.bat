@echo off
chcp 65001 >nul 2>&1
title MTC Cost Dashboard - Stop

echo ============================================
echo    Stopping MTC Cost Dashboard
echo ============================================
echo.

set "FOUND=0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3113 " ^| findstr "LISTENING"') do (
    echo [INFO] Found process on port 3113, PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel%==0 (
        echo [INFO] Process %%a terminated successfully.
        set "FOUND=1"
    ) else (
        echo [WARNING] Failed to terminate process %%a. Try running as administrator.
    )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3114 " ^| findstr "LISTENING"') do (
    echo [INFO] Found process on port 3114, PID: %%a
    taskkill /F /PID %%a >nul 2>&1
    if %errorlevel%==0 (
        echo [INFO] Process %%a terminated successfully.
        set "FOUND=1"
    ) else (
        echo [WARNING] Failed to terminate process %%a. Try running as administrator.
    )
)

if "%FOUND%"=="0" (
    echo [INFO] No process found on port 3113 or 3114.
)

echo.
echo Done.
pause
