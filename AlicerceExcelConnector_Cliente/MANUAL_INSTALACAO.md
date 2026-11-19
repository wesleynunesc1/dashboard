# Manual de Instalação e Operação — Alicerce Excel RTD Connector

**Arquitetura:** Profit Pro → Excel RTD → Conector Windows → Servidor Realtime (Railway) → Dashboard (Vercel)

---

## 1. Requisitos do Sistema
* Windows 10 ou Windows 11 (64-bit).
* Microsoft Excel (2016, 2019, 2021 ou Microsoft 365) instalado.
* Profit Pro / Nelogica em execução com o módulo RTD ativado.
* Conexão estável com a internet.
* **Nota importante:** O computador do cliente **NÃO precisa de Python, Git ou Antigravity instalados**. Todo o ambiente é autocontido no executável.

---

## 2. Passo a Passo de Instalação (Simples)

1. **Copiar a pasta:**
   Copie a pasta inteira `AlicerceExcelConnector_Cliente` para qualquer local do seu computador (ex: Documentos ou Área de Trabalho).

2. **Executar o Instalador:**
   Dê um duplo clique no arquivo **`Instalar.bat`**.

3. **Opção [1] - Instalação Completa:**
   * O instalador copiará os arquivos para a pasta padrão do usuário (`%LOCALAPPDATA%\AlicerceExcelConnector`).
   * Criará o atalho **"Alicerce Excel RTD"** na sua Área de Trabalho.
   * Perguntará se deseja cadastrar o **CONNECTOR_TOKEN**. Digite `S` e cole o token fornecido pela Alicerce. (O token é digitado de forma mascarada e salvo diretamente no cofre de segurança do Windows Credential Manager).
   * Perguntará se deseja ativar a inicialização automática com o Windows. Digite `S`.

4. **Pronto!**
   O aplicativo já estará configurado e operando silenciosamente na bandeja do sistema (ao lado do relógio do Windows).

---

## 3. Diagnóstico e Teste de Conexão Rápido

Antes de operar, você pode verificar se todos os componentes estão conectados:
* Dê um duplo clique em **`TestarConexao.bat`**.
* O teste verificará automaticamente:
  1. Conexão com o servidor em nuvem (Railway).
  2. Autenticação e credencial no cofre do Windows.
  3. Presença do Excel aberto.
  4. Detecção das duas planilhas (`DADOS...xlsx` e `nero.xlsm`).
  5. Leitura dos valores em tempo real.

---

## 4. Como Usar no Dia a Dia

* Ao ligar o computador e fazer login, o conector inicia automaticamente em segundo plano.
* Abra o seu **Profit Pro**.
* Abra as duas planilhas operacionais do Excel:
  - `DADOS^JWIN^JWDO^JPETRUS^JETC (1).xlsx`
  - `nero.xlsm`
* O conector detecta automaticamente a abertura dos arquivos e começa a transmitir os preços em tempo real para a Dashboard na nuvem.
* **Preservação:** O conector funciona em modo estrito de leitura. Ele **nunca altera células, nunca salva e nunca fecha seus arquivos Excel**.
