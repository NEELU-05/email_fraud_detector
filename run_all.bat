@echo off
setlocal EnableDelayedExpansion

title Email Fraud Detector - One-Click Launcher
cls

echo ===================================================
echo   EMAIL FRAUD DETECTOR - ONE-CLICK SETUP & RUN
echo ===================================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.9+ and try again.
    pause
    exit /b
)

cd backend

:: 2. Check/Create Virtual Environment
if not exist "venv" (
    echo [SETUP] Creating virtual environment...
    
    :: Try to use Python 3.12 via py launcher
    py -3.12 --version >nul 2>&1
    if !errorlevel! equ 0 (
        echo [INFO] Using Python 3.12 via py launcher.
        py -3.12 -m venv venv
    ) else (
        :: Fallback to default python
        echo [INFO] Python 3.12 not found via py launcher. Using default python.
        python -m venv venv
    )

    if !errorlevel! neq 0 (
        echo [ERROR] Failed to create venv.
        pause
        exit /b
    )
    echo [SETUP] Virtual environment created.
)

:: 3. Activate Venv and Install Requirements
call venv\Scripts\activate
if exist "requirements.txt" (
    echo [SETUP] Checking dependencies...
    pip install -r requirements.txt >nul 2>&1
) else (
    echo [WARNING] requirements.txt not found in backend directory.
)

:: 4. Check for Model Artifacts
set "MODEL_DIR=app\models\artifacts\roberta_fraud_model"
set "FALLBACK_MODEL=app\models\artifacts\fraud_model.pkl"

if exist "%MODEL_DIR%" (
    echo [INFO] Advanced RoBERTa model found. Using it.
) else (
    if exist "%FALLBACK_MODEL%" (
        echo [INFO] Advanced model not found, but fallback model exists.
        echo [INFO] Using fast fallback model. (Advanced model can be trained separately)
    ) else (
        echo [WARNING] No models found! Training is required.
        echo [TRAINING] Starting model training...
        python -m app.models.train_model
    )
)

:: 5. Start Backend Server (Background)
echo.
echo [1/2] Starting Backend Server...
start "Backend Server" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait for server to initialize
echo [2/2] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: 6. Open Frontend
cd ..
echo [frontend] Opening Application...
start frontend\index.html

echo.
echo ===================================================
echo   Application Running!
echo ===================================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: Opened in default browser
echo.
echo Keep this window open to maintain the process.
echo Press any key to stop the application.
pause >nul

:: Cleanup
taskkill /FI "WINDOWTITLE eq Backend Server" /F >nul 2>&1
