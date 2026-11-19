# excel-rtd-connector/tests/test_multi_workbook.py
"""
Testes unitários e de integração para o monitoramento simultâneo de múltiplos Workbooks.
Valida:
1. Resiliência: se um arquivo estiver ausente ou fechado, o outro continua sendo lido.
2. Reconexão e normalização independente.
3. Tratamento de códigos de erro (#N/A, #VALUE!, #DIV/0!).
"""
import pytest
from unittest.mock import MagicMock
from models.market_data import ConnectorSettings, WorkbookSource, WorksheetMapping, CellMappingItem
from connector.polling_engine import PollingEngine
from connector.cell_reader import CellReader


def test_cell_reader_error_codes():
    """Valida tratamento seguro de erros RTD sem travar o conector."""
    val, is_err, code = CellReader.normalize_value(-2146826246)
    assert is_err is True
    assert code == "#N/A"
    assert val is None

    val_div, is_err_div, code_div = CellReader.normalize_value(-2146826281)
    assert is_err_div is True
    assert code_div == "#DIV/0!"


def test_multi_workbook_resilience():
    """Valida monitoramento onde 1 workbook está aberto e outro fechado."""
    settings = ConnectorSettings(
        workbooks=[
            WorkbookSource(
                name_pattern="DADOS^JWIN^JWDO",
                sheets=[
                    WorksheetMapping(
                        sheet_name="Planilha4",
                        cells=[
                            CellMappingItem(indicator="dolfut_price", address="D12", data_type="float")
                        ]
                    )
                ]
            ),
            WorkbookSource(
                name_pattern="nero.xlsm",
                sheets=[
                    WorksheetMapping(
                        sheet_name="Planilha1",
                        cells=[
                            CellMappingItem(indicator="nero_winz26_price", address="D2", data_type="float")
                        ]
                    )
                ]
            )
        ]
    )

    engine = PollingEngine(settings=settings)

    # Mock do workbook DADOS aberto e nero fechado
    mock_wb_dados = MagicMock()
    mock_ws4 = MagicMock()
    mock_range = MagicMock()
    mock_range.Value2 = 5668.5
    mock_ws4.Range.return_value = mock_range
    mock_wb_dados.Sheets.Item.return_value = mock_ws4

    # Simula find_workbook
    def fake_find(pattern):
        if "DADOS" in pattern:
            return mock_wb_dados
        return None

    engine.connection.find_workbook = fake_find

    # Executa polling de DADOS (sucesso)
    res_dados = engine._poll_single_workbook(settings.workbooks[0])
    assert "dolfut_price" in res_dados
    assert res_dados["dolfut_price"].normalized_value == 5668.5

    # Executa polling de nero (fechado)
    res_nero = engine._poll_single_workbook(settings.workbooks[1])
    assert len(res_nero) == 0

    status = engine.get_workbook_status()
    assert status["DADOS^JWIN^JWDO"] is True
    assert status["nero.xlsm"] is False
