# excel-rtd-connector/tests/test_connection_mock.py
import pytest
from unittest.mock import MagicMock
from models.market_data import ConnectorSettings
from connector.cell_reader import CellReader
from connector.change_detector import ChangeDetector


def test_batch_range_reading_mock():
    # Simula mock de COM Worksheet.Range(address).Value2
    mock_ws = MagicMock()

    # Range normal de célula
    mock_cell_range = MagicMock()
    mock_cell_range.Value2 = 5667.5

    # Range de lote (matriz 2x2 de book)
    mock_matrix_range = MagicMock()
    mock_matrix_range.Value2 = ((173820, 450), (173815, 620))

    def range_side_effect(address):
        if address == "B5":
            return mock_cell_range
        elif address == "J5:K6":
            return mock_matrix_range
        return MagicMock()

    mock_ws.Range.side_effect = range_side_effect

    cells_map = {"wdofut": "B5"}
    ranges_map = {"book_bids": "J5:K6"}

    results = CellReader.read_mapped_cells(mock_ws, cells_map, ranges_map)

    assert "wdofut" in results
    assert results["wdofut"].normalized_value == 5667.5
    assert "book_bids" in results
    assert results["book_bids"].normalized_value == ((173820, 450), (173815, 620))


def test_settings_validation():
    valid_data = {
        "workbook": "PROFIT_RTD.xlsx",
        "worksheet": "Dólar",
        "polling_interval_ms": 250,
        "cells": {"wdofut": "B5"}
    }
    settings = ConnectorSettings(**valid_data)
    assert settings.workbook == "PROFIT_RTD.xlsx"
    assert settings.polling_interval_ms == 250
