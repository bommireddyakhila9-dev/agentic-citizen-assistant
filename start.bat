@echo off
title CitizenConnect AI - Agentic Municipal Assistant
echo ========================================================
echo   Starting Agentic AI Citizen Assistant Full-Stack App
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "CitizenConnect Backend (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "CitizenConnect Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo   Both services launched!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000/docs
echo ========================================================
pause
