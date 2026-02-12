@echo off
REM Start backend with UTF-8 encoding (fixes Windows API 500 errors)
set PYTHONIOENCODING=utf-8
cd /d "%~dp0"
call venv\Scripts\activate.bat
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
