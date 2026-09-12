@echo off
title GoDesc 360 - Servidor Local (Porta 10000)
cd /d "%~dp0server"
echo =====================================================================
echo           GODESC 360 - SERVIDOR DE WHATSAPP E E-MAIL LOCAL
echo =====================================================================
echo.
echo Iniciando o servidor na porta 10000...
echo Mantenha esta janela aberta enquanto estiver utilizando o GoDesc 360.
echo.
node index.js
pause
