"""Application factory and HTTP routes."""

from pathlib import Path
import logging
import secrets
from flask import Flask, abort, jsonify, render_template, request, send_from_directory
from werkzeug.utils import secure_filename

from .config import Settings
from .notifications import send_inquiry_notification
from .storage import InquiryStore
from .validation import validate_application, validate_contact

ALLOWED_UPLOADS = {"pdf", "doc", "docx", "png", "jpg", "jpeg"}


def create_app(test_config: dict | None = None) -> Flask:
    root = Path(__file__).resolve().parent.parent
    settings = Settings.from_environment(root)
    app = Flask(__name__, static_folder=str(root), static_url_path="", template_folder=str(root))
    app.config.from_mapping(SECRET_KEY=settings.secret_key, MAX_CONTENT_LENGTH=settings.max_upload_bytes + 1024 * 1024)
    if test_config:
        app.config.update(test_config)
    settings.upload_directory.mkdir(parents=True, exist_ok=True)
    store = InquiryStore(Path(app.config.get("DATABASE", settings.database_path)))
    app.extensions["inquiry_store"] = store
    app.extensions["settings"] = settings
    app.logger.setLevel(logging.INFO)

    @app.get("/")
    def home():
        return render_template("index.html", active_page="home")

    @app.get("/<page>.html")
    def page(page: str):
        page_names = {
            "about",
            "application",
            "app-development",
            "blog",
            "careers",
            "cloud-services",
            "contact",
            "cookie-policy",
            "index",
            "portfolio",
            "privacy-policy",
            "services",
            "solutions",
            "software-solutions",
            "terms-of-service",
            "ui-ux-design",
            "web-development",
        }
        if page not in page_names:
            abort(404)
        return render_template(f"{page}.html", active_page=page)

    @app.post("/contact")
    def contact():
        result = validate_contact(request.form)
        if not result.is_valid:
            return jsonify(errors=result.errors), 400
        inquiry_id = store.add_contact(result.values)
        send_inquiry_notification(settings, "contact", result.values)
        app.logger.info("Stored contact inquiry %s", inquiry_id)
        return jsonify(message="Thank you. We will respond within one business day.", inquiry_id=inquiry_id), 201

    @app.post("/application")
    def application():
        result = validate_application(request.form)
        if not result.is_valid:
            return jsonify(errors=result.errors), 400
        upload = request.files.get("attachment")
        attachment = None
        if upload and upload.filename:
            extension = Path(upload.filename).suffix.lower().lstrip(".")
            if extension not in ALLOWED_UPLOADS:
                return jsonify(errors={"attachment": "This file type is not supported."}), 400
            if upload.content_length and upload.content_length > settings.max_upload_bytes:
                return jsonify(errors={"attachment": "Files must be 10 MB or smaller."}), 400
            safe_name = f"{secrets.token_hex(12)}-{secure_filename(upload.filename)}"
            upload.save(settings.upload_directory / safe_name)
            attachment = {
                "original_filename": secure_filename(upload.filename),
                "stored_filename": safe_name,
                "mime_type": upload.mimetype,
                "size_bytes": (settings.upload_directory / safe_name).stat().st_size,
            }
        inquiry_id = store.add_project(result.values, attachment)
        attachment_path = settings.upload_directory / attachment["stored_filename"] if attachment else None
        send_inquiry_notification(settings, "project application", result.values, attachment_path)
        app.logger.info("Stored project inquiry %s", inquiry_id)
        return jsonify(message="Your project request has been received.", inquiry_id=inquiry_id), 201

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify(errors={"attachment": "The uploaded file is too large."}), 413

    @app.get("/<path:filename>")
    def legacy_static(filename: str):
        return send_from_directory(root, filename)

    return app


app = create_app()

if __name__ == "__main__":
    app.run()
