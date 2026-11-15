# 🖥️ Goorame Desktop App (Windows GUI - Tkinter)

Aplikasi desktop native Windows untuk manajemen operasional budidaya gurame & akuntansi double-entry, dibuat menggunakan **Python Tkinter & Pillow**, terkoneksi langsung ke database cloud **Railway**.

---

## ✨ 8 Modul Lengkap (Sama Persis dengan Versi Web)

Aplikasi desktop Goorame telah dilengkapi dengan seluruh modul operasional dan akuntansi yang ada di versi web:

1. **📊 Dashboard (Ringkasan Eksekutif & KPI)**:
   - 6 Kartu Metrik KPI Real-Time: Total Populasi Ikan, Estimasi Biomassa (Kg), Total Saldo Kas & Bank (Rp), Rata-rata Survival Rate (%), Laba Bersih Berjalan (Rp), dan Utang Jatuh Tempo (Rp).
   - Bar Aksi Cepat (*Quick Actions*): Tebar Bibit, Catat Kematian, Tambah Penjualan, Catat Pengeluaran, Bayar Utang.
   - Tabel ringkasan kondisi dan status seluruh kolam aktif.
2. **🏞️ Stok Kolam & Operasional Biologis**:
   - Master data kolam (Nama, Tipe, Dimensi, Kapasitas, Stok Ekor, Biomassa Kg, Total Tebar, Kematian, Survival Rate %, Status).
   - Modal Form: Tambah Kolam Baru, Tebar Bibit Baru, dan Catat Kematian (Mortalitas).
3. **🏷️ Penjualan Ikan (Auto-Journaling Akun 4110 & 1140)**:
   - Pencatatan faktur panen & penjualan konsumsi (No Faktur, Tanggal, Pembeli, Kolam, Ekor, Kg, Harga/Kg, Nilai Total).
   - Status Pembayaran: **LUNAS** (otomatis mendebit Kas/Bank dan mengkredit 4110) atau **TEMPO** (otomatis mendebit Piutang Usaha 1140 dan mengkredit 4110).
   - Tombol **Ekspor Laporan Penjualan ke CSV**.
4. **💸 Pengeluaran Operasional (Auto-Journaling 1160/1170/6110/6120)**:
   - Pencatatan belanja pakan pelet (`1160`), obat/vitamin (`1170`), gaji pekerja (`6110`), dan listrik/pompa aerator (`6120`).
   - Saldo kas/bank berkurang otomatis dan jurnal umum double-entry tercatat secara otomatis.
   - Tombol **Ekspor Laporan Pengeluaran ke CSV**.
5. **💳 Utang Pemasok & Piutang Pelanggan**:
   - Faktur utang kredit supplier (Auto Kredit `2110 Utang Usaha Pemasok`).
   - Modal pelunasan utang supplier (Auto Debit `2110` dan Kredit Kas/Bank).
   - Daftar piutang aktif dari pelanggan/restoran yang bertransaksi tempo.
6. **🏦 Dompet Kas Operasional & Rekening Bank**:
   - Kartu saldo real-time: Bank BCA (`1110`), Bank BRI (`1120`), Kas di Tangan/Kas Kecil (`1130`).
   - Modal transfer antar rekening kas/bank dengan mutasi jurnal otomatis.
7. **📑 Akuntansi Double-Entry, Buku Besar & Bagan Akun (COA 1110-6190)**:
   - **Buku Jurnal Umum**: Audit trail transaksi lengkap dengan nomor bukti, kode akun, debet, kredit, dan verifikasi keseimbangan (*balance check*).
   - **📚 Buku Besar (General Ledger)**: Drilldown mutasi detail per akun COA dengan kartu saldo akhir, tabel debet/kredit/saldo berjalan (*running balance*), dan tombol **Unduh CSV Buku Besar**.
   - Modal Entri Jurnal Manual (dengan validasi otomatis Debet == Kredit).
   - **Bagan Akun (COA Terstandarisasi)**: Hierarki akun 1000 Aset, 2000 Kewajiban, 3000 Ekuitas, 4000 Pendapatan, 5000 HPP, 6000 Beban.
   - Tombol Sinkronisasi Standar COA ke Database Railway.
8. **📈 Laporan Keuangan Standar**:
   - Pilihan format: **Laporan Laba (Rugi) Komprehensif** dan **Posisi Keuangan (Neraca / Balance Sheet)**.
   - Perhitungan otomatis Laba Bersih dan Status Keseimbangan Neraca (*Aktiva = Pasiva*).
   - Tombol **Ekspor Laporan Keuangan ke CSV**.

---

## 🎨 Branding & Logo Resmi

- **Titlebar Icon**: Menggunakan icon resmi ikan Goorame (`public/favicon.ico`).
- **Layar Login**: Dilengkapi logo resmi Goorame beresolusi tinggi di atas form autentikasi.
- **Top Bar Navigasi**: Logo Goorame berdampingan dengan teks merek dan badge status server live Railway.

---

## 🔒 Hak Akses Berbasis Peran (RBAC)

- **Pemilik (`pemilik` / `admin123`)**:
  Memiliki akses penuh ke seluruh 8 modul (Dashboard, Kolam, Penjualan, Pengeluaran, Utang, Kas, Akuntansi, Laporan).
- **Pekerja (`pekerja` / `pekerja123`)**:
  Hanya dapat mengakses tab **Manajemen Kolam & Mutasi Ikan** (mencatat tebar bibit dan kematian), sementara modul keuangan dan akuntansi disembunyikan.

---

## 🚀 Cara Menjalankan Langsung (Mode Python)

Buka Terminal / PowerShell di root proyek:

```powershell
backend\venv\Scripts\python.exe desktop\app.py
```

---

## 📦 Cara Membangun Executable Windows (`.exe`)

1. Buka folder `desktop/` di Windows Explorer.
2. Klik 2x file **`build_exe.bat`**.
3. File `.exe` siap pakai beserta logo dan seluruh aset akan berada di:
   👉 **`dist/Goorame-Desktop/Goorame-Desktop.exe`**
