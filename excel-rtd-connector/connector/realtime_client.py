# excel-rtd-connector/connector/realtime_client.py
"""
Cliente WebSocket Autenticado de Alta Velocidade.
Transmite dados do Excel RTD para o servidor WebSocket em tempo real.
- Conecta com segurança via WSS / WS
- Autenticação de dispositivo
- Envia snapshot inicial e somente deltas posteriores
- Reconexão automática resiliente sem travar o Excel COM
- Heartbeat contínuo
"""
import time
import json
import logging
import threading
from typing import List, Dict, Any, Optional
from collections import deque
from datetime import datetime

import websocket

logger = logging.getLogger("excel_connector.realtime")


class RealtimeClient:
    """Cliente WebSocket thread-safe para envio dos dados RTD."""

    def __init__(
        self,
        server_url: str = "ws://localhost:8080",
        token: str = "alicerce_rtd_secret_token_2026",
        max_buffer_size: int = 1000
    ):
        self.server_url = server_url
        self.token = token
        self.max_buffer_size = max_buffer_size

        self._ws: Optional[websocket.WebSocketApp] = None
        self._is_connected = False
        self._is_authenticated = False
        self._running = False
        self._thread: Optional[threading.Thread] = None

        self._queue: deque[Dict[str, Any]] = deque(maxlen=max_buffer_size)
        self._sequence_id = 0
        self._lock = threading.Lock()
        self._has_sent_initial_snapshot = False
        self._last_snapshot_cache: Optional[Dict[str, Any]] = None

    def start(self):
        """Inicia a thread de conexão e envio WebSocket."""
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_ws_loop, name="RealtimeWebSocketThread", daemon=True)
        self._thread.start()
        logger.info(f"Cliente Realtime iniciado para {self.server_url}")

    def stop(self):
        """Encerra a conexão WebSocket com segurança."""
        self._running = False
        if self._ws:
            self._ws.close()
        logger.info("Cliente Realtime encerrado.")

    def _run_ws_loop(self):
        """Loop de conexão persistente com reconexão automática."""
        while self._running:
            try:
                self._ws = websocket.WebSocketApp(
                    self.server_url,
                    on_open=self._on_open,
                    on_message=self._on_message,
                    on_error=self._on_error,
                    on_close=self._on_close
                )
                self._ws.run_forever(ping_interval=20, ping_timeout=10)
            except Exception as e:
                logger.debug(f"Tentativa de conexão falhou: {e}")

            self._is_connected = False
            self._is_authenticated = False
            if self._running:
                time.sleep(3.0)  # Aguarda 3 segundos antes de tentar reconectar

    def _on_open(self, ws):
        logger.info("Conectado ao servidor WebSocket. Autenticando dispositivo...")
        self._is_connected = True
        # Envia credencial de autenticação
        auth_msg = {
            "type": "AUTH",
            "role": "publisher",
            "token": self.token
        }
        ws.send(json.dumps(auth_msg))

    def _on_message(self, ws, message):
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "AUTH_OK":
                self._is_authenticated = True
                logger.info("Dispositivo AUTENTICADO com sucesso no Servidor Realtime.")
                # Se tínhamos um snapshot pendente, envia agora
                if self._last_snapshot_cache:
                    self.send_snapshot(self._last_snapshot_cache)
            elif msg_type == "ERROR":
                logger.warning(f"Aviso do Servidor Realtime: {data.get('message')}")
        except Exception as e:
            logger.debug(f"Erro ao processar mensagem do servidor: {e}")

    def _on_error(self, ws, error):
        logger.debug(f"Erro no socket: {error}")

    def _on_close(self, ws, close_status_code, close_msg):
        self._is_connected = False
        self._is_authenticated = False
        logger.info("Conexão WebSocket com o servidor encerrada.")

    def send_snapshot(self, snapshot_dict: Dict[str, Any]):
        """Transmite o snapshot completo para o servidor."""
        self._last_snapshot_cache = snapshot_dict

        if not self._is_connected or not self._is_authenticated or not self._ws:
            return

        try:
            payload = {
                "type": "SNAPSHOT",
                "snapshot": snapshot_dict,
                "timestamp": time.time()
            }
            self._ws.send(json.dumps(payload))
            self._has_sent_initial_snapshot = True
        except Exception as e:
            logger.debug(f"Falha ao enviar snapshot: {e}")

    def enqueue_changes(self, changes: List[Any]):
        """Enfileira e transmite deltas imediatamente via WebSocket."""
        if not changes:
            return

        formatted_deltas = []
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
                formatted_deltas.append(item)

        if self._is_connected and self._is_authenticated and self._ws:
            try:
                payload = {
                    "type": "DELTAS",
                    "deltas": formatted_deltas,
                    "timestamp": time.time()
                }
                self._ws.send(json.dumps(payload))
            except Exception as e:
                logger.debug(f"Falha ao enviar deltas: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Estatísticas do cliente realtime."""
        with self._lock:
            return {
                "server_connected": self._is_connected and self._is_authenticated,
                "buffered_changes": len(self._queue),
                "total_sequenced": self._sequence_id,
                "endpoint": self.server_url
            }
