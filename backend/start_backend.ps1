# Start Email Fraud Detector backend with UTF-8 encoding (fixes Windows 500 errors)
$env:PYTHONIOENCODING = 'utf-8'
Set-Location $PSScriptRoot
& .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
