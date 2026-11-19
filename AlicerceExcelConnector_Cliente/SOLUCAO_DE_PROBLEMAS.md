# Guia de Solução de Problemas (Troubleshooting)

**Alicerce Excel RTD Connector — Diagnóstico de Incidentes**

---

## 1. Mensagens do Teste de Diagnóstico (`TestarConexao.bat`)

### A. "Sem conexão com servidor"
* **Causa:** O computador está sem acesso à internet ou o firewall corporativo está bloqueando tráfego de saída na porta HTTPS/WSS (443).
* **Solução:**
  1. Verifique se o navegador abre sites normais na internet.
  2. Certifique-se de que a URL `dashboard-production-7b535f43.up.railway.app` não está bloqueada pelo antivírus/firewall.

### B. "Erro de autenticação" ou "Aguardando Token"
* **Causa:** O token no cofre do Windows está incorreto, expirado ou não foi cadastrado.
* **Solução:**
  1. Abra o `Instalar.bat`.
  2. Escolha a **Opção [3] - Configurar ou Atualizar Token no Cofre do Windows**.
  3. Cole o novo token fornecido pela administração da Alicerce.

### C. "Aguardando Excel"
* **Causa:** O aplicativo Microsoft Excel não está aberto no computador.
* **Solução:**
  1. Abra o Excel normalmente através do atalho do Windows.
  2. Abra os arquivos de cotação do Profit Pro.

### D. "Arquivo não encontrado" (DADOS... ou nero.xlsm)
* **Causa:** O arquivo específico não foi aberto no Excel ou está com o nome modificado.
* **Solução:**
  1. Confirme se os nomes das pastas de trabalho correspondem exatamente a:
     - `DADOS^JWIN^JWDO^JPETRUS^JETC (1).xlsx`
     - `nero.xlsm`
  2. Se um dos arquivos for fechado pelo operador, o conector continuará lendo o outro e reconectará automaticamente assim que o primeiro for reaberto.

### E. "Aguardando Profit Pro ou atualização RTD" (#N/A)
* **Causa:** O Excel está aberto, mas o Profit Pro está fechado ou o servidor RTD da Nelogica não foi iniciado.
* **Solução:**
  1. Abra o Profit Pro e faça login na sua conta da corretora.
  2. No Profit Pro, vá em **Cotações > Exportar em Tempo Real (RTD)** e certifique-se de que o Dólar e o Índice estão selecionados.
  3. Assim que as células do Excel começarem a piscar com as cotações do mercado, o conector começará a transmitir os deltas automaticamente.

---

## 2. Dúvidas Frequentes

* **O conector interfere nas macros ou cálculos das minhas velas de 10 pontos?**  
  *Não.* O conector opera exclusivamente com leitura passiva de memória COM (`Range.Value2`). Ele nunca executa cálculos, escrita ou recálculo de fórmulas.

* **Preciso abrir o terminal ou digitar comandos todo dia?**  
  *Não.* O conector opera como ícone ao lado do relógio do Windows na inicialização automática do sistema.
