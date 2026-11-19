# excel-rtd-connector/connector/autostart.py
"""
Módulo de gerenciamento de Inicialização Automática com o Windows (Startup).
Usa o registro HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.
Não exige privilégios de Administrador.
"""
import sys
import os
import winreg
import logging

logger = logging.getLogger("excel_connector.autostart")
APP_REG_NAME = "AlicerceExcelRTDConnector"


class WindowsAutostart:
    """Gerencia a chave de registro do Windows para inicialização automática no login."""

    REG_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"

    @classmethod
    def is_enabled(cls) -> bool:
        """Verifica se a inicialização com o Windows está ativa."""
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, cls.REG_KEY, 0, winreg.KEY_READ) as key:
                winreg.QueryValueEx(key, APP_REG_NAME)
                return True
        except FileNotFoundError:
            return False
        except Exception as e:
            logger.warning(f"Erro ao consultar registro de inicialização: {e}")
            return False

    @classmethod
    def set_enabled(cls, enable: bool) -> bool:
        """Ativa ou desativa a inicialização com o Windows."""
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, cls.REG_KEY, 0, winreg.KEY_SET_VALUE) as key:
                if enable:
                    # Determina o executável atual (empacotado ou script python)
                    if getattr(sys, "frozen", False):
                        exe_path = f'"{sys.executable}" --tray'
                    else:
                        python_exe = sys.executable
                        script_path = os.path.abspath(sys.argv[0])
                        exe_path = f'"{python_exe}" "{script_path}" --tray'

                    winreg.SetValueEx(key, APP_REG_NAME, 0, winreg.REG_SZ, exe_path)
                    logger.info("Inicialização automática com o Windows ATIVADA.")
                else:
                    try:
                        winreg.DeleteValue(key, APP_REG_NAME)
                        logger.info("Inicialização automática com o Windows DESATIVADA.")
                    except FileNotFoundError:
                        pass
            return True
        except Exception as e:
            logger.error(f"Erro ao alterar registro de inicialização: {e}")
            return False
