from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pond import Pond
from app.models.accounting import CashAccount
from app.models.sale import Sale
from app.models.expense import SupplierInvoice
from app.services.accounting_service import (
    calculate_income_statement,
    calculate_balance_sheet,
)

router = APIRouter(prefix="/reports", tags=["Laporan Keuangan & Statistik"])

@router.get("/income-statement")
def get_income_statement(period: str | None = None, db: Session = Depends(get_db)):
    return calculate_income_statement(db, period=period)

@router.get("/balance-sheet")
def get_balance_sheet(db: Session = Depends(get_db)):
    return calculate_balance_sheet(db)

@router.get("/dashboard-summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    ponds = db.query(Pond).all()
    cash_accounts = db.query(CashAccount).all()
    supplier_invoices = db.query(SupplierInvoice).filter(SupplierInvoice.status == "BELUM_LUNAS").all()
    sales_tempo = db.query(Sale).filter(Sale.payment_status == "TEMPO").all()
    income_stmt = calculate_income_statement(db)

    total_cash = sum(ca.balance for ca in cash_accounts)
    total_fish_count = sum(p.current_ekor for p in ponds)
    total_fish_weight = sum(p.current_kg_estimasi for p in ponds)
    total_payable_due = sum(inv.total_amount - inv.paid_amount for inv in supplier_invoices)
    total_receivable_due = sum(s.total_amount for s in sales_tempo)

    return {
        "total_cash": total_cash,
        "total_fish_count": total_fish_count,
        "total_fish_weight": round(total_fish_weight, 1),
        "total_payable_due": total_payable_due,
        "total_receivable_due": total_receivable_due,
        "net_income": income_stmt["net_income"],
        "total_revenue": income_stmt["total_revenue"],
        "total_expense": income_stmt["total_expense"],
        "pond_count": len(ponds),
    }

