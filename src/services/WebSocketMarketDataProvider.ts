// src/services/WebSocketMarketDataProvider.ts
import { MarketDataProvider } from './MarketDataProvider';
import { MarketSnapshot } from '@/types/market';
import { marketService as fallbackMockService } from './MockMarketDataProvider';

export interface WebSocketStatus {
  connected: boolean;
  connectorOnline: boolean;
  isStale: boolean;
  lastMessageTime: number;
}

/**
 * Provedor WebSocket Realtime com Segurança Avançada
 * - Obtém credencial temporária assinada pelo backend Next.js (/api/auth/ws-token)
 * - NUNCA expõe segredos estáticos no bundle público
 * - Mantém fallback caso a rede esteja indisponível
 */
export class WebSocketMarketDataProvider implements MarketDataProvider {
  private wsUrl: string;
  private socket: WebSocket | null = null;
  private listeners: Set<(snapshot: MarketSnapshot) => void> = new Set();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private currentSnapshot: MarketSnapshot;
  private isConnected = false;
  private isConnectorOnline = false;
  private isStale = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private lastMessageTime = 0;

  constructor(
    wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://dashboard-production-7b535f43.up.railway.app'
  ) {
    this.wsUrl = wsUrl;
    this.currentSnapshot = fallbackMockService.getCurrentSnapshot();
  }

  private async fetchTemporaryToken(): Promise<string> {
    try {
      const res = await fetch('/api/auth/ws-token');
      if (res.ok) {
        const data = await res.json();
        return data.token || '';
      }
    } catch (e) {
      console.debug('[WS Auth] Falha ao obter token temporário do backend:', e);
    }
    return '';
  }

  async connect(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. Obtém credencial temporária segura via backend
      const tempToken = await this.fetchTemporaryToken();

      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        // Autentica como Dashboard (Subscriber) com token temporário
        const authMsg = {
          type: 'AUTH',
          role: 'subscriber',
          token: tempToken
        };
        this.socket?.send(JSON.stringify(authMsg));
        this.notifyStatus();

        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'PING' }));
          }
        }, 20000);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.lastMessageTime = Date.now();
          this.isStale = false;

          if (data.type === 'INITIAL_SNAPSHOT' || data.type === 'SNAPSHOT_UPDATE') {
            this.handleSnapshotMessage(data);
          } else if (data.type === 'DELTA_UPDATE') {
            this.handleDeltaMessage(data.deltas);
          } else if (data.type === 'CONNECTOR_STATUS') {
            this.isConnectorOnline = data.online;
            this.notifyStatus();
          } else if (data.type === 'STALE_WARNING') {
            this.isStale = data.isStale;
            this.notifyStatus();
          }
        } catch (e) {
          console.debug('[WS Parse Error]', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.notifyStatus();
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        this.notifyStatus();
      };
    } catch (err) {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 4000);
  }

  private handleSnapshotMessage(data: any) {
    if (data.snapshot && data.snapshot.cells) {
      this.applyExcelCellsToSnapshot(data.snapshot.cells);
    }
    if (data.connectorOnline !== undefined) {
      this.isConnectorOnline = data.connectorOnline;
    }
    this.notifyStatus();
    this.notify();
  }

  private handleDeltaMessage(deltas: any[]) {
    if (!deltas || !Array.isArray(deltas)) return;
    const cellsDelta: Record<string, any> = {};
    for (const d of deltas) {
      if (d.key && d.value !== undefined) {
        cellsDelta[d.key] = d.value;
      }
    }
    this.applyExcelCellsToSnapshot(cellsDelta);
    this.notify();
  }

  private applyExcelCellsToSnapshot(cells: Record<string, any>) {
    const snap = { ...this.currentSnapshot };

    if (cells.wdofut_price !== undefined && typeof cells.wdofut_price === 'number') {
      snap.dolar.quote.price = cells.wdofut_price;
      snap.dolar.volatility.spotPrice = cells.wdofut_price;
      snap.dolar.volatility.futPrice = cells.wdofut_price;
    }

    if (cells.wdofut_variation !== undefined && typeof cells.wdofut_variation === 'number') {
      snap.dolar.quote.variationPoints = cells.wdofut_variation;
    }

    if (cells.winz_price !== undefined && typeof cells.winz_price === 'number') {
      snap.indice.quote.price = cells.winz_price;
      snap.indice.volatility.futPrice = cells.winz_price;
    }

    if (cells.winz_variation !== undefined && typeof cells.winz_variation === 'number') {
      snap.indice.quote.variationPoints = cells.winz_variation;
    }

    if (cells.gringo_flow_dolar !== undefined && typeof cells.gringo_flow_dolar === 'number') {
      const g = snap.dolar.dailyFlow.find((f) => f.type === 'estrangeiro');
      if (g) g.value = cells.gringo_flow_dolar;
    }

    if (cells.bank_flow_dolar !== undefined && typeof cells.bank_flow_dolar === 'number') {
      const b = snap.dolar.dailyFlow.find((f) => f.type === 'bancos');
      if (b) b.value = cells.bank_flow_dolar;
    }

    if (cells.retail_flow_dolar !== undefined && typeof cells.retail_flow_dolar === 'number') {
      const r = snap.dolar.dailyFlow.find((f) => f.type === 'pessoaFisica');
      if (r) r.value = cells.retail_flow_dolar;
    }

    if (cells.di_rate !== undefined && typeof cells.di_rate === 'number') {
      if (snap.center.diContracts[0]) {
        snap.center.diContracts[0].rate = cells.di_rate;
      }
    }

    snap.timestamp = Date.now();
    this.currentSnapshot = snap;
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  subscribe(callback: (snapshot: MarketSnapshot) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentSnapshot);
    return () => {
      this.listeners.delete(callback);
    };
  }

  subscribeStatus(callback: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.getStatus());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  getStatus(): WebSocketStatus {
    return {
      connected: this.isConnected,
      connectorOnline: this.isConnectorOnline,
      isStale: this.isStale,
      lastMessageTime: this.lastMessageTime
    };
  }

  getCurrentSnapshot(): MarketSnapshot {
    return this.currentSnapshot;
  }

  pause(): void {
    fallbackMockService.pause();
  }

  resume(): void {
    fallbackMockService.resume();
  }

  reset(): void {
    fallbackMockService.reset();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentSnapshot);
    }
  }

  private notifyStatus(): void {
    const status = this.getStatus();
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

export const realtimeService = new WebSocketMarketDataProvider();
