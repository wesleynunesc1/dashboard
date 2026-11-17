'use client';

import React from 'react';
import { MarketSnapshot } from '@/types/market';
import { formatNumberBR, formatCurrencyBRL, formatSignedNumberBR } from '@/utils/formatters';
import { SemiCircleGauge } from '@/components/ui/SemiCircleGauge';
import { CircularProgressIndicator } from '@/components/ui/CircularProgressIndicator';

interface Props {
  dolar: MarketSnapshot['dolar'];
  indice: MarketSnapshot['indice'];
}

export const MobileFluxoView: React.FC<Props> = ({ dolar, indice }) => {
  return (
    <div className="space-y-2 pb-16 pt-1 select-none">
      {/* 1. AGRESSÃO COMPARADA: DÓLAR VS ÍNDICE */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2.5 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-2">
          <span className="text-[9.5px] font-bold text-[#8191A8] uppercase tracking-wider">
            STATUS DA AGRESSÃO INSTITUCIONAL
          </span>
          <span className="text-[8px] font-mono text-[#21D787]">TEMPO REAL</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Dólar */}
          <div className="flex flex-col items-center bg-[#070D17] p-2 rounded border border-[#1D3048]/50">
            <div className="text-[9px] font-bold text-[#F3C65A] mb-1">DÓLAR — WDOFUT</div>
            <SemiCircleGauge
              score={dolar.aggression.score}
              label={dolar.aggression.state}
              subLabel={formatSignedNumberBR(dolar.aggression.value, 0)}
              size={95}
            />
            <span className="text-[7.5px] font-mono text-[#8191A8] mt-1">
              Fita Lida: {dolar.aggression.tapeReadPercent}%
            </span>
          </div>

          {/* Índice */}
          <div className="flex flex-col items-center bg-[#070D17] p-2 rounded border border-[#1D3048]/50">
            <div className="text-[9px] font-bold text-[#42A5F5] mb-1">ÍNDICE — WINFUT</div>
            <SemiCircleGauge
              score={indice.aggression.score}
              label={indice.aggression.state}
              subLabel={`+${formatNumberBR(indice.aggression.value, 0)}`}
              size={95}
            />
            <span className="text-[7.5px] font-mono text-[#8191A8] mt-1">
              Fita Lida: {indice.aggression.tapeReadPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. FORÇA DO FLUXO (DÓLAR E ÍNDICE) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
            <span className="text-[8.5px] font-bold text-[#8191A8] uppercase">FORÇA DÓLAR</span>
            <span className="text-[8.5px] font-bold text-[#FF4D5A]">{dolar.flowForce.state}</span>
          </div>
          <div className="flex items-center space-x-1.5 my-auto">
            <CircularProgressIndicator
              percent={dolar.flowForce.gaugePercent}
              color="#FF4D5A"
              textColor="#FF4D5A"
              size={40}
            />
            <div className="flex-1 space-y-0.5">
              {dolar.flowForce.participants.slice(0, 3).map((p) => (
                <div key={p.name} className="flex items-center justify-between text-[7px] font-mono">
                  <span className="text-[#8191A8] truncate max-w-[36px]">{p.name}</span>
                  <span className={p.direction === 'compra' ? 'text-[#21D787]' : 'text-[#FF4D5A]'}>
                    {p.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
            <span className="text-[8.5px] font-bold text-[#8191A8] uppercase">FORÇA ÍNDICE</span>
            <span className="text-[8.5px] font-bold text-[#21D787]">{indice.flowForce.state}</span>
          </div>
          <div className="flex items-center space-x-1.5 my-auto">
            <CircularProgressIndicator
              percent={indice.flowForce.gaugePercent}
              color="#21D787"
              textColor="#21D787"
              size={40}
            />
            <div className="flex-1 space-y-0.5">
              {indice.flowForce.participants.slice(0, 3).map((p) => (
                <div key={p.name} className="flex items-center justify-between text-[7px] font-mono">
                  <span className="text-[#8191A8] truncate max-w-[36px]">{p.name}</span>
                  <span className={p.direction === 'compra' ? 'text-[#21D787]' : 'text-[#FF4D5A]'}>
                    {p.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FLUXO POR PARTICIPANTE: ESTRANGEIROS, BANCOS, PESSOA FÍSICA */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1.5">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">
            FLUXO DIÁRIO POR PARTICIPANTE (R$)
          </span>
        </div>
        <div className="space-y-2 font-mono text-[9px]">
          {/* Dólar */}
          <div>
            <span className="text-[8px] text-[#F3C65A] font-bold block mb-0.5">DÓLAR (WDOFUT)</span>
            <div className="grid grid-cols-3 gap-1">
              {dolar.dailyFlow.map((p) => (
                <div key={p.name} className="bg-[#070D17] p-1 rounded border border-[#1D3048]/40">
                  <div className="text-[7.5px] text-[#8191A8] truncate">{p.name}</div>
                  <div className={`font-bold text-[8.5px] ${p.value >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatCurrencyBRL(p.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Índice */}
          <div className="pt-1 border-t border-[#1D3048]/30">
            <span className="text-[8px] text-[#42A5F5] font-bold block mb-0.5">ÍNDICE (WINFUT)</span>
            <div className="grid grid-cols-3 gap-1">
              {indice.dailyFlow.map((p) => (
                <div key={p.name} className="bg-[#070D17] p-1 rounded border border-[#1D3048]/40">
                  <div className="text-[7.5px] text-[#8191A8] truncate">{p.name}</div>
                  <div className={`font-bold text-[8.5px] ${p.value >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                    {formatCurrencyBRL(p.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PLAYERS E CORRETORAS COMPARATIVO */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">TOP PLAYERS DO MERCADO</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
          {/* Dólar */}
          <div>
            <span className="text-[#F3C65A] font-bold block pb-0.5 border-b border-[#1D3048]/30">DÓLAR</span>
            <div className="space-y-0.5 mt-1">
              {dolar.players.slice(0, 4).map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span className="text-[#8191A8] truncate max-w-[65px]">{p.broker}</span>
                  <span className={p.isBuyer ? 'text-[#21D787]' : 'text-[#FF4D5A]'}>
                    {p.isBuyer ? '+' : ''}{formatNumberBR(p.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Índice */}
          <div>
            <span className="text-[#42A5F5] font-bold block pb-0.5 border-b border-[#1D3048]/30">ÍNDICE</span>
            <div className="space-y-0.5 mt-1">
              {indice.players.slice(0, 4).map((p) => (
                <div key={p.id} className="flex justify-between">
                  <span className="text-[#8191A8] truncate max-w-[65px]">{p.broker}</span>
                  <span className={p.isBuyer ? 'text-[#21D787]' : 'text-[#FF4D5A]'}>
                    {p.isBuyer ? '+' : ''}{formatNumberBR(p.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
