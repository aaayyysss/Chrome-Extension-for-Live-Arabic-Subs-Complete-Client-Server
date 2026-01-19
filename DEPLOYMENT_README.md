# Live Arabic Subs - Production Deployment Package

## Files Included:
- `production_server.py` - Main FastAPI server
- `requirements.txt` - Python dependencies
- `runtime.txt` - Python version specification
- `Procfile` - Heroku deployment configuration

## Deployment Options:

### 1. Heroku Deployment (Easiest)
```bash
# Install Heroku CLI first
heroku login
heroku create your-app-name
git init
git add .
git commit -m "Initial deployment"
git push heroku main
```

### 2. Railway Deployment
- Go to railway.app
- Create new project
- Deploy from GitHub repo or upload files
- Set PORT environment variable to 8000

### 3. Render Deployment
- Go to render.com
- Create new web service
- Connect to your repository
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn production_server:app --host 0.0.0.0 --port $PORT`

## Testing the Deployed API:
Once deployed, test these endpoints:
- `https://your-app-url.herokuapp.com/` - Root
- `https://your-app-url.herokuapp.com/health` - Health check
- `https://your-app-url.herokuapp.com/api/` - API root
- `https://your-app-url.herokuapp.com/api/status` - API status

## Chrome Extension Configuration:
Update the extension to use your deployed URL instead of localhost.