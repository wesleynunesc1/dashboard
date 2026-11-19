# excel-rtd-connector/tests/test_change_detector.py
import pytest
from datetime import datetime
from models.market_data import CellValue
from connector.change_detector import ChangeDetector


def test_no_changes_on_identical_values():
    detector = ChangeDetector(tolerance=1e-6)

    state1 = {
        "wdofut": CellValue(address="B5", key="wdofut", raw_value=5668.0, normalized_value=5668.0, timestamp=datetime.now())
    }
    # Primeira leitura estabelece o baseline
    assert len(detector.detect_changes(state1)) == 0

    state2 = {
        "wdofut": CellValue(address="B5", key="wdofut", raw_value=5668.0, normalized_value=5668.0, timestamp=datetime.now())
    }
    # Segunda leitura idêntica -> sem mudanças
    changes = detector.detect_changes(state2)
    assert len(changes) == 0


def test_detect_numeric_delta():
    detector = ChangeDetector(tolerance=1e-6)

    state1 = {
        "winz": CellValue(address="C5", key="winz", raw_value=173840, normalized_value=173840, timestamp=datetime.now())
    }
    detector.detect_changes(state1)

    state2 = {
        "winz": CellValue(address="C5", key="winz", raw_value=173860, normalized_value=173860, timestamp=datetime.now())
    }
    changes = detector.detect_changes(state2)

    assert len(changes) == 1
    assert changes[0].key == "winz"
    assert changes[0].previous_value == 173840
    assert changes[0].current_value == 173860
    assert changes[0].delta == 20.0


def test_ignore_changes_below_tolerance():
    detector = ChangeDetector(tolerance=0.01)

    state1 = {
        "di_rate": CellValue(address="G5", key="di_rate", raw_value=13.6601, normalized_value=13.6601, timestamp=datetime.now())
    }
    detector.detect_changes(state1)

    state2 = {
        "di_rate": CellValue(address="G5", key="di_rate", raw_value=13.6605, normalized_value=13.6605, timestamp=datetime.now())
    }
    changes = detector.detect_changes(state2)
    assert len(changes) == 0
