# excel-rtd-connector/tests/simulator.py
"""
Simulador de Testes de Transmissao em Tempo Real.
Carrega as credenciais de forma segura via variavel de ambiente (CONNECTOR_TOKEN / SERVER_URL)
ou do arquivo local config/settings.json sem expor segredos no codigo.
"""
import sys
import os
import time
import json
import random
import websocket


def get_credentials():
    """Carrega URL e Token de variáveis de ambiente ou settings.json local."""
    env_token = os.getenv("CONNECTOR_TOKEN")
    env_url = os.getenv("SERVER_URL")

    if env_token and env_url:
        return env_url, env_token

    settings_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config", "settings.json")
    if os.path.exists(settings_path):
        try:
            with open(settings_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                url = env_url or data.get("server_url") or "wss://dashboard-production-7b535f43.up.railway.app"
                tok = env_token or data.get("server_token")
                return url, tok
        except Exception as e:
            print(f"[!] Erro ao ler settings.json: {e}")

    return env_url or "wss://dashboard-production-7b535f43.up.railway.app", env_token or ""


def run_simulator(server_url=None, token=None, max_ticks=None):
    auto_url, auto_token = get_credentials()
    url = server_url or auto_url
    tok = token or auto_token

    if not tok:
        print("[-] ERRO: CONNECTOR_TOKEN nao configurado no ambiente nem no settings.json.")
        return False

    # Mascarar o token para exibição segura em logs e terminal
    masked_token = tok[:3] + "..." + tok[-3:] if len(tok) > 6 else "***"
    print(f"[*] Conectando ao Servidor: {url} (Token: {masked_token})")

    try:
        ws = websocket.create_connection(url, timeout=10)
    except Exception as e:
        print(f"[-] Falha na conexao WSS: {e}")
        return False

    print("[+] Conectado com sucesso. Enviando credencial de autenticacao...")

    # 1. Autenticação
    ws.send(json.dumps({
        "type": "AUTH",
        "role": "publisher",
        "token": tok
    }))

    auth_resp = json.loads(ws.recv())
    print(f"[✔] Resposta do Servidor: {auth_resp.get('type')}")

    if auth_resp.get("type") != "AUTH_OK":
        print(f"[-] Falha na autenticação: {auth_resp.get('message')}")
        ws.close()
        return False

    # 2. Envio de Snapshot Inicial
    wdofut_price = 5667.5
    winz_price = 173820

    print("[*] Publicando Snapshot Inicial...")
    ws.send(json.dumps({
        "type": "SNAPSHOT",
        "snapshot": {
            "workbook": "SIMULADOR_RTD.xlsx",
            "worksheet": "Painel",
            "cells": {
                "wdofut_price": wdofut_price,
                "wdofut_variation": 7.5,
                "winz_price": winz_price,
                "winz_variation": 1037,
                "gringo_flow_dolar": 1148658013,
                "bank_flow_dolar": 499291624,
                "di_rate": 13.66
            }
        },
        "timestamp": time.time()
    }))
    print("[✔] Snapshot publicado com sucesso.")

    seq = 0
    try:
        while True:
            if max_ticks and seq >= max_ticks:
                print(f"[✔] Teste finalizado apos {seq} deltas transmitidos.")
                break

            time.sleep(0.5)
            seq += 1

            dolar_noise = random.choice([-0.5, 0.0, 0.5])
            indice_noise = random.choice([-15, 0, 15, 20])

            wdofut_price += dolar_noise
            winz_price += indice_noise

            deltas = [
                {
                    "seq": seq,
                    "key": "wdofut_price",
                    "address": "B5",
                    "previous": wdofut_price - dolar_noise,
                    "value": wdofut_price,
                    "delta": dolar_noise,
                    "timestamp": time.time()
                },
                {
                    "seq": seq,
                    "key": "winz_price",
                    "address": "C5",
                    "previous": winz_price - indice_noise,
                    "value": winz_price,
                    "delta": indice_noise,
                    "timestamp": time.time()
                }
            ]

            ws.send(json.dumps({
                "type": "DELTAS",
                "deltas": deltas,
                "timestamp": time.time()
            }))
            print(f"[RTD Delta #{seq}] Dólar: {wdofut_price:.1f} | Índice: {winz_price}")

    except KeyboardInterrupt:
        print("\n[*] Encerrando simulador com seguranca...")
    finally:
        ws.close()

    return True


if __name__ == "__main__":
    run_simulator()
