'use client';

import React from 'react';
import { MarketSnapshot } from '@/types/market';
import { formatNumberBR, formatSignedNumberBR } from '@/utils/formatters';
import { SemiCircleGauge } from '@/components/ui/SemiCircleGauge';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface Props {
  data: MarketSnapshot['center'];
}

export const CenterColumn: React.FC<Props> = ({ data }) => {
  const { diContracts, diTrendScore, ptax, ptaxFut } = data;

  return (
    <div className="flex flex-col space-y-1.5 p-1.5 bg-[#070D17] text-[#F0F4FA] font-sans">
      {/* JUROS DI'S */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/60 mb-1">
          <span className="text-[9.5px] font-extrabold text-[#F0F4FA] tracking-wide uppercase">
            JUROS DI&apos;S
          </span>
          <span className="text-[8px] font-mono text-[#8191A8]">B3 TAXAS</span>
        </div>

        <table className="w-full text-[9.5px] font-mono">
          <thead>
            <tr className="text-[#8191A8] border-b border-[#1D3048]/40">
              <th className="text-left font-normal pb-0.5">Venc.</th>
              <th className="text-right font-normal pb-0.5">Taxa</th>
              <th className="text-right font-normal pb-0.5">Var.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3048]/20">
            {diContracts.map((di) => {
              const isVarPos = di.variation > 0;
              const isVarNeg = di.variation < 0;
              return (
                <tr key={di.code} className="hover:bg-[#16253b]/30">
                  <td className="text-[#8191A8] py-0.5 font-sans font-medium">{di.code}</td>
                  <td className="text-right font-bold text-[#F0F4FA] py-0.5">
                    {formatNumberBR(di.rate, 2)}
                  </td>
                  <td
                    className={`text-right font-bold py-0.5 ${
                      isVarPos ? 'text-[#21D787]' : isVarNeg ? 'text-[#FF4D5A]' : 'text-[#8191A8]'
                    }`}
                  >
                    {di.variation === 0 ? '0,00' : formatSignedNumberBR(di.variation, 2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MEDIDOR DE TENDÊNCIA DI */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-between pb-1 border-b border-[#1D3048]/50 mb-1">
          <span className="text-[8.5px] font-bold text-[#8191A8] uppercase">TENDÊNCIA DI</span>
          <div className="flex items-center space-x-1 text-[9px] font-mono font-bold">
            <span className={diTrendScore < 0 ? 'text-[#FF4D5A]' : 'text-[#21D787]'}>
              {diTrendScore}
            </span>
            {diTrendScore < 0 ? (
              <ArrowDownRight className="w-3 h-3 text-[#FF4D5A]" />
            ) : (
              <ArrowUpRight className="w-3 h-3 text-[#21D787]" />
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

      {/* PTAX SPOT */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/60 mb-1.5">
          <span className="text-[9.5px] font-bold text-[#8191A8] uppercase tracking-wider">PTAX</span>
          <span className="text-[8px] font-mono text-[#8191A8]">BANCO CENTRAL</span>
        </div>

        <div className="space-y-1 font-mono text-[10.5px]">
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">P1:</span>
            <span className="text-[#F0F4FA] font-bold">
              {ptax.p1 ? formatNumberBR(ptax.p1, 2) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">P2:</span>
            <span className="text-[#F0F4FA] font-bold">
              {ptax.p2 ? formatNumberBR(ptax.p2, 2) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">P3:</span>
            <span className="text-[#8191A8] font-bold">
              {ptax.p3 ? formatNumberBR(ptax.p3, 2) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">P4:</span>
            <span className="text-[#8191A8] font-bold">
              {ptax.p4 ? formatNumberBR(ptax.p4, 2) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* PTAX FUTURA */}
      <div className="bg-[#0C1626] border border-[#1D3048] p-2 rounded-sm">
        <div className="flex items-center justify-between pb-1 border-b border-[#1D3048]/60 mb-1.5">
          <span className="text-[9.5px] font-bold text-[#8191A8] uppercase tracking-wider">PTAX FUTURA</span>
          <span className="text-[8px] font-mono text-[#8191A8]">PROJEÇÃO</span>
        </div>

        <div className="space-y-1 font-mono text-[10.5px]">
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">FUT P1:</span>
            <span className="text-[#F0F4FA] font-bold">
              {ptaxFut.p1 ? formatNumberBR(ptaxFut.p1, 2) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">FUT P2:</span>
            <span className="text-[#F0F4FA] font-bold">
              {ptaxFut.p2 ? formatNumberBR(ptaxFut.p2, 2) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">FUT P3:</span>
            <span className="text-[#8191A8] font-bold">
              {ptaxFut.p3 ? formatNumberBR(ptaxFut.p3, 2) : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8191A8] font-sans">FUT P4:</span>
            <span className="text-[#8191A8] font-bold">
              {ptaxFut.p4 ? formatNumberBR(ptaxFut.p4, 2) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
