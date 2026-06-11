@echo off
chcp 65001 >nul
title Tejedora de Ramas Narrativas - Servidor MCP
cd /d "%~dp0"

echo ============================================================
echo   TEJEDORA DE RAMAS NARRATIVAS
echo   Iniciando servidor + MCP para Claude Desktop
echo ============================================================
echo.

REM --- Comprobar que existe package.json en esta carpeta ---
if not exist "package.json" (
    echo [ERROR] No encuentro package.json en esta carpeta.
    echo Asegurate de que iniciar-tejedora.bat este junto a package.json.
    echo.
    pause
    exit /b 1
)

REM --- Instalar dependencias solo si faltan ---
if not exist "node_modules" (
    echo [1/2] Instalando dependencias por primera vez... esto tarda un poco.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo npm install. Revisa tu conexion o tu instalacion de Node.
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencias ya instaladas. OK.
)

echo.
echo [2/2] Arrancando servidor en http://localhost:3000
echo       Endpoint MCP: http://localhost:3000/mcp
echo.
echo  - Se abrira el navegador automaticamente en unos segundos.
echo  - DEJA ESTA VENTANA ABIERTA mientras uses la app y Claude.
echo  - Para detener el servidor: cierra esta ventana o pulsa Ctrl+C.
echo.

REM --- Abrir el navegador despues de unos segundos, sin bloquear el server ---
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 6; Start-Process 'http://localhost:3000'"

REM --- Arrancar el servidor (se queda corriendo en esta ventana) ---
call npm run dev

echo.
echo El servidor se detuvo.
pause
