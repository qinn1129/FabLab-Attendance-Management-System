import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SCRIPT_URL = os.getenv("GOOGLE_SCRIPT_URL", "https://script.google.com/macros/s/AKfycbwODJl_Ihn9gIu3WCstBl1drKsiYOQoT3roYiQqJlgvIwY_KB3RjD79_q-2x-JcqlFJ/exec")
WEBAPP_SECRET = os.getenv("WEBAPP_SECRET", "7893402haefudHJFKio&%^*(#G2ghd0")

SENDER_EMAIL = "roughmage33@gmail.com"
SENDER_APP_PASSWORD = os.getenv("SENDER_APP_PASSWORD", "lbkc vyso bifa qmvk")

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465  # SSL


class EmailServiceError(Exception):
    """Raised for any failure fetching recipients or sending mail."""


def fetch_resident_maker_emails() -> List[str]:
    """
    Fetches the "accounts" sheet from the Apps Script backend and returns
    the email addresses of every Resident Maker whose status is "Active".
    """
    if not GOOGLE_SCRIPT_URL:
        raise EmailServiceError(
            "GOOGLE_SCRIPT_URL is not set. Copy .env.example to .env and "
            "paste in the same script URL your React app's .env already uses."
        )
    if not WEBAPP_SECRET:
        raise EmailServiceError(
            "WEBAPP_SECRET is not set. Copy it from your React app's .env."
        )

    params = {"secret": WEBAPP_SECRET, "sheet": "accounts"}
    try:
        response = requests.get(GOOGLE_SCRIPT_URL, params=params, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise EmailServiceError(f"Could not reach Apps Script backend: {exc}") from exc

    data = response.json()
    if isinstance(data, dict) and data.get("error"):
        raise EmailServiceError(f"Backend returned an error: {data['error']}")

    emails = [
        row["email"].strip()
        for row in data
        if row.get("role") == "ResidentMaker"
        and row.get("status") == "Active"
        and row.get("email")
    ]
    return sorted(set(emails))


def fetch_admin_emails() -> List[str]:
    """
    Fetches the "accounts" sheet from the Apps Script backend and returns
    the email addresses of every Admin whose status is "Active".
    """
    if not GOOGLE_SCRIPT_URL:
        raise EmailServiceError(
            "GOOGLE_SCRIPT_URL is not set. Copy .env.example to .env and "
            "paste in the same script URL your React app's .env already uses."
        )
    if not WEBAPP_SECRET:
        raise EmailServiceError(
            "WEBAPP_SECRET is not set. Copy it from your React app's .env."
        )

    params = {"secret": WEBAPP_SECRET, "sheet": "accounts"}
    try:
        response = requests.get(GOOGLE_SCRIPT_URL, params=params, timeout=15)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise EmailServiceError(f"Could not reach Apps Script backend: {exc}") from exc

    data = response.json()
    if isinstance(data, dict) and data.get("error"):
        raise EmailServiceError(f"Backend returned an error: {data['error']}")

    emails = [
        row["email"].strip()
        for row in data
        if row.get("role") == "Admin"
        and row.get("status") == "Active"
        and row.get("email")
    ]
    return sorted(set(emails))


def _build_message(title: str, body: str, pinned: bool = False) -> MIMEMultipart:
    subject = f"[FabLab Announcement] {title}"

    pinned_line = "This announcement is pinned.\n\n" if pinned else ""
    text_body = (
        f"{pinned_line}"
        f"{title}\n"
        f"{'-' * len(title)}\n\n"
        f"{body}\n\n"
        "— Animo Labs FabLab\n"
        "This is an automated notification. Please do not reply to this email."
    )

    pinned_html = (
        '<p style="color:#d97706;font-weight:600;margin:0 0 12px;">'
        "&#128204; Pinned announcement</p>"
        if pinned
        else ""
    )
    html_body = f"""\
<html>
  <body style="font-family: 'Inter', Arial, sans-serif; background:#f8f9fb; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;
                border:1px solid #eceef2;overflow:hidden;">
      <div style="background:#064e3b;padding:20px 28px;">
        <p style="color:#ecfdf5;font-size:13px;letter-spacing:.05em;text-transform:uppercase;
                  margin:0;font-family:monospace;">Animo Labs FabLab</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:4px 0 0;">
          New Announcement
        </p>
      </div>
      <div style="padding:28px;">
        {pinned_html}
        <h2 style="margin:0 0 12px;color:#0f0f14;font-size:20px;">{title}</h2>
        <p style="color:#333;font-size:14px;line-height:1.6;white-space:pre-wrap;">{body}</p>
      </div>
      <div style="padding:16px 28px;background:#f1f0f6;color:#6b6b80;font-size:12px;">
        This is an automated notification from the Resident Maker Management System.
        Please do not reply to this email.
      </div>
    </div>
  </body>
</html>
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Animo Labs FabLab <{SENDER_EMAIL}>"
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))
    return message


def send_announcement_email(
    title: str,
    body: str,
    pinned: bool = False,
    extra_recipients: Optional[List[str]] = None,
) -> Dict:
    """
    Sends a "new announcement" notification to every active Resident Maker.
    Recipients are placed in BCC so RMs never see each other's addresses.
    """
    if not title.strip() or not body.strip():
        raise EmailServiceError("Both a title and a body are required.")
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for carljustinesa@gmail.com "
            "and put it in .env."
        )

    recipients = fetch_resident_maker_emails()
    if extra_recipients:
        recipients = sorted(set(recipients) | set(extra_recipients))

    if not recipients:
        return {
            "sent": 0,
            "recipients": [],
            "failed": [],
            "note": "No active Resident Makers to notify.",
        }

    message = _build_message(title, body, pinned)
    message["To"] = SENDER_EMAIL
    message["Bcc"] = ", ".join(recipients)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipients, message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send email: {exc}") from exc

    return {"sent": len(recipients), "recipients": recipients, "failed": []}


def _build_commission_confirmation_message(
    client_name: str,
    client_email: str,
    commission_id: str,
    service: str,
    color: str,
    filament: str,
    urgency: str,
    submitted: str,
) -> MIMEMultipart:
    """Build a confirmation email for an approved commission request."""
    subject = f"[FabLab] Your commission request {commission_id} is confirmed"

    text_body = f"""\
Dear {client_name},

Thank you for submitting your 3D printing request to Animo Labs FabLab. We're pleased to inform you that your commission request has been confirmed and is now being processed.

Request Details:
- Commission ID: {commission_id}
- Service: {service}
- Material: {color} {filament}
- Urgency: {urgency}
- Submitted: {submitted}

Your request is now in our fabrication queue. A Resident Maker will be assigned to your project shortly.

You will receive updates as your commission progresses through the workflow.

Thank you for choosing Animo Labs FabLab!

— Animo Labs FabLab
This is an automated notification. Please do not reply to this email.
"""

    html_body = f"""\
<html>
  <body style="font-family: 'Inter', Arial, sans-serif; background:#f8f9fb; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;
                border:1px solid #eceef2;overflow:hidden;">
      <div style="background:#064e3b;padding:20px 28px;">
        <p style="color:#ecfdf5;font-size:13px;letter-spacing:.05em;text-transform:uppercase;
                  margin:0;font-family:monospace;">Animo Labs FabLab</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:4px 0 0;">
          Commission Request Confirmed
        </p>
      </div>
      <div style="padding:28px;">
        <p style="color:#333;font-size:14px;line-height:1.6;">
          Dear {client_name},
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Thank you for submitting your 3D printing request. We're pleased to inform you that your commission request has been <strong>confirmed</strong> and is now being processed.
        </p>

        <div style="background:#f1f0f6;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="color:#0f0f14;font-size:14px;margin:0 0 8px;"><strong>Request Details:</strong></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Commission ID:</span> <span style="font-family:monospace;color:#059669;">{commission_id}</span></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Service:</span> {service}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Material:</span> {color} {filament}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Urgency:</span> {urgency}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Submitted:</span> {submitted}</p>
        </div>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Your request is now in our fabrication queue. A Resident Maker will be assigned to your project shortly.
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          You will receive updates as your commission progresses through the workflow.
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;margin-top:20px;">
          Thank you for choosing Animo Labs FabLab!
        </p>
      </div>
      <div style="padding:16px 28px;background:#f1f0f6;color:#6b6b80;font-size:12px;">
        This is an automated notification from the Resident Maker Management System.
        Please do not reply to this email.
      </div>
    </div>
  </body>
</html>
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Animo Labs FabLab <{SENDER_EMAIL}>"
    message["To"] = client_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))
    return message


