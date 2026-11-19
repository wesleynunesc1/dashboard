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
echo [1] Instalar Conector e Configurar Credencial Segura
echo [2] Ativar Inicializacao Automatica com o Windows
echo [3] Configurar/Alterar Token de Producao no Cofre do Windows
echo [4] Desinstalar Conector Completamente
echo [5] Cancelar
echo.
set /p opt="Escolha uma opcao (1, 2, 3, 4 ou 5): "

if "%opt%"=="1" (
    echo.
    echo [*] Copiando arquivos do aplicativo...
    if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
    xcopy /E /I /Y "dist\AlicerceExcelConnector\*" "%INSTALL_DIR%\" >nul

    echo [*] Criando atalho na Area de Trabalho...
    powershell "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\Alicerce Excel RTD.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\AlicerceExcelConnector.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Alicerce Conector Excel RTD'; $Shortcut.Save()"

    echo.
    echo [*] Configuracao de Seguranca:
    set /p set_token="Deseja configurar a credencial de conexao no Windows Credential Manager agora? (S/N): "
    if /i "!set_token!"=="S" (
        powershell -Command "$sec = Read-Host -Prompt 'Digite o Token do Conector (CONNECTOR_TOKEN)' -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); $Unsecure = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); cmdkey /generic:AlicerceExcelConnector /user:server_token /pass:$Unsecure; Write-Host '[✔] Credencial gravada com sucesso no cofre de credenciais do Windows (DPAPI)!' -ForegroundColor Green"
    )

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
    echo Nenhuma credencial foi salva em arquivo de texto plano.
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
    powershell -Command "$sec = Read-Host -Prompt 'Digite o novo Token do Conector' -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); $Unsecure = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); cmdkey /generic:AlicerceExcelConnector /user:server_token /pass:$Unsecure; Write-Host '[✔] Token atualizado no Windows Credential Manager!' -ForegroundColor Green"
    pause
    exit /b
)

if "%opt%"=="4" (
    echo.
    echo [*] Removendo registro de inicializacao...
    reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /f >nul 2>&1

    echo [*] Removendo atalho da Area de Trabalho...
    del "%USERPROFILE%\Desktop\Alicerce Excel RTD.lnk" >nul 2>&1

    echo [*] Removendo credencial do cofre do Windows...
    cmdkey /delete:AlicerceExcelConnector >nul 2>&1

    echo [*] Removendo arquivos do aplicativo...
    rmdir /S /Q "%INSTALL_DIR%" >nul 2>&1

    echo.
    echo [✔] O conector e suas credenciais foram completamente desinstalados.
    pause
    exit /b
)

exit /b
