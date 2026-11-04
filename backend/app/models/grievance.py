from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("citizens.id"), nullable=False)
    
    category = Column(String(100), nullable=False)  # e.g., Roads, Water Supply, Sanitation, Electricity
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255), nullable=True)
    ward_number = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    attachment_url = Column(String(500), nullable=True)  # Photo or evidence document URL
    
    status = Column(String(50), default="Pending", nullable=False)  # Pending, In Progress, Resolved
    priority = Column(String(20), default="Medium")  # Low, Medium, High, Urgent
    department_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to citizen
    citizen = relationship("Citizen", back_populates="grievances")

    def __repr__(self):
        return f"<Grievance(ticket='{self.ticket_number}', status='{self.status}', category='{self.category}')>"
