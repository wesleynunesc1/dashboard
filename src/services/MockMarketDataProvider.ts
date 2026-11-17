// src/services/MockMarketDataProvider.ts
import { MarketDataProvider } from './MarketDataProvider';
import { MarketSnapshot, CumulativeFlowPoint, CorrelationPoint, OrderBookLevel } from '@/types/market';

export class MockMarketDataProvider implements MarketDataProvider {
  private listeners: Set<(snapshot: MarketSnapshot) => void> = new Set();
  private timer: NodeJS.Timeout | null = null;
  private isPaused = false;
  private tickCount = 0;
  private currentSnapshot: MarketSnapshot;

  constructor() {
    this.currentSnapshot = this.generateInitialSnapshot();
  }

  private generateInitialSnapshot(): MarketSnapshot {
    const cumulativeDolar: CumulativeFlowPoint[] = [
      { time: '09:00', estrangeiro: 0.1, bancos: -0.05, pessoaFisica: -0.05, total: 0.0 },
      { time: '09:30', estrangeiro: 0.35, bancos: 0.12, pessoaFisica: -0.3, total: 0.17 },
      { time: '10:00', estrangeiro: 0.65, bancos: 0.25, pessoaFisica: -0.55, total: 0.35 },
      { time: '10:30', estrangeiro: 0.82, bancos: 0.31, pessoaFisica: -0.72, total: 0.41 },
      { time: '11:00', estrangeiro: 1.05, bancos: 0.42, pessoaFisica: -0.89, total: 1.2 },
      { time: '11:30', estrangeiro: 1.148, bancos: 0.499, pessoaFisica: -0.995, total: 1.4 },
    ];

    const cumulativeIndice: CumulativeFlowPoint[] = [
      { time: '09:00', estrangeiro: 0.15, bancos: -0.1, pessoaFisica: -0.05, total: 0.0 },
      { time: '09:30', estrangeiro: 0.42, bancos: -0.18, pessoaFisica: -0.15, total: 0.5 },
      { time: '10:00', estrangeiro: 0.71, bancos: -0.22, pessoaFisica: -0.24, total: 1.1 },
      { time: '10:30', estrangeiro: 0.85, bancos: -0.24, pessoaFisica: -0.31, total: 1.7 },
      { time: '11:00', estrangeiro: 0.87, bancos: -0.25, pessoaFisica: -0.33, total: 2.1 },
      { time: '11:30', estrangeiro: 0.888, bancos: -0.253, pessoaFisica: -0.338, total: 2.4 },
    ];

    const correlationHistory: CorrelationPoint[] = [
      { time: '10:00', indiceEwz: 0.42, indiceDolar: -0.35 },
      { time: '10:15', indiceEwz: 0.68, indiceDolar: -0.48 },
      { time: '10:30', indiceEwz: 0.75, indiceDolar: -0.52 },
      { time: '10:45', indiceEwz: 0.89, indiceDolar: -0.61 },
      { time: '11:00', indiceEwz: 0.82, indiceDolar: -0.58 },
      { time: '11:15', indiceEwz: 0.94, indiceDolar: -0.65 },
      { time: '11:30', indiceEwz: 0.86, indiceDolar: -0.53 },
    ];

    // Book Top 15 níveis de compra
    const buyLevels15: OrderBookLevel[] = Array.from({ length: 15 }, (_, i) => ({
      price: 173820 - i * 5,
      volume: Math.round(300 + Math.random() * 1400 + i * 50),
      isBuy: true,
    }));

    // Book Top 15 níveis de venda
    const sellLevels15: OrderBookLevel[] = Array.from({ length: 15 }, (_, i) => ({
      price: 173825 + i * 5,
      volume: Math.round(320 + Math.random() * 1500 + i * 60),
      isBuy: false,
    }));

    return {
      timestamp: Date.now(),
      isPaused: false,
      statusText: 'MODO DEMONSTRAÇÃO — DADOS SIMULADOS',
      dolar: {
        quote: {
          symbol: 'DÓLAR',
          ticker: 'WDOFUT',
          name: 'Dólar Futuro Mini',
          price: 5667.5,
          variationPoints: 7.4,
          variationPercent: 0.13,
          trend: 'LATERAL',
          contractCode: 'WDOF27',
          lastUpdate: '11:38:22',
        },
        dailyFlow: [
          { name: 'Estrangeiro', type: 'estrangeiro', value: 1148658013 },
          { name: 'Bancos', type: 'bancos', value: 499291624 },
          { name: 'Pessoa Física', type: 'pessoaFisica', value: -995319585 },
        ],
        totalDailyFlow: 1400000000,
        cumulativeFlow: cumulativeDolar,
        volatility: {
          topOfDay: 5683.5,
          bottomOfDay: 5652.0,
          volume: 1205883,
          volatilityPercent: 14.8,
          realtimeBalance: 24760,
          spotSymbol: 'DOLFUT',
          spotPrice: 5667.5,
          futSymbol: 'WDOFUT',
          futPrice: 5667.5,
        },
        flowDelta: [
          { participant: 'Estrangeiro', type: 'estrangeiro', m5: -1253, m15: 2754, m30: 7470 },
          { participant: 'Bancos', type: 'bancos', m5: 1212, m15: 2156, m30: 970 },
          { participant: 'Pessoa Física', type: 'pessoaFisica', m5: 398, m15: -5022, m30: 630 },
        ],
        flowForce: {
          state: 'VENDEDORA',
          gaugePercent: 44,
          participants: [
            { name: 'Estrangeiro', type: 'estrangeiro', percent: 63, direction: 'compra' },
            { name: 'Bancos', type: 'bancos', percent: 41, direction: 'venda' },
            { name: 'Pessoa Física', type: 'pessoaFisica', percent: 41, direction: 'venda' },
            { name: 'Agressão', type: 'agressao', percent: 44, direction: 'venda' },
          ],
        },
        aggression: {
          state: 'COMPRADORA',
          score: 65,
          value: 24760,
          tapeReadPercent: 98,
        },
        recentEvents: [
          { id: '1', time: '11:38', text: 'XP comprando contra o saldo do dia', type: 'buyer' },
          { id: '2', time: '11:31', text: 'Ideal comprando contra o saldo do dia', type: 'buyer' },
          { id: '3', time: '11:20', text: 'Estrangeiro aumentou compra', type: 'buyer' },
          { id: '4', time: '11:18', text: 'Agressão vendedora acelerando', type: 'seller' },
          { id: '5', time: '11:10', text: 'Bancos renovando contratos na máxima', type: 'neutral' },
        ],
        players: [
          { id: 'p1', broker: 'BTG Pactual', volume: 148200, balance: 18325, isBuyer: true },
          { id: 'p2', broker: 'XP Investimentos', volume: 195400, balance: 14210, isBuyer: true },
          { id: 'p3', broker: 'Ideal CTVM', volume: 98700, balance: 8950, isBuyer: true },
          { id: 'p4', broker: 'UBS Brasil', volume: 165000, balance: -12400, isBuyer: false },
          { id: 'p5', broker: 'Santander', volume: 84300, balance: -9800, isBuyer: false },
          { id: 'p6', broker: 'J.P. Morgan', volume: 112000, balance: -7450, isBuyer: false },
        ],
      },
      center: {
        diContracts: [
          { code: 'DI1F27', rate: 13.66, variation: 0.00 },
          { code: 'DI1F28', rate: 14.29, variation: -0.50 },
          { code: 'DI1F29', rate: 14.72, variation: -2.00 },
          { code: 'DI1F30', rate: 14.93, variation: -4.00 },
          { code: 'DI1F31', rate: 15.03, variation: -6.20 },
          { code: 'DI1F32', rate: 15.12, variation: -6.70 },
          { code: 'DI1F33', rate: 15.17, variation: -6.40 },
          { code: 'DI1F34', rate: 15.18, variation: -7.40 },
          { code: 'DI1F35', rate: 15.18, variation: -6.90 },
          { code: 'DI1F36', rate: 15.20, variation: -1.50 },
        ],
        diTrendScore: -4,
        diTrendState: 'BAIXA',
        ptax: {
          p1: 5664.90,
          p2: 5662.90,
          p3: null,
          p4: null,
        },
        ptaxFut: {
          p1: 5681.00,
          p2: 5679.00,
          p3: null,
          p4: null,
        },
      },
      indice: {
        quote: {
          symbol: 'ÍNDICE',
          ticker: 'WINZ26', // Contrato atual WINZ26 / WINFUT
          name: 'Ibovespa Mini Futuro WINZ26',
          price: 173820,
          variationPoints: 1037,
          variationPercent: 0.60,
          trend: 'LATERAL',
          contractCode: 'WINZ26',
          lastUpdate: '11:38:22',
        },
        dailyFlow: [
          { name: 'Estrangeiro', type: 'estrangeiro', value: 888424483 },
          { name: 'Bancos', type: 'bancos', value: -253686496 },
          { name: 'Pessoa Física', type: 'pessoaFisica', value: -338061401 },
        ],
        totalDailyFlow: 2400000000,
        cumulativeFlow: cumulativeIndice,
        volatility: {
          topOfDay: 173980,
          bottomOfDay: 172495,
          volume: 7746600,
          volatilityPercent: 18.0,
          realtimeBalance: 68000,
          spotSymbol: 'INDFUT',
          spotPrice: 173800,
          futSymbol: 'WINZ26',
          futPrice: 173820,
        },
        flowDelta: [
          { participant: 'Estrangeiro', type: 'estrangeiro', m5: 5021, m15: 24268, m30: 8003 },
          { participant: 'Bancos', type: 'bancos', m5: -2385, m15: -10015, m30: -6784 },
          { participant: 'Pessoa Física', type: 'pessoaFisica', m5: -5064, m15: -11155, m30: 871 },
        ],
        flowForce: {
          state: 'EQUILIBRADA',
          gaugePercent: 50,
          participants: [
            { name: 'Estrangeiro', type: 'estrangeiro', percent: 52, direction: 'compra' },
            { name: 'Bancos', type: 'bancos', percent: 50, direction: 'venda' },
            { name: 'Pessoa Física', type: 'pessoaFisica', percent: 51, direction: 'compra' },
            { name: 'Agressão', type: 'agressao', percent: 50, direction: 'compra' },
          ],
        },
        aggression: {
          state: 'NEUTRA',
          score: 10,
          value: 68000,
          tapeReadPercent: 98,
        },
        recentEvents: [
          { id: '1', time: '11:34', text: 'Agressão compradora acelerando', type: 'buyer' },
          { id: '2', time: '11:25', text: 'XP comprando contra o saldo do dia', type: 'buyer' },
          { id: '3', time: '11:24', text: 'Ideal comprando contra o saldo do dia', type: 'buyer' },
          { id: '4', time: '11:18', text: 'Agressão vendedora desacelerando', type: 'seller' },
          { id: '5', time: '11:15', text: 'Estrangeiro absorvendo venda na região 173.500', type: 'neutral' },
        ],
        players: [
          { id: 'p1', broker: 'Goldman Sachs', volume: 384000, balance: 42100, isBuyer: true },
          { id: 'p2', broker: 'BTG Pactual', volume: 312000, balance: 25400, isBuyer: true },
          { id: 'p3', broker: 'Morgan Stanley', volume: 290000, balance: 18900, isBuyer: true },
          { id: 'p4', broker: 'Bradesco', volume: 240000, balance: -31200, isBuyer: false },
          { id: 'p5', broker: 'Genial Invest', volume: 198000, balance: -22400, isBuyer: false },
          { id: 'p6', broker: 'Clear', volume: 175000, balance: -15600, isBuyer: false },
        ],
        top10Ibov: [
          { ticker: 'VALE3', variation: -0.34, weight: 9.8, points: -57 },
          { ticker: 'ITUB4', variation: 0.79, weight: 9.3, points: 126 },
          { ticker: 'PETR4', variation: 0.78, weight: 8.2, points: 110 },
          { ticker: 'PETR3', variation: 1.09, weight: 5.2, points: 97 },
          { ticker: 'AXIA3', variation: 3.26, weight: 4.5, points: 252 },
          { ticker: 'SBSP3', variation: 0.00, weight: 4.0, points: 0 },
          { ticker: 'ITSA4', variation: 0.51, weight: 3.4, points: 30 },
          { ticker: 'EMBJ3', variation: -1.66, weight: 3.4, points: -96 },
          { ticker: 'WEGE3', variation: -0.46, weight: 3.2, points: -25 },
          { ticker: 'B3SA3', variation: 0.88, weight: 3.1, points: 46 },
        ],
        top10Summary: {
          participationPercent: 54,
          top10Points: 456,
          ibovPoints: 788,
        },
        diVarPoints: [
          { code: 'F27', varPp: 0.00 },
          { code: 'F28', varPp: 0.01 },
          { code: 'F29', varPp: -0.02 },
          { code: 'F30', varPp: -0.04 },
          { code: 'F31', varPp: -0.06 },
          { code: 'F32', varPp: -0.07 },
          { code: 'F33', varPp: -0.06 },
          { code: 'F34', varPp: -0.07 },
          { code: 'F35', varPp: -0.07 },
          { code: 'F36', varPp: -0.02 },
        ],
        correlation: correlationHistory,
        correlationCurrent: {
          indiceEwz: 0.86,
          indiceDolar: -0.53,
        },
        orderBook: {
          spread: 5,
          imbalancePercent: 52,
          buyLevels: buyLevels15,
          sellLevels: sellLevels15,
        },
      },
    };
  }

