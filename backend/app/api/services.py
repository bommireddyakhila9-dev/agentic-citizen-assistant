from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.service import Service
from app.schemas.service import ServiceResponse

router = APIRouter(prefix="/services", tags=["Civic Services & Schemes"])


@router.get("", response_model=List[ServiceResponse])
def list_services(category: Optional[str] = None, db: Session = Depends(get_db)):
    """
    List all public welfare schemes and municipal programs.
    """
    query = db.query(Service)
    if category:
        query = query.filter(Service.category.ilike(f"%{category}%"))
    return query.order_by(Service.title.asc()).all()


@router.get("/{service_code}", response_model=ServiceResponse)
def get_service_details(service_code: str, db: Session = Depends(get_db)):
    """
    Fetch comprehensive details and eligibility criteria for a specific civic scheme code.
    """
    service = db.query(Service).filter(
        Service.service_code == service_code.upper().strip()
    ).first()

    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service scheme '{service_code}' not found."
        )
    return service
