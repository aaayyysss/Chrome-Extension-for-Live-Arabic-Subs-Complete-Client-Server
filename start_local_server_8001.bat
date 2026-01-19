@echo off
:: Local Backend Server Startup Script - Port 8001
:: Uses the local_server_port8001.py to avoid port conflicts

echo ========================================
echo Live Arabic Subs - Local Backend Server (Port 8001)
echo ========================================

:: Check if we're in the right directory
if not exist "backend\local_server_port8001.py" (
    echo ERROR: backend/local_server_port8001.py not found!
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
echo Installing local dependencies...
pip install fastapi uvicorn

:: Start the local server on port 8001
echo.
echo ========================================
echo Starting Local Backend Server on Port 8001
echo ========================================
echo Server will be available at: http://localhost:8001
echo API Documentation: http://localhost:8001/docs
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python local_server_port8001.py

pause