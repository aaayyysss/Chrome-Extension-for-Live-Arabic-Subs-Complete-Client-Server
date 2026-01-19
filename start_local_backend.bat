@echo off
:: Local Backend Server Startup Script
:: For Live Arabic Subs Extension Testing

echo ========================================
echo Live Arabic Subs - Local Backend Server
echo ========================================

:: Check if we're in the right directory
if not exist "backend\server.py" (
    echo ERROR: backend/server.py not found!
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
pip install -r local_requirements.txt

:: Check if .env file exists
if not exist ".env" (
    echo Creating .env file...
    (
        echo MONGO_URL="mongodb://localhost:27017"
        echo DB_NAME="test_database" 
        echo CORS_ORIGINS="*"
        echo EMERGENT_LLM_KEY=sk-emergent-2C5A936B7A5512526F
    ) > .env
    echo .env file created with default configuration
)

:: Start the server
echo.
echo ========================================
echo Starting Local Backend Server
echo ========================================
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python simple_test_server.py

pause