def send_commission_confirmation_email(
    client_name: str,
    client_email: str,
    commission: Dict,
) -> Dict:
    """Sends a confirmation email to a client when their commission request is approved."""
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for carljustinesa@gmail.com "
            "and put it in .env."
        )

    commission_id = commission.get("id", "Unknown")
    service = commission.get("service", "Unknown Service")
    color = commission.get("color", "Unknown")
    filament = commission.get("filament", "Unknown")
    urgency = commission.get("urgency", "Standard (3-5 days)")
    submitted = commission.get("submitted", "Unknown")

    if not client_email:
        return {"sent": False, "recipients": [], "failed": [], "note": "No client email provided."}

    message = _build_commission_confirmation_message(
        client_name=client_name,
        client_email=client_email,
        commission_id=commission_id,
        service=service,
        color=color,
        filament=filament,
        urgency=urgency,
        submitted=submitted,
    )

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [client_email], message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send confirmation email: {exc}") from exc

    return {"sent": True, "recipients": [client_email], "failed": []}


def _build_commission_rejection_message(
    client_name: str,
    client_email: str,
    commission_id: str,
    service: str,
    reason: str,
) -> MIMEMultipart:
    """Build a rejection notice email for an invalid/declined commission request."""
    subject = f"[FabLab] Update on your commission request {commission_id}"

    reason_text = f"\nReason provided: {reason}\n" if reason else ""
    text_body = f"""\
Dear {client_name},

Thank you for your interest in Animo Labs FabLab. After review, we're unable to move forward with your commission request at this time.

Request Details:
- Commission ID: {commission_id}
- Service: {service}
{reason_text}
If you believe this was a mistake or would like more information, please reach out to us directly, or feel free to submit a new request with updated details.

— Animo Labs FabLab
This is an automated notification. Please do not reply to this email.
"""

    reason_html = (
        f'<p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Reason:</span> {reason}</p>'
        if reason
        else ""
    )
    html_body = f"""\
<html>
  <body style="font-family: 'Inter', Arial, sans-serif; background:#f8f9fb; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;
                border:1px solid #eceef2;overflow:hidden;">
      <div style="background:#7f1d1d;padding:20px 28px;">
        <p style="color:#fee2e2;font-size:13px;letter-spacing:.05em;text-transform:uppercase;
                  margin:0;font-family:monospace;">Animo Labs FabLab</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:4px 0 0;">
          Commission Request Update
        </p>
      </div>
      <div style="padding:28px;">
        <p style="color:#333;font-size:14px;line-height:1.6;">
          Dear {client_name},
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Thank you for your interest in Animo Labs FabLab. After review, we're unable to move forward with your commission request at this time.
        </p>

        <div style="background:#f1f0f6;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="color:#0f0f14;font-size:14px;margin:0 0 8px;"><strong>Request Details:</strong></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Commission ID:</span> <span style="font-family:monospace;color:#dc2626;">{commission_id}</span></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Service:</span> {service}</p>
          {reason_html}
        </div>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          If you believe this was a mistake or would like more information, please reach out to us directly, or feel free to submit a new request with updated details.
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;margin-top:20px;">
          Thank you for your understanding.
        </p>
      </div>
      <div style="padding:16px 28px;background:#f1f0f6;color:#6b6b80;font-size:12px;">
        This is an automated notification from the Resident Maker Management System.
        Please do not reply to this email.
      </div>
    </div>
  </body>
</html>
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Animo Labs FabLab <{SENDER_EMAIL}>"
    message["To"] = client_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))
    return message


def send_commission_rejection_email(
    client_name: str,
    client_email: str,
    commission: Dict,
    reason: str = "",
) -> Dict:
    """Sends a rejection notice to a client when their commission request is declined."""
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for carljustinesa@gmail.com "
            "and put it in .env."
        )

    commission_id = commission.get("id", "Unknown")
    service = commission.get("service", "Unknown Service")

    if not client_email:
        return {"sent": False, "recipients": [], "failed": [], "note": "No client email provided."}

    message = _build_commission_rejection_message(
        client_name=client_name,
        client_email=client_email,
        commission_id=commission_id,
        service=service,
        reason=reason,
    )

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [client_email], message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send rejection email: {exc}") from exc

    return {"sent": True, "recipients": [client_email], "failed": []}


def _build_rm_assignment_message(
    rm_name: str,
    rm_email: str,
    commission_id: str,
    client_name: str,
    service: str,
) -> MIMEMultipart:
    """Build a "you've been assigned a new commission" email for a Resident Maker."""
    subject = f"[FabLab] New commission assigned to you: {commission_id}"

    text_body = f"""\
