import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_no = Column(String(50), unique=True, index=True, nullable=False)
    date = Column(String(20), nullable=False)
    category = Column(String(50), nullable=False)  # PAKAN | GAJI | OBAT | OPERASIONAL
    nominal = Column(Float, nullable=False, default=0.0)
    cash_account_id = Column(String(36), nullable=False)
    cash_account_name = Column(String(100), nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SupplierInvoice(Base):
    __tablename__ = "supplier_invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    date = Column(String(20), nullable=False)
    supplier_name = Column(String(100), nullable=False)
    item_category = Column(String(50), nullable=False)  # Pakan | Bibit | Obat / Suplemen | Operasional
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    due_date = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="BELUM_LUNAS")  # LUNAS | BELUM_LUNAS
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class SupplierPayment(Base):
    __tablename__ = "supplier_payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    payment_no = Column(String(50), unique=True, index=True, nullable=False)
    invoice_id = Column(String(36), nullable=False)
    date = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    cash_account_id = Column(String(36), nullable=False)
    cash_account_name = Column(String(100), nullable=True)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CashTransfer(Base):
    __tablename__ = "cash_transfers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transfer_no = Column(String(50), unique=True, index=True, nullable=False)
    date = Column(String(20), nullable=False)
    from_account_id = Column(String(36), nullable=False)
    from_account_name = Column(String(100), nullable=True)
    to_account_id = Column(String(36), nullable=False)
    to_account_name = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False, default=0.0)
    note = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

