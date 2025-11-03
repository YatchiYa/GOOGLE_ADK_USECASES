
import os
import smtplib
from pathlib import Path
from typing import Optional, List
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from loguru import logger


TOOL_CONFIG = {
    "email": {
        "smtp_server": os.getenv("SMTP_SERVER", "smtp.protonmail.ch"),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "smtp_username": os.getenv("SMTP_USERNAME", "no-reply@quantalogic.app"),
        "smtp_password": os.getenv("SMTP_PASSWORD", "NG7PDXGHEYY8RPN8"),
        "from_email": os.getenv("FROM_EMAIL", "no-reply@quantalogic.app"),
        "from_name": os.getenv("FROM_NAME", "Quantalogic Support Team"),
    },
    # Add configurations for other tools as needed
}

def send_email(
    to: str,
    subject: str,
    body: str, 
    attachments: Optional[str] = "",
    is_html: Optional[str] = "False"
) -> str:
    """Send an email with optional attachments using SMTP."""

    def parse_attachments(attachments_str: Optional[str] = "") -> List[str]:
        if not attachments_str:
            return []
        paths = [path.strip() for path in attachments_str.split(",")]
        valid_paths = [p for p in paths if os.path.isfile(p)]
        for p in paths:
            if not os.path.isfile(p):
                logger.warning(f"Attachment file not found or not a file: {p}")
        return valid_paths

    try:
        is_html_bool = is_html.lower() in ("true", "t", "1", "yes", "y")
        
        # Create email message
        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["From"] = f"{TOOL_CONFIG['email']['from_name']} <{TOOL_CONFIG['email']['from_email']}>"
        msg["To"] = to

        msg.attach(MIMEText(body, "html" if is_html_bool else "plain"))

        # Attach files
        for file_path in parse_attachments(attachments):
            try:
                with open(file_path, "rb") as file:
                    part = MIMEApplication(file.read(), Name=Path(file_path).name)
                part["Content-Disposition"] = f'attachment; filename="{Path(file_path).name}"'
                msg.attach(part)
                logger.debug(f"Attached file: {file_path}")
            except Exception as e:
                logger.error(f"Failed to attach file {file_path}: {e}")
                return f"Error attaching file {file_path}: {e}"

        # Send email
        with smtplib.SMTP(TOOL_CONFIG['email']['smtp_server'], TOOL_CONFIG['email']['smtp_port']) as server:
            server.starttls()
            server.login(TOOL_CONFIG['email']['smtp_username'], TOOL_CONFIG['email']['smtp_password'])
            server.send_message(msg)

        attachment_count = len(parse_attachments(attachments))
        attachment_msg = f" with {attachment_count} attachment{'s' if attachment_count != 1 else ''}" if attachment_count else ""
        logger.info(f"Email sent successfully to {to}{attachment_msg}")
        return f"Email sent successfully to {to}{attachment_msg}"

    except smtplib.SMTPAuthenticationError:
        error_msg = "SMTP authentication failed. Check your username and password."
        logger.error(error_msg)
        return error_msg
    except smtplib.SMTPException as e:
        error_msg = f"SMTP error occurred: {e}"
        logger.error(error_msg)
        return error_msg
    except Exception as e:
        error_msg = f"Error sending email: {e}"
        logger.error(error_msg)
        return error_msg

 