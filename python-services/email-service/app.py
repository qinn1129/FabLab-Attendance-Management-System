from flask import Flask, jsonify, request
from flask_cors import CORS

from email_service import (
    EmailServiceError,
    send_announcement_email,
    send_commission_confirmation_email,
    send_commission_rejection_email,
    send_admin_notification_email,
    send_client_queue_notification_email,
    send_rm_assignment_email,
    send_rm_unassignment_email,
)

app = Flask(__name__)
CORS(app)  # allow requests from the Vite dev server (localhost:5173)


@app.post("/api/send-announcement")
def send_announcement():
    payload = request.get_json(silent=True) or {}
    title = (payload.get("title") or "").strip()
    body = (payload.get("body") or "").strip()
    pinned = bool(payload.get("pinned", False))

    if not title or not body:
        return jsonify({"error": "Both 'title' and 'body' are required."}), 400

    try:
        result = send_announcement_email(title, body, pinned=pinned)
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.post("/api/send-commission-confirmation")
def send_commission_confirmation():
    """
    Send a confirmation email to a client when their commission request is approved.
    Expected payload: {
        "clientName": "Client Name",
        "clientEmail": "client@example.com",
        "commission": { ... full commission object ... }
    }
    """
    payload = request.get_json(silent=True) or {}
    client_name = (payload.get("clientName") or "").strip()
    client_email = (payload.get("clientEmail") or "").strip()
    commission = payload.get("commission", {})

    if not client_name or not client_email:
        return jsonify({"error": "Both 'clientName' and 'clientEmail' are required."}), 400

    if not commission:
        return jsonify({"error": "Commission data is required."}), 400

    try:
        result = send_commission_confirmation_email(client_name, client_email, commission)
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.post("/api/send-commission-rejection")
def send_commission_rejection():
    """
    Send a rejection notice to a client when their commission request is declined.
    Expected payload: {
        "clientName": "Client Name",
        "clientEmail": "client@example.com",
        "commission": { ... full commission object ... },
        "reason": "Optional reason text"
    }
    """
    payload = request.get_json(silent=True) or {}
    client_name = (payload.get("clientName") or "").strip()
    client_email = (payload.get("clientEmail") or "").strip()
    commission = payload.get("commission", {})
    reason = (payload.get("reason") or "").strip()

    if not client_name or not client_email:
        return jsonify({"error": "Both 'clientName' and 'clientEmail' are required."}), 400

    if not commission:
        return jsonify({"error": "Commission data is required."}), 400

    try:
        result = send_commission_rejection_email(client_name, client_email, commission, reason)
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.post("/api/send-rm-assignment")
def send_rm_assignment():
    """
    Send a "new commission assigned to you" email to the Resident Maker
    chosen by auto-assignment.
    Expected payload: {
        "rmName": "RM Name",
        "rmEmail": "rm@example.com",
        "commissionId": "COM-XXX",
        "clientName": "Client Name",
        "service": "Service Name"
    }
    """
    payload = request.get_json(silent=True) or {}
    rm_name = (payload.get("rmName") or "").strip()
    rm_email = (payload.get("rmEmail") or "").strip()
    commission_id = (payload.get("commissionId") or "Unknown").strip()
    client_name = (payload.get("clientName") or "Unknown").strip()
    service = (payload.get("service") or "Unknown Service").strip()

    if not rm_name or not rm_email:
        return jsonify({"error": "Both 'rmName' and 'rmEmail' are required."}), 400

    try:
        result = send_rm_assignment_email(rm_name, rm_email, commission_id, client_name, service)
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.post("/api/send-rm-unassignment")
def send_rm_unassignment():
    """
    Send a "you've been unassigned" email to the RM who previously held a
    now-reassigned commission.
    Expected payload: {
        "rmName": "RM Name",
        "rmEmail": "rm@example.com",
        "commissionId": "COM-XXX",
        "clientName": "Client Name",
        "service": "Service Name"
    }
    """
    payload = request.get_json(silent=True) or {}
    rm_name = (payload.get("rmName") or "").strip()
    rm_email = (payload.get("rmEmail") or "").strip()
    commission_id = (payload.get("commissionId") or "Unknown").strip()
    client_name = (payload.get("clientName") or "Unknown").strip()
    service = (payload.get("service") or "Unknown Service").strip()

    if not rm_name or not rm_email:
        return jsonify({"error": "Both 'rmName' and 'rmEmail' are required."}), 400

    try:
        result = send_rm_unassignment_email(rm_name, rm_email, commission_id, client_name, service)
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.post("/api/send-admin-notification")
def send_admin_notification():
    """
    Send a notification email to all active Admins when a new commission is submitted.
    Expected payload: {
        "clientName": "Client Name",
        "clientEmail": "client@example.com",
        "clientType": "Client Type",
        "commissionId": "COM-XXX",
        "service": "Service Name",
        "submitted": "Submission Date"
    }
    """
    payload = request.get_json(silent=True) or {}
    client_name = (payload.get("clientName") or "").strip()
    client_email = (payload.get("clientEmail") or "").strip()
    client_type = (payload.get("clientType") or "Unknown").strip()
    commission_id = (payload.get("commissionId") or "Unknown").strip()
    service = (payload.get("service") or "Unknown Service").strip()
    submitted = (payload.get("submitted") or "Unknown").strip()

    if not client_name or not client_email:
        return jsonify({"error": "Both 'clientName' and 'clientEmail' are required."}), 400

    try:
        result = send_admin_notification_email(
            client_name=client_name,
            client_email=client_email,
            client_type=client_type,
            commission_id=commission_id,
            service=service,
            submitted=submitted,
        )
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.post("/api/send-client-queue-notification")
def send_client_queue_notification():
    """
    Send a notification email to a client when their commission is submitted to the admin queue.
    Expected payload: {
        "clientName": "Client Name",
        "clientEmail": "client@example.com",
        "commissionId": "COM-XXX",
        "service": "Service Name",
        "submitted": "Submission Date"
    }
    """
    payload = request.get_json(silent=True) or {}
    client_name = (payload.get("clientName") or "").strip()
    client_email = (payload.get("clientEmail") or "").strip()
    commission_id = (payload.get("commissionId") or "Unknown").strip()
    service = (payload.get("service") or "Unknown Service").strip()
    submitted = (payload.get("submitted") or "Unknown").strip()

    if not client_name or not client_email:
        return jsonify({"error": "Both 'clientName' and 'clientEmail' are required."}), 400

    try:
        result = send_client_queue_notification_email(
            client_name=client_name,
            client_email=client_email,
            commission_id=commission_id,
            service=service,
            submitted=submitted,
        )
    except EmailServiceError as exc:
        return jsonify({"error": str(exc)}), 502

    return jsonify(result), 200


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(port=5001, debug=True)