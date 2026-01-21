from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
from datetime import datetime
import os

import re
from starlette.responses import RedirectResponse

@app.middleware("http")
async def collapse_double_slashes(request, call_next):
    path = request.scope.get("path", "")
    if '//' in path:
        new_path = re.sub(r"/{2,}", "/", path)
        # preserve querystring
        qs = request.url.query
        url = str(request.url.replace(path=new_path, query=qs))
        return RedirectResponse(url, status_code=307)
    return await call_next(request)

# Configure production logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Live Arabic Subs API",
    description="Production API for real-time subtitle translation",
    version="1.0.0"
)

# Production CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for extension
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "Live Arabic Subs API",
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    logger.info("Health check accessed")
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/api/")
async def api_root():
    logger.info("API root accessed")
    return {"message": "Arabic Subtitle Translation API"}

@app.get("/api/status")
async def api_status():
    logger.info("API status accessed")
    return {
        "status": "operational",
        "service": "subtitle-translation",
        "uptime": "production"
    }

# Mock endpoints for testing
@app.post("/api/transcribe")
async def transcribe_mock():
    logger.info("Transcribe endpoint accessed")
    return {
        "text": "This is a mock transcription from the remote server",
        "language": "en"
    }

@app.post("/api/translate")
async def translate_mock():
    logger.info("Translate endpoint accessed")
    return {
        "original_text": "Hello world",
        "translated_text": "مرحبا بالعالم",
        "source_language": "en",
        "target_language": "ar"
    }

@app.post("/api/transcribe-and-translate")
async def transcribe_and_translate_mock():
    logger.info("Combined endpoint accessed")
    return {
        "english_text": "This is a test transcription",
        "arabic_text": "هذه ترجمة تجريبية",
        "status": "success"
    }

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting production server on port {port}")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"

    )
