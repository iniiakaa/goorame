# 📘 Panduan Lengkap Goorame: Web, Backend & Desktop App (Dari Awal untuk Pemula)

Selamat datang di panduan resmi **Goorame**! Dokumen ini dirancang khusus agar siapa pun — baik pemula yang baru pertama kali membuka **Visual Studio Code (VS Code)** maupun pengembang — dapat memahami, menginstal, menjalankan, dan membangun seluruh ekosistem aplikasi **Goorame** dengan mudah dari nol.

---

## 🧭 1. Arsitektur & Komponen Ekosistem Goorame

Aplikasi **Goorame** adalah sistem Mini-ERP budidaya ikan gurame yang terintegrasi dengan akuntansi double-entry standar. Ekosistem ini terdiri dari 3 pilar utama:

```mermaid
graph TD
    subgraph Klien_Pengguna [Antarmuka Pengguna]
        Web["🌐 Web Frontend (Next.js 16 + React 19)<br/>Port: 3000"]
        Desktop["🖥️ Desktop Windows App (Python Tkinter / .exe)<br/>Native GUI Windows"]
    end

    subgraph Server_API [Otak & Layanan Logika]
        Backend["⚙️ Backend API (Python FastAPI)<br/>Port: 8000 (Lokal) / Railway (Cloud)"]
    end

    subgraph Penyimpanan [Basis Data]
        DB_Local[("💾 SQLite Lokal<br/>goorame.db")]
        DB_Cloud[("☁️ PostgreSQL Cloud<br/>Railway Database")]
    end

    Web -->|HTTP / REST API| Backend
    Desktop -->|HTTP / REST API| Backend
    Backend -->|Driver SQLite| DB_Local
    Backend -->|Driver PostgreSQL| DB_Cloud
```

1. **🌐 Web Frontend**: Dibuat menggunakan **Next.js 16 (Turbopack)**, **React 19**, dan **Tailwind CSS**. Tampilan bergaya modern *glassmorphism* yang dapat dibuka lewat browser di laptop, tablet, maupun HP.
2. **⚙️ Backend API**: Dibuat menggunakan **Python FastAPI**, **SQLAlchemy ORM**, dan **Pydantic**. Mengatur seluruh kalkulasi biologis ikan (stok, estimasi biomassa, survival rate) dan aturan penjurnalan akuntansi otomatis (*auto-journaling*).
3. **🖥️ Desktop Windows App**: Dibuat menggunakan **Python Tkinter & Pillow**. Merupakan aplikasi desktop native Windows yang dapat dibungkus menjadi file executable mandiri (**`.exe`**) via PyInstaller tanpa perlu menginstal Node.js atau Python di komputer pengguna.
4. **☁️ Cloud Railway Hosting**: Backend dan database telah ter-deploy langsung di cloud Railway:  
   👉 **URL Live API**: `https://vivacious-cat-production-1b1669c9.up.railway.app/api`

---

## 🛠️ 2. Prasyarat Software yang Harus Terinstal di Laptop / PC

Sebelum memulai, pastikan software berikut telah terpasang di komputer Windows Anda:

