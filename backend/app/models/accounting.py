import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ChartOfAccount(Base):
    __tablename__ = "chart_of_accounts"

    code = Column(String(20), primary_key=True)  # e.g. "1001", "1101", "2001", "4001", "5001"
    name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False)  # ASET | KEWAJIBAN | EKUITAS | PENDAPATAN | BEBAN
    normal_balance = Column(String(10), nullable=False)  # DEBIT | KREDIT
    description = Column(String(255), nullable=True)


class CashAccount(Base):
    __tablename__ = "cash_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(20), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # KAS | BANK
    account_number = Column(String(50), nullable=True)
    balance = Column(Float, nullable=False, default=0.0)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entry_number = Column(String(50), unique=True, index=True, nullable=False)
    date = Column(String(20), nullable=False)
    description = Column(String(255), nullable=False)
    ref_type = Column(String(30), nullable=False)  # PENJUALAN | BEBAN | UTANG | TRANSFER | MANUAL
    ref_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    items = relationship("JournalItem", back_populates="journal", cascade="all, delete-orphan")


class JournalItem(Base):
    __tablename__ = "journal_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    journal_id = Column(String(36), ForeignKey("journal_entries.id"), nullable=False)
    account_code = Column(String(20), ForeignKey("chart_of_accounts.code"), nullable=False)
    account_name = Column(String(100), nullable=True)
    debit = Column(Float, nullable=False, default=0.0)
    credit = Column(Float, nullable=False, default=0.0)

    journal = relationship("JournalEntry", back_populates="items")
    account = relationship("ChartOfAccount")

