@echo off
cd /d "c:\Users\ASUS\OneDrive\Documents\Python\Chrome-Extension-for-Live-Arabic-Subs-Complete-main\backend"

echo Installing required packages...
pip install fastapi uvicorn

echo Starting test server...
python simple_test_server.py

pause