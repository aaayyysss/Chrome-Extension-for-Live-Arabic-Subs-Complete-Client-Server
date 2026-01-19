from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import tempfile
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import emergent integrations
from emergentintegrations.llm.openai import OpenAISpeechToText
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Initialize API key
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# Add your routes to the router
@api_router.get("/")
async def root():
    return {"message": "Arabic Subtitle Translation API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

@api_router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file to text using OpenAI Whisper.
    Accepts: mp3, mp4, mpeg, mpga, m4a, wav, webm
    """
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    # Validate file type
    allowed_types = ['audio/webm', 'audio/mp3', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg']
    content_type = audio.content_type or ''
    
    logger.info(f"Received audio file: {audio.filename}, content_type: {content_type}")
    
    try:
        # Read the audio content
        audio_content = await audio.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        # Get file extension from filename or content type
        ext = '.webm'
        if audio.filename:
            ext = Path(audio.filename).suffix or '.webm'
        elif 'wav' in content_type:
            ext = '.wav'
        elif 'mp3' in content_type:
            ext = '.mp3'
        elif 'ogg' in content_type:
            ext = '.ogg'
        
        # Write to temp file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_content)
            tmp_path = tmp.name
        
        try:
            # Initialize Whisper STT
            stt = OpenAISpeechToText(api_key=EMERGENT_KEY)
            
            # Transcribe
            with open(tmp_path, "rb") as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="json",
                    language="en"
                )
            
            transcribed_text = response.text if hasattr(response, 'text') else str(response)
            logger.info(f"Transcription successful: {transcribed_text[:100]}...")
            
            return TranscribeResponse(text=transcribed_text, language="en")
            
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
                
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@api_router.post("/translate", response_model=TranslateResponse)
async def translate_text(request: TranslateRequest):
    """
    Translate text from English to Modern Standard Arabic using GPT-5.2.
    """
    if not EMERGENT_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Empty text provided")
    
    try:
        # Initialize chat with GPT-5.2
        chat = LlmChat(
            api_key=EMERGENT_KEY,
            session_id=f"translate-{uuid.uuid4()}",
            system_message="""You are a professional translator specializing in Modern Standard Arabic (MSA / الفصحى). 
Your task is to translate English text to Modern Standard Arabic.
Rules:
1. Use only Modern Standard Arabic (الفصحى), not dialects
2. Return ONLY the Arabic translation, nothing else
3. Maintain the meaning and tone of the original text
4. Use proper Arabic grammar and punctuation
5. Do not add explanations or notes"""
        ).with_model("openai", "gpt-5.2")
        
        # Create translation request
        user_message = UserMessage(
            text=f"Translate this English text to Modern Standard Arabic:\n\n{request.text}"
        )
        
        # Get translation
        response = await chat.send_message(user_message)
        translated_text = response.strip() if isinstance(response, str) else str(response).strip()
        
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
    Combined endpoint: transcribe audio then translate to Arabic.
    """
    # First transcribe
    transcribe_result = await transcribe_audio(audio)
    
    if not transcribe_result.text or not transcribe_result.text.strip():
        return {
            "english_text": "",
            "arabic_text": "",
            "status": "no_speech"
        }
    
    # Then translate
    translate_request = TranslateRequest(text=transcribe_result.text)
    translate_result = await translate_text(translate_request)
    
    return {
        "english_text": transcribe_result.text,
        "arabic_text": translate_result.translated_text,
        "status": "success"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
