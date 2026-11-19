# excel-rtd-connector/connector/diagnostics.py
"""
Módulo de diagnóstico de saúde, performance e estatísticas do conector.
"""
import time
import os
import psutil
from typing import Dict, Any


class Diagnostics:
    """Monitora tempos de leitura, taxas de erro e consumo de hardware."""

    def __init__(self):
        self.start_time = time.time()
        self.total_reads = 0
        self.successful_reads = 0
        self.failed_reads = 0
        self.total_changes_detected = 0
        self.last_read_duration_ms = 0.0
        self.avg_read_duration_ms = 0.0
        self.max_read_duration_ms = 0.0
        self.reconnections_count = 0
        self._proc = psutil.Process(os.getpid())

    def record_read(self, duration_ms: float, success: bool, changes_count: int = 0):
        self.total_reads += 1
        self.last_read_duration_ms = duration_ms

        if success:
            self.successful_reads += 1
            self.total_changes_detected += changes_count
            if duration_ms > self.max_read_duration_ms:
                self.max_read_duration_ms = duration_ms
            # Média móvel exponencial suave
            if self.avg_read_duration_ms == 0.0:
                self.avg_read_duration_ms = duration_ms
            else:
                self.avg_read_duration_ms = 0.9 * self.avg_read_duration_ms + 0.1 * duration_ms
        else:
            self.failed_reads += 1

    def record_reconnection(self):
        self.reconnections_count += 1

    def get_system_metrics(self) -> Dict[str, Any]:
        """Obtém uso de CPU e memória do processo Python."""
        try:
            mem_info = self._proc.memory_info()
            cpu_pct = self._proc.cpu_percent(interval=None)
            mem_mb = mem_info.rss / (1024 * 1024)
            return {
                "cpu_percent": round(cpu_pct, 1),
                "memory_mb": round(mem_mb, 1),
                "uptime_seconds": int(time.time() - self.start_time)
            }
        except Exception:
            return {"cpu_percent": 0.0, "memory_mb": 0.0, "uptime_seconds": 0}