Hi {rm_name},

A new commission has been auto-assigned to you based on current workload.

Assignment Details:
- Commission ID: {commission_id}
- Client: {client_name}
- Service: {service}

Please log in to the RM Portal to review the full details and begin work.

— Animo Labs FabLab
This is an automated notification. Please do not reply to this email.
"""

    html_body = f"""\
<html>
  <body style="font-family: 'Inter', Arial, sans-serif; background:#f8f9fb; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;
                border:1px solid #eceef2;overflow:hidden;">
      <div style="background:#064e3b;padding:20px 28px;">
        <p style="color:#ecfdf5;font-size:13px;letter-spacing:.05em;text-transform:uppercase;
                  margin:0;font-family:monospace;">Animo Labs FabLab</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:4px 0 0;">
          New Commission Assigned
        </p>
      </div>
      <div style="padding:28px;">
        <p style="color:#333;font-size:14px;line-height:1.6;">
          Hi {rm_name},
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          A new commission has been <strong>auto-assigned</strong> to you based on current workload.
        </p>

        <div style="background:#f1f0f6;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="color:#0f0f14;font-size:14px;margin:0 0 8px;"><strong>Assignment Details:</strong></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Commission ID:</span> <span style="font-family:monospace;color:#059669;">{commission_id}</span></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Client:</span> {client_name}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Service:</span> {service}</p>
        </div>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Please log in to the RM Portal to review the full details and begin work.
        </p>
      </div>
      <div style="padding:16px 28px;background:#f1f0f6;color:#6b6b80;font-size:12px;">
        This is an automated notification from the Resident Maker Management System.
        Please do not reply to this email.
      </div>
    </div>
  </body>
