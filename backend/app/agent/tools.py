from langchain_core.tools import tool
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.citizen import Citizen
from app.models.grievance import Grievance
from app.models.service import Service
from app.services.notification import notify_grievance_filed, dispatch_notification
import random


@tool
def check_ticket_status(ticket_number: str) -> str:
    """
    Check the current status, department notes, and attached evidence for an existing municipal grievance ticket.
    Args:
        ticket_number: The unique tracking ID, e.g. 'GRV-1001', 'GRV-1002'.
    """
    db: Session = SessionLocal()
    try:
        clean_ticket = ticket_number.upper().strip()
        record = db.query(Grievance).filter(Grievance.ticket_number == clean_ticket).first()
        if not record:
            return f"No grievance record found for ticket '{clean_ticket}'. Please verify the ticket number."

        attachment_info = f"Attached Evidence: {record.attachment_url}\n" if record.attachment_url else ""
        location_info = f"Location: {record.location or 'Not specified'} (Ward: {record.ward_number or 'General'})\n"

        return (
            f"Ticket: {record.ticket_number}\n"
            f"Title: {record.title}\n"
            f"Category: {record.category}\n"
            f"Current Status: {record.status}\n"
            f"Priority: {record.priority}\n"
            f"{location_info}"
            f"{attachment_info}"
            f"Department Notes: {record.department_notes or 'Pending department review.'}\n"
            f"Filed On: {record.created_at.strftime('%Y-%m-%d %H:%M')}"
        )
    finally:
        db.close()


@tool
def file_citizen_grievance(
    phone: str,
    category: str,
    title: str,
    description: str,
    location: str,
    priority: str = "Medium",
    attachment_url: str = None
) -> str:
    """
    File and register a new civic grievance in the municipal database.
    Automatically dispatches an SMS and Email notification to the citizen.
    Args:
        phone: Citizen's contact phone number.
        category: Department category (e.g., 'Roads & Infrastructure', 'Water Supply', 'Sanitation', 'Electricity & Lighting').
        title: Short summary of the complaint.
        description: Full details of the incident.
        location: Specific street, landmark, or area of the incident.
        priority: 'Low', 'Medium', 'High', or 'Urgent'.
        attachment_url: Optional URL of an uploaded photo or evidence document.
    """
    db: Session = SessionLocal()
    try:
        clean_phone = phone.strip()
        citizen = db.query(Citizen).filter(Citizen.phone == clean_phone).first()

        # If citizen doesn't exist yet, auto-create a basic profile
        if not citizen:
            citizen = Citizen(
                full_name="Registered Citizen",
                phone=clean_phone,
                email=f"citizen_{clean_phone}@municipal.gov",
                address=location,
                ward_number="General Ward"
            )
            db.add(citizen)
            db.commit()
            db.refresh(citizen)

        ticket_number = f"GRV-{random.randint(1000, 9999)}"
        new_grievance = Grievance(
            ticket_number=ticket_number,
            citizen_id=citizen.id,
            category=category,
            title=title,
            description=description,
            location=location,
            ward_number=citizen.ward_number,
            priority=priority,
            attachment_url=attachment_url,
            status="Pending",
            department_notes="Ticket officially registered via Agentic Citizen Assistant. Assigned to municipal queue."
        )
        db.add(new_grievance)
        db.commit()
        db.refresh(new_grievance)

        # Dispatch automated SMS & Email alert
        notify_grievance_filed(
            ticket_number=ticket_number,
            title=title,
            category=category,
            phone=citizen.phone,
            email=citizen.email,
            db=db
        )

        return (
            f"Grievance successfully registered!\n"
            f"Official Tracking Ticket: {ticket_number}\n"
            f"Department: {category}\n"
            f"Initial Status: Pending\n"
            f"Automated SMS & Email notification dispatched to citizen.\n"
            f"You can track this ticket anytime using ticket ID '{ticket_number}'."
        )
    finally:
        db.close()


@tool
def search_civic_schemes(keyword: str) -> str:
    """
    Search municipal public welfare programs, government subsidies, and civic services.
    Args:
        keyword: Query word like 'solar', 'senior', 'water', 'health', 'rebate', or 'tax'.
    """
    db: Session = SessionLocal()
    try:
        clean_kw = keyword.strip()
        records = db.query(Service).filter(
            (Service.title.ilike(f"%{clean_kw}%")) |
            (Service.category.ilike(f"%{clean_kw}%")) |
            (Service.description.ilike(f"%{clean_kw}%"))
        ).all()

        if not records:
            # Fall back to returning all available schemes
            records = db.query(Service).limit(4).all()

        results = []
        for s in records:
            results.append(
                f"• Scheme: {s.title} ({s.service_code})\n"
                f"  Category: {s.category}\n"
                f"  Summary: {s.description}\n"
                f"  Eligibility: {s.eligibility_criteria}\n"
                f"  Required Documents: {s.documents_required}\n"
            )
        return "\n".join(results)
    finally:
        db.close()


@tool
def lookup_citizen(phone: str) -> str:
    """
    Look up a citizen's registration profile and list of previously filed grievances by phone number.
    Args:
        phone: 10-digit citizen phone number.
    """
    db: Session = SessionLocal()
    try:
        clean_phone = phone.strip()
        citizen = db.query(Citizen).filter(Citizen.phone == clean_phone).first()
        if not citizen:
            return f"No registered citizen found with phone number '{clean_phone}'."

        tickets = [f"{g.ticket_number} ({g.title} - {g.status})" for g in citizen.grievances]
        ticket_str = ", ".join(tickets) if tickets else "No previous complaints filed."

        return (
            f"Citizen Name: {citizen.full_name}\n"
            f"Phone: {citizen.phone}\n"
            f"Address: {citizen.address or 'N/A'}\n"
            f"Ward: {citizen.ward_number or 'N/A'}\n"
            f"History: {ticket_str}"
        )
    finally:
        db.close()


@tool
def send_citizen_alert(phone: str, message: str) -> str:
    """
    Send a direct municipal SMS notification or emergency update to a citizen.
    Args:
        phone: Citizen's 10-digit phone number.
        message: Content of the alert message to deliver.
    """
    res = dispatch_notification(
        channel="SMS",
        recipient=phone,
        subject="Municipal Advisory",
        message=message,
    )
    if res.get("success"):
        return f"SMS notification successfully delivered to {phone}."
    return f"Failed to send alert: {res.get('error')}"
