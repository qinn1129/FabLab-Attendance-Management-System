from flask import Flask, jsonify, request
from flask_cors import CORS

from email_service import EmailServiceError, send_announcement_email

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


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    app.run(port=5001, debug=True)