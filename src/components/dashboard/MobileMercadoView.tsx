'use client';

import React from 'react';
import { MarketSnapshot } from '@/types/market';
import { formatNumberBR, formatSignedNumberBR } from '@/utils/formatters';
import { SemiCircleGauge } from '@/components/ui/SemiCircleGauge';
import { CorrelationChart } from '@/components/charts/CorrelationChart';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  center: MarketSnapshot['center'];
  indice: MarketSnapshot['indice'];
}

export const MobileMercadoView: React.FC<Props> = ({ center, indice }) => {
  const { diContracts, diTrendScore, ptax, ptaxFut } = center;
  const { top10Ibov, top10Summary, correlation, correlationCurrent, diVarPoints, orderBook } = indice;

  return (
    <div className="space-y-2 pb-16 pt-1 select-none">
      {/* 1. TENDÊNCIA DI (MEDIDOR) */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2.5 rounded-sm flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9.5px] font-bold text-[#8191A8] uppercase tracking-wider">TENDÊNCIA DOS JUROS DI</span>
          <div className="flex items-center space-x-1 text-[10px] font-mono font-bold">
            <span className={diTrendScore < 0 ? 'text-[#FF4D5A]' : 'text-[#21D787]'}>{diTrendScore}</span>
            {diTrendScore < 0 ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-[#FF4D5A]" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-[#21D787]" />
            )}
          </div>
        </div>

        <div className="py-1">
          <SemiCircleGauge
            score={diTrendScore}
            min={-10}
            max={10}
            size={110}
            label={diTrendScore < 0 ? 'BAIXA' : diTrendScore > 0 ? 'ALTA' : 'NEUTRA'}
          />
        </div>
      </div>

      {/* 2. PTAX SPOT & PTAX FUTURA (DUAS COLUNAS LADO A LADO) */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* PTAX */}
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/60 mb-1.5">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">PTAX SPOT</span>
            <span className="text-[7.5px] font-mono text-[#8191A8]">BC</span>
          </div>
          <div className="space-y-1 font-mono text-[9.5px]">
            <div className="flex justify-between">
              <span className="text-[#8191A8]">P1:</span>
              <span className="text-[#F0F4FA] font-bold">{ptax.p1 ? formatNumberBR(ptax.p1, 2) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">P2:</span>
              <span className="text-[#F0F4FA] font-bold">{ptax.p2 ? formatNumberBR(ptax.p2, 2) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">P3:</span>
              <span className="text-[#8191A8] font-bold">{ptax.p3 ? formatNumberBR(ptax.p3, 2) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">P4:</span>
              <span className="text-[#8191A8] font-bold">{ptax.p4 ? formatNumberBR(ptax.p4, 2) : '—'}</span>
            </div>
          </div>
        </div>

        {/* PTAX FUTURA */}
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/60 mb-1.5">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">PTAX FUTURA</span>
            <span className="text-[7.5px] font-mono text-[#8191A8]">FUT</span>
          </div>
          <div className="space-y-1 font-mono text-[9.5px]">
            <div className="flex justify-between">
              <span className="text-[#8191A8]">FUT P1:</span>
              <span className="text-[#F0F4FA] font-bold">{ptaxFut.p1 ? formatNumberBR(ptaxFut.p1, 2) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">FUT P2:</span>
              <span className="text-[#F0F4FA] font-bold">{ptaxFut.p2 ? formatNumberBR(ptaxFut.p2, 2) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">FUT P3:</span>
              <span className="text-[#8191A8] font-bold">{ptaxFut.p3 ? formatNumberBR(ptaxFut.p3, 2) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">FUT P4:</span>
              <span className="text-[#8191A8] font-bold">{ptaxFut.p4 ? formatNumberBR(ptaxFut.p4, 2) : '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CORRELAÇÃO ÍNDICE × EWZ & DÓLAR */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">CORRELAÇÃO (INTRADIÁRIA)</span>
          <div className="flex items-center space-x-2 text-[8px] font-mono">
            <span className="text-[#42A5F5]">● EWZ</span>
            <span className="text-[#FF4D5A]">● DÓLAR</span>
          </div>
        </div>
        <CorrelationChart data={correlation} height={75} />
        <div className="flex items-center justify-between text-[8px] font-mono pt-1 border-t border-[#1D3048]/40">
          <span className="text-[#42A5F5]">Índice × EWZ: {correlationCurrent.indiceEwz.toFixed(2)}</span>
          <span className="text-[#FF4D5A]">Índice × Dólar: {correlationCurrent.indiceDolar.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. TOP 10 IBOVESPA */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">TOP 10 IBOVESPA</span>
          <span className="text-[8px] font-mono text-[#21D787]">ao vivo</span>
        </div>
        <div className="space-y-0.5 text-[8.5px] font-mono">
          <div className="flex justify-between text-[#8191A8] pb-0.5 border-b border-[#1D3048]/30">
            <span className="w-14">Ativo</span>
            <span className="w-14 text-right">Var %</span>
            <span className="w-12 text-right">Peso</span>
            <span className="w-12 text-right">Pts</span>
          </div>
          {top10Ibov.map((stock) => {
            const isPos = stock.variation >= 0;
            return (
              <div key={stock.ticker} className="flex justify-between items-center py-0.5">
                <span className="text-[#F0F4FA] font-bold w-14">{stock.ticker}</span>
                <span className={`w-14 text-right ${isPos ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                  {formatSignedNumberBR(stock.variation, 2)}%
                </span>
                <span className="text-[#8191A8] w-12 text-right">{stock.weight.toFixed(1)}%</span>
                <span className={`font-bold w-12 text-right ${isPos ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                  {formatSignedNumberBR(stock.points, 0)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="text-[8px] font-mono text-center pt-1 mt-1 border-t border-[#1D3048]/40 text-[#21D787]">
          Top 10 ({top10Summary.participationPercent}% peso): +{top10Summary.top10Points} pts | IBOV +{top10Summary.ibovPoints} pts
        </div>
      </div>

      {/* 5. TABELA JUROS DI COMPLETA */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/60 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">CURVA DE JUROS DI (B3)</span>
          <span className="text-[8px] font-mono text-[#8191A8]">TAXAS &amp; VAR</span>
        </div>
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="text-[#8191A8] border-b border-[#1D3048]/40">
              <th className="text-left font-normal pb-0.5">Venc.</th>
              <th className="text-right font-normal pb-0.5">Taxa (%)</th>
              <th className="text-right font-normal pb-0.5">Var. (pts)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3048]/20">
            {diContracts.map((di) => {
              const isVarPos = di.variation > 0;
              const isVarNeg = di.variation < 0;
              return (
                <tr key={di.code}>
                  <td className="text-[#8191A8] py-0.5 font-medium">{di.code}</td>
                  <td className="text-right font-bold text-[#F0F4FA] py-0.5">{formatNumberBR(di.rate, 2)}%</td>
                  <td className={`text-right font-bold py-0.5 ${isVarPos ? 'text-[#21D787]' : isVarNeg ? 'text-[#FF4D5A]' : 'text-[#8191A8]'}`}>
                    {di.variation === 0 ? '0,00' : formatSignedNumberBR(di.variation, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
