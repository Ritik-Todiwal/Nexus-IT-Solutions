"""Local entry point for running Nexus Digital."""

from nexus import create_app

app = create_app()


if __name__ == "__main__":
    app.run()