</html>
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Animo Labs FabLab <{SENDER_EMAIL}>"
    message["To"] = rm_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))
    return message


def send_rm_assignment_email(
    rm_name: str,
    rm_email: str,
    commission_id: str,
    client_name: str,
    service: str,
) -> Dict:
    """Sends a "new commission assigned to you" email to the Resident Maker chosen by auto-assignment."""
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for carljustinesa@gmail.com "
            "and put it in .env."
        )

    if not rm_email:
        return {"sent": False, "recipients": [], "failed": [], "note": "No RM email provided."}

    message = _build_rm_assignment_message(
        rm_name=rm_name,
        rm_email=rm_email,
        commission_id=commission_id,
        client_name=client_name,
        service=service,
    )

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [rm_email], message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send RM assignment email: {exc}") from exc

    return {"sent": True, "recipients": [rm_email], "failed": []}


def _build_admin_notification_message(
    client_name: str,
    client_email: str,
    client_type: str,
    commission_id: str,
    service: str,
    submitted: str,
) -> MIMEMultipart:
    """Build an admin notification email for new commission requests."""
    subject = f"[FabLab] New Commission Request: {commission_id}"

    text_body = f"""\
New Commission Request Submitted

Request Details:
- Commission ID: {commission_id}
- Client: {client_name}
- Client Email: {client_email}
- Client Type: {client_type}
- Service: {service}
- Submitted: {submitted}

Please review and approve or reject this commission in the Admin Portal.

— Animo Labs FabLab
This is an automated notification. Please do not reply to this email.
"""

    html_body = f"""\
<html>
  <body style="font-family: 'Inter', Arial, sans-serif; background:#f8f9fb; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;
                border:1px solid #eceef2;overflow:hidden;">
      <div style="background:#052e16;padding:20px 28px;">
        <p style="color:#ecfdf5;font-size:13px;letter-spacing:.05em;text-transform:uppercase;
                  margin:0;font-family:monospace;">Animo Labs FabLab</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:4px 0 0;">
          New Commission Request
        </p>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 12px;color:#0f0f14;font-size:20px;">{commission_id}</h2>

        <div style="background:#f1f0f6;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="color:#0f0f14;font-size:14px;margin:0 0 8px;"><strong>Request Details:</strong></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Client:</span> {client_name}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Email:</span> {client_email}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Type:</span> {client_type}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Service:</span> {service}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Submitted:</span> {submitted}</p>
        </div>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Please review and approve or reject this commission in the Admin Portal.
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;margin-top:20px;">
          Thank you!
        </p>
      </div>
      <div style="padding:16px 28px;background:#f1f0f6;color:#6b6b80;font-size:12px;">
        This is an automated notification from the Resident Maker Management System.
        Please do not reply to this email.
      </div>
    </div>
  </body>
</html>
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Animo Labs FabLab <{SENDER_EMAIL}>"
    message["To"] = SENDER_EMAIL
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))
    return message


def send_admin_notification_email(
    client_name: str,
    client_email: str,
    client_type: str,
    commission_id: str,
    service: str,
    submitted: str,
) -> Dict:
    """Sends a notification email to all active Admins when a new commission is submitted."""
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for carljustinesa@gmail.com "
            "and put it in .env."
        )

    recipients = fetch_admin_emails()

    if not recipients:
        return {"sent": 0, "recipients": [], "failed": [], "note": "No active Admins to notify."}

    message = _build_admin_notification_message(
        client_name=client_name,
        client_email=client_email,
        client_type=client_type,
        commission_id=commission_id,
        service=service,
        submitted=submitted,
    )
    message["Bcc"] = ", ".join(recipients)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipients, message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send admin notification email: {exc}") from exc

    return {"sent": len(recipients), "recipients": recipients, "failed": []}


def _build_client_queue_notification_message(
    client_name: str,
    client_email: str,
    commission_id: str,
    service: str,
    submitted: str,
) -> MIMEMultipart:
    """Build a queue notification email for a client when their commission is submitted."""
    subject = f"[FabLab] Your commission request {commission_id} is pending review"

    text_body = f"""\
