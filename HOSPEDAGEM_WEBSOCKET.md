# Guia de Hospedagem e Conexão WebSocket (Sem Banco de Dados)

Arquitetura simplificada e de altíssima performance:
```text
Profit Pro -> Excel RTD -> AlicerceExcelConnector.exe -> Servidor WebSocket (RAM) -> Dashboard Vercel
```

Zero bancos de dados, zero SQL, zero retenção de dados confidenciais do cliente.

---

## 1. Onde Hospedar o Servidor WebSocket (`realtime-server`)
O servidor WebSocket em Node.js necessita de um processo contínuo com suporte a conexões TCP/WSS de longa duração. Recomendamos as seguintes plataformas gratuitas ou de custo irrisório:

### Opção A — Railway (Recomendado - 2 minutos)
1. Crie uma conta em [railway.app](https://railway.app).
2. Clique em **+ New Project** -> **Deploy from GitHub repo**.
3. Selecione o repositório `dashboard` e a pasta raiz `realtime-server`.
4. Em **Variables**, adicione:
   - `PORT`: `8080` (ou a porta atribuída)
   - `CONNECTOR_TOKEN`: `sua_chave_secreta_conector`
   - `DASHBOARD_TOKEN`: `sua_chave_secreta_dashboard`
5. A Railway gerará automaticamente uma URL pública segura:
   `wss://realtime-server-production-xxxx.up.railway.app`

### Opção B — Render.com (Web Service)
1. Crie um **Web Service** conectado ao GitHub no diretório `realtime-server`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. A Render fornecerá a URL segura `wss://seu-app.onrender.com`.

---

## 2. Configuração na Dashboard (Vercel)
No painel do seu projeto na Vercel:
1. Vá em **Settings** -> **Environment Variables**.
2. Adicione:
   - `NEXT_PUBLIC_WS_URL`: `wss://seu-servidor-websocket.up.railway.app`
   - `NEXT_PUBLIC_WS_TOKEN`: `sua_chave_secreta_dashboard`
3. Execute o Redeploy da Dashboard. A Dashboard se conectará automaticamente e exibirá o badge **EXCEL RTD CONECTADO** assim que o cliente abrir a planilha.

---

## 3. Configuração no Conector Windows (`config/settings.json`)
No arquivo `config/settings.json` na máquina do cliente (ou durante a instalação):
```json
{
  "workbook": "MINHA_PLANILHA.xlsx",
  "worksheet": "Painel",
  "server_url": "wss://seu-servidor-websocket.up.railway.app",
  "server_token": "sua_chave_secreta_conector",
  "cells": {
    "wdofut_price": "B5",
    "winz_price": "C5"
  }
}
```

---

## 4. Testes Locais com o Simulador
Para testar toda a comunicação sem o Excel ou Profit Pro:
1. Em um terminal, inicie o servidor:
   ```cmd
   cd realtime-server
   npm start
   ```
2. Em outro terminal, inicie a Dashboard Next.js:
   ```cmd
   npm run dev -p 7777
   ```
3. Em um terceiro terminal, rode o simulador:
   ```cmd
   cd excel-rtd-connector
   .venv\Scripts\python.exe tests\simulator.py
   ```
4. Veja as cotações oscilando e o badge de conexão mudando em tempo real na Dashboard!
