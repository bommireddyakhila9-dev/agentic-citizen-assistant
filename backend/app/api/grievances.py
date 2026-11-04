from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import random

from app.core.database import get_db
from app.models.citizen import Citizen
from app.models.grievance import Grievance
from app.schemas.grievance import GrievanceCreate, GrievanceResponse, GrievanceMapPin, GrievanceStatusUpdate
from app.services.notification import notify_grievance_filed, dispatch_notification

router = APIRouter(prefix="/grievances", tags=["Grievances"])


@router.get("", response_model=List[GrievanceResponse])
def list_grievances(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all citizen grievances, optionally filtered by status or category.
    """
    query = db.query(Grievance)
    if status:
        query = query.filter(Grievance.status.ilike(f"%{status}%"))
    if category:
        query = query.filter(Grievance.category.ilike(f"%{category}%"))
    return query.order_by(Grievance.created_at.desc()).all()


@router.get("/map/pins", response_model=List[GrievanceMapPin])
def get_map_pins(db: Session = Depends(get_db)):
    """
    Retrieve geolocated grievance pins for the interactive civic map.
    """
    records = db.query(Grievance).order_by(Grievance.created_at.desc()).all()
    default_coords = [
        {"lat": 28.6139, "lng": 77.2090, "ward": "Ward 1 - Central"},
        {"lat": 28.6219, "lng": 77.2185, "ward": "Ward 2 - Sector 5"},
        {"lat": 28.6080, "lng": 77.2250, "ward": "Ward 8 - East"},
        {"lat": 28.6290, "lng": 77.2010, "ward": "Ward 4 - North"},
        {"lat": 28.6180, "lng": 77.1950, "ward": "Ward 7 - West"},
    ]

    pins = []
    for idx, g in enumerate(records):
        coord = default_coords[idx % len(default_coords)]
        lat = g.latitude if g.latitude is not None else coord["lat"]
        lng = g.longitude if g.longitude is not None else coord["lng"]
        ward = g.ward_number or coord["ward"]

        pins.append(GrievanceMapPin(
            id=g.id,
            ticket_number=g.ticket_number,
            title=g.title,
            category=g.category,
            status=g.status,
            priority=g.priority or "Medium",
            location=g.location or "Municipal District",
            ward_number=ward,
            latitude=lat,
            longitude=lng,
            attachment_url=g.attachment_url,
            created_at=g.created_at,
        ))
    return pins


@router.get("/{ticket_number}", response_model=GrievanceResponse)
def get_grievance_status(ticket_number: str, db: Session = Depends(get_db)):
    """
    Look up a civic grievance by its tracking ticket number (e.g., GRV-1001).
    """
    grievance = db.query(Grievance).filter(
        Grievance.ticket_number == ticket_number.upper().strip()
    ).first()

    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grievance ticket '{ticket_number}' not found in municipal records."
        )
    return grievance


@router.post("", response_model=GrievanceResponse, status_code=status.HTTP_201_CREATED)
def file_grievance(payload: GrievanceCreate, db: Session = Depends(get_db)):
    """
    File a new civic grievance linked to a citizen's registered phone number.
    Generates a unique tracking ticket number and dispatches SMS/Email notification.
    """
    clean_phone = payload.citizen_phone.strip()
    citizen = db.query(Citizen).filter(Citizen.phone == clean_phone).first()
    if not citizen:
        citizen = Citizen(
            full_name="Registered Citizen",
            phone=clean_phone,
            email=f"citizen_{clean_phone}@municipal.gov",
            address=payload.location or "Municipal Ward",
            ward_number=payload.ward_number or "General Ward"
        )
        db.add(citizen)
        db.commit()
        db.refresh(citizen)

    random_id = random.randint(1000, 9999)
    ticket_number = f"GRV-{random_id}"

    new_grievance = Grievance(
        ticket_number=ticket_number,
        citizen_id=citizen.id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        ward_number=payload.ward_number or citizen.ward_number,
        latitude=payload.latitude,
        longitude=payload.longitude,
        attachment_url=payload.attachment_url,
        priority=payload.priority or "Medium",
        status="Pending",
        department_notes="Ticket logged in municipal queue. Awaiting departmental assignment."
    )
    db.add(new_grievance)
    db.commit()
    db.refresh(new_grievance)

    notify_grievance_filed(
        ticket_number=ticket_number,
        title=payload.title,
        category=payload.category,
        phone=citizen.phone,
        email=citizen.email,
        db=db
    )

    return new_grievance


@router.patch("/{ticket_number}/status", response_model=GrievanceResponse)
def update_grievance_status(
    ticket_number: str,
    payload: GrievanceStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Municipal Officer / Admin endpoint to update grievance status and enter official department notes.
    Dispatches automated SMS/Email notification to the citizen.
    """
    clean_ticket = ticket_number.upper().strip()
    grievance = db.query(Grievance).filter(Grievance.ticket_number == clean_ticket).first()
    if not grievance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grievance ticket '{clean_ticket}' not found in municipal records."
        )

    grievance.status = payload.status
    if payload.department_notes:
        officer = payload.officer_name or "Municipal Officer"
        grievance.department_notes = f"{payload.department_notes} [Actioned by {officer}]"

    db.commit()
    db.refresh(grievance)

    citizen = grievance.citizen
    if citizen:
        alert_msg = (
            f"🏛️ CitizenConnect Alert: Status for ticket {clean_ticket} has been updated to [{payload.status}]. "
            f"Officer Note: {payload.department_notes}"
        )
        dispatch_notification(
            channel="SMS",
            recipient=citizen.phone,
            subject=f"Status Update: {clean_ticket} is now {payload.status}",
            message=alert_msg,
            ticket_number=clean_ticket,
            db=db,
        )
        if citizen.email:
            dispatch_notification(
                channel="EMAIL",
                recipient=citizen.email,
                subject=f"Official Update: Grievance {clean_ticket} - {payload.status}",
                message=alert_msg,
                ticket_number=clean_ticket,
                db=db,
            )

    return grievance
