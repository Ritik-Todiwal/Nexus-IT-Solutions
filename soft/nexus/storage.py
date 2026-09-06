"""SQLite persistence for website content and inquiry workflows."""

from pathlib import Path
import sqlite3
from typing import Mapping


class InquiryStore:
    """Repository for contact messages and project requests."""

    def __init__(self, database_path: Path, schema_path: Path | None = None) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.schema_path = schema_path or Path(__file__).resolve().parent.parent / "database.sql"
        with self._connect() as connection:
            connection.executescript(self.schema_path.read_text(encoding="utf-8"))

    def add_contact(self, values: Mapping[str, str]) -> int:
        fields = ("name", "email", "phone", "company", "subject", "message")
        with self._connect() as connection:
            cursor = connection.execute(
                """INSERT INTO contact_messages
                   (name, email, phone, company, subject, message)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                tuple(values.get(field, "") for field in fields),
            )
            return int(cursor.lastrowid)

    def add_project(self, values: Mapping[str, str], attachment: Mapping[str, object] | None = None) -> int:
        fields = ("full_name", "company", "email", "phone", "service", "project_type", "budget", "timeline", "description", "technology", "additional_requirements")
        with self._connect() as connection:
            cursor = connection.execute(
                """INSERT INTO project_requests
                   (full_name, company, email, phone, service, project_type, budget,
                    timeline, description, technology, additional_requirements)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                tuple(values.get(field, "") for field in fields),
            )
            project_id = int(cursor.lastrowid)
            if attachment:
                connection.execute(
                    """INSERT INTO project_attachments
                       (project_request_id, original_filename, stored_filename, mime_type, size_bytes)
                       VALUES (?, ?, ?, ?, ?)""",
                    (project_id, attachment["original_filename"], attachment["stored_filename"], attachment.get("mime_type"), attachment["size_bytes"]),
                )
            return project_id

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection
