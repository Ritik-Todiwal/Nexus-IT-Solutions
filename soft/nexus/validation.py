"""Validation and normalization for public inquiry forms."""

from dataclasses import dataclass
import re
from typing import Mapping

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^[\d\s+()\-.]{7,}$")


@dataclass(frozen=True)
class ValidationResult:
    values: dict[str, str]
    errors: dict[str, str]

    @property
    def is_valid(self) -> bool:
        return not self.errors


def _text(form: Mapping[str, str], key: str) -> str:
    return str(form.get(key, "")).strip()


def validate_contact(form: Mapping[str, str]) -> ValidationResult:
    values = {key: _text(form, key) for key in ("name", "email", "phone", "company", "subject", "message")}
    errors: dict[str, str] = {}
    if not values["name"]:
        errors["name"] = "Please provide your name."
    if not EMAIL_PATTERN.fullmatch(values["email"]):
        errors["email"] = "Enter a valid email address."
    if values["phone"] and not PHONE_PATTERN.fullmatch(values["phone"]):
        errors["phone"] = "Enter a valid phone number."
    if not values["subject"]:
        errors["subject"] = "Please provide a subject."
    if len(values["message"]) < 20:
        errors["message"] = "Your message must contain at least 20 characters."
    return ValidationResult(values, errors)


def validate_application(form: Mapping[str, str]) -> ValidationResult:
    keys = ("full_name", "company", "email", "phone", "service", "project_type", "budget", "timeline", "description", "technology", "additional_requirements")
    values = {key: _text(form, key) for key in keys}
    errors: dict[str, str] = {}
    for key in ("full_name", "email", "service", "project_type", "budget", "timeline"):
        if not values[key]:
            errors[key] = "This field is required."
    if not EMAIL_PATTERN.fullmatch(values["email"]):
        errors["email"] = "Enter a valid email address."
    if values["phone"] and not PHONE_PATTERN.fullmatch(values["phone"]):
        errors["phone"] = "Enter a valid phone number."
    if len(values["description"]) < 50:
        errors["description"] = "Describe your project in at least 50 characters."
    if form.get("consent") not in ("on", "true", "1"):
        errors["consent"] = "Consent is required before submitting your request."
    return ValidationResult(values, errors)
