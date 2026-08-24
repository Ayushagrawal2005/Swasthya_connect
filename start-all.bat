@echo off
echo ========================================
echo   Swasthya Connect - ML Triage System
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "ml-backend\venv\" (
    echo ❌ Virtual environment not found!
    echo Please run setup first:
    echo    cd ml-backend
    echo    setup.bat
    pause
    exit /b 1
)

REM Check if model exists
if not exist "ml-backend\models\triage_model.pkl" (
    echo ❌ ML model not found!
    echo Training model now...
    cd ml-backend
    call venv\Scripts\activate
    python train_model.py
    cd ..
)

echo 🚀 Starting ML Backend...
start "ML Backend API" cmd /k "cd ml-backend && venv\Scripts\activate && python app.py"

echo ⏳ Waiting for ML API to start...
timeout /t 5 /nobreak >nul

echo 🎨 Starting Frontend...
start "Frontend Dev Server" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ Both servers starting!
echo ========================================
echo.
echo ML Backend:  http://localhost:5000
echo Frontend:    http://localhost:5173
echo.
echo Press any key to open the app in your browser...
pause >nul
start http://localhost:5173
