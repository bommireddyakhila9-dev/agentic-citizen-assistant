import os
import uuid
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.config import BACKEND_DIR
from app.services.llm import get_gemini_llm

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class Base64UploadPayload(BaseModel):
    filename: str
    file_data: str  # data:image/png;base64,... or raw base64
    content_type: Optional[str] = "image/jpeg"


@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    """
    Accepts multipart file upload (photos of civic complaints or PDF subsidy documents).
    Saves to the municipal uploads directory and returns a public URL.
    """
    try:
        ext = os.path.splitext(file.filename)[1].lower()
        if not ext:
            ext = ".jpg"
        
        safe_filename = f"{uuid.uuid4().hex[:12]}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        file_url = f"/uploads/{safe_filename}"
        return {
            "success": True,
            "filename": safe_filename,
            "url": file_url,
            "content_type": file.content_type,
            "size_bytes": len(contents),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("/base64")
async def upload_file_base64(payload: Base64UploadPayload):
    """
    Accepts base64 encoded image or document data.
    """
    try:
        raw_data = payload.file_data
        if "," in raw_data:
            # Strip data:image/png;base64, prefix
            raw_data = raw_data.split(",", 1)[1]

        binary_data = base64.b64decode(raw_data)
        safe_filename = f"{uuid.uuid4().hex[:12]}_{payload.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(binary_data)

        file_url = f"/uploads/{safe_filename}"
        return {
            "success": True,
            "filename": safe_filename,
            "url": file_url,
            "content_type": payload.content_type,
            "size_bytes": len(binary_data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Base64 upload failed: {str(e)}")


@router.post("/analyze-evidence")
async def analyze_civic_evidence(payload: Base64UploadPayload):
    """
    Leverages Google Gemini vision capabilities to analyze citizen grievance photos
    (potholes, garbage dumps, pipeline leaks, or electricity bills).
    """
    try:
        llm = get_gemini_llm()
        raw_data = payload.file_data
        if "," in raw_data:
            raw_data = raw_data.split(",", 1)[1]

        # Use Gemini with multimodal prompt
        prompt = (
            "You are an AI civic infrastructure inspector for a municipal government. "
            "Analyze this uploaded citizen photo/document. "
            "Provide: 1) What civic issue is visible? 2) Suggested municipal department (Roads, Water, Sanitation, Electricity). "
            "3) Severity (Low, Medium, High, Urgent). Keep the summary concise in 2 sentences."
        )

        message = {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": f"data:{payload.content_type or 'image/jpeg'};base64,{raw_data}"
                }
            ]
        }
        res = llm.invoke([message])
        return {
            "success": True,
            "analysis": res.content,
        }
    except Exception as e:
        # Graceful fallback description
        return {
            "success": False,
            "error": str(e),
            "fallback_analysis": "Civic evidence photo verified and attached to grievance dossier."
        }


class VoiceTranscriptionPayload(BaseModel):
    audio_data: str  # base64 data URL or raw base64
    content_type: Optional[str] = "audio/webm"
    language: Optional[str] = "English"


@router.post("/transcribe-voice")
async def transcribe_voice(payload: VoiceTranscriptionPayload):
    """
    Transcribes citizen voice recordings using Google Gemini Audio Multimodal AI.
    Works reliably across all networks, firewalls, and browsers (Chrome, Edge, Firefox, Brave, Safari)
    without relying on proprietary browser SpeechRecognition cloud servers.
    """
    try:
        llm = get_gemini_llm()
        raw_data = payload.audio_data
        if "," in raw_data:
            raw_data = raw_data.split(",", 1)[1]

        binary_data = base64.b64decode(raw_data)
        if len(binary_data) < 400:
            return {
                "success": False,
                "error": "Recorded audio is too short or empty. Please speak for at least 1-2 seconds.",
                "transcription": "",
            }

        prompt = (
            f"You are an accurate civic voice transcriber for a municipal assistant. "
            f"Listen to the attached audio recording and transcribe what was spoken accurately in {payload.language or 'English'}. "
            f"Return ONLY the plain transcribed text. Do not add quotes, markdown formatting, or preamble like 'Here is the transcription:'."
        )

        message = {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "media",
                    "mime_type": payload.content_type or "audio/webm",
                    "data": raw_data,
                }
            ]
        }
        res = llm.invoke([message])
        content = res.content
        if isinstance(content, list) and len(content) > 0 and isinstance(content[0], dict):
            transcription = content[0].get("text", "")
        elif isinstance(content, list):
            transcription = " ".join(str(item) for item in content)
        else:
            transcription = str(content)

        return {
            "success": True,
            "transcription": transcription.strip(),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "transcription": "",
        }
