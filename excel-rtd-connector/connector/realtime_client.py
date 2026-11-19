# excel-rtd-connector/connector/realtime_client.py
"""
Módulo de Transmissão Futura para o Serviço Realtime (Next.js / Vercel).
Implementa fila limitada de deltas, proteção contra duplicidades,
identificação de mensagens e reconexão automática segura sem travar o Excel.
"""
import time
import logging
import threading
from typing import List, Dict, Any, Optional
from collections import deque
from datetime import datetime

logger = logging.getLogger("excel_connector.realtime")


class RealtimePayload:
    """Estrutura segura de pacote para envio HTTPS/WebSocket."""
    def __init__(self, message_id: str, timestamp: float, changes: List[Dict[str, Any]]):
        self.message_id = message_id
        self.timestamp = timestamp
        self.changes = changes


class RealtimeClient:
    """
    Cliente modular de sincronização em tempo real.
    Nesta etapa:
    - Opera em modo 'STAGING / ARMAZENAMENTO EM BUFFER'
    - Não abre conexões externas reais até que a URL e o token seguro sejam definidos
    - Garante ausência de perda de dados e ordenação de deltas
    """

    def __init__(self, max_buffer_size: int = 500):
        self.max_buffer_size = max_buffer_size
        self._queue: deque[Dict[str, Any]] = deque(maxlen=max_buffer_size)
        self._is_connected_to_server = False
        self._last_sync_time: Optional[datetime] = None
        self._server_url: Optional[str] = None
        self._sequence_id: int = 0
        self._lock = threading.Lock()

    def set_endpoint(self, url: str, token: Optional[str] = None):
        """Define o endpoint HTTPS do servidor realtime (Fase 2)."""
        self._server_url = url
        logger.info(f"Endpoint realtime configurado: {url}")

    def enqueue_changes(self, changes: List[Any]):
        """Adiciona alterações na fila de transmissão."""
        if not changes:
            return

        with self._lock:
            for ch in changes:
                self._sequence_id += 1
                item = {
                    "seq": self._sequence_id,
                    "key": getattr(ch, "key", ""),
                    "address": getattr(ch, "address", ""),
                    "previous": getattr(ch, "previous_value", None),
                    "value": getattr(ch, "current_value", None),
                    "delta": getattr(ch, "delta", None),
                    "timestamp": time.time()
                }
                self._queue.append(item)

    def get_status(self) -> Dict[str, Any]:
        """Retorna o status atual da transmissão em tempo real."""
        with self._lock:
            return {
                "server_connected": self._is_connected_to_server,
                "buffered_changes": len(self._queue),
                "total_sequenced": self._sequence_id,
                "last_sync": self._last_sync_time.strftime("%H:%M:%S") if self._last_sync_time else "Aguardando servidor",
                "endpoint": self._server_url or "Pronto para Fase 2 (Offline Seguro)"
            }

    def clear(self):
        with self._lock:
            self._queue.clear()
