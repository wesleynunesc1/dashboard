# excel-rtd-connector/connector/tray_app.py
"""
Aplicação de Bandeja do Sistema (Windows System Tray Icon).
Permite que o conector rode discretamente em segundo plano:
- Ícone na bandeja com indicador visual
- Menu de contexto (Abrir Painel, Ver Logs, Iniciar com Windows, Sair)
- Não fecha o monitoramento ao fechar a janela
"""
import os
import sys
import threading
import logging
from typing import Optional
from PIL import Image, ImageDraw
import pystray

from connector.polling_engine import PollingEngine
from connector.realtime_client import RealtimeClient
from connector.status_window import StatusWindow
from connector.autostart import WindowsAutostart
from models.market_data import ConnectorSettings

logger = logging.getLogger("excel_connector.tray")


def create_tray_icon_image(color: str = "#21D787") -> Image.Image:
    """Gera um ícone nítido para a bandeja do Windows."""
    width, height = 64, 64
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dc = ImageDraw.Draw(image)

    # Círculo externo escuro com borda
    dc.ellipse((4, 4, 60, 60), fill="#0C1626", outline="#1D3048", width=3)
    # Círculo indicador central
    dc.ellipse((16, 16, 48, 48), fill=color)

    return image


class TrayApplication:
    """Orquestrador completo: PollingEngine + StatusWindow + TrayIcon."""

    def __init__(self, settings: ConnectorSettings):
        self.settings = settings
        self.realtime_client = RealtimeClient()
        self.window: Optional[StatusWindow] = None
        self.tray_icon: Optional[pystray.Icon] = None

        # Callbacks do PollingEngine
        self.engine = PollingEngine(
            settings=self.settings,
            on_change_callback=self._on_market_change,
            on_tick_callback=self._on_polling_tick
        )

    def _on_market_change(self, changes):
        # Envia deltas para a fila do cliente realtime
        self.realtime_client.enqueue_changes(changes)

    def _on_polling_tick(self, latest_values, diag):
        if self.window:
            sys_metrics = diag.get_system_metrics()
            rt_status = self.realtime_client.get_status()

            payload = {
                "is_connected": self.engine.connection.is_alive(),
                "workbook": self.settings.workbook or "Auto (Ativa)",
                "worksheet": self.settings.worksheet or "Auto (Ativa)",
                "cells_count": len(self.settings.cells) + len(self.settings.ranges),
                "last_read": diag.last_read_duration_ms > 0 and diag.last_read_duration_ms or 0,
                "latency_ms": diag.avg_read_duration_ms or diag.last_read_duration_ms,
                "realtime_status": f"Buffer: {rt_status['buffered_changes']} deltas",
                "cpu_pct": sys_metrics["cpu_percent"],
                "ram_mb": sys_metrics["memory_mb"]
            }
            self.window.update_metrics(payload)

    def show_window(self):
        """Restaura a janela de status."""
        if self.window:
            self.window.deiconify()
            self.window.lift()
            self.window.focus_force()

    def _open_logs(self):
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(log_dir, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(log_dir)

    def _toggle_autostart(self):
        current = WindowsAutostart.is_enabled()
        WindowsAutostart.set_enabled(not current)

    def quit_app(self):
        """Encerra a aplicação com segurança."""
        logger.info("Encerrando aplicativo via bandeja...")
        self.engine.stop()
        if self.tray_icon:
            self.tray_icon.stop()
        if self.window:
            self.window.destroy()
        sys.exit(0)

    def run(self, start_minimized: bool = False):
        """Inicia o conector e o ícone de bandeja."""
        self.engine.start()

        # Cria a janela CustomTkinter na thread principal
        self.window = StatusWindow()
        if start_minimized:
            self.window.withdraw()

        # Configura o menu da bandeja
        menu = pystray.Menu(
            pystray.MenuItem("Abrir Painel de Status", lambda: self.show_window(), default=True),
            pystray.MenuItem("Ver Arquivos de Log", lambda: self._open_logs()),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                "Iniciar com o Windows",
                lambda: self._toggle_autostart(),
                checked=lambda item: WindowsAutostart.is_enabled()
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Encerrar Conector", lambda: self.quit_app()),
        )

        icon_img = create_tray_icon_image("#21D787")
        self.tray_icon = pystray.Icon("AlicerceRTD", icon_img, "Alicerce — Conector Excel RTD", menu)

        # Roda o ícone de bandeja em thread dedicada
        tray_thread = threading.Thread(target=self.tray_icon.run, daemon=True)
        tray_thread.start()

        # Roda o loop da GUI na thread principal
        try:
            self.window.mainloop()
        except KeyboardInterrupt:
            self.quit_app()
