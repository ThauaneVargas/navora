@echo off
echo Iniciando app mobile com Expo...
echo Escaneie o QR code com o Expo Go no celular.
echo ATENCAO: No celular, o backend precisa ser o IP da sua maquina, nao localhost.
echo.
cd /d "%~dp0mobile"
npx expo start
