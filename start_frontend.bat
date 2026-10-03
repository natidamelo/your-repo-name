@echo off
echo ========================================================
echo Starting Call Center Management System - Frontend App
echo ========================================================
cd frontend
echo Starting Vite dev server on http://127.0.0.1:5173 ...
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
pause
