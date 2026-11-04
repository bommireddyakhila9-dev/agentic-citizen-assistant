from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    channel: str  # 'SMS' | 'EMAIL'
    recipient: str
    subject: str
    message: str
    ticket_number: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
