'use client';

import React, { useState } from 'react';
import { MarketSnapshot } from '@/types/market';
import { formatCurrencyBRL, formatNumberBR, formatSignedNumberBR, formatPercentBR } from '@/utils/formatters';
import { SemiCircleGauge } from '@/components/ui/SemiCircleGauge';
import { CircularProgressIndicator } from '@/components/ui/CircularProgressIndicator';
import { CumulativeFlowChart } from '@/components/charts/CumulativeFlowChart';
import { MobileQuoteHero } from './MobileQuoteHero';
import { CheckSquare } from 'lucide-react';

interface Props {
  data: MarketSnapshot['dolar'];
}

export const MobileDolarView: React.FC<Props> = ({ data }) => {
  const [viewUnit, setViewUnit] = useState<'RS' | 'CONTRATOS'>('RS');
  const { quote, dailyFlow, cumulativeFlow, volatility, flowDelta, flowForce, aggression, recentEvents, players } = data;

  return (
    <div className="space-y-2 pb-16 pt-1 select-none">
      {/* 1. HERO COTAÇÃO */}
      <MobileQuoteHero
        symbol="DÓLAR"
        ticker={quote.ticker}
        flag="🇺🇸"
        quote={quote}
        decimals={1}
      />

      {/* 2. AGRESSÃO & FORÇA DO FLUXO (PRIMEIRO NÍVEL - DUAS COLUNAS COMPACTAS) */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Status Agressão */}
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col items-center justify-between">
          <div className="w-full flex items-center justify-between pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">AGRESSÃO</span>
            <span className="text-[7.5px] font-mono text-[#21D787] border border-[#21D787]/40 px-1 rounded-xs">
              {aggression.tapeReadPercent}%
            </span>
          </div>
          <div className="py-0.5">
            <SemiCircleGauge
              score={aggression.score}
              label={aggression.state}
              subLabel={formatSignedNumberBR(aggression.value, 0)}
              size={95}
            />
          </div>
        </div>

        {/* Força do Fluxo */}
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="w-full flex items-center justify-between pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">FORÇA</span>
            <span className="text-[9px] font-bold text-[#FF4D5A]">{flowForce.state}</span>
          </div>
          <div className="flex items-center space-x-1.5 my-auto">
            <CircularProgressIndicator
              percent={flowForce.gaugePercent}
              color="#FF4D5A"
              textColor="#FF4D5A"
              size={42}
            />
            <div className="flex-1 space-y-0.5">
              {flowForce.participants.slice(0, 3).map((p) => (
                <div key={p.name} className="flex items-center justify-between text-[7.5px] font-mono">
                  <span className="text-[#8191A8] font-sans truncate max-w-[42px]">{p.name}</span>
                  <div className="w-10 h-1.5 bg-[#070D17] border border-[#1D3048] rounded-xs overflow-hidden">
                    <div
                      className={`h-full ${p.direction === 'compra' ? 'bg-[#21D787]' : 'bg-[#FF4D5A]'}`}
                      style={{ width: `${p.percent}%` }}
                    />
                  </div>
                  <span className="text-[#F0F4FA] font-bold w-5 text-right">{p.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FLUXO ACUMULADO COM GRÁFICO OTIMIZADO */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1D3048]/50">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">
            FLUXO ACUMULADO — DÓLAR
          </span>
          <div className="flex items-center space-x-0.5 bg-[#070D17] border border-[#1D3048] rounded p-0.5 text-[8px]">
            <button
              onClick={() => setViewUnit('RS')}
              className={`px-1.5 py-0.5 rounded ${viewUnit === 'RS' ? 'bg-[#F3C65A] text-black font-bold' : 'text-[#8191A8]'}`}
            >
              R$
            </button>
            <button
              onClick={() => setViewUnit('CONTRATOS')}
              className={`px-1.5 py-0.5 rounded ${viewUnit === 'CONTRATOS' ? 'bg-[#F3C65A] text-black font-bold' : 'text-[#8191A8]'}`}
            >
              Contratos
            </button>
          </div>
        </div>

        <CumulativeFlowChart data={cumulativeFlow} height={90} />

        <div className="flex items-center justify-between text-[8px] text-[#8191A8] px-1 pt-1 border-t border-[#1D3048]/40">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1 bg-[#21D787]" /> Estrangeiro</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1 bg-[#60CDFF]" /> Bancos</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1 bg-[#FF4D5A]" /> Pessoa Física</span>
        </div>

        <div className="flex items-center justify-between mt-1.5 px-2 py-1 bg-[#070D17] rounded border border-[#1D3048]/50">
          <span className="text-[9px] text-[#8191A8] font-bold uppercase">— Saldo total</span>
          <span className="text-xs font-mono font-bold text-[#21D787]">R$ 1,4 bi</span>
        </div>
      </div>

      {/* 4. FLUXO DO DIA & VOLATILIDADE */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Fluxo do dia */}
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">FLUXO DO DIA</span>
          </div>
          <div className="space-y-1.5 font-mono text-[9px] mt-1">
            {dailyFlow.map((item) => (
              <div key={item.name} className="flex flex-col">
                <span className="text-[#8191A8] font-sans text-[8.5px] truncate">{item.name}</span>
                <span className={`font-bold ${item.value >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                  {formatCurrencyBRL(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Volatilidade */}
        <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col justify-between">
          <div className="pb-1 border-b border-[#1D3048]/50">
            <span className="text-[9px] font-bold text-[#8191A8] uppercase">VOLATILIDADE</span>
          </div>
          <div className="space-y-1 font-mono text-[9px] mt-1">
            <div className="flex justify-between">
              <span className="text-[#8191A8]">Topo:</span>
              <span className="font-bold text-[#F0F4FA]">{formatNumberBR(volatility.topOfDay, 1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">Fundo:</span>
              <span className="font-bold text-[#F0F4FA]">{formatNumberBR(volatility.bottomOfDay, 1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8191A8]">Volat:</span>
              <span className="font-bold text-[#21D787]">{formatPercentBR(volatility.volatilityPercent, 1)}</span>
            </div>
            <div className="flex justify-between pt-0.5 border-t border-[#1D3048]/40">
              <span className="text-[#8191A8]">Saldo:</span>
              <span className={`font-bold ${volatility.realtimeBalance >= 0 ? 'text-[#21D787]' : 'text-[#FF4D5A]'}`}>
                {formatSignedNumberBR(volatility.realtimeBalance, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. DELTA DE FLUXO */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-[#1D3048]/60">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">DELTA DE FLUXO (CONTRATOS)</span>
        </div>
        <table className="w-full text-[9px] font-mono">
          <thead>
            <tr className="text-[#8191A8] border-b border-[#1D3048]/40">
              <th className="text-left font-normal pb-0.5">Partic.</th>
              <th className="text-right font-normal pb-0.5">5m</th>
              <th className="text-right font-normal pb-0.5">15m</th>
              <th className="text-right font-normal pb-0.5">30m</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3048]/30">
            {flowDelta.map((row) => (
              <tr key={row.participant}>
                <td className="text-[#8191A8] font-sans py-1 truncate max-w-[65px]">{row.participant}</td>
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

      {/* 6. PLAYERS DO DÓLAR */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">PLAYERS — DÓLAR</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[8.5px] font-mono">
          <div className="space-y-0.5">
            <span className="text-[8px] text-[#21D787] font-bold block border-b border-[#1D3048]/30 pb-0.5">COMPRA</span>
            {players.filter(p => p.isBuyer).slice(0, 3).map((p) => (
              <div key={p.id} className="flex justify-between py-0.5">
                <span className="text-[#8191A8] truncate max-w-[70px]">{p.broker}</span>
                <span className="text-[#21D787] font-bold">+{formatNumberBR(p.balance)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] text-[#FF4D5A] font-bold block border-b border-[#1D3048]/30 pb-0.5">VENDA</span>
            {players.filter(p => !p.isBuyer).slice(0, 3).map((p) => (
              <div key={p.id} className="flex justify-between py-0.5">
                <span className="text-[#8191A8] truncate max-w-[70px]">{p.broker}</span>
                <span className="text-[#FF4D5A] font-bold">{formatNumberBR(p.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. ÚLTIMAS MUDANÇAS */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[9px] font-bold text-[#8191A8] uppercase">ÚLTIMAS MUDANÇAS</span>
        </div>
        <div className="space-y-1 font-mono text-[8.5px]">
          {recentEvents.slice(0, 4).map((ev) => (
            <div key={ev.id} className="flex items-start space-x-1.5 leading-snug">
              <span className="text-[#8191A8] shrink-0">{ev.time}</span>
              <span className={ev.type === 'buyer' ? 'text-[#21D787]' : ev.type === 'seller' ? 'text-[#FF4D5A]' : 'text-[#F0F4FA]'}>
                {ev.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
