// realtime-server/src/server.js
/**
 * Servidor WebSocket de Alta Performance em Memória RAM
 * Arquitetura: Profit Pro -> Excel RTD -> Conector Windows -> Servidor WebSocket -> Dashboard Next.js
 * 
 * Regras:
 * - Zero Banco de Dados (Zero Supabase / Postgres)
 * - Autenticação por Tokens de Conector (Publisher) e Dashboard (Subscriber)
 * - Distribui snapshot imediato aos novos clientes
 * - Transmite apenas deltas alterados
 * - Detecta dados desatualizados (stale)
 */
require('dotenv').config();
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const CONNECTOR_TOKEN = process.env.CONNECTOR_TOKEN || 'alicerce_rtd_secret_token_2026';
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || 'alicerce_dashboard_token_2026';
const DATA_STALE_TIMEOUT_MS = parseInt(process.env.DATA_STALE_TIMEOUT_MS || '10000', 10);

// Estado de Mercado 100% em Memória RAM
let currentMarketSnapshot = null;
let lastUpdateTimestamp = 0;
let isConnectorOnline = false;

// Conjunto de conexões
const subscribers = new Set(); // Dashboards conectadas
let activePublisher = null;    // Conector Windows

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      connector_online: isConnectorOnline,
      subscribers_count: subscribers.size,
      last_update: lastUpdateTimestamp ? new Date(lastUpdateTimestamp).toISOString() : null,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Alicerce Realtime WebSocket Server Online');
});

const wss = new WebSocketServer({ server });

function broadcast(payload, targetSet = subscribers) {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const client of targetSet) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Verificação periódica de dados obsoletos (Heartbeat & Stale Data Check)
setInterval(() => {
  const now = Date.now();
  if (lastUpdateTimestamp > 0 && now - lastUpdateTimestamp > DATA_STALE_TIMEOUT_MS) {
    broadcast({
      type: 'STALE_WARNING',
      isStale: true,
      lastSeenMs: now - lastUpdateTimestamp,
      timestamp: now
    });
  }
}, 3000);

wss.on('connection', (ws, req) => {
  let role = null; // 'publisher' ou 'subscriber'
  let authenticated = false;
  const ip = req.socket.remoteAddress;

  // Timeout para autenticação (5 segundos)
  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Auth timeout: token required' }));
      ws.close(4001, 'Auth timeout');
    }
  }, 5000);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. Etapa de Autenticação
      if (msg.type === 'AUTH') {
        clearTimeout(authTimeout);

        if (msg.role === 'publisher') {
          if (msg.token === CONNECTOR_TOKEN) {
            authenticated = true;
            role = 'publisher';
            activePublisher = ws;
            isConnectorOnline = true;
            ws.send(JSON.stringify({ type: 'AUTH_OK', role: 'publisher' }));
            console.log(`[AUTH] Conector Windows autenticado com sucesso (${ip})`);

            // Notifica as dashboards de que o conector está online
            broadcast({ type: 'CONNECTOR_STATUS', online: true });
          } else {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Token de Conector inválido' }));
            ws.close(4003, 'Forbidden');
          }
        } else if (msg.role === 'subscriber') {
          // Dashboard
          if (!DASHBOARD_TOKEN || msg.token === DASHBOARD_TOKEN) {
            authenticated = true;
            role = 'subscriber';
            subscribers.add(ws);
            ws.send(JSON.stringify({ type: 'AUTH_OK', role: 'subscriber' }));
            console.log(`[AUTH] Nova Dashboard conectada (${ip}). Total: ${subscribers.size}`);

            // Envia imediatamente o último snapshot em memória
            if (currentMarketSnapshot) {
              ws.send(JSON.stringify({
                type: 'INITIAL_SNAPSHOT',
                snapshot: currentMarketSnapshot,
                connectorOnline: isConnectorOnline,
                timestamp: lastUpdateTimestamp
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'WAITING_DATA',
                connectorOnline: isConnectorOnline,
                message: 'Aguardando abertura da planilha no Excel pelo conector'
              }));
            }
          } else {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Token de Dashboard inválido' }));
            ws.close(4003, 'Forbidden');
          }
        }
        return;
      }

      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Não autenticado' }));
        return;
      }

      // 2. Fluxo do Conector Windows (Publisher)
      if (role === 'publisher') {
        if (msg.type === 'HEARTBEAT') {
          ws.send(JSON.stringify({ type: 'HEARTBEAT_ACK', timestamp: Date.now() }));
          return;
        }

        if (msg.type === 'SNAPSHOT') {
          currentMarketSnapshot = msg.snapshot;
          lastUpdateTimestamp = Date.now();
          broadcast({
            type: 'SNAPSHOT_UPDATE',
            snapshot: currentMarketSnapshot,
            timestamp: lastUpdateTimestamp
          });
          return;
        }

        if (msg.type === 'DELTAS') {
          lastUpdateTimestamp = Date.now();
          // Atualiza snapshot em memória se aplicável
          if (currentMarketSnapshot && msg.deltas) {
            for (const d of msg.deltas) {
              if (d.key && currentMarketSnapshot.cells) {
                currentMarketSnapshot.cells[d.key] = d.value;
              }
            }
          }
          // Transmite apenas as alterações para as dashboards
          broadcast({
            type: 'DELTA_UPDATE',
            deltas: msg.deltas,
            timestamp: lastUpdateTimestamp
          });
          return;
        }
      }

      // 3. Heartbeat de assinantes
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }

    } catch (err) {
      console.error('[ERRO MSG]', err.message);
    }
  });

  ws.on('close', () => {
    clearTimeout(authTimeout);
    if (role === 'subscriber') {
      subscribers.delete(ws);
      console.log(`[DISCONNECT] Dashboard desconectada (${ip}). Restantes: ${subscribers.size}`);
    } else if (role === 'publisher' && activePublisher === ws) {
      activePublisher = null;
      isConnectorOnline = false;
      console.log(`[DISCONNECT] Conector Windows desconectado (${ip})`);
      broadcast({ type: 'CONNECTOR_STATUS', online: false });
    }
  });

  ws.on('error', (err) => {
    console.error(`[SOCKET ERROR] ${err.message}`);
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  ALICERCE REALTIME WEBSOCKET SERVER INICIADO          `);
  console.log(`  Porta HTTP/WS: ${PORT}                             `);
  console.log(`  Memória RAM: Zero Banco de Dados                    `);
  console.log(`=======================================================`);
});
