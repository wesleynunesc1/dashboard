// src/types/market.ts

export type MarketParticipantType = 'estrangeiro' | 'bancos' | 'pessoaFisica';

export interface ParticipantFlow {
  name: string;
  type: MarketParticipantType;
  value: number; // Em R$
  contracts?: number; // Em contratos
  formattedValue?: string;
}

export interface QuoteData {
  symbol: string;
  ticker: string; // Ex: WDOFUT, WINFUT
  name: string;
  price: number;
  variationPoints: number;
  variationPercent: number;
  trend: 'LATERAL' | 'ALTA' | 'BAIXA';
  contractCode: string;
  lastUpdate: string;
}

export interface CumulativeFlowPoint {
  time: string; // "09:00", "09:30", etc.
  estrangeiro: number; // em bilhões ou milhões
  bancos: number;
  pessoaFisica: number;
  total: number;
}

export interface VolatilityData {
  topOfDay: number; // Topo do dia
  bottomOfDay: number; // Fundo do dia
  volume: number; // Volume financeiro ou contratos
  volatilityPercent: number; // Ex: 14.8%
  realtimeBalance: number; // Ex: +24.760
  spotSymbol: string; // DOLFUT ou INDFUT
  spotPrice: number;
  futSymbol: string; // WDOFUT ou WINFUT
  futPrice: number;
}

export interface FlowDeltaItem {
  participant: string;
  type: MarketParticipantType;
  m5: number;
  m15: number;
  m30: number;
}

export interface FlowForceParticipant {
  name: string;
  type: MarketParticipantType | 'agressao';
  percent: number; // 0 a 100
  direction: 'compra' | 'venda';
}

export interface FlowForceData {
  state: 'VENDEDORA' | 'COMPRADORA' | 'EQUILIBRADA';
  gaugePercent: number; // 0 - 100
  participants: FlowForceParticipant[];
}

export interface AggressionStatusData {
  state: 'COMPRADORA' | 'VENDEDORA' | 'NEUTRA';
  score: number; // -100 (super venda) a +100 (super compra)
  value: number; // Saldo ou valor ex: +24.760
  tapeReadPercent: number; // Ex: 98%
}

export interface MarketEvent {
  id: string;
  time: string; // "11:38"
  text: string;
  type: 'buyer' | 'seller' | 'neutral' | 'alert';
}

export interface PlayerRankItem {
  id: string;
  broker: string; // "XP", "Ideal", "BTG", "UBS"
  volume: number;
  balance: number; // + ou -
  isBuyer: boolean;
}

export interface ContractDIItem {
  code: string; // DI1F27, DI1F28...
  rate: number; // 13.66
  variation: number; // -0.04
  pointsVariation?: number; // pp
}

export interface PtaxData {
  p1: number | null;
  p2: number | null;
  p3: number | null;
  p4: number | null;
}

export interface Top10Stock {
  ticker: string; // VALE3, ITUB4, PETR4...
  variation: number; // -0.34
  weight: number; // 9.8%
  points: number; // -57
}

export interface OrderBookLevel {
  price: number;
  volume: number;
  isBuy: boolean;
}

export interface CorrelationPoint {
  time: string;
  indiceEwz: number;
  indiceDolar: number;
}

// Estrutura completa do estado do mercado
export interface MarketSnapshot {
  timestamp: number;
  isPaused: boolean;
  statusText: string;

  // Dólar
  dolar: {
    quote: QuoteData;
    dailyFlow: ParticipantFlow[];
    totalDailyFlow: number;
    cumulativeFlow: CumulativeFlowPoint[];
    volatility: VolatilityData;
    flowDelta: FlowDeltaItem[];
    flowForce: FlowForceData;
    aggression: AggressionStatusData;
    recentEvents: MarketEvent[];
    players: PlayerRankItem[];
  };

  // Indicadores Centrais
  center: {
    diContracts: ContractDIItem[];
    diTrendScore: number; // -10 a +10 (ex: -4)
    diTrendState: 'BAIXA' | 'ALTA' | 'NEUTRA';
    ptax: PtaxData;
    ptaxFut: PtaxData;
  };

  // Índice Futuro
  indice: {
    quote: QuoteData;
    dailyFlow: ParticipantFlow[];
    totalDailyFlow: number;
    cumulativeFlow: CumulativeFlowPoint[];
    volatility: VolatilityData;
    flowDelta: FlowDeltaItem[];
    flowForce: FlowForceData;
    aggression: AggressionStatusData;
    recentEvents: MarketEvent[];
    players: PlayerRankItem[];
    top10Ibov: Top10Stock[];
    top10Summary: {
      participationPercent: number; // 54%
      top10Points: number; // +456
      ibovPoints: number; // +788
    };
    diVarPoints: { code: string; varPp: number }[];
    correlation: CorrelationPoint[];
    correlationCurrent: {
      indiceEwz: number;
      indiceDolar: number;
    };
    orderBook: {
      buyLevels: OrderBookLevel[];
      sellLevels: OrderBookLevel[];
      spread: number;
      imbalancePercent: number; // Compra vs Venda
    };
  };
}
