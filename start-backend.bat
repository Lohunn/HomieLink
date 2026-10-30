@echo off
cd /d "%~dp0"
echo ===================================================
echo Starting HomieLink ASGI Backend (Daphne / Django)
echo http://127.0.0.1:8000
echo ===================================================
python backend/manage.py runserver 127.0.0.1:8000
pause

