@echo off
echo ========================================================
echo Starting Call Center Management System - Backend Server
echo ========================================================
cd backend
echo Initializing database tables and seeding 12 staff profiles...
python -m app.seed
echo Starting FastAPI Uvicorn server on http://127.0.0.1:8001 ...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
