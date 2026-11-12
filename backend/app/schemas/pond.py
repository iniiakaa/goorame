from typing import Optional, List
from pydantic import BaseModel

class StockMutationResponse(BaseModel):
    id: str
    pond_id: str
    date: str
    type: str
    ekor: int
    weight_kg: float
    note: Optional[str] = None
    reference_id: Optional[str] = None

    class Config:
        from_attributes = True

class PondCreate(BaseModel):
    name: str
    type: str  # PEMBESARAN | BIBIT | PANEN | KARANTINA
    dimension: str
    capacity_ekor: int
    initial_stock: int = 0
    initial_kg: float = 0.0

class PondResponse(BaseModel):
    id: str
    name: str
    type: str
    dimension: str
    capacity_ekor: int
    initial_stock: int
    current_ekor: int
    current_kg_estimasi: float
    total_tebar: int
    total_mati: int
    total_panen: int
    survival_rate: float
    status: str

    class Config:
        from_attributes = True

class TebarBibitRequest(BaseModel):
    pond_id: str
    ekor: int
    weight_kg: float
    note: Optional[str] = "Tebar bibit baru"

class MortalitasRequest(BaseModel):
    pond_id: str
    ekor: int
    weight_kg: float
    note: Optional[str] = "Kematian harian"

