from sqlalchemy.orm import Session
from app.models.user import User
from app.models.pond import Pond, StockMutation
from app.models.accounting import ChartOfAccount, CashAccount, JournalEntry, JournalItem
from app.models.sale import Sale
from app.models.expense import Expense, SupplierInvoice, SupplierPayment, CashTransfer
from app.core.security import get_password_hash

DEFAULT_COA = [
    # 1000 - ASET LANCAR
    {"code": "1110", "name": "Kas di Bank (BCA)", "category": "ASET", "normal_balance": "DEBIT", "description": "Rekening operasional penerimaan & pengeluaran utama"},
    {"code": "1120", "name": "Kas di Bank (BRI)", "category": "ASET", "normal_balance": "DEBIT", "description": "Rekening cadangan & belanja pakan skala besar"},
    {"code": "1130", "name": "Kas di Tangan (Kas Kecil)", "category": "ASET", "normal_balance": "DEBIT", "description": "Uang tunai operasional harian di lokasi kolam"},
    {"code": "1140", "name": "Piutang Usaha", "category": "ASET", "normal_balance": "DEBIT", "description": "Tagihan penjualan ikan ke restoran/pengepul"},
    {"code": "1150", "name": "Persediaan Benih Gurame", "category": "ASET", "normal_balance": "DEBIT", "description": "Stok bibit/benih sebelum ditebar ke kolam pembesaran"},
    {"code": "1160", "name": "Persediaan Pakan Ikan", "category": "ASET", "normal_balance": "DEBIT", "description": "Stok pelet & pakan di gudang"},
    {"code": "1170", "name": "Persediaan Obat, Vitamin & Garam", "category": "ASET", "normal_balance": "DEBIT", "description": "Stok obat, suplemen, dan probiotik kolam"},
    {"code": "1180", "name": "Persediaan Ikan dalam Pembesaran (Aset Biologis)", "category": "ASET", "normal_balance": "DEBIT", "description": "Akumulasi nilai benih, pakan, dan perawatan ikan di kolam"},

    # 2000 - KEWAJIBAN
    {"code": "2110", "name": "Utang Usaha Pemasok", "category": "KEWAJIBAN", "normal_balance": "KREDIT", "description": "Kewajiban pembelian pakan/benih/obat secara kredit"},
    {"code": "2120", "name": "Beban yang Masih Harus Dibayar", "category": "KEWAJIBAN", "normal_balance": "KREDIT", "description": "Kewajiban gaji/listrik yang belum dibayarkan"},

    # 3000 - EKUITAS
    {"code": "3100", "name": "Modal Pemilik Budidaya", "category": "EKUITAS", "normal_balance": "KREDIT", "description": "Modal disetor awal pemilik usaha tambak"},
    {"code": "3200", "name": "Laba Ditahan", "category": "EKUITAS", "normal_balance": "KREDIT", "description": "Akumulasi saldo laba/rugi periode lalu"},
    {"code": "3300", "name": "Prive Pemilik", "category": "EKUITAS", "normal_balance": "DEBIT", "description": "Penarikan modal untuk keperluan pribadi pemilik"},

    # 4000 - PENDAPATAN
    {"code": "4110", "name": "Penjualan Ikan Gurame Konsumsi", "category": "PENDAPATAN", "normal_balance": "KREDIT", "description": "Pendapatan panen ikan konsumsi"},
    {"code": "4120", "name": "Penjualan Benih Gurame", "category": "PENDAPATAN", "normal_balance": "KREDIT", "description": "Pendapatan penjualan bibit/benih pendederan"},

    # 5000 - HARGA POKOK PENJUALAN
    {"code": "5110", "name": "Harga Pokok Penjualan (HPP) Ikan", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Beban pokok ikan yang telah dipanen dan terjual"},
    {"code": "5120", "name": "Kerugian Ikan Mati (Mortalitas)", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Beban kerugian atas mortalitas ikan di kolam"},

    # 6000 - BEBAN OPERASIONAL
    {"code": "6110", "name": "Beban Gaji & Upah Tenaga Kerja", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Upah pekerja kolam harian dan bulanan"},
    {"code": "6120", "name": "Beban Listrik, Aerator & Pompa Air", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Tagihan listrik aerator & pompa pengairan kolam"},
    {"code": "6130", "name": "Beban Bahan Bakar & Transportasi", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Bensin/solar genset dan angkut pakan/ikan"},
    {"code": "6140", "name": "Beban Pemeliharaan Kolam & Peralatan", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Perawatan terpal, jaring, pompa, dan paralon"},
    {"code": "6190", "name": "Beban Operasional Lain-lain", "category": "BEBAN", "normal_balance": "DEBIT", "description": "Pengeluaran operasional umum lainnya"},
]

def seed_database(db: Session):
    """Populates empty tables with default master and initial operational data."""

    # 1. Seed COA
    if db.query(ChartOfAccount).count() == 0:
        for coa in DEFAULT_COA:
            db.add(ChartOfAccount(**coa))
        db.commit()

    # 2. Seed Cash Accounts
    if db.query(CashAccount).count() == 0:
        cash_accounts = [
            CashAccount(id="cash-1", code="1110", name="Bank BCA Operasional", type="BANK", account_number="8820-192-331", balance=82500000.0),
            CashAccount(id="cash-2", code="1120", name="Bank BRI Rekening Cadangan", type="BANK", account_number="0192-883-712", balance=45000000.0),
            CashAccount(id="cash-3", code="1130", name="Kas di Tangan (Kas Kecil)", type="KAS", account_number="KAS-TUNAI-01", balance=14750000.0),
        ]
        db.add_all(cash_accounts)
        db.commit()

    # 3. Seed Users
    if db.query(User).count() == 0:
        users = [
            User(
                username="pemilik",
                password_hash=get_password_hash("admin123"),
                full_name="Pemilik",
                role="PEMILIK",
            ),
            User(
                username="pekerja",
                password_hash=get_password_hash("pekerja123"),
                full_name="Pekerja",
                role="PEKERJA",
            ),
        ]
        db.add_all(users)
        db.commit()

    # 4. Seed Ponds
    if db.query(Pond).count() == 0:
        ponds = [
            Pond(
                id="pond-1",
                name="Kolam A (Pendederan & Bibit)",
                type="BIBIT",
                dimension="12m x 15m x 1.2m",
                capacity_ekor=5000,
                initial_stock=4000,
                current_ekor=3820,
                current_kg_estimasi=420.0,
                total_tebar=4000,
                total_mati=180,
                total_panen=0,
                survival_rate=95.5,
                status="AKTIF",
            ),
            Pond(
                id="pond-2",
                name="Kolam B (Pembesaran Utama 1)",
                type="PEMBESARAN",
                dimension="20m x 25m x 1.6m",
                capacity_ekor=6000,
                initial_stock=5000,
                current_ekor=4680,
                current_kg_estimasi=2340.0,
                total_tebar=5000,
                total_mati=120,
                total_panen=200,
                survival_rate=97.6,
                status="AKTIF",
            ),
            Pond(
                id="pond-3",
                name="Kolam C (Siap Panen Konsumsi)",
                type="PANEN",
                dimension="20m x 25m x 1.6m",
                capacity_ekor=4500,
                initial_stock=4000,
                current_ekor=3250,
                current_kg_estimasi=2437.0,
                total_tebar=4000,
                total_mati=60,
                total_panen=690,
                survival_rate=98.5,
                status="AKTIF",
            ),
            Pond(
                id="pond-4",
                name="Kolam D (Karantina & Sortir)",
                type="KARANTINA",
                dimension="8m x 10m x 1.0m",
                capacity_ekor=1500,
                initial_stock=1000,
                current_ekor=940,
                current_kg_estimasi=470.0,
                total_tebar=1000,
                total_mati=60,
                total_panen=0,
                survival_rate=94.0,
                status="AKTIF",
            ),
        ]
        db.add_all(ponds)
        db.commit()

        # Seed Stock Mutations
        mutations = [
            StockMutation(
                id="mut-1",
                pond_id="pond-1",
                date="2026-10-15",
                type="TEBAR",
                ekor=4000,
                weight_kg=80.0,
                note="Tebar bibit gurame ukuran silet dari Balai Benih",
                reference_id="TBR-202610-01",
            ),
            StockMutation(
                id="mut-2",
                pond_id="pond-1",
                date="2026-10-28",
                type="MATI",
                ekor=180,
                weight_kg=10.0,
                note="Fluktuasi suhu air hujan lebat, telah diberi garam ikan",
                reference_id="MT-202610-01",
            ),
            StockMutation(
                id="mut-3",
                pond_id="pond-3",
                date="2026-11-01",
                type="PANEN",
                ekor=350,
                weight_kg=250.0,
                note="Panen parsial untuk Restoran Gurame Bakar Pak Haji",
                reference_id="sale-1",
            ),
            StockMutation(
                id="mut-4",
                pond_id="pond-3",
                date="2026-11-05",
                type="PANEN",
                ekor=340,
                weight_kg=240.0,
                note="Panen untuk Pasar Ikan Muara Baru",
                reference_id="sale-2",
            ),
            StockMutation(
                id="mut-5",
                pond_id="pond-2",
                date="2026-11-08",
                type="MATI",
                ekor=40,
                weight_kg=20.0,
                note="Mortalitas wajar mingguan siklus akhir pembesaran",
                reference_id="MT-202611-02",
            ),
        ]
        db.add_all(mutations)
        db.commit()

    # 5. Seed Sales
    if db.query(Sale).count() == 0:
        sales = [
            Sale(
                id="sale-1",
                invoice_no="INV-202611-001",
                date="2026-11-01",
                buyer_name="Restoran Gurame Bakar Pak Slamet",
                pond_id="pond-3",
                quantity_ekor=350,
                weight_kg=250.0,
                price_per_kg=44000.0,
                total_amount=11000000.0,
                payment_status="LUNAS",
                due_date=None,
                paid_date="2026-11-01",
                cash_account_id="cash-1",
                cash_account_name="Bank BCA Operasional",
                note="Ikan gurame ukuran konsumsi 7-8 ons, pengiriman subuh via pikap tambak",
            ),
            Sale(
                id="sale-2",
                invoice_no="INV-202611-002",
                date="2026-11-05",
                buyer_name="Pasar Ikan Muara Baru (Pak Dedi)",
                pond_id="pond-3",
                quantity_ekor=340,
                weight_kg=240.0,
                price_per_kg=42500.0,
                total_amount=10200000.0,
                payment_status="TEMPO",
                due_date="2026-11-19",
                paid_date=None,
                cash_account_id=None,
                cash_account_name=None,
                note="Pembayaran tempo 14 hari, langganan grosir mingguan lapak C-12",
            ),
            Sale(
                id="sale-3",
                invoice_no="INV-202611-008",
                date="2026-11-08",
                buyer_name="Depot Seafood & Ikan Segar Segara",
                pond_id="pond-2",
                quantity_ekor=200,
                weight_kg=160.0,
                price_per_kg=45000.0,
                total_amount=7200000.0,
                payment_status="LUNAS",
                due_date=None,
                paid_date="2026-11-08",
                cash_account_id="cash-3",
                cash_account_name="Kas di Tangan (Kas Kecil)",
                note="Grade A gurame hidup segar, pembayaran tunai langsung di kasir tambak",
            ),
        ]
        db.add_all(sales)
        db.commit()

    # 6. Seed Expenses
    if db.query(Expense).count() == 0:
        expenses = [
            Expense(
                id="exp-1",
                expense_no="BBN-202611-01",
                date="2026-11-02",
                category="PAKAN",
                nominal=7500000.0,
                cash_account_id="cash-1",
                cash_account_name="Bank BCA Operasional",
                note="Beli pakan apung protein 32% (25 sak @ Rp 300.000)",
            ),
            Expense(
                id="exp-2",
                expense_no="BBN-202611-02",
                date="2026-11-04",
                category="GAJI",
                nominal=3500000.0,
                cash_account_id="cash-3",
                cash_account_name="Kas di Tangan (Kas Kecil)",
                note="Gaji mingguan 2 petugas rawat kolam & sift malam",
            ),
            Expense(
                id="exp-3",
                expense_no="BBN-202611-03",
                date="2026-11-06",
                category="OBAT",
                nominal=850000.0,
                cash_account_id="cash-3",
                cash_account_name="Kas di Tangan (Kas Kecil)",
                note="Probiotik EM4 perikanan 5 botol + 2 karung garam krosok",
            ),
            Expense(
                id="exp-4",
                expense_no="BBN-202611-04",
                date="2026-11-07",
                category="OPERASIONAL",
                nominal=1650000.0,
                cash_account_id="cash-1",
                cash_account_name="Bank BCA Operasional",
                note="Tagihan listrik aerator & kincir air tambak PLN November",
            ),
        ]
        db.add_all(expenses)
        db.commit()

    # 7. Seed Supplier Invoices
    if db.query(SupplierInvoice).count() == 0:
        invoices = [
            SupplierInvoice(
                id="inv-1",
                invoice_number="INV-SUP-2026-089",
                date="2026-11-03",
                supplier_name="CV Pakan Sentosa Mandiri",
                item_category="Pakan",
                total_amount=18000000.0,
                paid_amount=12000000.0,
                due_date="2026-11-25",
                status="BELUM_LUNAS",
                note="Faktur pakan pelet grower 60 sak, sisa Rp 6.000.000 jatuh tempo akhir bulan",
            ),
            SupplierInvoice(
                id="inv-2",
                invoice_number="INV-SUP-2026-094",
                date="2026-11-06",
                supplier_name="Balai Benih Ikan Air Tawar Subang",
                item_category="Bibit",
                total_amount=4500000.0,
                paid_amount=0.0,
                due_date="2026-11-20",
                status="BELUM_LUNAS",
                note="Bibit gurame super ukuran korek 3.000 ekor untuk restock kolam D",
            ),
        ]
        db.add_all(invoices)
        db.commit()

    # 8. Seed Supplier Payments
    if db.query(SupplierPayment).count() == 0:
        payments = [
            SupplierPayment(
                id="pay-1",
                payment_no="PAY-202611-01",
                invoice_id="inv-1",
                date="2026-11-03",
                amount=12000000.0,
                cash_account_id="cash-1",
                cash_account_name="Bank BCA Operasional",
                note="Pembayaran uang muka DP faktur pakan INV-SUP-2026-089",
            ),
        ]
        db.add_all(payments)
        db.commit()

    # 9. Seed Cash Transfers
    if db.query(CashTransfer).count() == 0:
        transfers = [
            CashTransfer(
                id="trf-1",
                transfer_no="TRF-202611-01",
                date="2026-11-02",
                from_account_id="cash-1",
                from_account_name="Bank BCA Operasional",
                to_account_id="cash-3",
                to_account_name="Kas di Tangan (Kas Kecil)",
                amount=5000000.0,
                note="Tarik tunai untuk kas kecil & belanja operasional tambak",
            ),
        ]
        db.add_all(transfers)
        db.commit()

    # 10. Seed Double-Entry Journal Entries
    if db.query(JournalEntry).count() == 0:
        journals_data = [
            {
                "id": "j-0",
                "entry_number": "JU-202610-000",
                "date": "2026-10-01",
                "description": "Saldo Awal Modal & Penempatan Kas Peternakan Gurame",
                "ref_type": "MANUAL",
                "ref_id": None,
                "items": [
                    {"account_code": "1110", "account_name": "Kas di Bank (BCA)", "debit": 95350000.0, "credit": 0.0},
                    {"account_code": "1120", "account_name": "Kas di Bank (BRI)", "debit": 45000000.0, "credit": 0.0},
                    {"account_code": "1130", "account_name": "Kas di Tangan (Kas Kecil)", "debit": 12400000.0, "credit": 0.0},
                    {"account_code": "1180", "account_name": "Persediaan Ikan dalam Pembesaran (Aset Biologis)", "debit": 45000000.0, "credit": 0.0},
                    {"account_code": "3100", "account_name": "Modal Pemilik Budidaya", "debit": 0.0, "credit": 197750000.0},
                ],
            },
            {
                "id": "j-1",
                "entry_number": "JU-202611-001",
                "date": "2026-11-01",
                "description": "Penjualan Gurame Konsumsi ke Restoran Gurame Bakar Pak Slamet (Lunas)",
                "ref_type": "PENJUALAN",
                "ref_id": "sale-1",
                "items": [
                    {"account_code": "1110", "account_name": "Kas di Bank (BCA)", "debit": 11000000.0, "credit": 0.0},
                    {"account_code": "4110", "account_name": "Penjualan Ikan Gurame Konsumsi", "debit": 0.0, "credit": 11000000.0},
                ],
            },
            {
                "id": "j-2",
                "entry_number": "JU-202611-002",
                "date": "2026-11-02",
                "description": "Pengeluaran Pembelian Pelet Pakan Apung 25 Sak",
                "ref_type": "BEBAN",
                "ref_id": "exp-1",
                "items": [
                    {"account_code": "1160", "account_name": "Persediaan Pakan Ikan", "debit": 7500000.0, "credit": 0.0},
                    {"account_code": "1110", "account_name": "Kas di Bank (BCA)", "debit": 0.0, "credit": 7500000.0},
                ],
            },
            {
                "id": "j-3",
                "entry_number": "JU-202611-003",
                "date": "2026-11-02",
                "description": "Transfer Kas: Tarik Tunai dari BCA ke Kas di Tangan",
                "ref_type": "MUTASI_KAS",
                "ref_id": "trf-1",
                "items": [
                    {"account_code": "1130", "account_name": "Kas di Tangan (Kas Kecil)", "debit": 5000000.0, "credit": 0.0},
                    {"account_code": "1110", "account_name": "Kas di Bank (BCA)", "debit": 0.0, "credit": 5000000.0},
                ],
            },
            {
                "id": "j-4",
                "entry_number": "JU-202611-004",
                "date": "2026-11-03",
                "description": "Pembelian Pakan Tempo dari CV Pakan Sentosa (Faktur Utang)",
                "ref_type": "UTANG",
                "ref_id": "inv-1",
                "items": [
                    {"account_code": "1160", "account_name": "Persediaan Pakan Ikan", "debit": 18000000.0, "credit": 0.0},
                    {"account_code": "2110", "account_name": "Utang Usaha Pemasok", "debit": 0.0, "credit": 18000000.0},
                ],
            },
            {
                "id": "j-5",
                "entry_number": "JU-202611-005",
                "date": "2026-11-03",
                "description": "Pembayaran Cicilan Utang Pakan ke CV Pakan Sentosa",
                "ref_type": "UTANG",
                "ref_id": "pay-1",
                "items": [
                    {"account_code": "2110", "account_name": "Utang Usaha Pemasok", "debit": 12000000.0, "credit": 0.0},
                    {"account_code": "1110", "account_name": "Kas di Bank (BCA)", "debit": 0.0, "credit": 12000000.0},
                ],
            },
            {
                "id": "j-6",
                "entry_number": "JU-202611-006",
                "date": "2026-11-04",
                "description": "Pembayaran Upah Mingguan Pekerja Kolam",
                "ref_type": "BEBAN",
                "ref_id": "exp-2",
                "items": [
                    {"account_code": "6110", "account_name": "Beban Gaji & Upah Tenaga Kerja", "debit": 3500000.0, "credit": 0.0},
                    {"account_code": "1130", "account_name": "Kas di Tangan (Kas Kecil)", "debit": 0.0, "credit": 3500000.0},
                ],
            },
            {
                "id": "j-7",
                "entry_number": "JU-202611-007",
                "date": "2026-11-05",
                "description": "Penjualan Gurame Tempo ke Pasar Ikan Muara Baru",
                "ref_type": "PENJUALAN",
                "ref_id": "sale-2",
                "items": [
                    {"account_code": "1140", "account_name": "Piutang Usaha", "debit": 10200000.0, "credit": 0.0},
                    {"account_code": "4110", "account_name": "Penjualan Ikan Gurame Konsumsi", "debit": 0.0, "credit": 10200000.0},
                ],
            },
            {
                "id": "j-8",
                "entry_number": "JU-202611-008",
                "date": "2026-11-06",
                "description": "Pembelian Probiotik EM4 & Garam Ikan",
                "ref_type": "BEBAN",
                "ref_id": "exp-3",
                "items": [
                    {"account_code": "1170", "account_name": "Persediaan Obat, Vitamin & Garam", "debit": 850000.0, "credit": 0.0},
                    {"account_code": "1130", "account_name": "Kas di Tangan (Kas Kecil)", "debit": 0.0, "credit": 850000.0},
                ],
            },
            {
                "id": "j-9",
                "entry_number": "JU-202611-009",
                "date": "2026-11-07",
                "description": "Pembayaran Listrik Aerator Tambak PLN",
                "ref_type": "BEBAN",
                "ref_id": "exp-4",
                "items": [
                    {"account_code": "6120", "account_name": "Beban Listrik, Aerator & Pompa Air", "debit": 1650000.0, "credit": 0.0},
                    {"account_code": "1110", "account_name": "Kas di Bank (BCA)", "debit": 0.0, "credit": 1650000.0},
                ],
            },
            {
                "id": "j-10",
                "entry_number": "JU-202611-010",
                "date": "2026-11-08",
                "description": "Penjualan Tunai Gurame ke Depot Seafood Segara",
                "ref_type": "PENJUALAN",
                "ref_id": "sale-3",
                "items": [
                    {"account_code": "1130", "account_name": "Kas di Tangan (Kas Kecil)", "debit": 7200000.0, "credit": 0.0},
                    {"account_code": "4110", "account_name": "Penjualan Ikan Gurame Konsumsi", "debit": 0.0, "credit": 7200000.0},
                ],
            },
        ]

        for entry in journals_data:
            j = JournalEntry(
                id=entry["id"],
                entry_number=entry["entry_number"],
                date=entry["date"],
                description=entry["description"],
                ref_type=entry["ref_type"],
                ref_id=entry["ref_id"],
            )
            db.add(j)
            db.flush()
            for item in entry["items"]:
                ji = JournalItem(
                    journal_id=j.id,
                    account_code=item["account_code"],
                    account_name=item["account_name"],
                    debit=item["debit"],
                    credit=item["credit"],
                )
                db.add(ji)

        db.commit()
