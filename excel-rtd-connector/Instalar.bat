@echo off
setlocal enabledelayedexpansion
title Instalador Alicerce Excel RTD Connector

set "INSTALL_DIR=%LOCALAPPDATA%\AlicerceExcelConnector"

echo ================================================================
echo       INSTALADOR — ALICERCE CONECTOR EXCEL RTD / PROFIT PRO
echo ================================================================
echo.
echo Este assistente instalara o Conector Windows da Alicerce em:
echo %INSTALL_DIR%
echo.
echo [1] Instalar Conector e Criar Atalhos
echo [2] Ativar Inicializacao Automatica com o Windows
echo [3] Desinstalar Conector Completamente
echo [4] Cancelar
echo.
set /p opt="Escolha uma opcao (1, 2, 3 ou 4): "

if "%opt%"=="1" (
    echo.
    echo [*] Copiando arquivos do aplicativo...
    if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
    xcopy /E /I /Y "dist\AlicerceExcelConnector\*" "%INSTALL_DIR%\" >nul

    echo [*] Criando atalho na Area de Trabalho...
    powershell "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\Alicerce Excel RTD.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\AlicerceExcelConnector.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Alicerce Conector Excel RTD'; $Shortcut.Save()"

    echo.
    set /p auto="Deseja iniciar o conector automaticamente ao ligar o computador? (S/N): "
    if /i "!auto!"=="S" (
        reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /t REG_SZ /d "\"%INSTALL_DIR%\AlicerceExcelConnector.exe\" --tray" /f >nul
        echo [✔] Inicializacao com o Windows configurada!
    )

    echo.
    echo ================================================================
    echo [✔] INSTALACAO CONCLUIDA COM SUCESSO!
    echo O icone foi criado na sua Area de Trabalho.
    echo O cliente nao precisa executar nenhum comando ou abrir terminal.
    echo ================================================================
    pause
    exit /b
)

if "%opt%"=="2" (
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /t REG_SZ /d "\"%INSTALL_DIR%\AlicerceExcelConnector.exe\" --tray" /f >nul
    echo.
    echo [✔] Inicializacao automatica ativada com sucesso!
    pause
    exit /b
)

if "%opt%"=="3" (
    echo.
    echo [*] Removendo registro de inicializacao...
    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /f >nul 2>&1

    echo [*] Removendo atalho da Area de Trabalho...
    del "%USERPROFILE%\Desktop\Alicerce Excel RTD.lnk" >nul 2>&1

    echo [*] Removendo arquivos do aplicativo...
    rmdir /S /Q "%INSTALL_DIR%" >nul 2>&1

    echo.
    echo [✔] O conector foi completamente desinstalado do computador.
    pause
    exit /b
)

exit /b
