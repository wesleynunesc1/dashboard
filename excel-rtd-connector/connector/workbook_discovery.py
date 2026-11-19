# excel-rtd-connector/connector/workbook_discovery.py
"""
Módulo de descoberta e inventário de pastas de trabalho e abas abertas no Excel.
Somente leitura de propriedades, sem varrer células desnecessárias.
"""
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("excel_connector.discovery")


class WorkbookDiscovery:
    """Descobre e inspeciona pastas de trabalho e abas disponíveis no Excel."""

    @staticmethod
    def list_workbooks(app: Any) -> List[Dict[str, Any]]:
        """
        Lista todas as pastas de trabalho abertas na instância do Excel.
        Retorna nome, caminho, número de planilhas e status.
        """
        workbooks_info = []
        if not app:
            return workbooks_info

        try:
            count = app.Workbooks.Count
            for i in range(1, count + 1):
                try:
                    wb = app.Workbooks.Item(i)
                    name = wb.Name
                    try:
                        path = wb.FullName
                    except Exception:
                        path = ""

                    sheets_count = wb.Sheets.Count
                    sheet_names = []
                    for s_idx in range(1, sheets_count + 1):
                        try:
                            sheet_names.append(wb.Sheets.Item(s_idx).Name)
                        except Exception:
                            pass

                    workbooks_info.append({
                        "name": name,
                        "full_path": path,
                        "sheets_count": sheets_count,
                        "sheets": sheet_names
                    })
                except Exception as e:
                    logger.warning(f"Erro ao ler metadados do Workbook {i}: {e}")
        except Exception as e:
            logger.error(f"Erro ao iterar Workbooks: {e}")

        return workbooks_info

    @staticmethod
    def get_sheet_details(app: Any, workbook_name: str, sheet_name: str) -> Optional[Dict[str, Any]]:
        """
        Obtém metadados restritos da aba (dimensões usadas) sem ler valores.
        """
        if not app:
            return None

        try:
            wb = app.Workbooks.Item(workbook_name)
            ws = wb.Sheets.Item(sheet_name)
            used_range = ws.UsedRange

            return {
                "workbook": workbook_name,
                "worksheet": sheet_name,
                "used_range_address": used_range.Address,
                "rows_count": used_range.Rows.Count,
                "columns_count": used_range.Columns.Count,
            }
        except Exception as e:
            logger.warning(f"Não foi possível obter detalhes de {workbook_name}/{sheet_name}: {e}")
            return None
