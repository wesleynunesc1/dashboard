// src/services/MarketDataProvider.ts
import { MarketSnapshot } from '@/types/market';

export interface MarketDataProvider {
  /**
   * Conecta ou inicializa o fluxo de dados
   */
  connect(): Promise<void>;

  /**
   * Desconecta o provedor
   */
  disconnect(): Promise<void>;

  /**
   * Inscreve um callback para receber snapshots do mercado
   */
  subscribe(callback: (snapshot: MarketSnapshot) => void): () => void;

  /**
   * Obtém o snapshot atual imediatamente
   */
  getCurrentSnapshot(): MarketSnapshot;

  /**
   * Pausa a atualização contínua
   */
  pause(): void;

  /**
   * Retoma a atualização contínua
   */
  resume(): void;

  /**
   * Reseta a simulação/estado para o início
   */
  reset(): void;
}
