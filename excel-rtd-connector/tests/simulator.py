# excel-rtd-connector/tests/simulator.py
"""
Simulador de Testes Locais para a Comunicação em Tempo Real.
Permite validar toda a esteira sem precisar do Profit Pro ou do Excel:
1. Conecta ao Servidor WebSocket
2. Autentica como conector Windows
3. Emite snapshot inicial
4. Simula oscilações de cotações RTD e envia deltas periódicos
"""
import time
import json
import random
import websocket

SERVER_URL = "ws://localhost:8080"
TOKEN = "alicerce_rtd_secret_token_2026"


def run_simulator():
    print(f"[*] Iniciando Simulador de Conector RTD -> {SERVER_URL}")

    ws = websocket.create_connection(SERVER_URL)
    print("[+] Conectado ao servidor. Enviando autenticacao...")

    # 1. Autenticação
    ws.send(json.dumps({
        "type": "AUTH",
        "role": "publisher",
        "token": TOKEN
    }))

    auth_resp = json.loads(ws.recv())
    print(f"[✔] Resposta do Servidor: {auth_resp}")

    if auth_resp.get("type") != "AUTH_OK":
        print("[-] Falha na autenticação.")
        return

    # 2. Envio de Snapshot Inicial
    wdofut_price = 5667.5
    winz_price = 173820

    print("[*] Enviando Snapshot Inicial do Excel...")
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

    print("[✔] Snapshot enviado com sucesso. Iniciando envio de deltas a cada 500ms...")

    seq = 0
    try:
        while True:
            time.sleep(0.5)
            seq += 1

            # Oscilação simulada
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


if __name__ == "__main__":
    run_simulator()
