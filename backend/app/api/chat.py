from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional, Dict
from app.agent.graph import process_citizen_query

router = APIRouter(prefix="/chat", tags=["Agentic Chat"])


class ChatTurn(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatTurn]] = []
    phone: Optional[str] = None
    language: Optional[str] = "English"


class ChatResponse(BaseModel):
    response: str
    tools_used: List[str]
    status: str


@router.post("", response_model=ChatResponse)
def chat_with_agent(payload: ChatRequest):
    """
    Primary endpoint for citizen interactions with the LangGraph Agentic Assistant.
    Coordinates reasoning, database tool execution, and empathetic responses in any language.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )

    try:
        history_dicts = [turn.model_dump() for turn in (payload.conversation_history or [])]
        result = process_citizen_query(
            user_input=payload.message,
            conversation_history=history_dicts,
            phone=payload.phone,
            language=payload.language or "English",
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow error: {str(e)}"
        )
