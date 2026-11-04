import json
import logging
import urllib.request
import urllib.parse
import base64
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("citizen_assistant.sms_gateway")


def send_cellular_sms(phone: str, message: str, otp: Optional[str] = None) -> dict:
    """
    Dispatches a real cellular SMS to a citizen's physical mobile handset.
    
    Supported Gateway Providers:
    1. Fast2SMS (Indian Mobile Numbers):
       - Uses Fast2SMS dev/bulkV2 API
       - If `otp` is provided, uses Fast2SMS dedicated OTP route
       - Otherwise uses Quick SMS route (q)
    2. Twilio (Global Mobile Numbers):
       - Uses Twilio REST API via HTTP Basic Auth
    3. Simulated Local Dispatch (Fallback):
       - If no credentials are configured in .env, simulates delivery
         for safe, zero-cost development testing.
    """
    # Clean phone number (strip whitespace, dashes, country code +91 if needed)
    raw_digits = "".join(filter(str.isdigit, phone))
    
    # 1. Check Fast2SMS
    fast2sms_key = settings.FAST2SMS_API_KEY.strip()
    if fast2sms_key:
        try:
            # Fast2SMS requires 10-digit Indian numbers without country code
            dest_phone = raw_digits[-10:] if len(raw_digits) >= 10 else raw_digits
            logger.info(f"[Fast2SMS] Attempting cellular dispatch to +91 {dest_phone}")

            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": fast2sms_key,
                "Content-Type": "application/json",
            }

            if otp:
                payload = {
                    "route": "otp",
                    "variables_values": str(otp),
                    "numbers": dest_phone,
                }
            else:
                payload = {
                    "route": "q",
                    "message": message,
                    "language": "english",
                    "flash": 0,
                    "numbers": dest_phone,
                }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                is_success = data.get("return", False) is True
                logger.info(f"[Fast2SMS] Response: {data}")
                return {
                    "provider": "fast2sms",
                    "success": is_success,
                    "phone": f"+91{dest_phone}",
                    "details": data.get("message", ["SMS dispatched"])[0] if isinstance(data.get("message"), list) else str(data.get("message")),
                }
        except Exception as e:
            logger.error(f"[Fast2SMS] Failed to send SMS: {e}")
            return {
                "provider": "fast2sms",
                "success": False,
                "error": str(e),
            }

    # 2. Check Twilio
    account_sid = settings.TWILIO_ACCOUNT_SID.strip()
    auth_token = settings.TWILIO_AUTH_TOKEN.strip()
    from_number = settings.TWILIO_FROM_NUMBER.strip()

    if account_sid and auth_token and from_number:
        try:
            # Twilio requires E.164 format (e.g. +919876543210)
            if not phone.startswith("+"):
                formatted_phone = f"+91{raw_digits[-10:]}" if len(raw_digits) >= 10 else f"+{raw_digits}"
            else:
                formatted_phone = phone

            logger.info(f"[Twilio] Attempting cellular dispatch to {formatted_phone}")

            twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            post_data = urllib.parse.urlencode({
                "To": formatted_phone,
                "From": from_number,
                "Body": message,
            }).encode("utf-8")

            auth_str = f"{account_sid}:{auth_token}"
            b64_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")

            req = urllib.request.Request(
                twilio_url,
                data=post_data,
                headers={
                    "Authorization": f"Basic {b64_auth}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method="POST",
            )

            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                sid = data.get("sid", "unknown")
                logger.info(f"[Twilio] SMS queued with SID: {sid}")
                return {
                    "provider": "twilio",
                    "success": True,
                    "sid": sid,
                    "phone": formatted_phone,
                }
        except Exception as e:
            logger.error(f"[Twilio] Failed to dispatch SMS: {e}")
            return {
                "provider": "twilio",
                "success": False,
                "error": str(e),
            }

    # 3. Simulated Mode (Zero-cost safe fallback)
    logger.info(f"[Simulated Gateway] SMS dispatched to virtual municipal log for {phone}")
    return {
        "provider": "simulated",
        "success": True,
        "phone": phone,
        "note": "No active cellular provider configured in .env; logged to Civic Dispatch Center.",
    }
