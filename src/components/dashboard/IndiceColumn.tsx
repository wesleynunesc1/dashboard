'use client';

import React, { useState } from 'react';
import { MarketSnapshot } from '@/types/market';
import { formatCurrencyBRL, formatNumberBR, formatSignedNumberBR, formatPercentBR } from '@/utils/formatters';
import { SemiCircleGauge } from '@/components/ui/SemiCircleGauge';
import { CircularProgressIndicator } from '@/components/ui/CircularProgressIndicator';
import { CumulativeFlowChart } from '@/components/charts/CumulativeFlowChart';
import { CorrelationChart } from '@/components/charts/CorrelationChart';
import { ChevronUp, ChevronDown, CheckSquare } from 'lucide-react';

interface Props {
  data: MarketSnapshot['indice'];
}

export const IndiceColumn: React.FC<Props> = ({ data }) => {
  const [viewUnit, setViewUnit] = useState<'RS' | 'CONTRATOS'>('RS');
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const {
    quote,
    dailyFlow,
    cumulativeFlow,
    volatility,
    flowDelta,
    flowForce,
    aggression,
    recentEvents,
    players,
    top10Ibov,
    top10Summary,
    diVarPoints,
    correlation,
    correlationCurrent,
    orderBook,
  } = data;

  const isIndicePositive = quote.variationPoints >= 0;

  // Cálculo para o preenchimento proporcional das barras do Book
  const maxBuyVol = Math.max(...orderBook.buyLevels.map((l) => l.volume), 1);
  const maxSellVol = Math.max(...orderBook.sellLevels.map((l) => l.volume), 1);
  const maxBookVol = Math.max(maxBuyVol, maxSellVol);

  return (
    <div className="flex flex-col space-y-1.5 p-1.5 bg-[#070D17] text-[#F0F4FA] font-sans">
      {/* CABEÇALHO DO ATIVO */}
      <div className="flex items-center justify-between bg-[#0C1626] border border-[#1D3048] px-2.5 py-1 rounded-sm">
        <div className="flex items-center space-x-2">
          {/* Bandeira Brasil */}
          <span className="text-sm select-none" title="Índice Bovespa Futuro">🇧🇷</span>
          <span className="text-[10px] text-[#8191A8] uppercase font-bold tracking-wider">TENDÊNCIA</span>
          <span className="text-[10px] bg-[#16253b] text-[#21D787] px-1.5 py-0.5 rounded font-mono font-bold">
            {quote.trend}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-extrabold tracking-wide text-[#F0F4FA]">
            ÍNDICE <span className="text-[#F3C65A]">— {quote.contractCode} / {quote.ticker}</span>
          </h2>
        </div>
      </div>

      {/* BLOCO SUPERIOR: COTAÇÃO + FLUXO DO DIA */}
      <div className="grid grid-cols-12 gap-1.5">
        {/* COTAÇÃO */}
        <div className="col-span-5 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase tracking-wider">COTAÇÃO</span>
            <span className="text-[9px] font-mono text-[#F3C65A] font-bold">{quote.contractCode}</span>
          </div>
          <div className="my-1">
            <span className="font-mono text-2xl font-black text-[#F0F4FA] tracking-tight">
              {formatNumberBR(quote.price, 0)}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 font-mono text-[11px] font-bold">
            <span className={`flex items-center ${isIndicePositive ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
              {isIndicePositive ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {formatSignedNumberBR(quote.variationPoints, 0)}
            </span>
            <span className={`px-1 rounded text-[10px] ${isIndicePositive ? 'bg-[#21D787]/15 text-[#21D787]' : 'bg-[#FF4D5A]/15 text-[#FF4D5A]'}`}>
              {formatPercentBR(quote.variationPercent, 2)}
            </span>
          </div>
        </div>

        {/* FLUXO DO DIA (R$) */}
        <div className="col-span-7 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between text-[11px]">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase tracking-wider">FLUXO DO DIA (R$)</span>
          </div>
          <div className="space-y-1 font-mono">
            {dailyFlow.map((item) => {
              const isPositive = item.value >= 0;
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      item.type === 'estrangeiro' ? 'bg-[#21D787]' : item.type === 'bancos' ? 'bg-[#42A5F5]' : 'bg-[#FF4D5A]'
                    }`} />
                    <span className="text-[10px] text-[#8191A8] font-sans">{item.name}</span>
                  </div>
                  <span className={`font-semibold text-[10.5px] ${isPositive ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatCurrencyBRL(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BLOCO: FLUXO ACUMULADO + VOLATILIDADE */}
      <div className="grid grid-cols-12 gap-1.5">
        {/* FLUXO ACUMULADO */}
        <div className="col-span-6 bg-[#0C1626] border border-[#1D3048] p-1.5 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase leading-tight">
              FLUXO ACUMULADO DO DIA — ÍNDICE (R$)
            </span>
            <div className="flex items-center space-x-0.5 bg-[#070D17] border border-[#1D3048] rounded p-0.5 text-[8px]">
              <button
                onClick={() => setViewUnit('RS')}
                className={`px-1 rounded ${viewUnit === 'RS' ? 'bg-[#F3C65A] text-black font-bold' : 'text-[#8191A8]'}`}
              >
                R$
              </button>
              <button
                onClick={() => setViewUnit('CONTRATOS')}
                className={`px-1 rounded ${viewUnit === 'CONTRATOS' ? 'bg-[#F3C65A] text-black font-bold' : 'text-[#8191A8]'}`}
              >
                Contratos
              </button>
            </div>
          </div>

          <div className="relative">
            <CumulativeFlowChart data={cumulativeFlow} height={85} />
            <div className="flex items-center justify-between text-[8px] text-[#8191A8] px-1 mt-0.5 pt-0.5 border-t border-[#1D3048]/40">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1 bg-[#21D787]" /> Estrangeiro</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1 bg-[#42A5F5]" /> Bancos</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1 bg-[#FF4D5A]" /> Pessoa Física</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1 px-1 py-0.5 bg-[#070D17] rounded border border-[#1D3048]/50">
            <span className="text-[9px] text-[#8191A8] font-bold uppercase">— Saldo total</span>
            <span className="text-[10px] font-mono font-bold text-[#21D787]">
              R$ 2,4 bi
            </span>
          </div>
        </div>

        {/* VOLATILIDADE — ÍNDICE */}
        <div className="col-span-6 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase tracking-wider mb-1">
            VOLATILIDADE — ÍNDICE
          </span>
          <div className="space-y-1 font-mono text-[10.5px]">
            <div className="flex justify-between items-center">
              <span className="text-[#8191A8] font-sans">Topo do dia</span>
              <span className="text-[#F0F4FA] font-bold">{formatNumberBR(volatility.topOfDay, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8191A8] font-sans">Fundo do dia</span>
              <span className="text-[#F0F4FA] font-bold">{formatNumberBR(volatility.bottomOfDay, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8191A8] font-sans">Volume</span>
              <span className="text-[#F0F4FA] font-bold">{formatNumberBR(volatility.volume, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8191A8] font-sans">Volatilidade</span>
              <span className="text-[#21D787] font-bold">{formatPercentBR(volatility.volatilityPercent, 1)}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5 border-t border-[#1D3048]/50">
              <span className="text-[#8191A8] font-sans">Saldo em tempo real</span>
              <span className={`font-bold ${volatility.realtimeBalance >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                +{formatNumberBR(volatility.realtimeBalance, 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 mt-1 text-[9px] font-mono text-center">
            <div className="bg-[#070D17] border border-[#1D3048] py-0.5 rounded">
              <span className="text-[#8191A8]">INDFUT </span>
              <span className="text-[#F0F4FA] font-bold">{formatNumberBR(volatility.spotPrice, 0)}</span>
            </div>
            <div className="bg-[#070D17] border border-[#1D3048] py-0.5 rounded">
              <span className="text-[#F3C65A] font-bold">{quote.contractCode} </span>
              <span className="text-[#F0F4FA] font-bold">{formatNumberBR(volatility.futPrice, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO: DELTA DE FLUXO + FORÇA DO FLUXO */}
      <div className="grid grid-cols-12 gap-1.5">
        {/* DELTA DE FLUXO (CONTRATOS) */}
        <div className="col-span-6 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1D3048]/60">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">DELTA DE FLUXO — ÍNDICE</span>
            <span className="text-[8px] text-[#8191A8] font-mono">(CONTRATOS)</span>
          </div>
          <table className="w-full text-[9.5px] font-mono">
            <thead>
              <tr className="text-[#8191A8] border-b border-[#1D3048]/40">
                <th className="text-left font-normal pb-0.5">Partic.</th>
                <th className="text-right font-normal pb-0.5">5 min</th>
                <th className="text-right font-normal pb-0.5">15 min</th>
                <th className="text-right font-normal pb-0.5">30 min</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D3048]/30">
              {flowDelta.map((row) => (
                <tr key={row.participant} className="py-0.5">
                  <td className="text-[#8191A8] font-sans py-1 truncate max-w-[50px]">{row.participant}</td>
                  <td className={`text-right font-bold py-1 ${row.m5 >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatSignedNumberBR(row.m5)}
                  </td>
                  <td className={`text-right font-bold py-1 ${row.m15 >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatSignedNumberBR(row.m15)}
                  </td>
                  <td className={`text-right font-bold py-1 ${row.m30 >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatSignedNumberBR(row.m30)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FORÇA DO FLUXO — ÍNDICE */}
        <div className="col-span-6 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1D3048]/60">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">FORÇA DO FLUXO — ÍNDICE</span>
            <span className="text-[9px] font-bold text-[#21D787]">{flowForce.state}</span>
          </div>

          <div className="flex items-center space-x-2">
            <CircularProgressIndicator
              percent={flowForce.gaugePercent}
              color="#21D787"
              textColor="#21D787"
              size={48}
            />
            <div className="flex-1 space-y-1">
              {flowForce.participants.map((p) => {
                const isBuyer = p.direction === 'compra';
                return (
                  <div key={p.name} className="flex items-center justify-between text-[8.5px] font-mono">
                    <span className="text-[#8191A8] font-sans w-16 truncate">{p.name}</span>
                    <div className="w-16 h-2 bg-[#070D17] border border-[#1D3048] rounded-xs overflow-hidden mx-1">
                      <div
                        className={`h-full ${isBuyer ? 'bg-[#21D787]' : 'bg-[#FF4D5A]'}`}
                        style={{ width: `${p.percent}%` }}
                      />
                    </div>
                    <span className="text-[#F0F4FA] font-bold w-6 text-right">{p.percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO: STATUS DA AGRESSÃO + ÚLTIMAS MUDANÇAS */}
      <div className="grid grid-cols-12 gap-1.5">
        {/* STATUS DA AGRESSÃO */}
        <div className="col-span-5 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">STATUS AGRESSÃO</span>
            <span className="text-[8px] font-mono text-[#21D787] border border-[#21D787]/40 px-1 rounded-xs">
              fita lida {aggression.tapeReadPercent}%
            </span>
          </div>
          <div className="py-1">
            <SemiCircleGauge
              score={aggression.score}
              label={aggression.state}
              subLabel={`+${formatNumberBR(aggression.value, 0)}`}
              size={105}
            />
          </div>
        </div>

        {/* ÚLTIMAS MUDANÇAS */}
        <div className="col-span-7 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">ÚLTIMAS MUDANÇAS</span>
          </div>
          <div className="space-y-1 font-mono text-[9px] max-h-[82px] overflow-y-auto pr-1">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-start space-x-1.5 leading-snug">
                <span className="text-[#8191A8] shrink-0">{ev.time}</span>
                <span
                  className={`truncate ${
                    ev.type === 'buyer'
                      ? 'text-[#21D787]'
                      : ev.type === 'seller'
                      ? 'text-[#FF4D5A]'
                      : 'text-[#F0F4FA]'
                  }`}
                >
                  {ev.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BLOCO INFERIOR MULTI-MÓDULO: CORRELAÇÃO, TOP 10 IBOV, DI VAR EM PP, BOOK TOP 15 */}
      <div className="grid grid-cols-12 gap-1.5">
        {/* CORRELAÇÃO */}
        <div className="col-span-4 bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-0.5">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">CORRELAÇÃO</span>
            <div className="flex items-center space-x-1 text-[8px] font-mono">
              <span className="text-[#42A5F5]">EWZ</span>
              <span className="text-[#FF4D5A]">DOL</span>
            </div>
          </div>
          <CorrelationChart data={correlation} height={60} />
          <div className="flex items-center justify-between text-[8px] font-mono pt-1 border-t border-[#1D3048]/40">
            <span className="text-[#42A5F5]">Índice × EWZ: {correlationCurrent.indiceEwz.toFixed(2)}</span>
            <span className="text-[#FF4D5A]">Índice × Dólar: {correlationCurrent.indiceDolar.toFixed(2)}</span>
          </div>
        </div>

        {/* TOP 10 IBOVESPA */}
        <div className="col-span-4 bg-[#0C1626] border border-[#1D3048] p-1.5 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-0.5 border-b border-[#1D3048]/50 mb-0.5">
            <span className="text-[8.5px] font-bold text-[#8191A8] uppercase">TOP 10 IBOVESPA</span>
            <span className="text-[7.5px] font-mono text-[#21D787]">ao vivo</span>
          </div>
          <div className="max-h-[68px] overflow-y-auto space-y-0.5 text-[8px] font-mono pr-0.5">
            <div className="flex justify-between text-[#8191A8] pb-0.5 border-b border-[#1D3048]/30">
              <span>Ativo</span>
              <span>Var.</span>
              <span>Peso</span>
              <span>Pts</span>
            </div>
            {top10Ibov.map((stock) => {
              const isPos = stock.variation >= 0;
              return (
                <div key={stock.ticker} className="flex justify-between items-center py-0.5">
                  <span className="text-[#8191A8] font-bold">{stock.ticker}</span>
                  <span className={isPos ? 'text-[#21D787]' : 'text-[#FF4D5A]'}>
                    {formatSignedNumberBR(stock.variation, 2)}%
                  </span>
                  <span className="text-[#8191A8]">{stock.weight.toFixed(1)}%</span>
                  <span className={`font-bold ${isPos ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatSignedNumberBR(stock.points, 0)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[7.5px] font-mono text-center pt-0.5 border-t border-[#1D3048]/40 text-[#21D787]">
            Top 10 ({top10Summary.participationPercent}%): +{top10Summary.top10Points} pts | IBOV +{top10Summary.ibovPoints} pts
          </div>
        </div>

        {/* BOOK TOP 15 PROFISSIONAL COM BARRAS DE PROFUNDIDADE */}
        <div className="col-span-4 bg-[#0C1626] border border-[#1D3048] p-1.5 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-0.5 border-b border-[#1D3048]/50 mb-0.5">
            <span className="text-[8px] font-bold text-[#8191A8] uppercase truncate">
              BOOK TOP 15 — {quote.contractCode}
            </span>
            <span className="text-[7px] font-mono text-[#F3C65A]">Spread: {orderBook.spread}</span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[7px] font-mono max-h-[75px] overflow-y-auto pr-0.5">
            {/* Lado da Compra (Bid) */}
            <div className="space-y-0.5">
              <div className="text-[7px] text-[#21D787] font-bold border-b border-[#1D3048]/40 pb-0.5 flex justify-between">
                <span>COMPRA</span>
                <span>QTD</span>
              </div>
              {orderBook.buyLevels.slice(0, 15).map((l, idx) => {
                const barWidth = Math.round((l.volume / maxBookVol) * 100);
                return (
                  <div key={idx} className="relative flex justify-between items-center px-1 py-0.5 rounded-xs overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#21D787]/15 pointer-events-none"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative z-10 text-[#21D787] font-bold">{l.price}</span>
                    <span className="relative z-10 text-[#F0F4FA]">{l.volume}</span>
                  </div>
                );
              })}
            </div>

            {/* Lado da Venda (Ask) */}
            <div className="space-y-0.5">
              <div className="text-[7px] text-[#FF4D5A] font-bold border-b border-[#1D3048]/40 pb-0.5 flex justify-between">
                <span>VENDA</span>
                <span>QTD</span>
              </div>
              {orderBook.sellLevels.slice(0, 15).map((l, idx) => {
                const barWidth = Math.round((l.volume / maxBookVol) * 100);
                return (
                  <div key={idx} className="relative flex justify-between items-center px-1 py-0.5 rounded-xs overflow-hidden">
                    <div
                      className="absolute inset-y-0 right-0 bg-[#FF4D5A]/15 pointer-events-none"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative z-10 text-[#FF4D5A] font-bold">{l.price}</span>
                    <span className="relative z-10 text-[#F0F4FA]">{l.volume}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[7px] font-mono text-center pt-0.5 border-t border-[#1D3048]/40 text-[#8191A8] flex justify-between">
            <span>Imbalance: {orderBook.imbalancePercent}% Comprador</span>
            <span className="text-[#21D787]">Profundidade N15</span>
          </div>
        </div>
      </div>

      {/* BLOCO INFERIOR: PLAYERS E CORRETORAS DO ÍNDICE */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">
            PLAYERS — ÍNDICE ({quote.contractCode}) <span className="font-mono text-[#8191A8]">(CONTRATOS)</span>
          </span>
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className="flex items-center space-x-1 text-[8px] text-[#8191A8] hover:text-[#F0F4FA]"
          >
            <CheckSquare className="w-2.5 h-2.5 text-[#21D787]" />
            <span>Automático</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
          {/* Compradores */}
          <div className="space-y-0.5">
            <div className="text-[8px] text-[#21D787] font-bold border-b border-[#1D3048]/30 pb-0.5">
              MAIORES COMPRADORES
            </div>
            {players.filter(p => p.isBuyer).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-0.5">
                <span className="text-[#8191A8] truncate max-w-[85px]">{p.broker}</span>
                <span className="text-[#21D787] font-bold">+{formatNumberBR(p.balance)}</span>
              </div>
            ))}
          </div>

          {/* Vendedores */}
          <div className="space-y-0.5">
            <div className="text-[8px] text-[#FF4D5A] font-bold border-b border-[#1D3048]/30 pb-0.5">
              MAIORES VENDEDORES
            </div>
            {players.filter(p => !p.isBuyer).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-0.5">
                <span className="text-[#8191A8] truncate max-w-[85px]">{p.broker}</span>
                <span className="text-[#FF4D5A] font-bold">{formatNumberBR(p.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
