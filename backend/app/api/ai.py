from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from app.services.llm import test_gemini_connection
from app.core.config import settings
import os

router = APIRouter(prefix="/ai", tags=["AI & Gemini"])


class PromptRequest(BaseModel):
    prompt: Optional[str] = "Briefly introduce yourself as the CitizenConnect AI Assistant."


@router.get("/status")
def gemini_status():
    """
    Checks if the Gemini API key is configured in the environment.
    """
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    is_configured = bool(api_key and api_key != "your_gemini_api_key_here")

    return {
        "service": "Google Gemini LLM",
        "model": settings.GEMINI_MODEL,
        "api_key_configured": is_configured,
        "message": (
            "Gemini API key is configured and ready."
            if is_configured
            else "GEMINI_API_KEY is not set yet. Add it to backend/.env to enable live LLM queries."
        ),
    }


@router.post("/test")
def test_gemini_prompt(payload: PromptRequest):
    """
    Sends a test prompt directly to Gemini and returns the AI response.
    """
    try:
        result = test_gemini_connection(payload.prompt)
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini API execution error: {str(e)}",
        )
