from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.accounting import CashAccount, ChartOfAccount
from app.models.expense import CashTransfer
from app.schemas.accounting import CashAccountCreate, CashAccountResponse
from app.schemas.expense import CashTransferCreate, CashTransferResponse
from app.schemas.accounting import JournalItemSchema
from app.services.accounting_service import create_double_entry_journal

router = APIRouter(prefix="/cash-accounts", tags=["Dompet Kas & Bank"])

@router.get("", response_model=list[CashAccountResponse])
def get_all_cash_accounts(db: Session = Depends(get_db)):
    return db.query(CashAccount).order_by(CashAccount.code).all()

@router.post("", response_model=CashAccountResponse)
def create_cash_account(payload: CashAccountCreate, db: Session = Depends(get_db)):
    # Generate sequential COA code for asset (1004, 1005, etc.)
    count = db.query(CashAccount).count()
    code = f"10{str(count + 1).zfill(2)}"

    # Also register in Chart of Accounts
    coa = ChartOfAccount(
        code=code,
        name=payload.name,
        category="ASET",
        normal_balance="DEBIT",
        description=f"Rekening {payload.type}: {payload.name}",
    )
    db.add(coa)

    account = CashAccount(
        code=code,
        name=payload.name,
        type=payload.type,
        account_number=payload.account_number,
        balance=payload.initial_balance,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

@router.post("/transfer", response_model=CashTransferResponse)
def transfer_cash(payload: CashTransferCreate, db: Session = Depends(get_db)):
    from_acc = db.query(CashAccount).filter(CashAccount.id == payload.from_account_id).first()
    to_acc = db.query(CashAccount).filter(CashAccount.id == payload.to_account_id).first()

    if not from_acc or not to_acc:
        raise HTTPException(status_code=400, detail="Rekening pengirim atau penerima tidak valid")
    if from_acc.id == to_acc.id:
        raise HTTPException(status_code=400, detail="Rekening asal dan tujuan tidak boleh sama")
    if from_acc.balance < payload.amount:
        raise HTTPException(status_code=400, detail=f"Saldo {from_acc.name} tidak cukup")

    date_str = datetime.now().strftime("%Y-%m-%d")
    count = db.query(CashTransfer).count() + 1
    transfer_no = f"TRF-{date_str.replace('-', '')[:6]}-{str(count).zfill(3)}"

    transfer = CashTransfer(
        transfer_no=transfer_no,
        date=date_str,
        from_account_id=from_acc.id,
        from_account_name=from_acc.name,
        to_account_id=to_acc.id,
        to_account_name=to_acc.name,
        amount=payload.amount,
        note=payload.note,
    )
    db.add(transfer)

    # 1. Update balances
    from_acc.balance -= payload.amount
    to_acc.balance += payload.amount

    # 2. Auto Journal: Debit Rekening Tujuan, Credit Rekening Asal
    create_double_entry_journal(
        db=db,
        date=date_str,
        description=f"Transfer Dana dari {from_acc.name} ke {to_acc.name}",
        ref_type="TRANSFER",
        ref_id=transfer_no,
        items=[
            JournalItemSchema(account_code=to_acc.code, account_name=to_acc.name, debit=payload.amount, credit=0.0),
            JournalItemSchema(account_code=from_acc.code, account_name=from_acc.name, debit=0.0, credit=payload.amount),
        ],
    )

    db.commit()
    db.refresh(transfer)
    return transfer

