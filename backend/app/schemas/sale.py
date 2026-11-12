from typing import Optional
from pydantic import BaseModel

class SaleCreate(BaseModel):
    buyer_name: str
    pond_id: Optional[str] = None
    quantity_ekor: int
    weight_kg: float
    price_per_kg: float
    payment_status: str = "LUNAS"  # LUNAS | TEMPO
    due_date: Optional[str] = None
    cash_account_id: Optional[str] = None
    note: Optional[str] = None

class PayReceivableRequest(BaseModel):
    cash_account_id: str

class SaleResponse(BaseModel):
    id: str
    invoice_no: str
    date: str
    buyer_name: str
    pond_id: Optional[str]
    quantity_ekor: int
    weight_kg: float
    price_per_kg: float
    total_amount: float
    payment_status: str
    due_date: Optional[str]
    paid_date: Optional[str]
    cash_account_id: Optional[str]
    cash_account_name: Optional[str]
    note: Optional[str]

    class Config:
        from_attributes = True

