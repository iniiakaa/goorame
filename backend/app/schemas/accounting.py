from typing import Optional, List
from pydantic import BaseModel

class COAResponse(BaseModel):
    code: str
    name: str
    category: str
    normal_balance: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class COACreate(BaseModel):
    code: str
    name: str
    category: str  # ASET | KEWAJIBAN | EKUITAS | PENDAPATAN | BEBAN
    normal_balance: str  # DEBIT | KREDIT
    description: Optional[str] = None

class COAUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    normal_balance: Optional[str] = None
    description: Optional[str] = None

class CashAccountCreate(BaseModel):
    name: str
    type: str  # KAS | BANK
    account_number: Optional[str] = None
    initial_balance: float = 0.0

class CashAccountResponse(BaseModel):
    id: str
    code: str
    name: str
    type: str
    account_number: Optional[str]
    balance: float

    class Config:
        from_attributes = True

class JournalItemSchema(BaseModel):
    account_code: str
    account_name: Optional[str] = None
    debit: float = 0.0
    credit: float = 0.0

class JournalEntryCreate(BaseModel):
    date: str
    description: str
    items: List[JournalItemSchema]

class JournalItemResponse(BaseModel):
    id: str
    account_code: str
    account_name: Optional[str]
    debit: float
    credit: float

    class Config:
        from_attributes = True

class JournalEntryResponse(BaseModel):
    id: str
    entry_number: str
    date: str
    description: str
    ref_type: str
    ref_id: Optional[str]
    items: List[JournalItemResponse]

    class Config:
        from_attributes = True

