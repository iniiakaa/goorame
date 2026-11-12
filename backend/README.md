# Goorame Mini-ERP Backend (FastAPI + SQLAlchemy + SQLite)

Backend REST API untuk **Goorame Mini-ERP** (Sistem Manajemen Budidaya Gurame & Pembukuan Akuntansi Double-Entry Terintegrasi).

---

## 🚀 Fitur Backend

1. **Autentikasi & RBAC (Role-Based Access Control)**:
   - Login JWT untuk peran **Pemilik Bisnis** dan **Pekerja Kolam**.
2. **Manajemen Budidaya & Multi-Kolam**:
   - Master Data Kolam (Kapasitas, Tipe: Pembesaran/Bibit/Panen/Karantina).
   - Pencatatan Tebar Bibit & Mortalitas Harian.
   - Perhitungan otomatis **Survival Rate (SR)** dan bobot biomassa.
3. **Akuntansi Berpasangan (Double-Entry Bookkeeping)**:
   - Chart of Accounts (COA) standar akuntansi (Aset, Kewajiban, Ekuitas, Pendapatan, Beban).
   - Validasi otomatis keseimbangan jurnal: `Total Debit == Total Kredit`.
   - Dompet Kas & Bank (Kas di Tangan, Bank BCA, Bank BRI) dengan mutasi otomatis.
   - Penjualan (Tunai & Tempo Piutang).
   - Beban Operasional & Pembayaran Utang Pemasok.
4. **Laporan Keuangan Otomatis**:
   - Laporan Laba Rugi (Income Statement).
   - Laporan Neraca (Balance Sheet).
   - Buku Besar (General Ledger).
   - Ringkasan Metrik Dashboard.

---

## 🛠️ Cara Menjalankan Backend

### 1. Masuk ke folder backend & aktifkan Virtual Environment:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

### 2. Jalankan Server:
```powershell
python run.py
```
Atau menggunakan `uvicorn` langsung:
```powershell
uvicorn app.main:app --reload --port 8000
```

---

## 📖 Dokumentasi API Interaktif

Setelah server berjalan di port `8000`, buka browser Anda:
- **Swagger UI (Interactive Docs)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc UI**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Root Status**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 📂 Struktur Direktori

```text
backend/
├── app/
│   ├── api/
│   │   ├── auth.py          # Endpoint Login & User
│   │   ├── ponds.py         # Endpoint Kolam, Tebar & Mortalitas
│   │   ├── sales.py         # Endpoint Penjualan & Piutang
│   │   ├── expenses.py      # Endpoint Beban, Utang & Pembayaran Supplier
│   │   ├── cash.py          # Endpoint Dompet Kas/Bank & Transfer Dana
│   │   ├── accounting.py    # Endpoint COA, Jurnal Umum & Buku Besar
│   │   └── reports.py       # Endpoint Laba Rugi, Neraca & Ringkasan Metrik
│   ├── core/
│   │   ├── config.py        # Pengaturan Database, CORS, JWT
│   │   ├── database.py      # SQLAlchemy Engine & Session
│   │   ├── security.py      # Password Hashing & JWT Handler
│   │   └── seeder.py        # Master Data Seeder Bawaan (Kolam, Kas, COA)
│   ├── models/              # Model Tabel SQLAlchemy ORM
│   ├── schemas/             # Schema Validasi Pydantic v2
│   ├── services/            # Engine Double-Entry Auto-Journaling
│   └── main.py              # Entry Point FastAPI App
├── goorame.db               # Database SQLite lokal
├── requirements.txt         # Daftar paket dependensi
└── run.py                   # Script eksekusi server
```

