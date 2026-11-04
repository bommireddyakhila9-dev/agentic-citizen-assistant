from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.notification import CivicNotification
from app.schemas.notification import NotificationResponse, NotificationCreate
from app.services.notification import dispatch_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    ticket: str = Query(None),
    db: Session = Depends(get_db),
):
    """
    Retrieve real-time audit trail of SMS and Email notifications dispatched to citizens.
    """
    query = db.query(CivicNotification)
    if ticket:
        query = query.filter(CivicNotification.ticket_number == ticket.upper().strip())
    return query.order_by(CivicNotification.created_at.desc()).limit(limit).all()


@router.post("/send", response_model=NotificationResponse)
def send_manual_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
):
    """
    Manually dispatch a civic notification to a citizen.
    """
    res = dispatch_notification(
        channel=payload.channel,
        recipient=payload.recipient,
        subject=payload.subject,
        message=payload.message,
        ticket_number=payload.ticket_number,
        db=db,
    )
    if not res.get("success"):
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=res.get("error", "Dispatch failed"))
    
    # Return database record
    return db.query(CivicNotification).filter(CivicNotification.id == res["id"]).first()
