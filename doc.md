# Dokumentasi Teknis Goorame

Goorame adalah sistem informasi manajemen budidaya ikan gurame dan pencatatan akuntansi double-entry. Aplikasi ini mendukung operasional tambak (stok kolam, tebar bibit, mortalitas, panen) serta transaksi finansial (penjualan tunai/tempo, pembelian pakan/obat, utang pemasok, kas/bank, jurnal umum, buku besar, dan laporan keuangan).

Sistem ini terdiri dari tiga komponen:
1. **Frontend Web**: Antarmuka berbasis Next.js 16 (React 19) dan Tailwind CSS.
2. **Backend API**: REST API berbasis Python FastAPI, SQLAlchemy ORM, dan Pydantic.
3. **Desktop App**: Klien desktop Windows berbasis Python Tkinter yang dapat dikompilasi menjadi file executable mandiri (.exe).

Backend dan database juga telah terpasang di layanan cloud Railway:
- **Base URL API Production**: `https://vivacious-cat-production-1b1669c9.up.railway.app/api`
- **Dokumentasi Swagger UI**: `https://vivacious-cat-production-1b1669c9.up.railway.app/docs`

---

## Kebutuhan Sistem

Sebelum menjalankan proyek, pastikan perangkat telah terpasang:

1. **Python**: Versi 3.10 atau yang lebih baru.
   - Saat instalasi di Windows, pastikan opsi **Add python.exe to PATH** dicentang.
2. **Node.js**: Versi 18 LTS atau 20 LTS ke atas (sudah termasuk npm).
3. **Visual Studio Code**: Editor yang direkomendasikan.

Verifikasi instalasi melalui terminal:
```powershell
python --version
node -v
npm -v
```

---

## Struktur Direktori

```text
goorame/
├── app/                      # Routing, metadata layout, dan icon Next.js
├── components/goorame/       # Komponen UI Web (Dashboard, Kolam, Penjualan, dll.)
│   ├── akuntansi-view.tsx    # Jurnal Umum, Buku Besar (General Ledger), dan COA
│   ├── dashboard-view.tsx    # Ringkasan KPI dan status kolam
│   ├── kolam-view.tsx        # Monitoring kolam dan mutasi ikan
│   ├── penjualan-view.tsx    # Faktur penjualan tunai dan tempo
│   ├── pengeluaran-view.tsx  # Biaya operasional dan pembelian persediaan
│   ├── utang-view.tsx        # Faktur utang supplier dan kartu piutang
│   ├── kas-view.tsx          # Rekening bank, kas kecil, dan buku kas
│   ├── laporan-view.tsx      # Laba rugi dan neraca saldo
│   └── modals.tsx            # Form dialog transaksi
├── backend/                  # REST API FastAPI
│   ├── app/
│   │   ├── api/              # Endpoint router per modul
│   │   ├── core/             # Konfigurasi database, security, dan seeder data
│   │   ├── models/           # Definisi tabel database SQLAlchemy
│   │   ├── schemas/          # Validasi skema request/response Pydantic
│   │   └── services/         # Logika bisnis dan auto-journaling
│   ├── requirements.txt      # Dependensi pustaka Python backend
│   └── run.py                # Entrypoint server lokal (Uvicorn)
├── desktop/                  # Klien Desktop Windows (Tkinter)
│   ├── app.py                # Logika antarmuka desktop, REST client, dan kalkulasi ledger
│   ├── build_exe.bat         # Script otomatis build PyInstaller (.exe)
│   └── README.md             # Petunjuk khusus aplikasi desktop
├── public/                   # Aset publik (logo, background, favicon)
└── doc.md                    # Dokumentasi ini
```

---

## Panduan Instalasi dan Menjalankan Sistem

Buka folder proyek Goorame di VS Code melalui menu **File** > **Open Folder...**. Seluruh terminal yang dibuka di VS Code otomatis mengarah ke root direktori proyek.

### 1. Menjalankan Backend (FastAPI)

Buka terminal pertama di VS Code (**Terminal** > **New Terminal**):

```powershell
# 1. Buat virtual environment (hanya dilakukan sekali saat awal setup)
python -m venv backend\venv

# 2. Pasang dependensi backend
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt

# 3. Pasang dependensi tambahan untuk GUI Desktop dan PyInstaller
backend\venv\Scripts\python.exe -m pip install requests pillow pyinstaller

# 4. Jalankan server lokal
backend\venv\Scripts\python.exe backend\run.py
```

Server backend lokal berjalan pada `http://127.0.0.1:8000`. Dokumentasi interaktif Swagger dapat diakses di `http://127.0.0.1:8000/docs`.

