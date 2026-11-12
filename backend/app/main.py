from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.seeder import seed_database
import app.models  # Ensures all SQLAlchemy models are registered

# Import routers
from app.api.auth import router as auth_router
from app.api.ponds import router as ponds_router
from app.api.sales import router as sales_router
from app.api.expenses import router as expenses_router
from app.api.cash import router as cash_router
from app.api.accounting import router as accounting_router
from app.api.reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create tables in SQLite
    Base.metadata.create_all(bind=engine)

    # 2. Seed initial master data
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API Sistem Informasi Akuntansi & Manajemen Budidaya Ikan Gurame (Double-Entry Bookkeeping & Aquaculture Operations)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.(railway\.app|up\.railway\.app|vercel\.app)$",
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(ponds_router, prefix=settings.API_V1_STR)
app.include_router(sales_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(cash_router, prefix=settings.API_V1_STR)
app.include_router(accounting_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "version": "1.0.0",
    }

