from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime
import tempfile
import asyncio
import json

# Simple logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Live Arabic Subs Local Backend")

# Create API router
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class StatusCheck(BaseModel):
    id: str = str(uuid.uuid4())
    client_name: str
    timestamp: datetime = datetime.now()

class StatusCheckCreate(BaseModel):
    client_name: str

class TranslateRequest(BaseModel):
    text: str
    source_language: str = "English"
    target_language: str = "Arabic"

class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: str
    target_language: str

class TranscribeResponse(BaseModel):
    text: str
    language: Optional[str] = None

# Mock translation function (simulates translation)
def mock_translate(text: str) -> str:
    """Mock translation that converts English to Arabic-like text"""
    # Simple word mapping for demonstration
    word_map = {
        "hello": "مرحبا",
        "world": "عالم",
        "test": "اختبار",
        "good": "جيد",
        "morning": "صباح",
        "evening": "مساء",
        "thank": "شكرا",
        "please": "من فضلك",
        "yes": "نعم",
        "no": "لا"
    }
    
    # Split text into words and translate
    words = text.lower().split()
    translated_words = []
    
    for word in words:
        # Remove punctuation for matching
        clean_word = ''.join(c for c in word if c.isalnum())
        if clean_word in word_map:
            translated_words.append(word_map[clean_word])
        else:
            # For unknown words, just reverse them as demo
            translated_words.append(clean_word[::-1] if clean_word else word)
    
    return ' '.join(translated_words)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Live Arabic Subs Local Backend - Running Successfully!"}

@api_router.post("/status")
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(client_name=input.client_name)
    logger.info(f"Status check created: {status_obj.client_name}")
    return status_obj

@api_router.get("/status")
async def get_status_checks():
    # Return dummy status for testing
    return [
        {
            "id": str(uuid.uuid4()),
            "client_name": "test-client",
            "timestamp": datetime.now().isoformat()
        }
    ]

@api_router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Mock transcription - returns dummy text for testing
    """
    logger.info(f"Received audio file: {audio.filename}")
    
    try:
        # Read a small portion to verify it's an audio file
        content = await audio.read(1024)
        await audio.seek(0)  # Reset file pointer
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Return mock transcription
        mock_text = "This is a test transcription from the local server"
        logger.info(f"Mock transcription: {mock_text}")
        
        return TranscribeResponse(text=mock_text, language="en")
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@api_router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Mock translation from English to Arabic
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Empty text provided")
    
    try:
        # Perform mock translation
        translated_text = mock_translate(request.text)
        logger.info(f"Translation: '{request.text}' -> '{translated_text}'")
        
        return TranslateResponse(
            original_text=request.text,
            translated_text=translated_text,
            source_language=request.source_language,
            target_language=request.target_language
        )
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@api_router.post("/transcribe-and-translate")
async def transcribe_and_translate(audio: UploadFile = File(...)):
    """
    Combined endpoint: mock transcription then mock translation
    """
    # First mock transcribe
    transcribe_result = await transcribe_audio(audio)
    
    if not transcribe_result.text or not transcribe_result.text.strip():
        return {
            "english_text": "",
            "arabic_text": "",
            "status": "no_speech"
        }
    
    # Then mock translate
    translate_request = TranslateRequest(text=transcribe_result.text)
    translate_result = await translate_text(translate_request)
    
    return {
        "english_text": transcribe_result.text,
        "arabic_text": translate_result.translated_text,
        "status": "success"
    }

# Include router
app.include_router(api_router)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0-local"
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Live Arabic Subs Local Backend Server...")
    print("📡 Server available at: http://localhost:8000")
    print("📚 API docs available at: http://localhost:8000/docs")
    print("⚠️  This is a MOCK server for TESTING purposes only")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)