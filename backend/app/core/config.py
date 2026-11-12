import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Absolute path to root repository directory (used as SQLite fallback)
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
DB_FILE = ROOT_DIR / "goorame.db"

def _default_db_url() -> str:
    """Return DATABASE_URL from env, or fallback to local SQLite."""
    return os.environ.get("DATABASE_URL", f"sqlite:///{DB_FILE.as_posix()}")

class Settings(BaseSettings):
    APP_NAME: str = "Goorame Mini-ERP Backend"
    API_V1_STR: str = "/api"
    # Railway injects DATABASE_URL for PostgreSQL automatically
    DATABASE_URL: str = _default_db_url()
    JWT_SECRET: str = "goorame-super-secret-key-change-in-prod-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # FRONTEND_URL is set at Railway as the Next.js public URL
    FRONTEND_URL: Optional[str] = None

    @property
    def cors_origins(self) -> list[str]:
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
        ]
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
        # Allow all HTTPS Railway / Vercel subdomains
        return origins

    class Config:
        case_sensitive = True

settings = Settings()

