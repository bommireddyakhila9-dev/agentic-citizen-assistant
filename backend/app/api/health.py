from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
def health_check():
    """
    Returns server health, timestamp, and active service name.
    """
    return {
        "status": "healthy",
        "service": "Agentic AI Citizen Assistant Backend",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "configured",
        "agentic_engine": "ready",
    }
