@echo off
setlocal
title Conector Profissional Excel RTD / Profit Pro

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [AVISO] Ambiente virtual nao encontrado. Criando .venv...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

set PYTHONPATH=%~dp0

echo ========================================================
echo    CONECTOR EXCEL RTD / PROFIT PRO - FASE 1
echo ========================================================
echo.
echo Escolha o modo de execucao:
echo [1] Descobrir Planilhas e Abas Abertas (discover)
echo [2] Iniciar Monitoramento Continuo (monitor)
echo [3] Executar Testes Automatizados (pytest)
echo [4] Sair
echo.
set /p opt="Digite a opcao (1, 2, 3 ou 4): "

if "%opt%"=="1" (
    python main.py discover
    pause
) else if "%opt%"=="2" (
    python main.py monitor
) else if "%opt%"=="3" (
    pytest tests
    pause
) else (
    exit /b
)
