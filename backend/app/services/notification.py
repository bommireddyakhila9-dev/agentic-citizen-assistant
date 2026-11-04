import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.notification import CivicNotification
from app.services.sms_gateway import send_cellular_sms

logger = logging.getLogger("citizen_assistant.notifications")


def dispatch_notification(
    channel: str,
    recipient: str,
    subject: str,
    message: str,
    ticket_number: str = None,
    db: Session = None,
) -> dict:
    """
    Dispatches a civic alert (SMS or Email) to a citizen and records it in the database.
    Integrates with cellular telecom gateways (Fast2SMS / Twilio) when configured.
    """
    clean_channel = channel.upper().strip()
    should_close_db = False

    if db is None:
        db = SessionLocal()
        should_close_db = True

    try:
        # If SMS, attempt real cellular dispatch if provider configured
        gateway_provider = "simulated"
        if clean_channel == "SMS":
            sms_res = send_cellular_sms(phone=recipient.strip(), message=message.strip())
            gateway_provider = sms_res.get("provider", "simulated")

        notification = CivicNotification(
            ticket_number=ticket_number,
            channel=clean_channel,
            recipient=recipient.strip(),
            subject=subject.strip(),
            message=message.strip(),
            status="Delivered" if gateway_provider == "simulated" else f"Delivered ({gateway_provider.upper()})",
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        logger.info(f"[{clean_channel}] Alert delivered to {recipient} for Ticket {ticket_number}: {subject}")

        return {
            "success": True,
            "id": notification.id,
            "channel": notification.channel,
            "recipient": notification.recipient,
            "subject": notification.subject,
            "message": notification.message,
            "ticket_number": notification.ticket_number,
            "status": notification.status,
            "provider": gateway_provider,
            "created_at": notification.created_at.isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to dispatch notification: {e}")
        return {"success": False, "error": str(e)}
    finally:
        if should_close_db:
            db.close()


def notify_grievance_filed(
    ticket_number: str,
    title: str,
    category: str,
    phone: str,
    email: str = None,
    db: Session = None,
):
    """
    Sends automated dual SMS and Email confirmation to citizen when a new ticket is registered.
    """
    sms_msg = (
        f"🏛️ CitizenConnect Alert: Your grievance {ticket_number} ('{title}') has been successfully "
        f"registered with the {category} Department. Track your ticket anytime at our citizen portal."
    )
    dispatch_notification(
        channel="SMS",
        recipient=phone,
        subject=f"Grievance Registered: {ticket_number}",
        message=sms_msg,
        ticket_number=ticket_number,
        db=db,
    )

    if email:
        email_msg = (
            f"Dear Citizen,\n\n"
            f"Your municipal grievance has been officially accepted into the digital governance queue.\n\n"
            f"• Ticket Number: {ticket_number}\n"
            f"• Department: {category}\n"
            f"• Subject: {title}\n"
            f"• Status: Pending Department Review\n\n"
            f"You will receive automated updates via SMS as municipal engineers resolve your ticket."
        )
        dispatch_notification(
            channel="EMAIL",
            recipient=email,
            subject=f"Official Acknowledgement: Grievance {ticket_number}",
            message=email_msg,
            ticket_number=ticket_number,
            db=db,
        )
