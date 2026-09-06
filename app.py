"""Workspace-level launcher for the Nexus Digital application."""

from soft.nexus import create_app

app = create_app()


if __name__ == "__main__":
    app.run()
