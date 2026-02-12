# Email Fraud Detector - One-Click Launcher (PowerShell)
# Run with: powershell -ExecutionPolicy Bypass -File run_all.ps1

param(
    [switch]$StopOnly = $false
)

$ErrorActionPreference = "Continue"
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Header {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   EMAIL FRAUD DETECTOR - ONE-CLICK LAUNCHER" -ForegroundColor Cyan
    Write-Host "   AI-Powered Email Security Tool" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Status {
    param([string]$Message, [string]$Status = "INFO", [string]$Color = "White")
    
    $icon = "[*]"
    if ($Status -eq "SUCCESS") { $icon = "[OK]"; $Color = "Green" }
    elseif ($Status -eq "ERROR") { $icon = "[XX]"; $Color = "Red" }
    elseif ($Status -eq "WARNING") { $icon = "[!!]"; $Color = "Yellow" }
    elseif ($Status -eq "WAIT") { $icon = "[..]"; $Color = "Magenta" }
    
    Write-Host "$icon $Message" -ForegroundColor $Color
}

function Stop-AllServices {
    Write-Host ""
    Write-Status "Stopping all services..." "WAIT"
    
    try {
        $processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | 
        Select-Object -ExpandProperty OwningProcess -Unique
        
        foreach ($pid in $processes) {
            try {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Status "Stopped backend process (PID: $pid)" "SUCCESS"
            }
            catch { }
        }
    }
    catch { }
    
    Get-Process -Name python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Status "All services stopped" "SUCCESS"
    Write-Host ""
    exit 0
}

function Start-Services {
    Write-Header
    
    # 1. Check Python
    Write-Status "Checking Python installation..." "WAIT"
    try {
        $pythonVersion = & python --version 2>&1
        Write-Status "Found: $pythonVersion" "SUCCESS"
    }
    catch {
        Write-Status "Python not found! Install Python 3.9+ and try again." "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # 2. Navigate to backend
    $backendDir = "$scriptRoot\backend"
    if (-not (Test-Path $backendDir)) {
        Write-Status "Backend directory not found" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Set-Location $backendDir
    
    # 3. Setup Virtual Environment
    Write-Status "Setting up Python environment..." "WAIT"
    
    if (-not (Test-Path "venv")) {
        Write-Status "Creating virtual environment..." "WAIT"
        & python -m venv venv 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Status "Failed to create virtual environment" "ERROR"
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Status "Virtual environment created" "SUCCESS"
    }
    else {
        Write-Status "Virtual environment exists" "SUCCESS"
    }
    
    # 4. Activate venv
    & ".\venv\Scripts\Activate.ps1"
    Write-Status "Virtual environment activated" "SUCCESS"
    
    # 5. Install dependencies
    Write-Status "Installing dependencies..." "WAIT"
    if (Test-Path "requirements.txt") {
        & pip install -q -r requirements.txt 2>&1 | Out-Null
        Write-Status "Dependencies installed" "SUCCESS"
    }
    else {
        Write-Status "requirements.txt not found" "WARNING"
    }
    
    # 6. Check models
    Write-Status "Checking ML models..." "WAIT"
    $modelDir = "app\models\artifacts\roberta_fraud_model"
    $fallbackModel = "app\models\artifacts\fraud_model.pkl"
    
    if (Test-Path $modelDir) {
        Write-Status "Advanced RoBERTa model found" "SUCCESS"
    }
    elseif (Test-Path $fallbackModel) {
        Write-Status "Fallback scikit-learn model found" "SUCCESS"
    }
    else {
        Write-Status "No models found - training required" "WARNING"
        Write-Status "Starting model training..." "WAIT"
        & python -m app.models.train_model 2>&1 | Out-Null
        Write-Status "Model training complete" "SUCCESS"
    }
    
    # 7. Start Backend Server
    Write-Host ""
    Write-Status "Starting Backend Server on port 8000..." "WAIT"
    
    $backendProcess = Start-Process `
        -FilePath "python" `
        -ArgumentList "-m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" `
        -PassThru `
        -NoNewWindow
    
    Write-Status "Backend started (PID: $($backendProcess.Id))" "SUCCESS"
    
    # 8. Wait for backend to be ready
    $backendReady = $false
    $maxRetries = 30
    $retries = 0
    
    Write-Status "Waiting for backend to initialize..." "WAIT"
    while (-not $backendReady -and $retries -lt $maxRetries) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                Write-Status "Backend is ready!" "SUCCESS"
            }
        }
        catch {
            $retries++
            Start-Sleep -Milliseconds 500
        }
    }
    
    if (-not $backendReady) {
        Write-Status "Backend failed to start" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    # 9. Open Frontend
    Write-Host ""
    Write-Status "Opening frontend application..." "WAIT"
    
    $frontendPath = "$scriptRoot\frontend\index.html"
    if (Test-Path $frontendPath) {
        Invoke-Item $frontendPath
        Write-Status "Frontend opened in browser" "SUCCESS"
    }
    else {
        Write-Status "Frontend file not found" "ERROR"
    }
    
    # 10. Display running status
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "   SUCCESS - SYSTEM RUNNING" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Backend API:" -ForegroundColor Cyan
    Write-Host "   http://127.0.0.1:8000" -ForegroundColor White
    Write-Host ""
    Write-Host "API Health:" -ForegroundColor Cyan
    Write-Host "   http://127.0.0.1:8000/health" -ForegroundColor White
    Write-Host ""
    Write-Host "API Docs:" -ForegroundColor Cyan
    Write-Host "   http://127.0.0.1:8000/docs" -ForegroundColor White
    Write-Host ""
    Write-Host "Gmail Extension Setup:" -ForegroundColor Cyan
    Write-Host "   1. Go to chrome://extensions/" -ForegroundColor White
    Write-Host "   2. Enable Developer Mode (top-right)" -ForegroundColor White
    Write-Host "   3. Click 'Load unpacked'" -ForegroundColor White
    Write-Host "   4. Select: $scriptRoot\gmail-fraud-extension" -ForegroundColor White
    Write-Host ""
    Write-Host "Stop the application:" -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C in this terminal" -ForegroundColor Yellow
    Write-Host ""
    
    # Keep the process alive
    try {
        while ($true) {
            if ($null -eq (Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue)) {
                Write-Status "Backend process has stopped" "WARNING"
                break
            }
            Start-Sleep -Seconds 5
        }
    }
    catch {
        # Continue on any errors
    }
    finally {
        Write-Status "Cleaning up..." "WAIT"
        Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
        Write-Status "Application stopped" "SUCCESS"
    }
}

# Main execution
Write-Host ""
if ($StopOnly) {
    Stop-AllServices
}
else {
    Start-Services
}
