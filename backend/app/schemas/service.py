from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ServiceResponse(BaseModel):
    id: int
    service_code: str
    title: str
    category: str
    description: str
    eligibility_criteria: str
    documents_required: str
    application_procedure: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
