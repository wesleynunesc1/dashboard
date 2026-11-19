# excel-rtd-connector/tests/test_normalization.py
import pytest
from connector.cell_reader import CellReader


def test_normalize_empty_cell():
    val, is_err, err_code = CellReader.normalize_value(None)
    assert val is None
    assert is_err is False
    assert err_code is None


def test_normalize_numeric_values():
    val, is_err, _ = CellReader.normalize_value(5667.5)
    assert val == 5667.5
    assert isinstance(val, float)
    assert not is_err

    val_int, _, _ = CellReader.normalize_value(173820)
    assert val_int == 173820

    # Preservar zero e negativos
    val_zero, _, _ = CellReader.normalize_value(0)
    assert val_zero == 0
    assert val_zero is not None

    val_neg, _, _ = CellReader.normalize_value(-995319585.0)
    assert val_neg == -995319585.0


def test_normalize_excel_errors():
    # Código COM clássico para #N/A (-2146826246)
    val, is_err, err_code = CellReader.normalize_value(-2146826246)
    assert val is None
    assert is_err is True
    assert err_code == "#N/A"

    # String com formato de erro
    val_str, is_err_str, err_str = CellReader.normalize_value("#DIV/0!")
    assert val_str is None
    assert is_err_str is True
    assert err_str == "#DIV/0!"
