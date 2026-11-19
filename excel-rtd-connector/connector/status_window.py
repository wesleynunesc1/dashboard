# excel-rtd-connector/connector/status_window.py
"""
Interface Gráfica Nativa de Status do Conector (CustomTkinter).
Dark Financial Terminal Compacto com visual profissional:
- Status de conexão (Verde/Amarelo/Vermelho)
- Métricas em tempo real (Leituras, Latência, CPU, RAM)
- Botões para Visualizar Logs, Configurar Autostart e Minimizar na Bandeja
"""
import os
import sys
import subprocess
import customtkinter as ctk
from typing import Callable, Optional
from connector.autostart import WindowsAutostart

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")


class StatusWindow(ctk.CTk):
    """Janela compacta de status e diagnóstico do conector."""

    def __init__(self, on_close_callback: Optional[Callable[[], None]] = None):
        super().__init__()
        self.on_close_callback = on_close_callback

        self.title("Alicerce — Conector Excel RTD")
        self.geometry("480x420")
        self.resizable(False, False)
        self.configure(fg_color="#070D17")

        # Intercepta o 'X' para ocultar na bandeja ao invés de fechar o processo
        self.protocol("WM_DELETE_WINDOW", self.hide_to_tray)

        self._build_ui()

    def _build_ui(self):
        # Header
        self.header_frame = ctk.CTkFrame(self, fg_color="#0C1626", corner_radius=0)
        self.header_frame.pack(fill="x", padx=0, pady=0)

        self.title_label = ctk.CTkLabel(
            self.header_frame,
            text="ALICERCE FINANCIAL CONNECTOR",
            font=ctk.CTkFont(family="Segoe UI", size=13, weight="bold"),
            text_color="#F0F4FA"
        )
        self.title_label.pack(side="left", padx=16, pady=10)

        self.sub_badge = ctk.CTkLabel(
            self.header_frame,
            text="PROFIT RTD",
            font=ctk.CTkFont(family="Consolas", size=9, weight="bold"),
            text_color="#60CDFF",
            fg_color="#070D17",
            corner_radius=4,
            padx=6,
            pady=2
        )
        self.sub_badge.pack(side="right", padx=16, pady=10)

        # Status Card Principal
        self.status_card = ctk.CTkFrame(self, fg_color="#0C1626", border_color="#1D3048", border_width=1, corner_radius=6)
        self.status_card.pack(fill="x", padx=16, pady=12)

        self.dot_label = ctk.CTkLabel(
            self.status_card,
            text="●",
            font=ctk.CTkFont(size=20),
            text_color="#F3C65A"
        )
        self.dot_label.grid(row=0, column=0, padx=(12, 6), pady=8, sticky="w")

        self.status_text = ctk.CTkLabel(
            self.status_card,
            text="AGUARDANDO EXCEL / PLANILHA...",
            font=ctk.CTkFont(family="Segoe UI", size=11, weight="bold"),
            text_color="#F3C65A"
        )
        self.status_text.grid(row=0, column=1, padx=0, pady=8, sticky="w")

        # Grid de Informações
        self.info_frame = ctk.CTkFrame(self, fg_color="#0C1626", border_color="#1D3048", border_width=1, corner_radius=6)
        self.info_frame.pack(fill="both", expand=True, padx=16, pady=(0, 12))

        labels = [
            ("Pasta de Trabalho:", "lbl_wb", "Procurando..."),
            ("Aba Monitorada:", "lbl_ws", "Procurando..."),
            ("Células Mapeadas:", "lbl_cells", "0"),
            ("Última Leitura:", "lbl_last_read", "—"),
            ("Latência COM:", "lbl_latency", "0.0 ms"),
            ("Transmissão Realtime:", "lbl_realtime", "Buffer Ativo (Fase 2)"),
            ("CPU / Memória:", "lbl_res", "0% / 0 MB"),
        ]

        self.val_labels = {}
        for idx, (title, key, default_val) in enumerate(labels):
            ctk.CTkLabel(
                self.info_frame,
                text=title,
                font=ctk.CTkFont(family="Segoe UI", size=10),
                text_color="#8191A8"
            ).grid(row=idx, column=0, padx=12, pady=3, sticky="w")

            val_lbl = ctk.CTkLabel(
                self.info_frame,
                text=default_val,
                font=ctk.CTkFont(family="Consolas", size=10, weight="bold"),
                text_color="#F0F4FA"
            )
            val_lbl.grid(row=idx, column=1, padx=12, pady=3, sticky="e")
            self.val_labels[key] = val_lbl

        self.info_frame.grid_columnconfigure(1, weight=1)

        # Rodapé de Ações
        self.actions_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.actions_frame.pack(fill="x", padx=16, pady=(0, 14))

        self.autostart_switch = ctk.CTkSwitch(
            self.actions_frame,
            text="Iniciar com o Windows",
            font=ctk.CTkFont(size=10),
            text_color="#8191A8",
            command=self._toggle_autostart
        )
        self.autostart_switch.pack(side="left")
        if WindowsAutostart.is_enabled():
            self.autostart_switch.select()

        self.btn_logs = ctk.CTkButton(
            self.actions_frame,
            text="Ver Logs",
            width=75,
            height=26,
            font=ctk.CTkFont(size=10),
            fg_color="#0C1626",
            border_color="#1D3048",
            border_width=1,
            hover_color="#16253b",
            command=self._open_logs
        )
        self.btn_logs.pack(side="right", padx=(6, 0))

        self.btn_hide = ctk.CTkButton(
            self.actions_frame,
            text="Ocultar na Bandeja",
            width=110,
            height=26,
            font=ctk.CTkFont(size=10),
            fg_color="#16253b",
            hover_color="#1D3048",
            command=self.hide_to_tray
        )
        self.btn_hide.pack(side="right")

    def _toggle_autostart(self):
        enabled = bool(self.autostart_switch.get())
        WindowsAutostart.set_enabled(enabled)

    def _open_logs(self):
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(log_dir, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(log_dir)

    def hide_to_tray(self):
        self.withdraw()

    def update_metrics(self, data: dict):
        """Atualiza a UI em tempo real de forma thread-safe."""
        def _update():
            # Status
            is_connected = data.get("is_connected", False)
            if is_connected:
                self.dot_label.configure(text_color="#21D787")
                self.status_text.configure(text="CONECTADO AO EXCEL RTD", text_color="#21D787")
            else:
                self.dot_label.configure(text_color="#F3C65A")
                self.status_text.configure(text="AGUARDANDO EXCEL / PLANILHA...", text_color="#F3C65A")

            # Valores
            self.val_labels["lbl_wb"].configure(text=data.get("workbook", "Auto"))
            self.val_labels["lbl_ws"].configure(text=data.get("worksheet", "Auto"))
            self.val_labels["lbl_cells"].configure(text=str(data.get("cells_count", 0)))
            self.val_labels["lbl_last_read"].configure(text=data.get("last_read", "—"))
            self.val_labels["lbl_latency"].configure(text=f"{data.get('latency_ms', 0.0):.1f} ms")
            self.val_labels["lbl_realtime"].configure(text=data.get("realtime_status", "Buffer Ativo"))
            self.val_labels["lbl_res"].configure(
                text=f"{data.get('cpu_pct', 0.0)}% / {data.get('ram_mb', 0.0)} MB"
            )

        self.after(0, _update)
