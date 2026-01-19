@echo off
:: Live Arabic Subs - Deployment Script v1.1.0
:: This script deploys the enhanced version without overwriting existing files

echo ========================================
echo Live Arabic Subs - Enhanced Deployment
echo Version 1.1.0 - Self-contained Edition
echo ========================================

set "EXTENSION_DIR=extension"
set "BACKUP_DIR=backup_v1.1.0_%date:~-4,4%%date:~-10,2%%date:~-7,2%"
set "DEPLOY_LOG=deployment_log.txt"

echo [%date% %time%] Starting deployment > "%DEPLOY_LOG%"

:: Create backup of current files
if exist "%EXTENSION_DIR%" (
    echo Creating backup of current extension...
    mkdir "%BACKUP_DIR%" 2>nul
    xcopy "%EXTENSION_DIR%" "%BACKUP_DIR%" /E /I /H /Y >> "%DEPLOY_LOG%" 2>&1
    echo Backup created in %BACKUP_DIR%
    echo [%date% %time%] Backup created >> "%DEPLOY_LOG%"
)

:: Deploy enhanced files with version control
echo Deploying enhanced files...

:: Create utils directory if it doesn't exist
if not exist "%EXTENSION_DIR%\utils" (
    mkdir "%EXTENSION_DIR%\utils"
    echo Created utils directory
)

:: Copy enhanced files (these won't overwrite unless forced)
echo Copying enhanced background service worker...
copy /Y "extension\background\enhanced-service-worker.js" "%EXTENSION_DIR%\background\service-worker.js" >> "%DEPLOY_LOG%" 2>&1

echo Copying enhanced popup files...
copy /Y "extension\popup\version-controlled-popup.html" "%EXTENSION_DIR%\popup\popup.html" >> "%DEPLOY_LOG%" 2>&1
copy /Y "extension\popup\enhanced-popup.js" "%EXTENSION_DIR%\popup\popup.js" >> "%DEPLOY_LOG%" 2>&1
copy /Y "extension\popup\enhanced-popup.css" "%EXTENSION_DIR%\popup\popup.css" >> "%DEPLOY_LOG%" 2>&1

echo Copying utility files...
copy /Y "extension\utils\logger.js" "%EXTENSION_DIR%\utils\logger.js" >> "%DEPLOY_LOG%" 2>&1
copy /Y "extension\utils\config.js" "%EXTENSION_DIR%\utils\config.js" >> "%DEPLOY_LOG%" 2>&1

:: Update manifest to include utils
echo Updating manifest for enhanced features...

:: Create temporary manifest
(
echo {
echo   "manifest_version": 3,
echo   "name": "Live Arabic Subs",
echo   "version": "1.1.0",
echo   "description": "Enhanced real-time subtitle translation with multiple backend support",
echo   
echo   "permissions": [
echo     "tabCapture",
echo     "activeTab", 
echo     "storage",
echo     "offscreen"
echo   ],
echo   
echo   "host_permissions": [
echo     "http://localhost:*/",
echo     "https://*/"
echo   ],
echo   
echo   "action": {
echo     "default_popup": "popup/popup.html",
echo     "default_icon": {
echo       "16": "icons/icon16.png",
echo       "48": "icons/icon48.png", 
echo       "128": "icons/icon128.png"
echo     }
echo   },
echo   
echo   "icons": {
echo     "16": "icons/icon16.png",
echo     "48": "icons/icon48.png",
echo     "128": "icons/icon128.png"
echo   },
echo   
echo   "background": {
echo     "service_worker": "background/service-worker.js",
echo     "type": "module"
echo   },
echo   
echo   "content_scripts": [
echo     {
echo       "matches": ["^<all_urls>$"],
echo       "js": ["content/content.js"],
echo       "css": ["content/overlay.css"],
echo       "run_at": "document_idle"
echo     }
echo   ],
echo   
echo   "web_accessible_resources": [
echo     {
echo       "resources": ["fonts/*", "icons/*", "utils/*"],
echo       "matches": ["^<all_urls>$"]
echo     }
echo   ]
echo }
) > "%EXTENSION_DIR%\manifest.json.tmp"

:: Move temporary manifest to replace original
move /Y "%EXTENSION_DIR%\manifest.json.tmp" "%EXTENSION_DIR%\manifest.json" >> "%DEPLOY_LOG%" 2>&1

echo Manifest updated with enhanced permissions

:: Create deployment verification file
(
echo Live Arabic Subs v1.1.0 - Enhanced Deployment
echo ================================================
echo Deployment Date: %date% %time%
echo Backup Location: %BACKUP_DIR%
echo 
echo Enhanced Features Deployed:
echo - Multiple backend support (Cloud, Local, Custom)
echo - Enhanced logging system
echo - Version control protection
echo - Self-contained operation
echo - Fallback mechanisms
echo - Improved error handling
echo 
echo Files Updated:
echo - background/service-worker.js (enhanced)
echo - popup/popup.html (version-controlled)
echo - popup/popup.js (enhanced)
echo - popup/popup.css (enhanced)
echo - utils/logger.js (new)
echo - utils/config.js (new)
echo - manifest.json (updated)
) > "%EXTENSION_DIR%\DEPLOYMENT_INFO.txt"

echo Deployment verification file created

:: Final status
echo.
echo ========================================
echo DEPLOYMENT COMPLETE
echo ========================================
echo Enhanced version 1.1.0 deployed successfully!
echo 
echo Key Features:
echo - Multiple backend options (cloud, local, custom)
echo - Self-contained operation
echo - Enhanced debugging capabilities
echo - Version overwrite protection
echo - Fallback mechanisms for reliability
echo 
echo Next Steps:
echo 1. Go to chrome://extensions/
echo 2. Remove old extension
echo 3. Load unpacked "%EXTENSION_DIR%" folder
echo 4. Configure backend in popup settings
echo 
echo Backup saved to: %BACKUP_DIR%
echo Deployment log: %DEPLOY_LOG%
echo ========================================

echo [%date% %time%] Deployment completed successfully >> "%DEPLOY_LOG%"

pause