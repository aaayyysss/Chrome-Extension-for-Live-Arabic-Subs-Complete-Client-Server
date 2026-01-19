from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Simple Test Server")

@app.get("/")
async def root():
    return {"message": "Test server is running!"}

@app.get("/health")
async def health():
    return {"status": "healthy", "message": "Server is working"}

if __name__ == "__main__":
    print("🚀 Starting Simple Test Server...")
    print("📡 Available at: http://localhost:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)