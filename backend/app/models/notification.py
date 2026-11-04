from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.core.database import Base


class CivicNotification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_number = Column(String(50), nullable=True, index=True)
    channel = Column(String(20), nullable=False)  # SMS or EMAIL
    recipient = Column(String(100), nullable=False)  # Phone number or email
    subject = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(30), default="Delivered")  # Delivered, Queued, Failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Notification({self.channel} to {self.recipient} [{self.status}])>"
