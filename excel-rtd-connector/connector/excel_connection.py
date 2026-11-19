# excel-rtd-connector/connector/excel_connection.py
"""
Módulo de conexão com instâncias ativas do Microsoft Excel via COM.
REGRAS RÍGIDAS DE PRESERVAÇÃO:
- Conexão estrita via GetActiveObject (sem Dispatch que cria processos)
- Operações de leitura estrita (sem escrita, sem salvar, sem recalcular)
- Inicialização e finalização COM explícitas (pythoncom.CoInitialize/CoUninitialize)
"""
import logging
from typing import Optional, Any
import pythoncom
import win32com.client

logger = logging.getLogger("excel_connector.connection")


class ExcelConnection:
    """Gerencia a conexão segura com uma instância em execução do Excel."""

    def __init__(self):
        self._app: Optional[Any] = None
        self._is_connected: bool = False
        self._com_initialized: bool = False

    def init_com(self) -> None:
        """Inicializa o subsistema COM na thread atual."""
        try:
            pythoncom.CoInitialize()
            self._com_initialized = True
        except Exception as e:
            logger.debug(f"CoInitialize warning: {e}")

    def uninit_com(self) -> None:
        """Finaliza o subsistema COM na thread atual."""
        if self._com_initialized:
            try:
                pythoncom.CoUninitialize()
            except Exception as e:
                logger.debug(f"CoUninitialize warning: {e}")
            self._com_initialized = False

    def connect(self) -> bool:
        """
        Conecta a uma instância aberta do Excel usando GetActiveObject.
        NÃO cria uma nova instância nem abre arquivos.
        """
        self.init_com()
        try:
            # GetActiveObject conecta na Running Object Table (ROT)
            excel_dispatch = win32com.client.GetActiveObject("Excel.Application")
            self._app = excel_dispatch
            self._is_connected = True
            logger.info("Conectado com sucesso à instância ativa do Excel.")
            return True
        except pythoncom.com_error as ce:
            self._app = None
            self._is_connected = False
            logger.warning(f"Excel não encontrado ou indisponível via COM: {ce}")
            return False
        except Exception as e:
            self._app = None
            self._is_connected = False
            logger.error(f"Erro inesperado ao conectar ao Excel: {e}")
            return False

    def is_alive(self) -> bool:
        """Verifica se a instância conectada continua responsiva."""
        if not self._app or not self._is_connected:
            return False
        try:
            # Apenas leitura de metadado leve (não dispara recálculo)
            _ = self._app.Name
            return True
        except Exception:
            self._is_connected = False
            self._app = None
            return False

    def get_app(self) -> Optional[Any]:
        """Retorna o ponteiro COM do aplicativo Excel."""
        return self._app

    def disconnect(self) -> None:
        """Desconecta do Excel sem fechar a aplicação."""
        self._app = None
        self._is_connected = False
        self.uninit_com()
        logger.info("Desconectado da instância do Excel.")
