from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CitizenBase(BaseModel):
    full_name: str
    phone: str
    email: str
    address: Optional[str] = None
    ward_number: Optional[str] = None


class CitizenCreate(CitizenBase):
    pass


class CitizenResponse(CitizenBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
