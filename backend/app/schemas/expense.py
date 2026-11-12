from typing import Optional
from pydantic import BaseModel

class ExpenseCreate(BaseModel):
    category: str  # PAKAN | GAJI | OBAT | OPERASIONAL
    nominal: float
    cash_account_id: str
    note: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    expense_no: str
    date: str
    category: str
    nominal: float
    cash_account_id: str
    cash_account_name: Optional[str]
    note: Optional[str]

    class Config:
        from_attributes = True

class SupplierInvoiceCreate(BaseModel):
    supplier_name: str
    item_category: str  # Pakan | Bibit | Obat / Suplemen | Operasional
    total_amount: float
    due_date: str
    note: Optional[str] = None

class SupplierInvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    date: str
    supplier_name: str
    item_category: str
    total_amount: float
    paid_amount: float
    due_date: str
    status: str
    note: Optional[str]

    class Config:
        from_attributes = True

class SupplierPaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    cash_account_id: str
    note: Optional[str] = None

class SupplierPaymentResponse(BaseModel):
    id: str
    payment_no: str
    invoice_id: str
    date: str
    amount: float
    cash_account_id: str
    cash_account_name: Optional[str]
    note: Optional[str]

    class Config:
        from_attributes = True

class CashTransferCreate(BaseModel):
    from_account_id: str
    to_account_id: str
    amount: float
    note: Optional[str] = None

class CashTransferResponse(BaseModel):
    id: str
    transfer_no: str
    date: str
    from_account_id: str
    from_account_name: Optional[str]
    to_account_id: str
    to_account_name: Optional[str]
    amount: float
    note: Optional[str]

    class Config:
        from_attributes = True

