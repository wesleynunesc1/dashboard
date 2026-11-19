# Conector Profissional Excel RTD / Profit Pro — Fase 1

Conector local de alta performance em Python para Windows 10/11 que se anexa a uma instância aberta do Microsoft Excel recebendo cotações RTD do Profit Pro/Nelogica, lendo continuamente seus valores calculados em memória sem modificar a planilha.

---

## 🛡️ Regras Rígidas de Preservação e Segurança

- **100% Leitura (Read-Only):** Conecta exclusivamente via `win32com.client.GetActiveObject` na Running Object Table (ROT).
- **Zero interferência:** Nunca executa `Save`, `SaveAs`, `Close`, `RefreshAll` ou recálculos (`Calculate`).
- **Nenhum arquivo aberto pelo conector:** Apenas lê planilhas que o usuário já abriu.
- **Isolamento de threads:** Operações COM inicializadas e finalizadas estritamente com `pythoncom.CoInitialize()` e `pythoncom.CoUninitialize()`.
- **Segurança local:** Não abre portas de rede, não expõe credenciais e não trafega dados para a internet nesta fase.

---

## 📁 Estrutura do Projeto

```text
excel-rtd-connector/
├── main.py                  # Ponto de entrada CLI (discover e monitor)
├── requirements.txt         # Dependências (pywin32, rich, pydantic, psutil, pytest)
├── start.bat                # Inicializador interativo para Windows
├── config/
│   ├── settings.json        # Configuração ativa local
│   └── settings.example.json# Exemplo com mapeamentos típicos
├── connector/
│   ├── excel_connection.py  # Anexação segura via GetActiveObject
│   ├── workbook_discovery.py# Descoberta não invasiva de pastas e abas
│   ├── cell_reader.py       # Leitura Value2 e normalização de erros (#N/A)
│   ├── change_detector.py   # Motor de deltas com tolerância numérica
│   ├── polling_engine.py    # Loop de leitura cadenciado sem sobreposição
│   └── diagnostics.py       # Métricas de latência COM, CPU e memória
├── models/
│   └── market_data.py       # Modelos Pydantic de dados e configurações
├── tests/                   # Testes automatizados com Pytest
│   ├── test_change_detector.py
│   ├── test_normalization.py
│   └── test_connection_mock.py
└── logs/
    └── connector.log        # Logs de eventos de conexão e erros
```

---

## 🚀 Instalação e Execução

### 1. Pré-requisitos
- Windows 10 ou 11
- Python 3.11 ou superior
- Microsoft Excel aberto com as fórmulas RTD ativas do Profit Pro

### 2. Execução Rápida via Batch
Dê um duplo clique no arquivo `start.bat` ou execute no terminal:
```cmd
start.bat
```

### 3. Execução Manual via Terminal
Ative o ambiente virtual e execute:
```cmd
cd excel-rtd-connector
.venv\Scripts\activate

# 1. Descobrir as planilhas e abas abertas no Excel:
python main.py discover

# 2. Iniciar o monitoramento em tempo real:
python main.py monitor

# 3. Rodar a suíte de testes:
pytest tests
```

---

## ⚙️ Configuração das Células (`config/settings.json`)

Edite o arquivo `config/settings.json` com os endereços reais da sua planilha:

```json
{
  "workbook": "PROFIT_RTD.xlsx",
  "worksheet": "Painel",
  "polling_interval_ms": 250,
  "cells": {
    "wdofut_price": "B5",
    "winz_price": "C5",
    "gringo_flow_dolar": "D5",
    "bank_flow_dolar": "E5",
    "retail_flow_dolar": "F5",
    "di_rate": "G5"
  },
  "ranges": {
    "book_top_bids": "J5:K9",
    "book_top_asks": "L5:M9"
  },
  "tolerance": 0.000001,
  "max_consecutive_errors": 5,
  "log_level": "INFO"
}
```

- **`workbook`**: Nome da pasta de trabalho aberta (ex: `MinhaPlanilha.xlsx`). Deixe em branco `""` para selecionar a pasta ativa automaticamente.
- **`worksheet`**: Nome da aba (ex: `Painel` ou `Dólar`). Deixe em branco `""` para a aba ativa.
- **`polling_interval_ms`**: Cadência de leitura em milissegundos (recomendado: 250ms).
- **`cells`**: Dicionário com chaves amigáveis e endereços das células.
- **`ranges`**: Intervalos contíguos para leitura em lote de livros de ofertas ou tabelas.
- **`tolerance`**: Limite numérico mínimo para considerar um delta real.

---

## 🧪 Relatório de Testes Executados

Os testes unitários e de integração foram validados com 100% de sucesso via `pytest`:
1. `test_change_detector.py`: Validação de detecção de deltas numéricos, ausência de falsos positivos em valores idênticos e respeito à tolerância.
2. `test_normalization.py`: Tratamento de células vazias (`None`), números negativos, zero e conversão segura de códigos de erro COM do Excel (`#N/A`, `#DIV/0!`).
3. `test_connection_mock.py`: Leitura em lote de intervalos contíguos (*matrix range*) e validação de schema Pydantic.
