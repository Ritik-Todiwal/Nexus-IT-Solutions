"""Email notifications for submitted website inquiries."""

from email.message import EmailMessage
from pathlib import Path
import logging
import mimetypes
import smtplib
from typing import Mapping

from .config import Settings

logger = logging.getLogger(__name__)


def send_inquiry_notification(
    settings: Settings,
    inquiry_type: str,
    values: Mapping[str, str],
    attachment_path: Path | None = None,
) -> bool:
    """Send an inquiry email and return whether delivery was attempted successfully."""
    if not settings.notification_email or not settings.smtp_host:
        logger.warning("Email notifications are not configured; skipping %s notification", inquiry_type)
        return False

    message = EmailMessage()
    message["Subject"] = f"New Nexus Digital {inquiry_type} submission"
    message["From"] = settings.smtp_from or settings.smtp_username or settings.notification_email
    message["To"] = settings.notification_email
    submitter_email = values.get("email", "").strip()
    if submitter_email:
        message["Reply-To"] = submitter_email
    message.set_content(_format_submission(inquiry_type, values, attachment_path))

    if attachment_path and attachment_path.is_file():
        content_type, _ = mimetypes.guess_type(attachment_path.name)
        maintype, subtype = (content_type or "application/octet-stream").split("/", 1)
        message.add_attachment(
            attachment_path.read_bytes(),
            maintype=maintype,
            subtype=subtype,
            filename=attachment_path.name,
        )

    try:
        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20) as server:
                _authenticate(server, settings)
                server.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
                if settings.smtp_use_tls:
                    server.starttls()
                _authenticate(server, settings)
                server.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("Could not send %s notification email", inquiry_type)
        return False
    return True


def _authenticate(server: smtplib.SMTP, settings: Settings) -> None:
    if settings.smtp_username and settings.smtp_password:
        server.login(settings.smtp_username, settings.smtp_password)


def _format_submission(inquiry_type: str, values: Mapping[str, str], attachment_path: Path | None) -> str:
    lines = [f"New {inquiry_type} submission", "", "Submission details:"]
    for key, value in values.items():
        label = key.replace("_", " ").title()
        lines.append(f"{label}: {value or '(not provided)'}")
    if attachment_path:
        lines.extend(("", f"Attachment: {attachment_path.name}"))
    return "\n".join(lines)
