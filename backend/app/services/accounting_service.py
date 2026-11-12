from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.accounting import JournalEntry, JournalItem, ChartOfAccount, CashAccount
from app.schemas.accounting import JournalItemSchema

def create_double_entry_journal(
    db: Session,
    date: str,
    description: str,
    ref_type: str,
    items: List[JournalItemSchema],
    ref_id: str | None = None,
) -> JournalEntry:
    """
    Creates and validates a balanced Double-Entry journal transaction.
    Raises ValueError if total debit does not equal total credit.
    """
    total_debit = round(sum(item.debit for item in items), 2)
    total_credit = round(sum(item.credit for item in items), 2)

    if total_debit != total_credit:
        raise ValueError(
            f"Jurnal tidak seimbang! Total Debit (Rp {total_debit:,.2f}) != Total Kredit (Rp {total_credit:,.2f})"
        )

    # Generate sequential entry number: JU-YYYYMM-XXX
    clean_date = date.replace("-", "")[:6]
    count = db.query(JournalEntry).filter(JournalEntry.date.like(f"{date[:7]}%")).count() + 1
    entry_number = f"JU-{clean_date}-{str(count).padStart if hasattr(str(count), 'padStart') else str(count).zfill(3)}"

    journal = JournalEntry(
        entry_number=entry_number,
        date=date,
        description=description,
        ref_type=ref_type,
        ref_id=ref_id,
    )
    db.add(journal)
    db.flush()

    for item in items:
        # Lookup account name if not provided
        acc = db.query(ChartOfAccount).filter(ChartOfAccount.code == item.account_code).first()
        acc_name = item.account_name or (acc.name if acc else item.account_code)

        j_item = JournalItem(
            journal_id=journal.id,
            account_code=item.account_code,
            account_name=acc_name,
            debit=item.debit,
            credit=item.credit,
        )
        db.add(j_item)

    db.commit()
    db.refresh(journal)
    return journal


def calculate_general_ledger(db: Session) -> List[Dict[str, Any]]:
    """Calculates general ledger balances for all Chart of Accounts."""
    coas = db.query(ChartOfAccount).order_by(ChartOfAccount.code).all()
    journal_items = db.query(JournalItem).join(JournalEntry).order_by(JournalEntry.date).all()

    ledger = []
    for coa in coas:
        items = [ji for ji in journal_items if ji.account_code == coa.code]
        total_debit = sum(i.debit for i in items)
        total_credit = sum(i.credit for i in items)

        if coa.normal_balance == "DEBIT":
            balance = total_debit - total_credit
        else:
            balance = total_credit - total_debit

        ledger.append({
            "code": coa.code,
            "name": coa.name,
            "category": coa.category,
            "normal_balance": coa.normal_balance,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "ending_balance": balance,
            "transaction_count": len(items),
        })

    return ledger


def calculate_income_statement(db: Session, period: str | None = None) -> Dict[str, Any]:
    """Calculates Income Statement (Laporan Laba Rugi)."""
    ledger = calculate_general_ledger(db)

    revenues = [acc for acc in ledger if acc["category"] == "PENDAPATAN"]
    expenses = [acc for acc in ledger if acc["category"] == "BEBAN"]

    total_revenue = sum(acc["ending_balance"] for acc in revenues)
    total_expense = sum(acc["ending_balance"] for acc in expenses)
    net_income = total_revenue - total_expense

    return {
        "period": period or datetime.now().strftime("%Y-%m"),
        "revenues": revenues,
        "total_revenue": total_revenue,
        "expenses": expenses,
        "total_expense": total_expense,
        "net_income": net_income,
    }


def calculate_balance_sheet(db: Session) -> Dict[str, Any]:
    """Calculates Balance Sheet (Laporan Neraca)."""
    ledger = calculate_general_ledger(db)
    income_stmt = calculate_income_statement(db)

    assets = [acc for acc in ledger if acc["category"] == "ASET"]
    liabilities = [acc for acc in ledger if acc["category"] == "KEWAJIBAN"]
    equities = [acc for acc in ledger if acc["category"] == "EKUITAS"]

    total_assets = sum(acc["ending_balance"] for acc in assets)
    total_liabilities = sum(acc["ending_balance"] for acc in liabilities)
    total_equity_base = sum(acc["ending_balance"] for acc in equities)

    # Net income increases Retained Earnings in Equity
    current_earnings = income_stmt["net_income"]
    total_equity = total_equity_base + current_earnings

    is_balanced = round(total_assets, 2) == round(total_liabilities + total_equity, 2)

    return {
        "assets": assets,
        "total_assets": total_assets,
        "liabilities": liabilities,
        "total_liabilities": total_liabilities,
        "equities": equities,
        "current_earnings": current_earnings,
        "total_equity": total_equity,
        "is_balanced": is_balanced,
    }

