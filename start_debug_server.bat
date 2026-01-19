@echo off
:: Debug Server Startup Script with Full Logging
:: For Live Arabic Subs Extension Connection Troubleshooting

echo ========================================
echo Live Arabic Subs - DEBUG SERVER
echo ========================================

cd backend

:: Kill any existing Python processes
echo Killing existing Python processes...
taskkill /IM python.exe /F 2>nul

:: Wait for ports to free up
timeout /t 3 /nobreak >nul

:: Install required packages
echo Installing/updating dependencies...
pip install fastapi uvicorn

:: Start debug server
echo.
echo ========================================
echo Starting DEBUG Server with Full Logging
echo ========================================
echo Server log file: backend\server_debug.log
echo Console output will show real-time logs
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python debug_server.py

pause