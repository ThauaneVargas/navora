@echo off
echo Subindo banco PostgreSQL...
cd /d "%~dp0backend-nest"
docker-compose up -d
echo.
echo Iniciando backend NestJS em http://localhost:8000
echo Pressione Ctrl+C para parar.
echo.
npm run start:dev
