# Agentic AI Citizen Assistant API entrypoint
import os
import ssl

# Inject Windows native system certificates
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings, BACKEND_DIR
from app.core.database import init_db
from app.api.health import router as health_router
from app.api.grievances import router as grievances_router
from app.api.services import router as services_router
from app.api.ai import router as ai_router
from app.api.chat import router as chat_router
from app.api.upload import router as upload_router
from app.api.notifications import router as notifications_router
from app.api.auth import router as auth_router

# Ensure tables are created when FastAPI starts
init_db()

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Agentic AI Citizen Assistant API - empowering citizens with intelligent civic workflows.",
    version="1.0.0",
)

# CORS middleware allows the React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for citizen photo evidence uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include API routes
app.include_router(health_router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(grievances_router, prefix=settings.API_V1_STR)
app.include_router(services_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(upload_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API",
        "health_check": f"{settings.API_V1_STR}/health",
        "chat": f"{settings.API_V1_STR}/chat",
        "grievances": f"{settings.API_V1_STR}/grievances",
        "grievances_map": f"{settings.API_V1_STR}/grievances/map/pins",
        "services": f"{settings.API_V1_STR}/services",
        "notifications": f"{settings.API_V1_STR}/notifications",
        "upload": f"{settings.API_V1_STR}/upload",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
