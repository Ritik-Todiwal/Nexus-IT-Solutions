# Nexus Digital

Nexus Digital is a Flask-powered digital services website that preserves the original marketing experience while adding production-minded inquiry workflows.

## Features

- Responsive home, services, solutions, portfolio, about, contact, and project application pages.
- Portfolio and technology filtering, FAQ accordion, mobile navigation, animated counters, scroll effects, and file upload UX.
- Server-side validation for contact messages and four-step project requests.
- SQLite persistence for inquiries.
- Normalized SQLite schema for services, industry solutions, portfolio projects, FAQs, contact messages, project requests, and uploaded attachments.
- Secure randomized upload names, extension allow-listing, size limits, and environment-backed configuration.
- JSON responses suitable for the existing browser forms or future API clients.

## Technology Stack

- Python 3.11+
- Flask 3.1+
- SQLite
- HTML, CSS, and vanilla JavaScript
- pytest for automated tests

## Installation

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Alternatively install the package with test extras:

```powershell
python -m pip install -e ".[test]"
```

## Configuration

Copy `.env.example` to `.env` or set environment variables in the hosting environment. `NEXUS_SECRET_KEY` should be a long random value in production. Data defaults to `data/nexus.sqlite3` and uploads to `data/uploads`.

To receive an email for every contact message and project application, configure `NEXUS_NOTIFICATION_EMAIL`, `NEXUS_SMTP_HOST`, `NEXUS_SMTP_PORT`, `NEXUS_SMTP_USERNAME`, and `NEXUS_SMTP_PASSWORD`. Use `NEXUS_SMTP_USE_TLS=true` for most SMTP providers on port 587, or `NEXUS_SMTP_USE_SSL=true` for providers that require implicit TLS, commonly on port 465. `NEXUS_SMTP_FROM` is optional and defaults to the SMTP username or notification address. SMTP credentials must be supplied through environment variables and never committed to the repository.

## Usage

```powershell
flask --app nexus run --debug
```

Open `http://127.0.0.1:5000/`. The original `.html` URLs remain available for compatibility with existing links.

From the workspace parent directory, the equivalent launcher is:

```powershell
py app.py
```

## Project Structure

- `nexus/factory.py`: application factory and routes.
- `nexus/config.py`: environment-backed settings.
- `nexus/validation.py`: form validation and normalization.
- `nexus/storage.py`: SQLite inquiry repository.
- `database.sql`: relational schema, indexes, constraints, and operational query examples.
- `tests/`: route and validation tests.
- `css/`, `js/`, and HTML pages: retained presentation and interaction layer.

## Development and Testing

Run tests with:

```powershell
python -m pytest -q
```

## Database Queries

The application creates the configured SQLite database automatically from `database.sql`. Useful queries include:

```sql
-- New work waiting for review
SELECT id, full_name, email, service, budget, created_at
FROM project_requests
WHERE status IN ('new', 'reviewing')
ORDER BY created_at DESC;

-- Unanswered contact messages
SELECT id, name, email, subject, created_at
FROM contact_messages
WHERE status = 'new'
ORDER BY created_at DESC;

-- Monthly project request volume
SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS requests
FROM project_requests
GROUP BY month
ORDER BY month DESC;
```

Keep secrets out of source control, use a persistent external data directory in production, and place Flask behind a production WSGI server such as Waitress or Gunicorn.

## Deployment

Set `NEXUS_SECRET_KEY`, `NEXUS_DATABASE`, and `NEXUS_UPLOAD_DIR` in the deployment environment. Run database initialization by starting the application once, then serve it with a WSGI server. Restrict upload directory access and back up the SQLite database or replace the repository with a managed database adapter as traffic grows.
