@echo off
echo Iniciando Web Admin em http://localhost:5173
echo Pressione Ctrl+C para parar.
echo.
cd /d "%~dp0web-admin"
npm run dev
