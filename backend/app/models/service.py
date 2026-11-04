from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.core.database import Base


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    service_code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # Welfare, Environment, Subsidies, Infrastructure
    description = Column(Text, nullable=False)
    eligibility_criteria = Column(Text, nullable=False)
    documents_required = Column(Text, nullable=False)
    application_procedure = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Service(code='{self.service_code}', title='{self.title}')>"
