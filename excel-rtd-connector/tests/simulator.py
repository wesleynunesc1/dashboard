# excel-rtd-connector/tests/simulator.py
"""
Simulador de Testes Locais e em Producao (Railway).
Permite validar toda a esteira de comunicacao em tempo real:
1. Conecta ao Servidor WebSocket (Railway WSS)
2. Autentica como conector Windows
3. Emite snapshot inicial
4. Simula oscilacoes de cotacoes RTD e envia deltas periodicos
"""
import sys
import time
import json
import random
import websocket

DEFAULT_SERVER_URL = "wss://dashboard-production-7b535f43.up.railway.app"
DEFAULT_TOKEN = "alicerce_rtd_secret_token_2026"


def run_simulator(server_url=DEFAULT_SERVER_URL, token=DEFAULT_TOKEN, max_ticks=None):
    print(f"[*] Conectando ao Servidor Railway: {server_url}")

    ws = websocket.create_connection(server_url, timeout=10)
    print("[+] Conectado com sucesso. Enviando credencial de autenticacao...")

    # 1. Autenticação
    ws.send(json.dumps({
        "type": "AUTH",
        "role": "publisher",
        "token": token
    }))

    auth_resp = json.loads(ws.recv())
    print(f"[✔] Resposta de Autenticacao do Servidor: {auth_resp}")

    if auth_resp.get("type") != "AUTH_OK":
        print("[-] Falha na autenticação.")
        return False

    # 2. Envio de Snapshot Inicial
    wdofut_price = 5667.5
    winz_price = 173820

    print("[*] Enviando Snapshot Inicial do Simulador RTD...")
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
    print("[✔] Snapshot publicado com sucesso no Railway.")

    seq = 0
    try:
        while True:
            if max_ticks and seq >= max_ticks:
                print(f"[✔] Teste finalizado apos {seq} deltas.")
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
        print("\n[*] Encerrando simulador...")
    finally:
        ws.close()

    return True


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SERVER_URL
    run_simulator(server_url=url)
