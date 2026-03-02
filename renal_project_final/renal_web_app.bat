@echo off
setlocal enabledelayedexpansion

REM --------------------------------------------
REM Renal Web App Launcher for Windows CMD
REM --------------------------------------------

echo Navigating to project folder...
cd /d "%~dp0web-project-main" || (
    echo ERROR: Could not enter web-project-main directory.
    pause
    exit /b
)

REM ---------- Frontend (Next.js) ----------
if not exist node_modules (
    echo node_modules not found. Installing...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed.
        pause
        exit /b
    )
) else (
    echo node_modules already exists.
)

REM ---------- Backend (Python) ----------
set REQUIREMENTS_FILE=server\scripts\requirements.txt
set REQUIREMENTS_INSTALLED=.requirements_installed

if not exist %REQUIREMENTS_INSTALLED% (
    echo Installing Python requirements...
    pip install -r %REQUIREMENTS_FILE%
    if errorlevel 1 (
        echo ERROR: pip install failed.
        pause
        exit /b
    )
    type nul > %REQUIREMENTS_INSTALLED%
    echo Python requirements installed.
) else (
    echo Python requirements already satisfied.
)

REM ---------- Model Files Check ----------
echo Checking model files...
set MODEL_DIR=models
set MODELS=model_finetune_3.keras efficientnetb0_finetuned.keras model_finetune_resnet.keras
set MISSING=0

for %%M in (%MODELS%) do (
    if not exist "%MODEL_DIR%\%%M" (
        echo Missing model: %%M
        set MISSING=1
    ) else (
        echo Found model: %%M
    )
)

if "!MISSING!"=="1" (
    echo ERROR: One or more model files are missing.
    pause
    exit /b
)

REM ---------- Start Frontend ----------
echo Starting frontend (Next.js)...
start "" cmd /k "npm run dev"

REM ---------- Open Browser ----------
timeout /t 3 >nul
start http://localhost:3000

echo Application launched at http://localhost:3000
pause
