@echo off
title Membangun Goorame Desktop Windows (.exe)
echo =======================================================
echo    Membangun Executable Windows (Goorame Desktop)
echo =======================================================
echo.

cd /d "%~dp0\.."

echo Memeriksa virtual environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment backend tidak ditemukan!
    pause
    exit /b 1
)

echo Menginstal dependencies PyInstaller & Requests...
backend\venv\Scripts\python.exe -m pip install requests pyinstaller

echo.
echo Menjalankan PyInstaller...
backend\venv\Scripts\pyinstaller.exe --noconfirm --onedir --windowed --name "Goorame-Desktop" desktop\app.py

echo.
echo =======================================================
echo SELESAI!
echo File executable aplikasi Windows siap di folder:
echo dist\Goorame-Desktop\Goorame-Desktop.exe
echo =======================================================
pause
