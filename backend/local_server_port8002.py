from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Live Arabic Subs Local Server - Port 8002")

@app.get("/")
async def root():
    return {"message": "Live Arabic Subs Local Backend - Running Successfully!", "port": 8002}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": "2026-01-19T18:00:00Z", "version": "1.0.0-local", "port": 8002}

@app.get("/api/")
async def api_root():
    return {"message": "Arabic Subtitle Translation API"}

@app.get("/api/status")
async def api_status():
    return {"status": "operational", "service": "subtitle-translation"}

if __name__ == "__main__":
    print("🚀 Starting Live Arabic Subs Local Backend Server...")
    print("📡 Server available at: http://localhost:8002")
    print("📚 API docs available at: http://localhost:8002/docs")
    print("⚠️  This is a LOCAL server for TESTING purposes")
    uvicorn.run(app, host="127.0.0.1", port=8002)