@echo off
REM Email Fraud Detector - One-Click Launcher (Batch)
REM This batch file launches the PowerShell version for better control

setlocal EnableDelayedExpansion

title Email Fraud Detector - Launcher

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     EMAIL FRAUD DETECTOR - ONE-CLICK LAUNCHER           ║
echo ║              Launching PowerShell Script...             ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%run_all.ps1"

REM Check if PowerShell script exists
if not exist "%PS_SCRIPT%" (
    echo [ERROR] run_all.ps1 not found!
    pause
    exit /b 1
)

REM Launch PowerShell with the script
REM ExecutionPolicy Bypass allows running the script without group policy restrictions
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%"

REM If user closes PowerShell, exit gracefully
exit /b