### 1. **Visual Studio Code (VS Code)**
- Unduh di: [https://code.visualstudio.com/](https://code.visualstudio.com/)
- Ekstensi yang disarankan di VS Code:
  - *Python* (oleh Microsoft)
  - *Tailwind CSS IntelliSense*
  - *ESLint*

### 2. **Node.js** (Versi 18 atau 20 LTS ke atas)
- Unduh di: [https://nodejs.org/](https://nodejs.org/) (Pilih tombol bertuliskan **LTS**).
- *Fungsi*: Diperlukan untuk menjalankan Web Frontend Next.js.
- *Verifikasi di Terminal*:
  ```powershell
  node -v
  npm -v
  ```

### 3. **Python** (Versi 3.10, 3.11, 3.12, atau 3.14)
- Unduh di: [https://www.python.org/downloads/](https://www.python.org/downloads/)
- ⚠️ **SANGAT PENTING SAAT INSTALL**: Centang kotak bertuliskan **"Add python.exe to PATH"** di bagian bawah installer sebelum mengklik tombol *Install Now*.
- *Verifikasi di Terminal*:
  ```powershell
  python --version
  ```

### 4. **Git** (Opsional, untuk pull/push ke GitHub)
- Unduh di: [https://git-scm.com/](https://git-scm.com/)

---

## 📂 3. Struktur Folder Proyek

```text
goorame/
├── app/                          # File Router & Metadata Next.js (layout.tsx, page.tsx, favicon)
├── components/goorame/           # Seluruh Komponen Antarmuka Web
│   ├── dashboard-view.tsx        # Modul 1: Dashboard Eksekutif & KPI
│   ├── kolam-view.tsx            # Modul 2: Stok Kolam & Biologis
│   ├── penjualan-view.tsx        # Modul 3: Penjualan Ikan (4110 & 1140)
│   ├── pengeluaran-view.tsx      # Modul 4: Pengeluaran & Pakan (1160/6110)
│   ├── utang-view.tsx            # Modul 5: Utang Supplier & Piutang Pelanggan
│   ├── kas-view.tsx              # Modul 6: Dompet Kas & Bank (Buku Kas)
│   ├── akuntansi-view.tsx        # Modul 7: Jurnal Umum & Bagan Akun COA
│   ├── laporan-view.tsx          # Modul 8: Laporan Laba Rugi & Neraca
│   ├── modals.tsx                # Seluruh Form Pop-up Transaksi
│   └── login-view.tsx            # Layanan Autentikasi Web
├── backend/                      # Backend Python FastAPI
│   ├── app/
│   │   ├── api/                  # Endpoint Router (auth, ponds, sales, expenses, cash, accounting, reports)
│   │   ├── core/                 # Konfigurasi Database, Security & Seeder Otomatis
│   │   ├── models/               # Model Database Tabel SQLAlchemy
│   │   ├── schemas/              # Validasi Data Skema Pydantic
│   │   └── services/             # Mesin Logika Akuntansi & Jurnal Berpasangan
│   ├── venv/                     # Virtual Environment Python Lokal
│   ├── requirements.txt          # Daftar Pustaka Python
│   └── run.py                    # Script Peluncur Server Backend Lokal
├── desktop/                      # Aplikasi Desktop Native Windows
│   ├── app.py                    # Kode Utama GUI Desktop (Tkinter + Pillow + REST API)
│   ├── build_exe.bat             # Script 1-Klik Pembuat File .exe Mandiri
│   └── README.md                 # Dokumentasi Khusus Desktop App
├── public/                       # Aset Gambar, Logo Resmi Goorame, & Background
│   ├── logo-goorame.png          # Logo Resmi Ikan Goorame
│   ├── favicon.ico               # Icon Windows & Browser
│   └── bg.jpg                    # Wallpaper Latar Belakang
└── doc.md                        # Panduan Komprehensif Ini
```

---

## 💻 4. Langkah Membuka Proyek di VS Code

1. Buka aplikasi **VS Code**.
2. Klik menu **File** (pojok kiri atas) → pilih **Open Folder...**.
3. Navigasikan ke folder proyek:
   ```text
   f:\tugasmandiri\Punyadia\goorame
   ```
4. Jika muncul kotak dialog *"Do you trust the authors of the files in this folder?"*, klik **Yes, I trust the authors**.

---

## ⚙️ 5. Menjalankan Backend API (Python FastAPI)

Backend bertugas mengelola basis data, aturan auto-journaling, dan autentikasi.

### 5.1 Persiapan Awal Virtual Environment (Hanya Dilakukan Sekali)
Buka terminal baru di VS Code (**Terminal** → **New Terminal**), lalu jalankan perintah:

```powershell
# 1. Pastikan dependensi backend terpasang lengkap
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt

# 2. Pasang dependensi tambahan untuk GUI Desktop & PyInstaller
backend\venv\Scripts\python.exe -m pip install requests pillow pyinstaller
```

### 5.2 Menyalakan Server Backend Lokal
Ketik perintah berikut di terminal:

```powershell
backend\venv\Scripts\python.exe backend\run.py
```

Jika berhasil, terminal akan menampilkan:
```text
==================================================
🚀 Goorame Mini-ERP Backend (FastAPI)
🌍 Host: 0.0.0.0:8000
📖 Swagger UI: http://127.0.0.1:8000/docs
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```
> 💡 **Penting**: Biarkan terminal backend ini tetap menyala selama Anda menggunakan aplikasi.

---

## 🌐 6. Menjalankan Web Frontend (Next.js)

Sekarang jalankan antarmuka website di terminal kedua tanpa mematikan terminal backend.

### 6.1 Membuka Terminal Baru
1. Klik tombol **`+`** di pojok kanan atas jendela terminal VS Code untuk membuat terminal baru.
2. Pastikan Anda berada di folder utama:
   ```powershell
   cd f:\tugasmandiri\Punyadia\goorame
   ```

### 6.2 Memasang Dependensi Node.js (Hanya Pertama Kali)
```powershell
npm install
```

### 6.3 Menyalakan Server Frontend
```powershell
npm run dev
```

Jika berhasil, terminal akan memunculkan:
```text
▲ Next.js 16.4.5 (Turbopack)
- Local:   http://localhost:3000
✓ Ready in 2.1s
```

### 6.4 Membuka Website di Browser
Buka Google Chrome atau Edge, lalu buka:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🖥️ 7. Menjalankan & Membangun Desktop Windows App (Tkinter)

Aplikasi Desktop Goorame dirancang menggunakan **Python Tkinter native** yang langsung terhubung ke database cloud Railway maupun lokal.

### 7.1 Cara Menjalankan Langsung (Mode Python)
Buka terminal baru di VS Code, lalu jalankan:

```powershell
backend\venv\Scripts\python.exe desktop\app.py
```
Jendela aplikasi desktop Goorame dengan logo resmi dan tema gelap emerald modern akan langsung terbuka di layar Anda.

### 7.2 Cara Membangun File Executable Mandiri (`.exe`)
Anda bisa membungkus aplikasi ini menjadi file `.exe` yang bisa dibagikan ke laptop/komputer kasir pekerja tanpa perlu install Python maupun Node.js.

#### Pilihan A: Klik Ganda (*Paling Mudah*)
1. Buka folder `desktop/` di File Explorer Windows Anda.
2. Klik ganda (double-click) file **`build_exe.bat`**.
3. Tunggu hingga proses kompilasi selesai (sekitar 30-60 detik).

#### Pilihan B: Lewat Terminal PowerShell
```powershell
backend\venv\Scripts\pyinstaller.exe --noconfirm --onedir --windowed --name "Goorame-Desktop" --icon "public\favicon.ico" --add-data "public;public" desktop\app.py
```

Setelah selesai, aplikasi siap pakai lengkap dengan logo resmi berada di:
👉 **`dist\Goorame-Desktop\Goorame-Desktop.exe`**

---

## ☁️ 8. Terkoneksi ke Cloud Backend Railway

Aplikasi Goorame sudah terpasang di cloud Railway, sehingga data tersinkronisasi secara real-time antara Web dan Desktop dari mana saja:

* **URL Live API Railway**:  
  `https://vivacious-cat-production-1b1669c9.up.railway.app/api`
* **Dokumentasi Swagger API**:  
  `https://vivacious-cat-production-1b1669c9.up.railway.app/docs`

> 💡 Di aplikasi Desktop, kolom *Server API* di layar login sudah terisi otomatis ke Railway. Anda juga bisa menggantinya ke `http://127.0.0.1:8000/api` jika ingin bekerja secara offline dengan database lokal.

---

## 🔑 9. Akun Login & Hak Akses (RBAC)

Aplikasi memiliki sistem keamanan peran ketat (*Role-Based Access Control*):

| Role / Jabatan | Username | Password | Modul yang Dapat Diakses |
| :--- | :--- | :--- | :--- |
| **Pemilik Usaha** | `pemilik` | `admin123` | **Seluruh 8 Modul**: Dashboard KPI, Stok Kolam, Penjualan, Pengeluaran, Utang/Piutang, Dompet Kas, Akuntansi, & Laporan Keuangan. |
| **Pekerja Kolam** | `pekerja` | `pekerja123` | **Khusus Operasional Kolam**: Melihat data kolam, mencatat tebar bibit, dan mencatat kematian ikan harian. Modul keuangan disembunyikan. |

---

## 📖 10. Panduan Fitur 8 Modul Lengkap

Baik di versi Web maupun Desktop, tersedia 8 modul lengkap:

### 1. 📊 Dashboard (Executive Summary)
- Menampilkan 6 metrik utama: Total Populasi (ekor), Estimasi Biomassa (kg), Total Kas & Bank (Rp), Rata-rata Survival Rate (%), Laba Bersih (Rp), dan Utang Jatuh Tempo (Rp).
- Tombol Aksi Cepat (*Quick Actions*) untuk input transaksi tanpa pindah halaman.

### 2. 🏞️ Stok Kolam & Operasional
- Data teknis kolam (Kapasitas, Stok, Dimensi, Persentase Hidup/SR).
- **Tebar Bibit**: Menambah stok ekor dan bobot ikan di kolam terpilih.
- **Catat Kematian (Mortalitas)**: Mengurangi stok ikan dan otomatis memperbarui nilai survival rate (% SR).

### 3. 🏷️ Penjualan Ikan (Auto Akun 4110 & 1140)
- **Penjualan Tunai (LUNAS)**: Otomatis mendebit akun Kas/Bank pilihan dan mengkredit akun `4110 Penjualan Ikan Gurame Konsumsi`.
- **Penjualan Kredit (TEMPO)**: Otomatis mendebit akun `1140 Piutang Usaha` dan mengkredit akun `4110`.
- Dilengkapi tombol **Ekspor CSV**.

### 4. 💸 Pengeluaran Operasional (Auto Akun 1160/1170/6110/6120)
- Pembelian Pakan pelet otomatis mendebit `1160 Persediaan Pakan Ikan` (sebagai aset persediaan, bukan langsung hangus).
- Pembelian Obat/Vitamin mendebit `1170 Persediaan Obat & Vitamin`.
- Gaji pekerja mendebit `6110 Beban Gaji & Upah`.
- Listrik/Pompa mendebit `6120 Beban Listrik, Aerator & Pompa`.
- Saldo rekening kas asal otomatis terpotong secara riil.

### 5. 💳 Utang Supplier & Piutang Usaha
- **Faktur Pemasok**: Mencatat pembelian pakan/benih secara tempo (kredit) ke pemasok (Kredit `2110 Utang Usaha Pemasok`).
- **Pelunasan Utang**: Mengurangi sisa utang dan mendebit `2110`, memotong saldo Kas/Bank.
- **Monitoring Piutang**: Memantau tagihan tempo dari restoran/pengepul.

### 6. 🏦 Dompet Kas & Rekening Bank
- Memantau saldo riil di masing-masing rekening: Bank BCA (`1110`), Bank BRI (`1120`), dan Kas Kecil (`1130`).
- **Transfer Kas**: Fitur mutasi saldo antar dompet (misal: penarikan tunai dari BCA ke Kas Kecil) dengan jurnal debit-kredit otomatis.

### 7. 📑 Akuntansi Double-Entry & Bagan Akun (COA)
- **Buku Jurnal Umum**: Melihat riwayat jurnal berpasangan dari setiap transaksi beserta status *balance check* (Debet = Kredit).
- **Jurnal Manual**: Form entri jurnal akuntansi manual untuk penyesuaian khusus.
- **COA Terstandarisasi**: Daftar hierarki 22 akun standar budidaya gurame (1110 s.d 6190) dengan tombol sinkronisasi otomatis ke Railway.

### 8. 📈 Laporan Keuangan Standar
- **Laporan Laba (Rugi)**: Menghitung Pendapatan Usaha dikurangi Beban Operasional untuk menghasilkan Laba Bersih periode berjalan.
- **Laporan Posisi Keuangan (Neraca)**: Menampilkan posisi Aset, Kewajiban (Utang), dan Ekuitas (Modal) secara seimbang.
- Tombol **Ekspor Laporan ke CSV** untuk keperluan arsip atau pembukuan eksternal.

---

## ❓ 11. Tanya Jawab & Solusi Kendala (Troubleshooting)

### Q1: Muncul pesan error *"running scripts is disabled on this system"* saat menjalankan virtual environment?
**Solusi**: Jalankan Python langsung menggunakan path executable-nya tanpa perlu aktivasi:
```powershell
backend\venv\Scripts\python.exe backend\run.py
```

### Q2: Browser masih menampilkan judul lama *"Create Next App"*?
**Solusi**: Itu adalah cache statis dari browser Anda. Lakukan hard reload dengan menekan tombol **`Ctrl + Shift + R`** (atau `Ctrl + F5`) di browser Anda.

### Q3: Port 3000 atau Port 8000 bentrok (*EADDRINUSE* / *Already in use*)?
**Solusi**: Ada proses lama yang belum tertutup. Buka Task Manager Windows (`Ctrl + Shift + Esc`), cari proses bernama **Node.js** atau **Python**, lalu klik *End Task*. Setelah itu jalankan kembali perintahnya.

### Q4: Apakah data yang diinput dari Desktop App (.exe) otomatis muncul di Web?
**Jawab**: **YA, 100%!** Karena Desktop App dan Web terhubung ke backend dan database yang sama di Railway, setiap penambahan data (seperti tebar bibit, penjualan, atau pengeluaran) akan langsung sinkron seketika.

---

*Dokumentasi ini dikelola untuk proyek **Goorame Mini-ERP**.*
