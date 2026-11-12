import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime
from app.core.database import Base

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_no = Column(String(50), unique=True, index=True, nullable=False)
    date = Column(String(20), nullable=False)
    buyer_name = Column(String(100), nullable=False)
    pond_id = Column(String(36), nullable=True)
    quantity_ekor = Column(Integer, nullable=False, default=0)
    weight_kg = Column(Float, nullable=False, default=0.0)
    price_per_kg = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(20), nullable=False, default="LUNAS")  # LUNAS | TEMPO
    due_date = Column(String(20), nullable=True)
    paid_date = Column(String(20), nullable=True)
    cash_account_id = Column(String(36), nullable=True)
    cash_account_name = Column(String(100), nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

