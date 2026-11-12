# Panduan Environment & Cara Menjalankan Goorame Mini-ERP

Dokumentasi ini menjelaskan konfigurasi environment, arsitektur sistem, dan langkah-langkah menjalankan aplikasi **Goorame Mini-ERP** (Sistem Manajemen Budidaya Ikan Gurame & Akuntansi Double-Entry).

---

## 1. Prasyarat Sistem (Prerequisites)

Pastikan di komputer Anda telah terinstal:

- **Node.js**: v18.x / v20.x ke atas (dengan `npm` atau `pnpm`)
- **Python**: v3.10 ke atas (direkomendasikan v3.11 atau v3.12)
- **Sistem Operasi**: Windows, macOS, atau Linux

---

## 2. Struktur Proyek

```text
goorame/
├── app/                      # Next.js App Router (Frontend)
├── components/               # Komponen Glassmorphism UI & Views
│   ├── goorame/              # Workspace, Login, Views Kolam, Keuangan, dll.
│   └── ui/                   # Komponen atomik UI
├── lib/                      # Logika Akuntansi, Context API, API Client, Types
├── public/                   # Asset statis (bg.jpg, icons, dll.)
├── backend/                  # Backend Python FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routes/       # Router endpoints (auth, ponds, sales, expenses, coa)
│   │   ├── core/             # Konfigurasi database & seeder
│   │   ├── models/           # SQLAlchemy models
│   │   └── schemas/          # Pydantic schemas (validasi request/response)
│   ├── run.py                # Entry point server Uvicorn
│   └── requirements.txt      # Dependensi Python
├── goorame.db                # SQLite database (otomatis di-generate / auto-seed)
└── doc.md                    # Dokumentasi ini
```

---

## 3. Konfigurasi Environment (`.env`)

### A. Frontend (`.env.local` - Opsional)
Buat file `.env.local` di root proyek jika ingin mengubah URL backend:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```
*(Secara default, `lib/api-client.ts` menggunakan fallback `http://127.0.0.1:8000/api` jika variabel ini tidak diset).*

### B. Backend (`backend/.env` - Opsional)
Secara bawaan database SQLite akan disimpan di file root `goorame.db`. Jika diperlukan pengaturan kustom:

```env
DATABASE_URL=sqlite:///../goorame.db
SECRET_KEY=goorame-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## 4. Langkah Menjalankan Proyek

Buka 2 jendela terminal (satu untuk **Backend**, satu untuk **Frontend**).

---

### Terminal 1: Menjalankan Backend (FastAPI + SQLAlchemy)

1. Buka direktori root proyek:
   ```bash
   cd f:\tugasmandiri\Punyadia\goorame
   ```

2. **(Pertama kali)** Buat virtual environment Python dan instal dependensi:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv backend\venv
     backend\venv\Scripts\Activate.ps1
     pip install -r backend\requirements.txt
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv backend/venv
     source backend/venv/bin/activate
     pip install -r backend/requirements.txt
     ```

3. Jalankan server backend:
   - **Windows**:
     ```powershell
     backend\venv\Scripts\python.exe backend\run.py
     ```
   - **Linux / macOS**:
     ```bash
     ./backend/venv/bin/python backend/run.py
     ```
   *Atau langsung via Uvicorn:*
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```

4. **Verifikasi Backend Aktif:**
   - URL API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - Dokumentasi Swagger Interaktif: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Auto-seed database otomatis berjalan saat startup pertama kali jika data masih kosong.

---

### Terminal 2: Menjalankan Frontend (Next.js)

1. Buka direktori root proyek:
   ```bash
   cd f:\tugasmandiri\Punyadia\goorame
   ```

2. **(Pertama kali)** Instal dependensi Node.js:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan Next.js:
   ```bash
   npm run dev
   ```

4. Buka di browser:
   - Akses: [http://localhost:3000](http://localhost:3000)

---

## 5. Akun Default untuk Login (Demo Data)

Sistem telah dilengkapi data awal (seed) dengan 2 role pengguna:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Pemilik Usaha** | `pemilik` | `admin123` | Akses penuh (Dashboard, Kolam, Penjualan, Keuangan, Jurnal, Laporan L/R & Neraca) |
| **Pekerja Kolam** | `pekerja` | `pekerja123` | Terbatas (Dashboard operasional, monitoring kolam, tebar bibit, pencatatan kematian) |

> **Catatan UI**: Di halaman login tersedia tombol pintas *1-Click Demo* untuk langsung mengisi form sebagai Pemilik atau Pekerja.

---

## 6. Fitur & Pengujian Alur Data

1. **Database Badge Indikator**:
   - Jika backend FastAPI aktif dan terhubung ke SQLite, badge indikator status di pojok kanan atas topbar akan menyala hijau (`Database SQLite Aktif`).
2. **Sinkronisasi Data Dua Arah**:
   - Semua penambahan transaksi Penjualan, Biaya Operasional, Tebar Bibit, Kematian Ikan, dan Jurnal Manual langsung disimpan ke `goorame.db` melalui API dan di-refresh ke UI.
3. **Double-Entry Bookkeeping**:
   - Setiap transaksi otomatis membentuk jurnal debit-kredit seimbang yang dapat diperiksa di menu **Jurnal Umum** dan **Buku Besar**.
4. **Glassmorphism Customizer**:
   - Pengaturan visual (Blur, Opacity, Saturation, Edge) dapat disesuaikan lewat ikon slider di topbar.

---

## 7. Troubleshooting

- **Database lock / reset data**:
  Jika ingin me-reset database kembali ke kondisi awal, cukup hapus file `goorame.db` lalu restart backend (`backend/run.py`). Backend akan otomatis men-generate ulang tabel dan melakukan seeding data default.
- **Port 8000 atau 3000 sudah terpakai**:
  - Matikan proses lama atau ubah port di file `backend/run.py` (untuk backend) atau jalankan `npm run dev -- -p 3001` (untuk frontend).

