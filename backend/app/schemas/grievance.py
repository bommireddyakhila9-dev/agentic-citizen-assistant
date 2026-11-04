from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GrievanceBase(BaseModel):
    category: str
    title: str
    description: str
    location: Optional[str] = None
    ward_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attachment_url: Optional[str] = None
    priority: Optional[str] = "Medium"


class GrievanceCreate(GrievanceBase):
    citizen_phone: str  # Allows citizen to file complaint by providing their verified phone number


class GrievanceStatusUpdate(BaseModel):
    status: str  # "Pending", "In Progress", "Resolved"
    department_notes: str
    officer_name: Optional[str] = "Municipal Officer"


class GrievanceResponse(GrievanceBase):
    id: int
    ticket_number: str
    citizen_id: int
    status: str
    department_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GrievanceMapPin(BaseModel):
    id: int
    ticket_number: str
    title: str
    category: str
    status: str
    priority: str
    location: Optional[str] = None
    ward_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attachment_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
