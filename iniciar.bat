@echo off
chcp 65001 >nul
title Tejedora de ramas narrativas - Servidor local
cd /d "%~dp0"

echo ============================================================
echo   Iniciando "Tejedora de ramas narrativas" en local
echo ============================================================
echo.
echo Carpeta: %cd%
echo.

REM Instala dependencias solo si falta la carpeta node_modules
if not exist "node_modules" (
    echo Primera vez: instalando dependencias, esto tarda 1-2 minutos...
    call npm install
    echo.
)

echo Arrancando el servidor...
echo Cuando veas "MCP endpoint: http://localhost:3000/mcp" ya esta listo.
echo NO cierres esta ventana mientras uses la app o el MCP.
echo.
call npm run dev

echo.
echo El servidor se detuvo. Revisa si hubo algun error arriba.
pause
