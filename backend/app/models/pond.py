import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Pond(Base):
    __tablename__ = "ponds"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # PEMBESARAN | BIBIT | PANEN | KARANTINA
    dimension = Column(String(50), nullable=False)  # e.g. "10m x 20m x 1.5m"
    capacity_ekor = Column(Integer, nullable=False, default=0)
    initial_stock = Column(Integer, nullable=False, default=0)
    current_ekor = Column(Integer, nullable=False, default=0)
    current_kg_estimasi = Column(Float, nullable=False, default=0.0)
    total_tebar = Column(Integer, nullable=False, default=0)
    total_mati = Column(Integer, nullable=False, default=0)
    total_panen = Column(Integer, nullable=False, default=0)
    survival_rate = Column(Float, nullable=False, default=100.0)
    status = Column(String(20), nullable=False, default="AKTIF")  # AKTIF | PANEN | PERBAIKAN
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    mutations = relationship("StockMutation", back_populates="pond", cascade="all, delete-orphan")


class StockMutation(Base):
    __tablename__ = "stock_mutations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    pond_id = Column(String(36), ForeignKey("ponds.id"), nullable=False)
    date = Column(String(20), nullable=False)
    type = Column(String(20), nullable=False)  # TEBAR | MATI | PANEN | TRANSFER
    ekor = Column(Integer, nullable=False, default=0)
    weight_kg = Column(Float, nullable=False, default=0.0)
    note = Column(String(255), nullable=True)
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    pond = relationship("Pond", back_populates="mutations")

