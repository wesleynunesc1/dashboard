# excel-rtd-connector/connector/excel_connection.py
"""
Módulo de conexão com instâncias ativas do Microsoft Excel via COM.
REGRAS RÍGIDAS DE PRESERVAÇÃO:
- Conexão estrita via GetActiveObject e Running Object Table (ROT)
- Suporta múltiplos workbooks abertos em uma ou mais instâncias
- Operações de leitura estrita (sem escrita, sem salvar, sem recalcular)
- Inicialização e finalização COM explícitas (pythoncom.CoInitialize/CoUninitialize)
"""
import logging
from typing import Optional, Any, List, Dict
import pythoncom
import win32com.client

logger = logging.getLogger("excel_connector.connection")


class ExcelConnection:
    """Gerencia a conexão segura com instâncias em execução do Excel e seus Workbooks."""

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
            _ = self._app.Name
            return True
        except Exception:
            self._is_connected = False
            self._app = None
            return False

    def get_app(self) -> Optional[Any]:
        """Retorna o ponteiro COM do aplicativo Excel."""
        return self._app

    def find_workbook(self, name_pattern: str) -> Optional[Any]:
        """
        Localiza uma pasta de trabalho aberta pelo nome ou padrão.
        Suporta busca direta no Excel.Application e varredura da ROT.
        """
        # 1. Tentar via Application.Workbooks
        if self._app and self.is_alive():
            try:
                count = self._app.Workbooks.Count
                clean_target = name_pattern.strip().lower()
                for i in range(1, count + 1):
                    wb = self._app.Workbooks.Item(i)
                    wb_name = wb.Name.lower()
                    if clean_target in wb_name or wb_name in clean_target:
                        return wb
            except Exception as e:
                logger.debug(f"Erro buscando workbook no app ativo: {e}")

        # 2. Tentar via Running Object Table (ROT) para capturar outras instâncias do Excel
        try:
            rot = pythoncom.GetRunningObjectTable()
            monikers = rot.EnumRunning()
            clean_target = name_pattern.strip().lower()
            for m in monikers:
                ctx = pythoncom.CreateBindCtx()
                display_name = m.GetDisplayName(ctx, None).lower()
                if clean_target in display_name and ('.xls' in display_name or '.xlsm' in display_name):
                    obj = rot.GetObject(m)
                    wb = win32com.client.Dispatch(obj.QueryInterface(pythoncom.IID_IDispatch))
                    return wb
        except Exception as e:
            logger.debug(f"Erro buscando workbook na ROT: {e}")

        return None

    def disconnect(self) -> None:
        """Desconecta do Excel sem fechar a aplicação."""
        self._app = None
        self._is_connected = False
        self.uninit_com()
        logger.info("Desconectado da instância do Excel.")
