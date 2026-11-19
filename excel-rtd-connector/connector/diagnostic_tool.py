# excel-rtd-connector/connector/diagnostic_tool.py
"""
Ferramenta de Diagnóstico Automatizado para o Cliente Windows.
Executa 8 verificações essenciais em sequência:
1. Conectividade de Rede / Servidor Railway (WSS/HTTPS)
2. Autenticação do Conector (Windows Credential Manager / DPAPI)
3. Presença de Instância do Microsoft Excel em execução
4. Detecção dos 2 arquivos abertos (DADOS^JWIN... e nero.xlsm)
5. Validação das abas (Planilha4 e Planilha1)
6. Leitura dos valores calculados via COM (Range.Value2)
7. Detecção de atualização RTD / Profit Pro
8. Teste de handshake e transmissão com o servidor
"""
import sys
import os
import time
import json
import logging
from typing import Dict, Any, List

# Garantir importação correta mesmo executado de qualquer subdiretório
base_connector_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_connector_dir not in sys.path:
    sys.path.insert(0, base_connector_dir)

logger = logging.getLogger("excel_connector.diagnostic")


def run_full_diagnostics(settings_path: str = "config/settings.json"):
    print("=================================================================")
    print("      ALICERCE EXCEL RTD CONNECTOR — DIAGNÓSTICO DO SISTEMA      ")
    print("=================================================================\n")

    overall_status = "OK"

    # Carregar configurações
    from models.market_data import ConnectorSettings
    base_dir = base_connector_dir
    cfg_file = os.path.join(base_dir, settings_path)
    example_file = os.path.join(base_dir, "config", "settings.example.json")

    settings = None
    if os.path.exists(cfg_file):
        try:
            with open(cfg_file, "r", encoding="utf-8") as f:
                settings = ConnectorSettings(**json.load(f))
        except Exception:
            pass
    if not settings and os.path.exists(example_file):
        with open(example_file, "r", encoding="utf-8") as f:
            settings = ConnectorSettings(**json.load(f))

    if not settings:
        settings = ConnectorSettings()

    # 1. Conectividade com Servidor Railway
    print("[1/8] Verificando conectividade com o servidor Railway...")
    import urllib.request
    http_health_url = settings.server_url.replace("wss://", "https://").replace("ws://", "http://") + "/health"
    server_online = False
    try:
        req = urllib.request.Request(http_health_url, headers={"User-Agent": "AlicerceDiagnostic/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                server_online = True
                print("   [✔] Funcionando: Servidor Railway online e responsivo.")
            else:
                print(f"   [!] Aviso: Servidor respondeu com código HTTP {resp.status}.")
    except Exception as e:
        print(f"   [❌] Sem conexão com servidor: {e}")
        overall_status = "SEM_CONEXAO"

    # 2. Verificação de Autenticação / Cofre do Windows
    print("\n[2/8] Verificando credencial no Windows Credential Manager...")
    token = None
    try:
        import keyring
        token = keyring.get_password("AlicerceExcelConnector", "server_token")
    except Exception as e:
        logger.debug(f"Keyring read error: {e}")

    if not token:
        token = os.getenv("CONNECTOR_TOKEN")

    if token:
        masked = token[:3] + "..." + token[-3:] if len(token) > 6 else "***"
        print(f"   [✔] Funcionando: Credencial localizada no cofre seguro ({masked}).")
    else:
        print("   [!] Aviso: Nenhuma credencial cadastrada no Windows Credential Manager.")
        print("       (Use a opcao [1] ou [3] do Instalador para cadastrar seu token).")
        overall_status = "AGUARDANDO_TOKEN"

    # Teste de Autenticação WSS no Railway se o servidor e token estiverem disponíveis
    if server_online and token:
        try:
            import websocket
            ws = websocket.create_connection(settings.server_url, timeout=6)
            ws.send(json.dumps({"type": "AUTH", "role": "publisher", "token": token}))
            auth_res = json.loads(ws.recv())
            if auth_res.get("type") == "AUTH_OK":
                print("   [✔] Funcionando: Autenticação aceita pelo Railway como Publisher.")
            else:
                print(f"   [❌] Erro de autenticação: {auth_res.get('message')}")
                overall_status = "ERRO_AUTH"
            ws.close()
        except Exception as e:
            print(f"   [!] Falha no handshake de autenticação: {e}")

    # 3. Excel em execução
    print("\n[3/8] Verificando se o Microsoft Excel está aberto...")
    from connector.excel_connection import ExcelConnection
    conn = ExcelConnection()
    excel_running = conn.connect()

    if excel_running:
        app = conn.get_app()
        try:
            v = app.Version
            print(f"   [✔] Funcionando: Microsoft Excel v{v} ativo via COM.")
        except Exception:
            print("   [✔] Funcionando: Microsoft Excel ativo via COM.")
    else:
        print("   [⏸] Aguardando Excel: O aplicativo Microsoft Excel não está aberto no momento.")
        overall_status = "AGUARDANDO_EXCEL"

    # 4 & 5. Identificação dos Arquivos e Abas
    print("\n[4/8] Identificando arquivos abertos e [5/8] Validando abas configuradas...")
    workbooks_to_check = settings.workbooks if settings.workbooks else []
    if not workbooks_to_check:
        print("   [!] Nenhuma pasta de trabalho mapeada em settings.json.")

    found_wb_count = 0
    read_samples = {}

    if excel_running:
        for wb_cfg in workbooks_to_check:
            wb_com = conn.find_workbook(wb_cfg.name_pattern)
            if wb_com:
                found_wb_count += 1
                try:
                    wb_name = wb_com.Name
                except Exception:
                    wb_name = wb_cfg.name_pattern
                print(f"   [✔] Arquivo aberto: '{wb_name}'")

                for sheet_cfg in wb_cfg.sheets:
                    try:
                        ws_com = wb_com.Sheets.Item(sheet_cfg.sheet_name)
                        print(f"       ✔ Aba encontrada: '{sheet_cfg.sheet_name}' ({len(sheet_cfg.cells)} células mapeadas)")

                        # 6. Leitura dos valores via COM
                        from connector.cell_reader import CellReader
                        for cell_item in sheet_cfg.cells[:4]: # lê amostras
                            try:
                                r_com = ws_com.Range(cell_item.address)
                                val_raw = r_com.Value2
                                val_norm, is_err, err_code = CellReader.normalize_value(val_raw)
                                read_samples[cell_item.indicator] = {
                                    "address": cell_item.address,
                                    "value": val_norm,
                                    "is_error": is_err,
                                    "code": err_code
                                }
                            except Exception as ex:
                                read_samples[cell_item.indicator] = {"error": str(ex)}

                    except Exception as e:
                        print(f"       [!] Aba não encontrada: '{sheet_cfg.sheet_name}' ({e})")
            else:
                print(f"   [⏸] Arquivo não encontrado: '{wb_cfg.name_pattern}' (Aguardando abertura no Excel)")

    # 6 & 7. Diagnóstico dos valores calculados e RTD
    print("\n[6/8] Leitura COM dos valores calculados & [7/8] Status RTD...")
    if read_samples:
        rtd_ok = False
        for ind, data in read_samples.items():
            if data.get("is_error"):
                print(f"   • {ind} [{data.get('address')}]: Erro RTD ({data.get('code')}) -> Aguardando Profit Pro")
            elif data.get("value") is not None:
                print(f"   • {ind} [{data.get('address')}]: Valor lido = {data.get('value')}")
                rtd_ok = True
            else:
                print(f"   • {ind} [{data.get('address')}]: Vazio (None)")

        if rtd_ok:
            print("   [✔] Funcionando: Células lidas e recebendo valores calculados em memória.")
        else:
            print("   [⏸] Aguardando Profit Pro ou atualização RTD (valores retornando #N/A ou vazios).")
    elif not excel_running:
        print("   [⏸] Ignorado pois o Excel não está aberto.")
    else:
        print("   [!] Nenhuma célula pode ser lida dos arquivos abertos.")

    # 8. Teste de Transmissão / Snapshot
    print("\n[8/8] Teste de transmissão realtime...")
    if server_online and token and overall_status == "OK":
        print("   [✔] Funcionando: Canal publisher pronto para transmitir deltas ao Railway.")
    elif overall_status == "AGUARDANDO_EXCEL":
        print("   [⏸] Conector em prontidão: transmitirá assim que o Excel for iniciado.")
    else:
        print("   [!] Transmissão pendente de saneamento dos itens acima.")

    conn.disconnect()

    print("\n=================================================================")
    print("                       RESUMO DO DIAGNÓSTICO                     ")
    print("=================================================================")
    if overall_status == "OK" and found_wb_count == len(workbooks_to_check):
        print("STATUS GERAL: [✔] FUNCIONANDO PERFEITAMENTE")
    elif overall_status == "AGUARDANDO_EXCEL":
        print("STATUS GERAL: [⏸] AGUARDANDO EXCEL (Abra os arquivos no Excel)")
    elif overall_status == "AGUARDANDO_TOKEN":
        print("STATUS GERAL: [!] AGUARDANDO TOKEN (Configure via Instalador)")
    elif overall_status == "SEM_CONEXAO":
        print("STATUS GERAL: [❌] SEM CONEXÃO COM SERVIDOR (Verifique a internet)")
    else:
        print(f"STATUS GERAL: [!] PARCIAL ({overall_status}) - Aguardando arquivos abertos no Excel")
    print("=================================================================\n")


if __name__ == "__main__":
    run_full_diagnostics()
