# excel-rtd-connector/connector/polling_engine.py
"""
Motor de polling sequencial e multi-workbook do Conector Excel RTD.
Executa em thread dedicada monitorando independentemente múltiplos arquivos:
- DADOS^JWIN^JWDO^JPETRUS^JETC (1).xlsx
- nero.xlsm
Se um arquivo for fechado, o outro continua sendo monitorado normalmente.
"""
import time
import logging
import threading
from typing import Callable, Optional, Dict, Any, List
from models.market_data import (
    ConnectorSettings,
    CellValue,
    FieldChange,
    WorkbookSource,
    WorksheetMapping,
    CellMappingItem
)
from connector.excel_connection import ExcelConnection
from connector.cell_reader import CellReader
from connector.change_detector import ChangeDetector
from connector.diagnostics import Diagnostics

logger = logging.getLogger("excel_connector.engine")


class PollingEngine:
    """Orquestrador de leitura contínua multi-workbook, detecção de deltas e resiliência."""

    def __init__(
        self,
        settings: ConnectorSettings,
        on_change_callback: Optional[Callable[[list[FieldChange]], None]] = None,
        on_tick_callback: Optional[Callable[[Dict[str, CellValue], Diagnostics], None]] = None
    ):
        self.settings = settings
        self.on_change = on_change_callback
        self.on_tick = on_tick_callback

        self.connection = ExcelConnection()
        self.detector = ChangeDetector(tolerance=settings.tolerance)
        self.diagnostics = Diagnostics()

        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._consecutive_errors = 0
        self._workbook_status: Dict[str, bool] = {}

    def start(self):
        """Inicia o loop de polling em uma thread dedicada."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, name="ExcelRTDPollingThread", daemon=True)
        self._thread.start()
        logger.info("PollingEngine Multi-Workbook iniciado.")

    def stop(self):
        """Para o loop com segurança."""
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self.connection.disconnect()
        logger.info("PollingEngine Multi-Workbook encerrado.")

    def is_running(self) -> bool:
        return self._running

    def get_workbook_status(self) -> Dict[str, bool]:
        """Retorna o status online/offline de cada pasta de trabalho monitorada."""
        return self._workbook_status.copy()

    def _resolve_legacy_worksheet(self) -> Optional[Any]:
        """Compatibilidade para configuração legado de planilha única."""
        app = self.connection.get_app()
        if not app:
            return None
        try:
            wb = None
            if self.settings.workbook:
                wb = app.Workbooks.Item(self.settings.workbook)
            elif app.Workbooks.Count > 0:
                wb = app.ActiveWorkbook or app.Workbooks.Item(1)

            if not wb:
                return None

            if self.settings.worksheet:
                return wb.Sheets.Item(self.settings.worksheet)
            return wb.ActiveSheet or wb.Sheets.Item(1)
        except Exception:
            return None

    def _poll_single_workbook(self, wb_source: WorkbookSource) -> Dict[str, CellValue]:
        """Realiza a leitura de uma pasta de trabalho específica de forma resiliente."""
        result: Dict[str, CellValue] = {}
        wb_com = self.connection.find_workbook(wb_source.name_pattern)

        if not wb_com:
            if self._workbook_status.get(wb_source.name_pattern, True):
                logger.warning(f"Pasta de trabalho '{wb_source.name_pattern}' não encontrada ou fechada no Excel.")
            self._workbook_status[wb_source.name_pattern] = False
            return result

        if not self._workbook_status.get(wb_source.name_pattern, False):
            logger.info(f"Pasta de trabalho '{wb_source.name_pattern}' detectada e reconectada com sucesso!")
        self._workbook_status[wb_source.name_pattern] = True

        for sheet_mapping in wb_source.sheets:
            try:
                ws_com = wb_com.Sheets.Item(sheet_mapping.sheet_name)
            except Exception as e:
                logger.debug(f"Aba '{sheet_mapping.sheet_name}' não encontrada em '{wb_source.name_pattern}': {e}")
                continue

            # Mapeia as células para o leitor
            cells_map = {item.indicator: item.address for item in sheet_mapping.cells}
            ranges_map = sheet_mapping.ranges

            try:
                sheet_values = CellReader.read_mapped_cells(
                    worksheet_com=ws_com,
                    cells_map=cells_map,
                    ranges_map=ranges_map
                )
                result.update(sheet_values)
            except Exception as e:
                logger.warning(f"Erro ao ler aba '{sheet_mapping.sheet_name}' de '{wb_source.name_pattern}': {e}")

        return result

    def _run_loop(self):
        """Loop principal de leitura multi-workbook, thread COM isolada."""
        self.connection.init_com()
        interval_sec = max(0.05, self.settings.polling_interval_ms / 1000.0)

        while self._running:
            start_tick = time.perf_counter()
            read_success = False
            changes = []
            aggregated_values: Dict[str, CellValue] = {}

            # 1. Garante conexão COM ativa
            if not self.connection.is_alive():
                logger.info("Tentando conectar às instâncias existentes do Excel...")
                if self.connection.connect():
                    self.diagnostics.record_reconnection()
                    self._consecutive_errors = 0
                else:
                    self._consecutive_errors += 1
                    time.sleep(1.0)
                    continue

            # 2. Executa leitura multi-workbook se configurado
            try:
                read_start = time.perf_counter()

                if self.settings.workbooks:
                    for wb_source in self.settings.workbooks:
                        if not wb_source.active:
                            continue
                        wb_vals = self._poll_single_workbook(wb_source)
                        aggregated_values.update(wb_vals)
                else:
                    # Modo legado (single workbook)
                    ws_com = self._resolve_legacy_worksheet()
                    if ws_com:
                        aggregated_values = CellReader.read_mapped_cells(
                            worksheet_com=ws_com,
                            cells_map=self.settings.cells,
                            ranges_map=self.settings.ranges
                        )

                read_duration_ms = (time.perf_counter() - read_start) * 1000.0

                # 3. Detecta deltas agregados
                if aggregated_values:
                    changes = self.detector.detect_changes(aggregated_values, duration_ms=read_duration_ms)
                    read_success = True
                    self._consecutive_errors = 0

                    if changes and self.on_change:
                        self.on_change(changes)

                    if self.on_tick:
                        self.on_tick(aggregated_values, self.diagnostics)

            except Exception as e:
                read_duration_ms = (time.perf_counter() - start_tick) * 1000.0
                read_success = False
                self._consecutive_errors += 1
                logger.warning(f"Erro transitório na leitura COM (tentativa {self._consecutive_errors}): {e}")

                if self._consecutive_errors >= self.settings.max_consecutive_errors:
                    logger.error("Múltiplos erros consecutivos no Excel. Aguardando recuperação...")
                    time.sleep(1.5)

            # Registra diagnóstico
            self.diagnostics.record_read(
                duration_ms=read_duration_ms,
                success=read_success,
                changes_count=len(changes)
            )

            # Controle estrito de frequência
            elapsed = time.perf_counter() - start_tick
            sleep_time = max(0.005, interval_sec - elapsed)
            time.sleep(sleep_time)

        self.connection.uninit_com()
