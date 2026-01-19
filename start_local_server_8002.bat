@echo off
:: Local Backend Server Startup Script - Port 8002
:: Uses local_server_port8002.py to avoid port conflicts

echo ========================================
echo Live Arabic Subs - Local Backend Server (Port 8002)
echo ========================================

:: Check if we're in the right directory
if not exist "backend\local_server_port8002.py" (
    echo ERROR: backend/local_server_port8002.py not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

cd backend

:: Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

:: Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Install/update local dependencies
echo Installing/updating dependencies...
pip install fastapi uvicorn

:: Kill any existing Python processes that might be using ports
echo Checking for existing server processes...
taskkill /IM python.exe /F 2>nul

:: Wait a moment for ports to free up
timeout /t 2 /nobreak >nul

:: Start the local server on port 8002
echo.
echo ========================================
echo Starting Local Backend Server on Port 8002
echo ========================================
echo Server will be available at: http://localhost:8002
echo API Documentation: http://localhost:8002/docs
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python local_server_port8002.py

pause