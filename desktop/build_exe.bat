@echo off
title Membangun Goorame Desktop Windows (.exe)
echo =======================================================
echo    Membangun Executable Windows (Goorame Desktop)
echo    Dilengkapi Logo Resmi & Terkoneksi ke Railway
echo =======================================================
echo.

cd /d "%~dp0\.."

echo Memeriksa virtual environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment backend tidak ditemukan!
    pause
    exit /b 1
)

echo Menginstal dependencies PyInstaller, Requests & Pillow...
backend\venv\Scripts\python.exe -m pip install requests pyinstaller pillow

echo.
echo Menjalankan PyInstaller dengan Logo Resmi Goorame...
backend\venv\Scripts\pyinstaller.exe --noconfirm --onedir --windowed ^
    --name "Goorame-Desktop" ^
    --icon "public\favicon.ico" ^
    --add-data "public;public" ^
    desktop\app.py

echo.
echo =======================================================
echo SELESAI!
echo File executable aplikasi Windows siap di folder:
echo dist\Goorame-Desktop\Goorame-Desktop.exe
echo =======================================================
pause
