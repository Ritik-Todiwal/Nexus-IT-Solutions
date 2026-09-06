"""Environment-backed application settings."""

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class Settings:
    secret_key: str
    database_path: Path
    upload_directory: Path
    max_upload_bytes: int = 10 * 1024 * 1024
    notification_email: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    @classmethod
    def from_environment(cls, root: Path) -> "Settings":
        data_directory = root / os.getenv("NEXUS_DATA_DIR", "data")
        return cls(
            secret_key=os.getenv("NEXUS_SECRET_KEY", "development-only-change-me"),
            database_path=Path(os.getenv("NEXUS_DATABASE", data_directory / "nexus.sqlite3")),
            upload_directory=Path(os.getenv("NEXUS_UPLOAD_DIR", data_directory / "uploads")),
            notification_email=os.getenv("NEXUS_NOTIFICATION_EMAIL", ""),
            smtp_host=os.getenv("NEXUS_SMTP_HOST", ""),
            smtp_port=int(os.getenv("NEXUS_SMTP_PORT", "587")),
            smtp_username=os.getenv("NEXUS_SMTP_USERNAME", ""),
            smtp_password=os.getenv("NEXUS_SMTP_PASSWORD", ""),
            smtp_from=os.getenv("NEXUS_SMTP_FROM", ""),
            smtp_use_tls=os.getenv("NEXUS_SMTP_USE_TLS", "true").lower() in {"1", "true", "yes"},
            smtp_use_ssl=os.getenv("NEXUS_SMTP_USE_SSL", "false").lower() in {"1", "true", "yes"},
        )
