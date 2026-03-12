@echo off
setlocal enabledelayedexpansion
color 0A
title ChatApp - Full Startup Script

echo ========================================
echo ChatApp - Starting from Scratch
echo ========================================
echo.

:: Kill any existing Node processes
echo [1/6] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM ChatApp.exe >nul 2>&1
timeout /t 2 >nul

:: Navigate to project root
cd /d "%~dp0"

:: Check if .env exists in server
if not exist "server\.env" (
    echo [2/6] Creating server .env file...
    (
        echo # Server environment variables
        echo JWT_SECRET=dev_secret_key_change_in_production_12345
        echo CLIENT_ORIGIN=http://localhost:3000
        echo PORT=5000
    ) > "server\.env"
    echo .env file created successfully!
) else (
    echo [2/6] Server .env file already exists
)

:: Install server dependencies
echo.
echo [3/6] Installing server dependencies...
cd server
if not exist "node_modules" (
    echo Installing server packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies
        pause
        exit /b 1
    )
) else (
    echo Server dependencies already installed
)

:: Install client dependencies
echo.
echo [4/6] Installing client dependencies...
cd ..\client
if not exist "node_modules" (
    echo Installing client packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install client dependencies
        pause
        exit /b 1
    )
) else (
    echo Client dependencies already installed
)

:: Start server in new window
echo.
echo [5/6] Starting server on port 5000...
cd ..\server
start "ChatApp Server" cmd /k "npm start"
timeout /t 5 >nul

:: Start client in browser
echo.
echo [6/6] Starting client on port 3000...
cd ..\client
start "ChatApp Client" cmd /k "npm start"

echo.
echo ========================================
echo ChatApp is starting!
echo ========================================
echo.
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Two windows will open:
echo 1. Server window (backend)
echo 2. Client window (frontend - browser will auto-open)
echo.
echo Press any key to exit this window...
pause >nul
