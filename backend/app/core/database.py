from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

_db_url = settings.DATABASE_URL

# Normalize any Postgres URL scheme (postgres://, postgresql://, postgresql+psycopg://)
# to the psycopg2 driver, which is the one listed in requirements.txt.
for _prefix in ("postgres://", "postgresql://", "postgresql+psycopg://"):
    if _db_url.startswith(_prefix):
        _db_url = "postgresql+psycopg2://" + _db_url[len(_prefix):]
        break

# SQLite needs check_same_thread=False; PostgreSQL does not use that arg
_connect_args = {"check_same_thread": False} if "sqlite" in _db_url else {}

engine = create_engine(
    _db_url,
    connect_args=_connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
