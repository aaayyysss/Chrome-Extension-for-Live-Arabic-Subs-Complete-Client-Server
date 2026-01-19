from fastapi import FastAPI, Request
import uvicorn
import logging
from datetime import datetime
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server_debug.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Live Arabic Subs - Debug Server")

# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    
    # Log incoming request
    logger.info(f"📥 INCOMING REQUEST: {request.method} {request.url}")
    logger.info(f"   Headers: {dict(request.headers)}")
    
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.body()
            if body:
                logger.info(f"   Body: {body.decode('utf-8')[:200]}...")  # First 200 chars
        except Exception as e:
            logger.warning(f"   Could not read body: {e}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = (datetime.now() - start_time).total_seconds()
    logger.info(f"📤 RESPONSE: {response.status_code} ({process_time:.3f}s)")
    
    return response

@app.get("/")
async def root():
    logger.info("✅ Root endpoint accessed")
    return {
        "message": "Live Arabic Subs Debug Server", 
        "status": "running",
        "port": 8002,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    logger.info("✅ Health check endpoint accessed")
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0-debug",
        "port": 8002
    }

@app.get("/api/")
async def api_root():
    logger.info("✅ API root endpoint accessed")
    return {"message": "Arabic Subtitle Translation API - Debug Mode"}

@app.get("/api/status")
async def api_status():
    logger.info("✅ API status endpoint accessed")
    return {
        "status": "operational", 
        "service": "subtitle-translation",
        "debug": True
    }

@app.post("/api/transcribe")
async def transcribe_debug():
    logger.info("✅ Transcribe endpoint accessed (DEBUG)")
    return {
        "text": "This is a debug transcription response",
        "language": "en",
        "debug": True
    }

@app.post("/api/translate")
async def translate_debug():
    logger.info("✅ Translate endpoint accessed (DEBUG)")
    return {
        "original_text": "Debug test text",
        "translated_text": "نص تجريبي للتصحيح",
        "source_language": "en",
        "target_language": "ar",
        "debug": True
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ GLOBAL ERROR: {exc}", exc_info=True)
    return {
        "error": str(exc),
        "type": type(exc).__name__,
        "timestamp": datetime.now().isoformat(),
        "endpoint": str(request.url)
    }

if __name__ == "__main__":
    logger.info("=" * 50)
    logger.info("🚀 STARTING DEBUG SERVER")
    logger.info("=" * 50)
    logger.info("Server configuration:")
    logger.info("  - Port: 8002")
    logger.info("  - Mode: Debug with full logging")
    logger.info("  - Log file: server_debug.log")
    logger.info("  - Endpoints available:")
    logger.info("    * GET  /")
    logger.info("    * GET  /health")
    logger.info("    * GET  /api/")
    logger.info("    * GET  /api/status")
    logger.info("    * POST /api/transcribe")
    logger.info("    * POST /api/translate")
    logger.info("=" * 50)
    
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=8002,
        log_level="info"
    )