Dear {client_name},

Thank you for submitting your 3D printing request to Animo Labs FabLab. We have received your commission request and it is now pending review by our Resident Makers.

Request Details:
- Commission ID: {commission_id}
- Service: {service}
- Submitted: {submitted}

Your request has been added to our admin queue for approval. A Resident Maker will review your request and contact you shortly with pricing and estimated completion time.

You will receive another email once your commission is approved and processing begins.

Thank you for choosing Animo Labs FabLab!

— Animo Labs FabLab
This is an automated notification. Please do not reply to this email.
"""

    html_body = f"""\
<html>
  <body style="font-family: 'Inter', Arial, sans-serif; background:#f8f9fb; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;
                border:1px solid #eceef2;overflow:hidden;">
      <div style="background:#064e3b;padding:20px 28px;">
        <p style="color:#ecfdf5;font-size:13px;letter-spacing:.05em;text-transform:uppercase;
                  margin:0;font-family:monospace;">Animo Labs FabLab</p>
        <p style="color:#ffffff;font-size:18px;font-weight:700;margin:4px 0 0;">
          Commission Request Received
        </p>
      </div>
      <div style="padding:28px;">
        <p style="color:#333;font-size:14px;line-height:1.6;">
          Dear {client_name},
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Thank you for submitting your 3D printing request. Your commission request has been received and is now pending review by our Resident Makers.
        </p>

        <div style="background:#f1f0f6;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="color:#0f0f14;font-size:14px;margin:0 0 8px;"><strong>Request Details:</strong></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Commission ID:</span> <span style="font-family:monospace;color:#059669;">{commission_id}</span></p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Service:</span> {service}</p>
          <p style="color:#333;font-size:13px;margin:4px 0;"><span style="color:#6b6b80;">Submitted:</span> {submitted}</p>
        </div>

        <p style="color:#333;font-size:14px;line-height:1.6;">
          Your request has been added to our admin queue for approval. A Resident Maker will review your request and contact you shortly with pricing and estimated completion time.
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;margin-top:20px;">
          You will receive another email once your commission is approved and processing begins.
        </p>

        <p style="color:#333;font-size:14px;line-height:1.6;margin-top:20px;">
          Thank you for choosing Animo Labs FabLab!
        </p>
      </div>
      <div style="padding:16px 28px;background:#f1f0f6;color:#6b6b80;font-size:12px;">
        This is an automated notification from the Resident Maker Management System.
        Please do not reply to this email.
      </div>
    </div>
  </body>
