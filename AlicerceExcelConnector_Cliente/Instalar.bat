@echo off
setlocal enabledelayedexpansion
title Instalador e Gerenciador — Alicerce Excel RTD Connector
color 0b

set "INSTALL_DIR=%LOCALAPPDATA%\AlicerceExcelConnector"

:MENU
cls
echo =========================================================================
echo         ALICERCE CONECTOR EXCEL RTD — PROFIT PRO / NELOGICA
echo =========================================================================
echo  Pasta de Destino: %INSTALL_DIR%
echo =========================================================================
echo.
echo  [1] Instalar Conector Completo (com Atalho e Autostart)
echo  [2] Testar Conexao e Diagnostico (Executa Verificacao Completa)
echo  [3] Configurar ou Atualizar Token no Cofre do Windows (DPAPI)
echo  [4] Ativar Inicializacao Automatica com o Windows
echo  [5] Desativar Inicializacao Automatica
echo  [6] Desinstalar Conector Completamente
echo  [7] Sair
echo.
echo =========================================================================
set /p opt="Escolha uma opcao (1 a 7): "

if "%opt%"=="1" goto INSTALAR
if "%opt%"=="2" goto DIAGNOSTICO
if "%opt%"=="3" goto TOKEN
if "%opt%"=="4" goto ATIVAR_AUTO
if "%opt%"=="5" goto DESATIVAR_AUTO
if "%opt%"=="6" goto DESINSTALAR
if "%opt%"=="7" exit /b
goto MENU

:INSTALAR
cls
echo =========================================================================
echo [*] Instalando Alicerce Excel RTD Connector...
echo =========================================================================
echo.
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [1/4] Copiando arquivos e dependencias do aplicativo...
xcopy /E /I /Y "app\*" "%INSTALL_DIR%\" >nul

echo [2/4] Copiando arquivos de mapeamento das planilhas...
if not exist "%INSTALL_DIR%\config" mkdir "%INSTALL_DIR%\config"
copy /Y "config\settings.json" "%INSTALL_DIR%\config\settings.json" >nul

echo [3/4] Criando atalho na Area de Trabalho...
powershell "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\Alicerce Excel RTD.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\AlicerceExcelConnector.exe'; $Shortcut.WorkingDirectory = '%INSTALL_DIR%'; $Shortcut.Description = 'Alicerce Conector Excel RTD Realtime'; $Shortcut.Save()"

echo [4/4] Configuracao Segura de Credenciais:
echo.
set /p set_tok="Deseja cadastrar a credencial segura no Windows Credential Manager agora? (S/N): "
if /i "!set_tok!"=="S" (
    powershell -Command "$sec = Read-Host -Prompt 'Digite o Token do Conector (CONNECTOR_TOKEN)' -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); $Unsecure = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); cmdkey /generic:AlicerceExcelConnector /user:server_token /pass:$Unsecure; Write-Host '[✔] Credencial gravada com sucesso no cofre seguro do Windows!' -ForegroundColor Green"
)

echo.
set /p set_auto="Deseja iniciar o conector automaticamente ao ligar o computador? (S/N): "
if /i "!set_auto!"=="S" (
    reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /t REG_SZ /d "\"%INSTALL_DIR%\AlicerceExcelConnector.exe\" --tray" /f >nul
    echo [✔] Inicializacao automatica ativada!
)

echo.
echo =========================================================================
echo [✔] INSTALACAO CONCLUIDA COM SUCESSO!
echo O icone foi criado na Area de Trabalho.
echo O cliente nao precisa instalar Python, GitHub ou digitar comandos.
echo =========================================================================
echo.
pause
goto MENU

:DIAGNOSTICO
cls
echo =========================================================================
echo [*] Executando Diagnostico de Conexao e Planilhas...
echo =========================================================================
echo.
if exist "%INSTALL_DIR%\AlicerceExcelConnector.exe" (
    "%INSTALL_DIR%\AlicerceExcelConnector.exe" diag
) else if exist "app\AlicerceExcelConnector.exe" (
    "app\AlicerceExcelConnector.exe" diag
) else (
    echo [❌] Erro: Executavel nao encontrado. Realize a instalacao primeiro (opcao 1).
)
echo.
pause
goto MENU

:TOKEN
cls
echo =========================================================================
echo [*] Configurar / Atualizar Credencial no Windows Credential Manager
echo =========================================================================
echo O token sera gravado com criptografia DPAPI e nunca ficara em texto puro.
echo.
powershell -Command "$sec = Read-Host -Prompt 'Digite o Token do Conector (CONNECTOR_TOKEN)' -AsSecureString; $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); $Unsecure = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR); cmdkey /generic:AlicerceExcelConnector /user:server_token /pass:$Unsecure; Write-Host '[✔] Token gravado com sucesso no Windows Credential Manager!' -ForegroundColor Green"
echo.
pause
goto MENU

:ATIVAR_AUTO
cls
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /t REG_SZ /d "\"%INSTALL_DIR%\AlicerceExcelConnector.exe\" --tray" /f >nul
echo.
echo [✔] Inicializacao automatica com o Windows ativada!
echo.
pause
goto MENU

:DESATIVAR_AUTO
cls
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /f >nul 2>&1
echo.
echo [✔] Inicializacao automatica desativada!
echo.
pause
goto MENU

:DESINSTALAR
cls
echo =========================================================================
echo [*] Desinstalacao Completa do Alicerce Excel RTD Connector
echo =========================================================================
echo.
echo Removendo registro de inicializacao...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "AlicerceExcelRTDConnector" /f >nul 2>&1

echo Removendo atalho da Area de Trabalho...
del "%USERPROFILE%\Desktop\Alicerce Excel RTD.lnk" >nul 2>&1

echo Removendo credencial segura do cofre do Windows...
cmdkey /delete:AlicerceExcelConnector >nul 2>&1

echo Removendo arquivos do aplicativo...
rmdir /S /Q "%INSTALL_DIR%" >nul 2>&1

echo.
echo =========================================================================
echo [✔] Desinstalacao concluida! Todos os arquivos e registros foram removidos.
echo =========================================================================
echo.
pause
goto MENU
