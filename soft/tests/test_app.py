from io import BytesIO
from pathlib import Path
import sqlite3

try:
    from nexus import create_app
    from nexus.config import Settings
    from nexus.notifications import send_inquiry_notification
    from nexus import notifications as notifications_module
except ModuleNotFoundError:
    from soft.nexus import create_app
    from soft.nexus.config import Settings
    from soft.nexus.notifications import send_inquiry_notification
    from soft.nexus import notifications as notifications_module


def make_client(tmp_path: Path):
    app = create_app({"TESTING": True, "DATABASE": tmp_path / "test.sqlite3", "SECRET_KEY": "test"})
    return app.test_client()


def test_public_pages_are_available(tmp_path):
    client = make_client(tmp_path)
    for page in (
        "/",
        "/services.html",
        "/solutions.html",
        "/portfolio.html",
        "/about.html",
        "/contact.html",
        "/application.html",
        "/blog.html",
        "/privacy-policy.html",
        "/terms-of-service.html",
        "/cookie-policy.html",
        "/app-development.html",
        "/web-development.html",
        "/cloud-services.html",
        "/ui-ux-design.html",
        "/software-solutions.html",
        "/careers.html",
    ):
        response = client.get(page)
        assert response.status_code == 200
        assert b"Nexus" in response.data or b"NEXUS" in response.data


def test_contact_validation_and_persistence(tmp_path):
    client = make_client(tmp_path)
    response = client.post("/contact", data={"name": "Ada Lovelace", "email": "ada@example.com", "subject": "Partnership", "message": "I would like to discuss a new digital project."})
    assert response.status_code == 201
    assert response.json["inquiry_id"] == 1


def test_application_requires_consent_and_description(tmp_path):
    client = make_client(tmp_path)
    response = client.post("/application", data={"full_name": "Ada Lovelace", "email": "ada@example.com"})
    assert response.status_code == 400
    assert "consent" in response.json["errors"]
    assert "description" in response.json["errors"]


def test_project_request_is_queryable_with_attachment_metadata(tmp_path):
    app = create_app({"TESTING": True, "DATABASE": tmp_path / "test.sqlite3", "SECRET_KEY": "test", "MAX_CONTENT_LENGTH": 12 * 1024 * 1024})
    client = app.test_client()
    response = client.post(
        "/application",
        data={
            "full_name": "Ada Lovelace",
            "email": "ada@example.com",
            "service": "web",
            "project_type": "new",
            "budget": "10k-25k",
            "timeline": "3-months",
            "description": "We need a secure customer portal with reporting, authentication, and an accessible responsive interface.",
            "consent": "on",
            "attachment": (BytesIO(b"project brief"), "brief.pdf"),
        },
        content_type="multipart/form-data",
    )
    assert response.status_code == 201
    with sqlite3.connect(tmp_path / "test.sqlite3") as connection:
        project = connection.execute("SELECT email, service FROM project_requests").fetchone()
        attachment = connection.execute("SELECT original_filename FROM project_attachments").fetchone()
    assert project == ("ada@example.com", "web")
    assert attachment == ("brief.pdf",)


def test_email_notification_contains_submission_details(monkeypatch, tmp_path):
    sent_messages = []

    class FakeSMTP:
        def __init__(self, *_args, **_kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def starttls(self):
            pass

        def login(self, *_args):
            pass

        def send_message(self, message):
            sent_messages.append(message)

    monkeypatch.setattr(notifications_module.smtplib, "SMTP", FakeSMTP)
    settings = Settings(
        secret_key="test",
        database_path=tmp_path / "test.sqlite3",
        upload_directory=tmp_path / "uploads",
        notification_email="owner@example.com",
        smtp_host="smtp.example.com",
        smtp_username="smtp-user",
        smtp_password="smtp-password",
    )
    values = {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "subject": "Partnership",
        "message": "I would like to discuss a new digital project.",
    }

    assert send_inquiry_notification(settings, "contact", values)
    message = sent_messages[0]
    assert message["To"] == "owner@example.com"
    assert message["Reply-To"] == "ada@example.com"
    body = message.get_content()
    assert "Ada Lovelace" in body
    assert "Partnership" in body
    assert "new digital project" in body