</html>
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"Animo Labs FabLab <{SENDER_EMAIL}>"
    message["To"] = client_email
    message.attach(MIMEText(text_body, "plain"))
    message.attach(MIMEText(html_body, "html"))
    return message


def send_client_queue_notification_email(
    client_name: str,
    client_email: str,
    commission_id: str,
    service: str,
    submitted: str,
) -> Dict:
    """Sends a notification email to a client when their commission is submitted to the admin queue."""
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for carljustinesa@gmail.com "
            "and put it in .env."
        )

    if not client_email:
        return {"sent": False, "recipients": [], "failed": [], "note": "No client email provided."}

    message = _build_client_queue_notification_message(
        client_name=client_name,
        client_email=client_email,
        commission_id=commission_id,
        service=service,
        submitted=submitted,
    )

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, [client_email], message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send client queue notification email: {exc}") from exc

    return {"sent": True, "recipients": [client_email], "failed": []}


def _cli():
    import argparse

    parser = argparse.ArgumentParser(
        description="Send a FabLab announcement email to all active Resident Makers."
    )
    parser.add_argument("--title", required=True, help="Announcement title")
    parser.add_argument("--body", required=True, help="Announcement body text")
    parser.add_argument("--pinned", action="store_true", help="Mark as pinned")
    args = parser.parse_args()

    try:
        result = send_announcement_email(args.title, args.body, pinned=args.pinned)
    except EmailServiceError as exc:
        print(f"Error: {exc}")
        raise SystemExit(1)

    if result["sent"] == 0:
        print(result.get("note", "No emails were sent."))
    else:
        print(f"Sent to {result['sent']} Resident Maker(s):")
        for email in result["recipients"]:
            print(f"  - {email}")


if __name__ == "__main__":
    _cli()