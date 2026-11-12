from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.accounting import ChartOfAccount, JournalEntry
from app.schemas.accounting import (
    COAResponse,
    JournalEntryCreate,
    JournalEntryResponse,
)
from app.services.accounting_service import (
    create_double_entry_journal,
    calculate_general_ledger,
)

router = APIRouter(prefix="/accounting", tags=["Akuntansi & Pembukuan"])

@router.get("/coa", response_model=list[COAResponse])
def get_chart_of_accounts(db: Session = Depends(get_db)):
    return db.query(ChartOfAccount).order_by(ChartOfAccount.code).all()

@router.get("/journals", response_model=list[JournalEntryResponse])
def get_journal_entries(db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.created_at.desc()).all()

@router.post("/journals", response_model=JournalEntryResponse)
def create_manual_journal(payload: JournalEntryCreate, db: Session = Depends(get_db)):
    try:
        journal = create_double_entry_journal(
            db=db,
            date=payload.date,
            description=payload.description,
            ref_type="MANUAL",
            items=payload.items,
        )
        return journal
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/ledger")
def get_ledger(db: Session = Depends(get_db)):
    return calculate_general_ledger(db)

