@echo off
title Membangun Goorame Desktop Windows (.exe)
echo =======================================================
echo    Membangun Executable Windows (Goorame Desktop)
echo    1 File Tunggal Mandiri (Standalone - Tanpa Folder Tambahan)
echo =======================================================
echo.

cd /d "%~dp0\.."

echo Memeriksa virtual environment Python...
if not exist "backend\venv\Scripts\python.exe" (
    echo [INFO] Virtual environment belum ditemukan.
    echo Membuat virtual environment backend\venv secara otomatis...
    python -m venv backend\venv
    if errorlevel 1 (
        echo [ERROR] Gagal membuat virtual environment!
        echo Pastikan Python sudah terinstal di komputer Anda dan dicentang 'Add to PATH'.
        pause
        exit /b 1
    )
)

echo Menginstal dependencies PyInstaller, Requests & Pillow...
backend\venv\Scripts\python.exe -m pip install requests pyinstaller pillow

echo.
echo [1/2] Membangun File Tunggal Mandiri (--onefile)...
backend\venv\Scripts\pyinstaller.exe --noconfirm --onefile --windowed ^
    --name "Goorame-Desktop-Standalone" ^
    --icon "public\favicon.ico" ^
    --add-data "public;public" ^
    desktop\app.py

echo.
echo [2/2] Membangun Folder Portabel (--onedir)...
backend\venv\Scripts\pyinstaller.exe --noconfirm --onedir --windowed ^
    --name "Goorame-Desktop" ^
    --icon "public\favicon.ico" ^
    --add-data "public;public" ^
    desktop\app.py

echo.
echo =======================================================
echo SELESAI!
echo.
echo PILIHAN 1 (Direkomendasikan untuk dibagikan ke PC lain):
echo 👉 dist\Goorame-Desktop-Standalone.exe
echo    (Cukup kirim 1 file ini saja! Bisa langsung dijalankan di PC lain).
echo.
echo PILIHAN 2 (Folder Lengkap):
echo 👉 dist\Goorame-Desktop\
echo    (Harus di-ZIP dulu SELURUH FOLDERNYA sebelum dikirim ke PC lain).
echo =======================================================
pause
