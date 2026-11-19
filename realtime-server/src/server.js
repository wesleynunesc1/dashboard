// realtime-server/src/server.js
/**
 * Servidor WebSocket de Alta Performance em Memória RAM
 * Arquitetura: Profit Pro -> Excel RTD -> Conector Windows -> Servidor WebSocket (Railway) -> Dashboard Next.js (Vercel)
 * 
 * Segurança Avançada:
 * - Validação de tokens de sessão temporários assinados com HMAC-SHA256 (Vercel Backend)
 * - Aceita também DASHBOARD_TOKEN direto se configurado
 * - CONNECTOR_TOKEN exclusivo para o conector Windows
 * - Zero Banco de Dados
 */
require('dotenv').config();
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const CONNECTOR_TOKEN = process.env.CONNECTOR_TOKEN || 'alicerce_rtd_secret_token_2026';
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || 'alicerce_dashboard_token_2026';
const WS_AUTH_SECRET = process.env.WS_AUTH_SECRET || DASHBOARD_TOKEN || 'alicerce_auth_secret_shared_2026';
const DATA_STALE_TIMEOUT_MS = parseInt(process.env.DATA_STALE_TIMEOUT_MS || '10000', 10);

// Estado de Mercado 100% em Memória RAM
let currentMarketSnapshot = null;
let lastUpdateTimestamp = 0;
let isConnectorOnline = false;

// Conjunto de conexões
const subscribers = new Set();
let activePublisher = null;

function validateSubscriberToken(token) {
  if (!token) return false;

  // 1. Verificação de Token de Sessão Assinado HMAC (tmp_timestamp_signature)
  if (token.startsWith('tmp_')) {
    const parts = token.split('_');
    if (parts.length === 3) {
      const tokenTime = parseInt(parts[1], 10);
      const signature = parts[2];
      const now = Date.now();

      // Expiração de 5 minutos para cobrir latência de handshake e conexões
      if (now - tokenTime < 300000 && tokenTime <= now + 5000) {
        const payload = `subscriber:${tokenTime}`;
        const hmac = crypto.createHmac('sha256', WS_AUTH_SECRET);
        hmac.update(payload);
        const expectedSig = hmac.digest('hex');
        if (signature === expectedSig) {
          return true;
        }
      }
    }
  }

  // 2. Token estático direto (se configurado)
  if (DASHBOARD_TOKEN && token === DASHBOARD_TOKEN) {
    return true;
  }

  return false;
}

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

// Verificação de dados obsoletos (Stale Warning)
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
  let role = null;
  let authenticated = false;
  const ip = req.socket.remoteAddress;

  const authTimeout = setTimeout(() => {
    if (!authenticated) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Auth timeout: token required' }));
      ws.close(4001, 'Auth timeout');
    }
  }, 6000);

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. Autenticação
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
            broadcast({ type: 'CONNECTOR_STATUS', online: true });
          } else {
            console.warn(`[AUTH FAIL] Conector com token inválido de ${ip}`);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Token de Conector inválido' }));
            ws.close(4003, 'Forbidden');
          }
        } else if (msg.role === 'subscriber') {
          if (validateSubscriberToken(msg.token)) {
            authenticated = true;
            role = 'subscriber';
            subscribers.add(ws);
            ws.send(JSON.stringify({ type: 'AUTH_OK', role: 'subscriber' }));
            console.log(`[AUTH] Dashboard conectada (${ip}). Total ativas: ${subscribers.size}`);

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
            console.warn(`[AUTH FAIL] Dashboard rejeitada: token inválido ou expirado de ${ip}`);
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Token de Dashboard inválido ou expirado' }));
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
          if (currentMarketSnapshot && msg.deltas) {
            for (const d of msg.deltas) {
              if (d.key && currentMarketSnapshot.cells) {
                currentMarketSnapshot.cells[d.key] = d.value;
              }
            }
          }
          broadcast({
            type: 'DELTA_UPDATE',
            deltas: msg.deltas,
            timestamp: lastUpdateTimestamp
          });
          return;
        }
      }

      // 3. Heartbeat do navegador
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
  console.log(`  Serviço: Railway Production Cloud                   `);
  console.log(`  Segurança: HMAC Token Authentication                `);
  console.log(`=======================================================`);
});
