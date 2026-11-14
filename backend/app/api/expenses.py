from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.expense import Expense, SupplierInvoice, SupplierPayment
from app.models.accounting import CashAccount
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    SupplierInvoiceCreate,
    SupplierInvoiceResponse,
    SupplierPaymentCreate,
    SupplierPaymentResponse,
)
from app.schemas.accounting import JournalItemSchema
from app.services.accounting_service import create_double_entry_journal

router = APIRouter(prefix="/expenses", tags=["Beban & Utang Usaha"])

EXPENSE_COA_MAP = {
    "PAKAN": ("1160", "Persediaan Pakan Ikan"),
    "GAJI": ("6110", "Beban Gaji & Upah Tenaga Kerja"),
    "OBAT": ("1170", "Persediaan Obat, Vitamin & Garam"),
    "OPERASIONAL": ("6120", "Beban Listrik, Aerator & Pompa Air"),
}

@router.get("", response_model=list[ExpenseResponse])
def get_all_expenses(db: Session = Depends(get_db)):
    return db.query(Expense).order_by(Expense.created_at.desc()).all()

@router.post("", response_model=ExpenseResponse)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)):
    cash_acc = db.query(CashAccount).filter(CashAccount.id == payload.cash_account_id).first()
    if not cash_acc:
        raise HTTPException(status_code=400, detail="Dompet Kas/Bank tidak valid")
    if cash_acc.balance < payload.nominal:
        raise HTTPException(status_code=400, detail=f"Saldo {cash_acc.name} tidak mencukupi (Tersedia: Rp {cash_acc.balance:,.2f})")

    date_str = datetime.now().strftime("%Y-%m-%d")
    count = db.query(Expense).count() + 1
    expense_no = f"BBN-{date_str.replace('-', '')[:6]}-{str(count).zfill(3)}"

    expense = Expense(
        expense_no=expense_no,
        date=date_str,
        category=payload.category,
        nominal=payload.nominal,
        cash_account_id=cash_acc.id,
        cash_account_name=cash_acc.name,
        note=payload.note,
    )
    db.add(expense)

    # 1. Deduct Cash Balance
    cash_acc.balance -= payload.nominal

    # 2. Auto Double-Entry Journal
    coa_code, coa_name = EXPENSE_COA_MAP.get(payload.category.upper(), ("5004", "Beban Operasional Kolam"))
    create_double_entry_journal(
        db=db,
        date=date_str,
        description=f"Beban {payload.category}: {payload.note or expense_no}",
        ref_type="BEBAN",
        ref_id=expense_no,
        items=[
            JournalItemSchema(account_code=coa_code, account_name=coa_name, debit=payload.nominal, credit=0.0),
            JournalItemSchema(account_code=cash_acc.code, account_name=cash_acc.name, debit=0.0, credit=payload.nominal),
        ],
    )

    db.commit()
    db.refresh(expense)
    return expense

# --- SUPPLIER INVOICES (UTANG USAHA) ---

@router.get("/supplier-invoices", response_model=list[SupplierInvoiceResponse])
def get_supplier_invoices(db: Session = Depends(get_db)):
    return db.query(SupplierInvoice).order_by(SupplierInvoice.created_at.desc()).all()

@router.post("/supplier-invoices", response_model=SupplierInvoiceResponse)
def create_supplier_invoice(payload: SupplierInvoiceCreate, db: Session = Depends(get_db)):
    date_str = datetime.now().strftime("%Y-%m-%d")
    clean_supplier = "".join(filter(str.isalnum, payload.supplier_name))[:3].upper()
    count = db.query(SupplierInvoice).count() + 1
    invoice_number = f"INV-{clean_supplier}-{str(count).zfill(3)}"

    invoice = SupplierInvoice(
        invoice_number=invoice_number,
        date=date_str,
        supplier_name=payload.supplier_name,
        item_category=payload.item_category,
        total_amount=payload.total_amount,
        paid_amount=0.0,
        due_date=payload.due_date,
        status="BELUM_LUNAS",
        note=payload.note,
    )
    db.add(invoice)

    # Map category to debit account
    if payload.item_category == "Pakan":
        debit_code = "1160"
        debit_name = "Persediaan Pakan Ikan"
    elif payload.item_category == "Bibit":
        debit_code = "1150"
        debit_name = "Persediaan Benih Gurame"
    elif payload.item_category == "Obat / Suplemen":
        debit_code = "1170"
        debit_name = "Persediaan Obat, Vitamin & Garam"
    else:
        debit_code = "6190"
        debit_name = "Beban Operasional Lain-lain"

    # Auto Journal: Debit Persediaan/Beban, Credit Utang Usaha (2110)
    create_double_entry_journal(
        db=db,
        date=date_str,
        description=f"Utang Pembelian {payload.item_category} dari {payload.supplier_name} ({invoice_number})",
        ref_type="UTANG",
        ref_id=invoice_number,
        items=[
            JournalItemSchema(account_code=debit_code, account_name=debit_name, debit=payload.total_amount, credit=0.0),
            JournalItemSchema(account_code="2110", account_name="Utang Usaha Pemasok", debit=0.0, credit=payload.total_amount),
        ],
    )

    db.commit()
    db.refresh(invoice)
    return invoice

@router.post("/supplier-payments", response_model=SupplierPaymentResponse)
def pay_supplier_invoice(payload: SupplierPaymentCreate, db: Session = Depends(get_db)):
    invoice = db.query(SupplierInvoice).filter(SupplierInvoice.id == payload.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Faktur tagihan supplier tidak ditemukan")

    cash_acc = db.query(CashAccount).filter(CashAccount.id == payload.cash_account_id).first()
    if not cash_acc:
        raise HTTPException(status_code=400, detail="Dompet Kas/Bank tidak valid")
    if cash_acc.balance < payload.amount:
        raise HTTPException(status_code=400, detail=f"Saldo {cash_acc.name} tidak cukup")

    date_str = datetime.now().strftime("%Y-%m-%d")
    count = db.query(SupplierPayment).count() + 1
    payment_no = f"PAY-{date_str.replace('-', '')[:6]}-{str(count).zfill(3)}"

    payment = SupplierPayment(
        payment_no=payment_no,
        invoice_id=invoice.id,
        date=date_str,
        amount=payload.amount,
        cash_account_id=cash_acc.id,
        cash_account_name=cash_acc.name,
        note=payload.note,
    )
    db.add(payment)

    # 1. Update invoice paid amount & status
    invoice.paid_amount += payload.amount
    if invoice.paid_amount >= invoice.total_amount:
        invoice.status = "LUNAS"

    # 2. Deduct Cash Balance
    cash_acc.balance -= payload.amount

    # 3. Auto Journal: Debit Utang Usaha (2110), Credit Kas/Bank
    create_double_entry_journal(
        db=db,
        date=date_str,
        description=f"Pembayaran Utang {invoice.invoice_number} ke {invoice.supplier_name}",
        ref_type="UTANG",
        ref_id=payment_no,
        items=[
            JournalItemSchema(account_code="2110", account_name="Utang Usaha Pemasok", debit=payload.amount, credit=0.0),
            JournalItemSchema(account_code=cash_acc.code, account_name=cash_acc.name, debit=0.0, credit=payload.amount),
        ],
    )

    db.commit()
    db.refresh(payment)
    return payment