  async connect(): Promise<void> {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 1000);
  }

  async disconnect(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(callback: (snapshot: MarketSnapshot) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentSnapshot);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getCurrentSnapshot(): MarketSnapshot {
    return this.currentSnapshot;
  }

  pause(): void {
    this.isPaused = true;
    this.currentSnapshot = {
      ...this.currentSnapshot,
      isPaused: true,
    };
    this.notify();
  }

  resume(): void {
    this.isPaused = false;
    this.currentSnapshot = {
      ...this.currentSnapshot,
      isPaused: false,
    };
    this.notify();
  }

  reset(): void {
    this.tickCount = 0;
    this.currentSnapshot = this.generateInitialSnapshot();
    this.notify();
  }

  private tick(): void {
    this.tickCount++;
    const snap = this.currentSnapshot;

    const dPriceNoise = (Math.sin(this.tickCount * 0.3) * 0.5 + (Math.random() - 0.5) * 0.2);
    const roundedDolarNoise = Math.round(dPriceNoise * 2) / 2;
    const newDolarPrice = +(snap.dolar.quote.price + roundedDolarNoise).toFixed(1);
    const newDolarPts = +(snap.dolar.quote.variationPoints + roundedDolarNoise).toFixed(1);
    const newDolarPct = +((newDolarPts / 5660) * 100).toFixed(2);

    const iPriceNoise = Math.round((Math.cos(this.tickCount * 0.25) * 15 + (Math.random() - 0.5) * 10) / 5) * 5;
    const newIndicePrice = snap.indice.quote.price + iPriceNoise;
    const newIndicePts = snap.indice.quote.variationPoints + iPriceNoise;
    const newIndicePct = +((newIndicePts / 172783) * 100).toFixed(2);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const dolarBalanceDelta = Math.round((Math.random() - 0.48) * 120);
    const indiceBalanceDelta = Math.round((Math.random() - 0.46) * 250);

    // Book Top 15 dinâmico
    const updatedBuy15 = snap.indice.orderBook.buyLevels.map((l, idx) => ({
      price: newIndicePrice - idx * 5,
      volume: Math.max(100, l.volume + Math.round((Math.random() - 0.48) * 50)),
      isBuy: true,
    }));

    const updatedSell15 = snap.indice.orderBook.sellLevels.map((l, idx) => ({
      price: newIndicePrice + 5 + idx * 5,
      volume: Math.max(100, l.volume + Math.round((Math.random() - 0.48) * 50)),
      isBuy: false,
    }));

    const updatedDolar = {
      ...snap.dolar,
      quote: {
        ...snap.dolar.quote,
        price: newDolarPrice,
        variationPoints: newDolarPts,
        variationPercent: newDolarPct,
        lastUpdate: timeStr,
      },
      volatility: {
        ...snap.dolar.volatility,
        topOfDay: Math.max(snap.dolar.volatility.topOfDay, newDolarPrice),
        bottomOfDay: Math.min(snap.dolar.volatility.bottomOfDay, newDolarPrice),
        volume: snap.dolar.volatility.volume + Math.floor(Math.random() * 45),
        realtimeBalance: snap.dolar.volatility.realtimeBalance + dolarBalanceDelta,
        spotPrice: newDolarPrice,
        futPrice: newDolarPrice,
      },
      aggression: {
        ...snap.dolar.aggression,
        value: snap.dolar.aggression.value + dolarBalanceDelta,
        score: Math.min(95, Math.max(-95, snap.dolar.aggression.score + Math.round((Math.random() - 0.5) * 4))),
      },
    };

    const updatedIndice = {
      ...snap.indice,
      quote: {
        ...snap.indice.quote,
        price: newIndicePrice,
        variationPoints: newIndicePts,
        variationPercent: newIndicePct,
        lastUpdate: timeStr,
      },
      volatility: {
        ...snap.indice.volatility,
        topOfDay: Math.max(snap.indice.volatility.topOfDay, newIndicePrice),
        bottomOfDay: Math.min(snap.indice.volatility.bottomOfDay, newIndicePrice),
        volume: snap.indice.volatility.volume + Math.floor(Math.random() * 120),
        realtimeBalance: snap.indice.volatility.realtimeBalance + indiceBalanceDelta,
        spotPrice: newIndicePrice - 20,
        futPrice: newIndicePrice,
      },
      aggression: {
        ...snap.indice.aggression,
        value: snap.indice.aggression.value + indiceBalanceDelta,
        score: Math.min(95, Math.max(-95, snap.indice.aggression.score + Math.round((Math.random() - 0.5) * 6))),
      },
      orderBook: {
        ...snap.indice.orderBook,
        buyLevels: updatedBuy15,
        sellLevels: updatedSell15,
      },
    };

    this.currentSnapshot = {
      ...snap,
      timestamp: Date.now(),
      dolar: updatedDolar,
      indice: updatedIndice,
    };

    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentSnapshot);
    }
  }
}

export const marketService: MarketDataProvider = new MockMarketDataProvider();
