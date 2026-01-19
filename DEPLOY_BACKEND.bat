@echo off
:: Live Arabic Subs - Deployment Helper Script
:: Helps deploy the backend to various cloud platforms

echo ========================================
echo Live Arabic Subs - Deployment Helper
echo ========================================

echo Select deployment platform:
echo 1. Heroku (Recommended - Free tier available)
echo 2. Railway (Easy GUI deployment)
echo 3. Render (Simple web service)
echo 4. Manual deployment preparation
echo.

choice /c 1234 /m "Enter your choice (1-4)"

if errorlevel 4 goto manual
if errorlevel 3 goto render
if errorlevel 2 goto railway
if errorlevel 1 goto heroku

:heroku
echo.
echo ========================================
echo Heroku Deployment
echo ========================================
echo Prerequisites:
echo - Install Heroku CLI from heroku.com
echo - Create free Heroku account
echo.
echo Steps:
echo 1. Open Command Prompt as Administrator
echo 2. Run: heroku login
echo 3. Run: heroku create live-arabic-subs-api
echo 4. Run: git init
echo 5. Run: git add .
echo 6. Run: git commit -m "Initial deployment"
echo 7. Run: git push heroku main
echo.
echo Your API will be available at: https://YOUR-APP-NAME.herokuapp.com
goto end

:railway
echo.
echo ========================================
echo Railway Deployment
echo ========================================
echo Steps:
echo 1. Go to railway.app
echo 2. Sign up/Login
echo 3. Click "New Project"
echo 4. Choose "Deploy from GitHub repo" or "Deploy from template"
echo 5. Upload the backend folder contents
echo 6. Set environment variable: PORT = 8000
echo.
echo Your API will get a railway.app URL automatically
goto end

:render
echo.
echo ========================================
echo Render Deployment
echo ========================================
echo Steps:
echo 1. Go to render.com
echo 2. Sign up/Login
echo 3. Click "New +" and select "Web Service"
echo 4. Connect your GitHub repository (or upload files)
echo 5. Set:
echo    - Build command: pip install -r requirements.txt
echo    - Start command: uvicorn production_server:app --host 0.0.0.0 --port $PORT
echo 6. Click "Create Web Service"
echo.
echo Your API will be available at your render.com URL
goto end

:manual
echo.
echo ========================================
echo Manual Deployment Preparation
echo ========================================
echo Files prepared for deployment:
echo - backend/production_server.py (Main server)
echo - backend/requirements.txt (Dependencies)
echo - backend/runtime.txt (Python version)
echo - backend/Procfile (Heroku config)
echo.
echo Copy the backend folder to your deployment environment
echo and run: pip install -r requirements.txt
echo Then: uvicorn production_server:app --host 0.0.0.0 --port 8000
goto end

:end
echo.
echo ========================================
echo Next Steps After Deployment:
echo ========================================
echo 1. Test your deployed API endpoints:
echo    - YOUR-DEPLOYED-URL/
echo    - YOUR-DEPLOYED-URL/health
echo    - YOUR-DEPLOYED-URL/api/
echo    - YOUR-DEPLOYED-URL/api/status
echo.
echo 2. Update Chrome extension to use your deployed URL
echo 3. Test the connection from the extension popup
echo.
pause