Biarkan terminal ini tetap aktif.

### 2. Menjalankan Frontend Web (Next.js)

Buka terminal kedua di VS Code (klik ikon **+** pada panel terminal):

```powershell
# 1. Pasang paket dependensi Node.js (hanya dilakukan sekali)
npm install

# 2. Jalankan development server
npm run dev
```

Aplikasi web dapat dibuka melalui browser pada alamat:
`http://localhost:3000`

### 3. Menjalankan Aplikasi Desktop (Tkinter)

Aplikasi desktop dapat dijalankan langsung menggunakan interpreter Python:

```powershell
backend\venv\Scripts\python.exe desktop\app.py
```

Aplikasi desktop ini menggunakan HTTP REST client untuk berkomunikasi langsung ke backend Railway secara default, atau dapat diarahkan ke backend lokal melalui input field URL server pada layar login.

---

## Kompilasi Executable Windows (.exe)

Untuk mendistribusikan aplikasi desktop ke komputer lain tanpa memerlukan instalasi Python:

1. Buka File Explorer dan masuk ke folder `desktop`.
2. Jalankan script `build_exe.bat` dengan klik ganda.
3. Script akan menghasilkan output pada folder `dist`:
   - **`dist\Goorame-Desktop-Standalone.exe`**: File tunggal mandiri (~29 MB). File ini merangkum seluruh runtime Python, dependensi, dan aset gambar. Cukup bagikan file ini ke PC lain dan aplikasi langsung dapat dijalankan.
   - **`dist\Goorame-Desktop\`**: Versi folder portabel. Jika menggunakan versi ini, seluruh folder (termasuk sub-folder `_internal`) harus disertakan atau dikompresi ke format ZIP sebelum dikirim.

---

## Akun Pengguna dan Hak Akses (RBAC)

Sistem menerapkan pembagian peran pengguna (*Role-Based Access Control*):

| Username | Password | Peran | Cakupan Hak Akses |
| :--- | :--- | :--- | :--- |
| `pemilik` | `admin123` | PEMILIK | Akses penuh ke seluruh 8 modul (Dashboard, Kolam, Penjualan, Pengeluaran, Utang/Piutang, Kas/Bank, Akuntansi, Laporan Keuangan). |
| `pekerja` | `pekerja123` | PEKERJA | Akses terbatas pada operasional kolam (monitoring stok, pencatatan tebar bibit, dan pencatatan mortalitas harian). Seluruh menu finansial dan akuntansi disembunyikan. |

---

## Rincian Modul dan Aturan Akuntansi

### 1. Dashboard
Menampilkan ringkasan eksekutif secara real-time: total populasi ikan, estimasi biomassa kolam (kg), saldo kas dan bank, rata-rata tingkat kelangsungan hidup (*survival rate*), laba/rugi berjalan, dan utang supplier jatuh tempo. Dilengkapi tombol aksi cepat untuk input transaksi langsung.

### 2. Stok Kolam & Biologis
Mengelola data teknis setiap kolam (pendederan/pembesaran/karantina), kapasitas, dimensi, jumlah tebar awal, dan status aktif.
- **Tebar Bibit**: Menambah populasi ikan dan estimasi bobot pada kolam terkait.
- **Mortalitas**: Mencatat kematian ikan harian dan secara otomatis memperbarui persentase *Survival Rate* (SR).

### 3. Penjualan Ikan (Auto-Journaling Akun 4110 & 1140)
Mencatat faktur panen dan penjualan ikan konsumsi atau bibit.
- **Penjualan Lunas**: Mendebit akun Kas/Bank terpilih dan mengkredit akun `4110 Penjualan Ikan Gurame Konsumsi`.
- **Penjualan Tempo**: Mendebit akun `1140 Piutang Usaha` dan mengkredit akun `4110`.
- Data transaksi dapat diekspor ke format CSV.

### 4. Pengeluaran & Pembelian Persediaan (Auto-Journaling 1160, 1170, 6110, 6120)
Mencatat pengeluaran operasional tambak dengan pemetaan akun otomatis:
- **Pakan**: Mendebit akun aset `1160 Persediaan Pakan Ikan` dan mengkredit akun Kas/Bank asal.
- **Obat & Vitamin**: Mendebit akun aset `1170 Persediaan Obat, Vitamin & Garam` dan mengkredit Kas/Bank.
- **Gaji Pekerja**: Mendebit akun beban `6110 Beban Gaji & Upah Tenaga Kerja` dan mengkredit Kas/Bank.
- **Listrik & Pompa**: Mendebit akun beban `6120 Beban Listrik, Aerator & Pompa Air` dan mengkredit Kas/Bank.

### 5. Utang Pemasok & Piutang Usaha
- **Faktur Pemasok**: Pembelian pakan/obat secara kredit dari supplier. Transaksi mendebit akun persediaan terkait dan mengkredit akun `2110 Utang Usaha Pemasok`.
- **Pelunasan Utang**: Mengurangi sisa saldo tagihan faktur, mendebit akun `2110`, dan mengkredit akun Kas/Bank.
- **Kartu Piutang**: Memantau daftar faktur tempo pelanggan yang belum lunas.

### 6. Dompet Kas & Bank
Menampilkan saldo akun likuid: Bank BCA (`1110`), Bank BRI (`1120`), dan Kas Kecil / Tunai (`1130`).
- **Transfer Kas**: Fasilitas pemindahan dana antar akun kas/bank (misalnya pengisian kas kecil dari BCA). Sistem otomatis membukukan jurnal debit rekening tujuan dan kredit rekening asal.

### 7. Akuntansi Double-Entry, Buku Besar & Bagan Akun (COA)
- **Buku Jurnal Umum**: Menampilkan seluruh entri jurnal berpasangan beserta status validasi keseimbangan (*balance check* debit = kredit).
- **Buku Besar (General Ledger)**: Fasilitas drilldown per akun COA untuk melihat histori mutasi transaksi debit, kredit, saldo berjalan (*running balance*), dan saldo penutupan akun. Dilengkapi fitur unduh mutasi akun ke format CSV.
- **Bagan Akun (Chart of Accounts)**: Hierarki akun standar 1000 s.d 6000:
  - `1000 - 1180`: Aset Lancar (Kas, Bank, Piutang, Persediaan Pakan/Obat/Bibit, Aset Biologis)
  - `2000 - 2120`: Kewajiban (Utang Usaha Pemasok, Beban Akrual)
  - `3000 - 3300`: Ekuitas (Modal Pemilik, Laba Ditahan, Prive)
  - `4000 - 4120`: Pendapatan (Penjualan Ikan Konsumsi, Penjualan Benih)
  - `5000 - 5120`: Harga Pokok Penjualan (HPP Ikan, Mortalitas)
  - `6000 - 6190`: Beban Operasional (Gaji, Listrik/Pompa, BBM, Pemeliharaan)
- **Sinkronisasi COA**: Fitur untuk memastikan struktur akun database di Railway selalu sesuai dengan standar akuntansi Goorame.

### 8. Laporan Keuangan
- **Laporan Laba (Rugi)**: Perhitungan pendapatan usaha dikurangi total beban operasional untuk menghasilkan laba bersih periode berjalan.
- **Neraca (Posisi Keuangan)**: Menyajikan posisi aktiva (aset) dan pasiva (kewajiban + ekuitas) dengan validasi keseimbangan (*is_balanced*).
- Seluruh laporan dapat diekspor ke file CSV.

---

## Troubleshooting

### Error: "Failed to load Python DLL ...\_internal\python314.dll"
- **Penyebab**: Menjalankan file `Goorame-Desktop.exe` hasil `--onedir` di komputer lain tanpa menyertakan folder `_internal`.
- **Solusi**: Gunakan file **`dist\Goorame-Desktop-Standalone.exe`** yang merupakan build single-file mandiri, atau kompresi seluruh folder `dist\Goorame-Desktop` ke format ZIP sebelum dipindahkan ke komputer lain.

### Script Execution Disabled di PowerShell
- **Gejala**: Muncul pesan *"running scripts is disabled on this system"* saat memanggil script aktivasi venv.
- **Solusi**: Jalankan Python langsung melalui path binary-nya tanpa mengaktifkan script:
  ```powershell
  backend\venv\Scripts\python.exe backend\run.py
  ```

### Port 3000 atau Port 8000 Sudah Terpakai (EADDRINUSE)
- **Penyebab**: Proses Node.js atau Python sebelumnya masih berjalan di background.
- **Solusi**: Buka Task Manager Windows (`Ctrl + Shift + Esc`), cari dan hentikan proses bernama **Node.js** atau **Python**, kemudian jalankan kembali perintah startup.

### Cache Halaman Web Menampilkan Judul atau Nama Lama
- **Penyebab**: Browser menyimpan cache statis halaman HTML sebelumnya.
- **Solusi**: Lakukan hard reload pada browser dengan menekan tombol kombinasi **`Ctrl + Shift + R`** (atau `Ctrl + F5`).
