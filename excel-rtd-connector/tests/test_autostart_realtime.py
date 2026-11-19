# excel-rtd-connector/tests/test_autostart_realtime.py
import pytest
from connector.realtime_client import RealtimeClient
from connector.autostart import WindowsAutostart
from models.market_data import FieldChange


def test_realtime_queue_buffering():
    client = RealtimeClient(max_buffer_size=10)

    changes = [
        FieldChange(key="wdofut", address="B5", previous_value=5667.0, current_value=5667.5, delta=0.5),
        FieldChange(key="winz", address="C5", previous_value=173820, current_value=173840, delta=20.0),
    ]

    client.enqueue_changes(changes)
    status = client.get_status()

    assert status["buffered_changes"] == 2
    assert status["total_sequenced"] == 2
    assert status["server_connected"] is False

    client.clear()
    assert client.get_status()["buffered_changes"] == 0


def test_autostart_registry_check():
    # Valida que o método is_enabled roda sem exceções
    enabled = WindowsAutostart.is_enabled()
    assert isinstance(enabled, bool)
