@echo off
title Alicerce Excel RTD — Teste de Conexao e Diagnostico
color 0e
cd /d "%~dp0"

echo =========================================================================
echo       ALICERCE EXCEL RTD CONNECTOR — TESTAR CONEXAO E STATUS
echo =========================================================================
echo.

if exist "app\AlicerceExcelConnector.exe" (
    "app\AlicerceExcelConnector.exe" diag
) else if exist "%LOCALAPPDATA%\AlicerceExcelConnector\AlicerceExcelConnector.exe" (
    "%LOCALAPPDATA%\AlicerceExcelConnector\AlicerceExcelConnector.exe" diag
) else (
    echo [❌] Erro: Executavel nao localizado.
    echo Execute o Instalar.bat primeiro para instalar o aplicativo.
)

echo.
pause
