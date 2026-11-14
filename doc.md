# 📘 Panduan Menjalankan Goorame Mini-ERP (Untuk Pemula)

Selamat datang! Dokumen ini dibuat khusus agar **siapa saja yang baru menginstal Visual Studio Code (VS Code)** bisa menjalankan aplikasi **Goorame Mini-ERP** di komputernya dengan mudah, langkah demi langkah, tanpa bingung.

---

## 🧭 Gambaran Singkat Aplikasi

Aplikasi **Goorame** terdiri dari 2 bagian yang bekerja bersamaan:
1. **Frontend (Tampilan Website)**: Dibuat dengan Next.js / React (berjalan di port `3000`).
2. **Backend (Otak & Database)**: Dibuat dengan Python FastAPI & SQLite (berjalan di port `8000`).

Agar aplikasi bisa dibuka di browser, **keduanya harus dinyalakan bersamaan**.

---

## 🛠️ Langkah 0: Program yang Harus Terinstal di Laptop / PC

Sebelum mulai di VS Code, pastikan 2 program ini sudah terinstal di komputer Anda:

1. **Node.js** (Versi 18 atau 20 ke atas)
   - Download di: [https://nodejs.org/](https://nodejs.org/) (Pilih versi **LTS**).
2. **Python** (Versi 3.10, 3.11, atau 3.12)
   - Download di: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - ⚠️ **PENTING SAAT INSTALL PYTHON**: Centang kotak bertuliskan **"Add python.exe to PATH"** di bagian bawah sebelum klik tombol Install.

---

## 💻 Langkah 1: Membuka Folder Proyek di VS Code

1. Buka aplikasi **VS Code**.
2. Klik menu **File** (di pojok kiri atas) → pilih **Open Folder...**.
3. Cari dan pilih folder proyek:
   ```text
   f:\tugasmandiri\Punyadia\goorame
   ```
4. Jika muncul jendela peringatan *"Do you trust the authors of the files in this folder?"*, klik tombol **Yes, I trust the authors**.

---

## 🖥️ Langkah 2: Membuka Terminal di VS Code

Terminal adalah tempat kita mengetikkan perintah untuk menyalakan program:

1. Di menu atas VS Code, klik **Terminal** → pilih **New Terminal**.
2. Sebuah jendela hitam/abu-abu (PowerShell) akan muncul di bagian bawah layar VS Code Anda.

---

## 🚀 Langkah 3: Menjalankan Backend (Python FastAPI)

Kita jalankan bagian Backend terlebih dahulu.

### 3.1 Jika Ini Pertama Kali Anda Menjalankan Proyek:
Ketik perintah ini di terminal satu per satu lalu tekan **Enter**:

```powershell
# 1. Masuk ke virtual environment Python bawaan
backend\venv\Scripts\Activate.ps1

# 2. Pastikan paket dependensi terpasang
pip install -r backend\requirements.txt
```

> 💡 *Catatan:* Jika muncul tulisan merah *"running scripts is disabled on this system"*, Anda bisa langsung melompat ke langkah 3.2 di bawah tanpa perlu pusing!

### 3.2 Menyalakan Server Backend:
Cukup ketik perintah ini di terminal dan tekan **Enter**:

```powershell
backend\venv\Scripts\python.exe backend\run.py
```

Jika berhasil, terminal akan menampilkan teks seperti ini:
```text
==================================================
🚀 Goorame Mini-ERP Backend (FastAPI)
🌍 Host: 0.0.0.0:8000
📖 Swagger UI: /docs
==================================================
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```
✅ **Backend sudah menyala! Biarkan terminal ini tetap terbuka.**

---

## 🌐 Langkah 4: Menjalankan Frontend (Tampilan Website)

Sekarang kita perlu membuka **terminal kedua** tanpa mematikan terminal pertama.

1. Di pojok kanan atas jendela terminal (di bawah), klik tanda **`+`** (Split / New Terminal) untuk membuat terminal baru.
2. Di terminal kedua yang baru muncul, pastikan Anda berada di folder utama:
   ```powershell
   cd f:\tugasmandiri\Punyadia\goorame
   ```

### 4.1 Jika Ini Pertama Kali:
Ketik perintah ini untuk memasang pustaka tampilan website:
```powershell
npm install
```
*(Tunggu 1–2 menit sampai proses unduhan selesai).*

### 4.2 Menyalakan Frontend:
Ketik perintah ini dan tekan **Enter**:
```powershell
npm run dev
```

Jika berhasil, terminal akan menampilkan:
```text
▲ Next.js 16.4.5 (Turbopack)
- Local:   http://localhost:3000
✓ Ready in 2.5s
```
✅ **Frontend sudah menyala!**

---

## 📱 Langkah 5: Membuka Aplikasi di Browser

Buka browser favorit Anda (Google Chrome, Microsoft Edge, atau Mozilla Firefox), lalu ketik alamat berikut:

👉 **[http://localhost:3000](http://localhost:3000)**

Halaman login **Goorame** akan langsung muncul di layar Anda!

---

## 🔑 Akun untuk Masuk (Login)

Anda bisa langsung mengklik tombol **1-Klik Demo** di bawah form login, atau mengetikkan manual:

| Role / Jabatan | Username | Password | Keterangan Akses |
| :--- | :--- | :--- | :--- |
| **Pemilik Usaha** | `pemilik` | `admin123` | Akses penuh (Dashboard, Keuangan, Kas/Bank, Penjualan, Jurnal & Neraca) |
| **Pekerja Kolam** | `pekerja` | `pekerja123` | Akses khusus lapangan (Stok Ikan Kolam, Tebar Bibit, Catat Ikan Mati) |

---

## 🛑 Cara Mematikan Server (Jika Sudah Selesai)

Jika Anda sudah selesai menggunakan aplikasi dan ingin mematikannya:
1. Klik pada jendela terminal di VS Code.
2. Tekan tombol **`Ctrl + C`** di keyboard Anda (tekan bersamaan).
3. Jika ditanya `Terminate batch job (Y/N)?`, ketik **`Y`** lalu tekan **Enter**.
4. Lakukan hal yang sama pada kedua terminal.

---

## ❓ Masalah yang Sering Dialami Pemula (FAQ)

### 1. Muncul Tulisan *"Database Menghubungkan..."* warna kuning di topbar
- **Penyebab**: Server Backend (Langkah 3) belum dinyalakan atau tidak sengaja tertutup.
- **Solusi**: Pastikan terminal Backend tetap berjalan di port `8000`. Jika backend aktif, badge akan menyala hijau bertuliskan **"SQLite Database Aktif"**.

### 2. Port 3000 atau 8000 Bentrok (*Already in use*)
- **Penyebab**: Server lama belum dimatikan sempurna saat menutup VS Code.
- **Solusi**: Tutup aplikasi VS Code sepenuhnya, lalu buka kembali dan jalankan perintah dari Langkah 3.

### 3. Ingin Reset Ulang Data ke Awal
- Cukup hapus file `goorame.db` di folder proyek, lalu restart backend. Sistem otomatis men-generate ulang database baru lengkap dengan data bawaan yang rapi.
