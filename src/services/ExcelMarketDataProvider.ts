// src/services/ExcelMarketDataProvider.ts
import { MarketDataProvider } from './MarketDataProvider';
import { MarketSnapshot } from '@/types/market';

/**
 * Contrato preparado para a FASE 02:
 * Integração com backend Python conectado ao Excel/RTD/DDE.
 * Nesta Fase 01, este provedor apenas implementa a interface e lança aviso de não implementado.
 */
export class ExcelMarketDataProvider implements MarketDataProvider {
  private apiUrl: string;

  constructor(apiUrl = 'http://localhost:8000/api/market') {
    this.apiUrl = apiUrl;
  }

  async connect(): Promise<void> {
    console.info(`[ExcelMarketDataProvider] Interface preparada para backend Python em: ${this.apiUrl}`);
    throw new Error('ExcelMarketDataProvider será ativado na FASE 02.');
  }

  async disconnect(): Promise<void> {
    // Implementação na Fase 02
  }

  subscribe(_callback: (snapshot: MarketSnapshot) => void): () => void {
    return () => {};
  }

  getCurrentSnapshot(): MarketSnapshot {
    throw new Error('ExcelMarketDataProvider ainda não conectado.');
  }

  pause(): void {}
  resume(): void {}
  reset(): void {}
}
