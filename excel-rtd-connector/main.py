# excel-rtd-connector/main.py
"""
Ponto de entrada do Conector Profissional Excel RTD / Profit Pro.
Modos de execução:
  python main.py             -> Inicia o aplicativo Windows com interface gráfica e ícone de bandeja.
  python main.py --tray      -> Inicia minimizado diretamente na bandeja (ideal para autostart do Windows).
  python main.py discover    -> Inspeciona e descobre planilhas abertas no terminal.
  python main.py monitor     -> Monitoramento contínuo em terminal CLI.
"""
import sys
import os
import json
import logging
from typing import Dict, Any, List

from models.market_data import ConnectorSettings, CellValue, FieldChange
from connector.excel_connection import ExcelConnection
from connector.workbook_discovery import WorkbookDiscovery
from connector.polling_engine import PollingEngine

# Configuração de Logs
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "connector.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ]
)
logger = logging.getLogger("main")


def load_settings(path: str = "config/settings.json") -> ConnectorSettings:
    """Carrega as configurações locais ou cria a partir do exemplo."""
    config_path = os.path.join(os.path.dirname(__file__), path)
    example_path = os.path.join(os.path.dirname(__file__), "config/settings.example.json")

    if not os.path.exists(config_path) and os.path.exists(example_path):
        with open(example_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return ConnectorSettings(**data)

    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return ConnectorSettings(**data)

    return ConnectorSettings()


def command_discover():
    """Descobre instâncias ativas do Excel, pastas de trabalho e abas."""
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel

    console = Console()
    console.print(Panel.fit(
        "[bold cyan]CONECTOR EXCEL RTD[/bold cyan] — [bold yellow]DESCOBERTA DE PLANILHAS[/bold yellow]\n"
        "[dim]Varredura não invasiva via COM (GetActiveObject). Nenhuma célula é modificada.[/dim]",
        border_style="cyan"
    ))

    conn = ExcelConnection()
    if not conn.connect():
        console.print("[bold red]❌ Nenhuma instância ativa do Microsoft Excel foi detectada.[/bold red]")
        console.print("[yellow]Certifique-se de que o Excel e a planilha RTD do Profit Pro estejam abertos.[/yellow]")
        return

    app = conn.get_app()
    try:
        app_name = app.Name
        version = app.Version
        caption = app.Caption
        wb_count = app.Workbooks.Count

        console.print(f"[bold green]✔ Excel Detectado:[/bold green] {app_name} v{version} | [dim]{caption}[/dim]")
        console.print(f"Pastas de trabalho abertas: [bold]{wb_count}[/bold]\n")

        workbooks = WorkbookDiscovery.list_workbooks(app)
        if not workbooks:
            console.print("[yellow]Nenhuma pasta de trabalho aberta no momento.[/yellow]")
            return

        table = Table(title="PASTAS DE TRABALHO E ABAS DISPONÍVEIS", header_style="bold cyan", border_style="dim")
        table.add_column("Workbook", style="bold white")
        table.add_column("Abas (Sheets)", style="green")
        table.add_column("Caminho do Arquivo", style="dim")

        for wb in workbooks:
            sheets_str = ", ".join(wb["sheets"]) if wb["sheets"] else "[sem abas]"
            table.add_row(wb["name"], sheets_str, wb["full_path"] or "[Não salvo/Memória]")

        console.print(table)
        console.print(
            "\n[bold yellow]Dica:[/bold yellow] Copie o nome da planilha e da aba para o seu "
            "[bold white]config/settings.json[/bold white] antes de executar o monitoramento."
        )

    except Exception as e:
        console.print(f"[bold red]Erro durante a descoberta:[/bold red] {e}")
    finally:
        conn.disconnect()


def command_monitor():
    """Inicia o monitoramento contínuo em terminal CLI com Rich."""
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.live import Live
    from rich.layout import Layout
    from rich.text import Text

    console = Console()
    settings = load_settings()

    recent_changes: List[FieldChange] = []
    latest_values: Dict[str, CellValue] = {}

    def on_change(changes: List[FieldChange]):
        nonlocal recent_changes
        for ch in changes:
            recent_changes.insert(0, ch)
        recent_changes = recent_changes[:15]

    def on_tick(vals: Dict[str, CellValue], diag):
        nonlocal latest_values
        latest_values = vals

    engine = PollingEngine(settings, on_change_callback=on_change, on_tick_callback=on_tick)

    def generate_ui() -> Layout:
        diag = engine.diagnostics
        sys_metrics = diag.get_system_metrics()

        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="main", ratio=1),
            Layout(name="footer", size=3),
        )

        conn_status = "[bold green]CONECTADO[/bold green]" if engine.connection.is_alive() else "[bold red]DESCONECTADO (AGUARDANDO EXCEL)[/bold red]"
        header_text = Text.from_markup(
            f" [bold cyan]EXCEL RTD CONNECTOR[/bold cyan] | Status: {conn_status} | "
            f"Workbook: [bold white]{settings.workbook or 'Auto'}[/bold white] | "
            f"Aba: [bold white]{settings.worksheet or 'Auto'}[/bold white] | "
            f"Cadência: [bold yellow]{settings.polling_interval_ms}ms[/bold yellow]"
        )
        layout["header"].update(Panel(header_text, border_style="cyan"))

        layout["main"].split_row(
            Layout(name="left", ratio=6),
            Layout(name="right", ratio=6),
        )

        vals_table = Table(title="VALORES CALCULADOS RTD (EM MEMÓRIA)", header_style="bold cyan", border_style="dim", expand=True)
        vals_table.add_column("Campo", style="bold white", width=16)
        vals_table.add_column("Célula", style="dim", width=8)
        vals_table.add_column("Valor Atual", style="bold green", justify="right")
        vals_table.add_column("Status", width=10)

        for key, cell in latest_values.items():
            if cell.is_error:
                val_disp = f"[bold red]{cell.error_code}[/bold red]"
                status = "[red]ERRO[/red]"
            else:
                val_disp = str(cell.normalized_value) if cell.normalized_value is not None else "[dim]Vazio[/dim]"
                status = "[green]OK[/green]"
            vals_table.add_row(key, cell.address, val_disp, status)

        layout["left"].update(Panel(vals_table, border_style="dim"))

        delta_table = Table(title="ÚLTIMAS ALTERAÇÕES DETECTADAS (DELTAS)", header_style="bold yellow", border_style="dim", expand=True)
        delta_table.add_column("Horário", style="dim", width=12)
        delta_table.add_column("Campo", style="bold white", width=14)
        delta_table.add_column("Anterior", style="dim", justify="right")
        delta_table.add_column("Novo", style="bold green", justify="right")
        delta_table.add_column("Delta", style="bold yellow", justify="right")

        for ch in recent_changes:
            delta_str = f"+{ch.delta}" if ch.delta and ch.delta > 0 else str(ch.delta or "—")
            delta_color = "green" if ch.delta and ch.delta > 0 else "red" if ch.delta and ch.delta < 0 else "yellow"
            delta_table.add_row(
                ch.timestamp.strftime("%H:%M:%S.%f")[:-3],
                ch.key,
                str(ch.previous_value),
                str(ch.current_value),
                f"[{delta_color}]{delta_str}[/{delta_color}]"
            )

        layout["right"].update(Panel(delta_table, border_style="dim"))

        footer_text = Text.from_markup(
            f" [bold]Leituras:[/bold] {diag.total_reads} (Falhas: [red]{diag.failed_reads}[/red]) | "
            f"[bold]Latência COM:[/bold] {diag.last_read_duration_ms:.1f}ms (Média: {diag.avg_read_duration_ms:.1f}ms, Máx: {diag.max_read_duration_ms:.1f}ms) | "
            f"[bold]CPU:[/bold] {sys_metrics['cpu_percent']}% | [bold]RAM:[/bold] {sys_metrics['memory_mb']} MB | "
            f"[bold]Deltas:[/bold] {diag.total_changes_detected} | [dim]Pressione Ctrl+C para encerrar com segurança.[/dim]"
        )
        layout["footer"].update(Panel(footer_text, border_style="cyan"))

        return layout

    engine.start()
    try:
        with Live(generate_ui(), refresh_per_second=4, screen=True) as live:
            while engine.is_running():
                live.update(generate_ui())
    except KeyboardInterrupt:
        console.print("\n[yellow]Encerrando monitoramento com segurança...[/yellow]")
    finally:
        engine.stop()
        console.print("[green]Conector finalizado e desconectado do Excel.[/green]")


def command_gui(start_minimized: bool = False):
    """Inicia a aplicação Windows nativa com ícone na bandeja."""
    from connector.tray_app import TrayApplication
    settings = load_settings()
    app = TrayApplication(settings)
    app.run(start_minimized=start_minimized)


def main():
    args = [arg.lower() for arg in sys.argv[1:]]

    if "discover" in args:
        command_discover()
    elif "monitor" in args:
        command_monitor()
    elif "--tray" in args or "-t" in args:
        command_gui(start_minimized=True)
    else:
        command_gui(start_minimized=False)


if __name__ == "__main__":
    main()
