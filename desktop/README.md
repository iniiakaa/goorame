# 🖥️ Goorame Desktop App (Windows GUI - Tkinter)

Aplikasi desktop native Windows untuk manajemen operasional budidaya gurame & akuntansi, dibuat menggunakan **Python Tkinter**.

---

## ❓ Apakah database bisa diambil dari Railway?

**BISA 100%!**  
Aplikasi Tkinter ini berkomunikasi dengan backend melalui **REST API JSON (HTTP/HTTPS)**. 
- Anda bisa menghubungkannya ke backend lokal (`http://127.0.0.1:8000/api`).
- Atau langsung menghubungkannya ke **Backend Railway Anda di Cloud** (misal: `https://goorame-backend.up.railway.app/api`).

Data yang diinput dari aplikasi desktop Windows ini (seperti tebar bibit, mortalitas, penjualan) **akan langsung masuk ke database PostgreSQL di Railway** dan langsung tersinkronisasi secara real-time ke web Next.js!

---

## 🚀 Cara Menjalankan Langsung (Mode Python)

Buka Terminal / PowerShell di root proyek:

```powershell
backend\venv\Scripts\python.exe desktop\app.py
```

---

## 📦 Cara Membuat File Executable Windows (`.exe`)

Kami sudah menyediakan script otomatis untuk membungkus aplikasi ini menjadi `.exe` menggunakan **PyInstaller**:

### Cara Cepat (Klik 2x):
1. Buka folder `desktop/` di File Explorer Windows Anda.
2. Klik 2x file **`build_exe.bat`**.
3. Tunggu hingga proses selesai.

### Cara Lewat Terminal:
```powershell
backend\venv\Scripts\pyinstaller.exe --noconfirm --onedir --windowed --name "Goorame-Desktop" desktop\app.py
```

Setelah selesai, aplikasi siap pakai akan berada di:
👉 **`dist/Goorame-Desktop/Goorame-Desktop.exe`**

Folder tersebut bisa Anda zip dan bagikan ke pekerja kolam atau dipasang di komputer kasir Windows mana saja tanpa perlu install Python maupun Node.js!

---

## 🔑 Pengaturan URL Server Railway di Aplikasi

Saat aplikasi `.exe` dibuka, di layar login terdapat kolom:
```text
Server API URL: https://[URL-BACKEND-RAILWAY-ANDA].up.railway.app/api
```
Cukup ganti dengan URL backend Railway Anda, lalu login dengan:
- **Pemilik**: `pemilik` / `admin123`
- **Pekerja**: `pekerja` / `pekerja123`
