from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.sale import Sale
from app.models.pond import Pond, StockMutation
from app.models.accounting import CashAccount
from app.schemas.sale import SaleCreate, SaleResponse, PayReceivableRequest
from app.schemas.accounting import JournalItemSchema
from app.services.accounting_service import create_double_entry_journal

router = APIRouter(prefix="/sales", tags=["Penjualan & Piutang"])

@router.get("", response_model=list[SaleResponse])
def get_all_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.created_at.desc()).all()

@router.post("", response_model=SaleResponse)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    date_str = datetime.now().strftime("%Y-%m-%d")
    total_amount = round(payload.weight_kg * payload.price_per_kg, 2)
    
    # Generate sequential invoice no
    count = db.query(Sale).count() + 1
    invoice_no = f"INV-{date_str.replace('-', '')[:6]}-{str(count).zfill(3)}"

    cash_acc = None
    if payload.payment_status == "LUNAS" and payload.cash_account_id:
        cash_acc = db.query(CashAccount).filter(CashAccount.id == payload.cash_account_id).first()
        if not cash_acc:
            raise HTTPException(status_code=400, detail="Dompet Kas/Bank tidak valid")

    sale = Sale(
        invoice_no=invoice_no,
        date=date_str,
        buyer_name=payload.buyer_name,
        pond_id=payload.pond_id,
        quantity_ekor=payload.quantity_ekor,
        weight_kg=payload.weight_kg,
        price_per_kg=payload.price_per_kg,
        total_amount=total_amount,
        payment_status=payload.payment_status,
        due_date=payload.due_date,
        paid_date=date_str if payload.payment_status == "LUNAS" else None,
        cash_account_id=cash_acc.id if cash_acc else None,
        cash_account_name=cash_acc.name if cash_acc else None,
        note=payload.note,
    )
    db.add(sale)

    # 1. Update Cash Balance & Auto Double-Entry Journal
    if payload.payment_status == "LUNAS" and cash_acc:
        cash_acc.balance += total_amount
        create_double_entry_journal(
            db=db,
            date=date_str,
            description=f"Penjualan Tunai {invoice_no} ({payload.buyer_name})",
            ref_type="PENJUALAN",
            ref_id=invoice_no,
            items=[
                JournalItemSchema(account_code=cash_acc.code, account_name=cash_acc.name, debit=total_amount, credit=0.0),
                JournalItemSchema(account_code="4001", account_name="Pendapatan Penjualan Ikan Gurame", debit=0.0, credit=total_amount),
            ],
        )
    else:
        # Piutang Usaha
        create_double_entry_journal(
            db=db,
            date=date_str,
            description=f"Penjualan Tempo {invoice_no} ({payload.buyer_name})",
            ref_type="PENJUALAN",
            ref_id=invoice_no,
            items=[
                JournalItemSchema(account_code="1101", account_name="Piutang Usaha", debit=total_amount, credit=0.0),
                JournalItemSchema(account_code="4001", account_name="Pendapatan Penjualan Ikan Gurame", debit=0.0, credit=total_amount),
            ],
        )

    # 2. Panen Stock Mutation if pond selected
    if payload.pond_id:
        pond = db.query(Pond).filter(Pond.id == payload.pond_id).first()
        if pond:
            mutation = StockMutation(
                pond_id=pond.id,
                date=date_str,
                type="PANEN",
                ekor=payload.quantity_ekor,
                weight_kg=payload.weight_kg,
                note=f"Panen penjualan {invoice_no} ({payload.buyer_name})",
                reference_id=invoice_no,
            )
            db.add(mutation)
            pond.total_panen += payload.quantity_ekor
            pond.current_ekor = max(0, pond.current_ekor - payload.quantity_ekor)
            pond.current_kg_estimasi = max(0.0, pond.current_kg_estimasi - payload.weight_kg)

    db.commit()
    db.refresh(sale)
    return sale

@router.post("/{sale_id}/pay", response_model=SaleResponse)
def pay_receivable(sale_id: str, payload: PayReceivableRequest, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Penjualan tidak ditemukan")
    if sale.payment_status == "LUNAS":
        raise HTTPException(status_code=400, detail="Penjualan ini sudah lunas")

    cash_acc = db.query(CashAccount).filter(CashAccount.id == payload.cash_account_id).first()
    if not cash_acc:
        raise HTTPException(status_code=400, detail="Dompet Kas/Bank tidak valid")

    date_str = datetime.now().strftime("%Y-%m-%d")
    sale.payment_status = "LUNAS"
    sale.paid_date = date_str
    sale.cash_account_id = cash_acc.id
    sale.cash_account_name = cash_acc.name

    # Increment cash balance
    cash_acc.balance += sale.total_amount

    # Auto Journal: Debit Kas, Credit Piutang Usaha
    create_double_entry_journal(
        db=db,
        date=date_str,
        description=f"Pelunasan Piutang {sale.invoice_no} ({sale.buyer_name})",
        ref_type="PENJUALAN",
        ref_id=sale.invoice_no,
        items=[
            JournalItemSchema(account_code=cash_acc.code, account_name=cash_acc.name, debit=sale.total_amount, credit=0.0),
            JournalItemSchema(account_code="1101", account_name="Piutang Usaha", debit=0.0, credit=sale.total_amount),
        ],
    )

    db.commit()
    db.refresh(sale)
    return sale

