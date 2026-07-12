import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SCRIPT_URL = os.getenv("GOOGLE_SCRIPT_URL", "https://script.google.com/macros/s/AKfycbyWYS8LRjIlQ3xftyxlt6vfI2onRoPka4W3LhppjxX-BK6IwCydZiavSEOrRLRlFX2Q/exec")
WEBAPP_SECRET = os.getenv("WEBAPP_SECRET", "7893402haefudHJFKio&%^*(#G2ghd0")

SENDER_EMAIL = "roughmage33@gmail.com"
SENDER_APP_PASSWORD = os.getenv("SENDER_APP_PASSWORD", "lbkc vyso bifa qmv") #k

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 465  # SSL


class EmailServiceError(Exception):
    """Raised for any failure fetching recipients or sending mail."""


def fetch_resident_maker_emails() -> List[str]:
    """
    Fetches the "accounts" sheet from the Apps Script backend and returns
    the email addresses of every Resident Maker whose status is "Active".

    Mirrors accountsService.fetchResidentMakers() on the frontend, just
    implemented here in Python since this runs as a separate service.
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

    Returns: {"sent": int, "recipients": [...], "failed": [...], "note"?: str}
    """
    if not title.strip() or not body.strip():
        raise EmailServiceError("Both a title and a body are required.")
    if not SENDER_APP_PASSWORD:
        raise EmailServiceError(
            "SENDER_APP_PASSWORD is not set. Generate a Gmail App Password at "
            "https://myaccount.google.com/apppasswords for roughmage33@gmail.com "
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
    message["To"] = SENDER_EMAIL  # visible "To" is just the sender; real list is BCC
    message["Bcc"] = ", ".join(recipients)

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, recipients, message.as_string())
    except smtplib.SMTPException as exc:
        raise EmailServiceError(f"Failed to send email: {exc}") from exc

    return {"sent": len(recipients), "recipients": recipients, "failed": []}


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