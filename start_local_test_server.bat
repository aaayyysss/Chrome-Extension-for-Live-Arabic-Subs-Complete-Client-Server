@echo off
:: Local Backend Server Startup Script for Testing
:: Uses the local_server.py which doesn't require proprietary dependencies

echo ========================================
echo Live Arabic Subs - Local Testing Server
echo ========================================

:: Check if we're in the right directory
if not exist "backend\local_server.py" (
    echo ERROR: backend/local_server.py not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

cd backend

:: Check if virtual environment exists
if not exist "local_venv" (
    echo Creating local virtual environment...
    python -m venv local_venv
)

:: Activate virtual environment
echo Activating virtual environment...
call local_venv\Scripts\activate.bat

:: Install/update local dependencies
echo Installing local dependencies...
pip install -r local_requirements.txt

:: Check if .env file exists
if not exist ".env" (
    echo Creating .env file for local testing...
    (
        echo MONGO_URL="mongodb://localhost:27017"
        echo DB_NAME="test_database" 
        echo CORS_ORIGINS="*"
        echo EMERGENT_LLM_KEY=sk-test-key-for-local-testing
    ) > .env
    echo .env file created with local testing configuration
)

:: Start the local server
echo.
echo ========================================
echo Starting Local Testing Server
echo ========================================
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo Press Ctrl+C to stop the server
echo ========================================
echo.

:: Run the local server (uses local_server.py instead of server.py)
python local_server.py

pause