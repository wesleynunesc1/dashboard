'use client';

import React from 'react';
import { MarketSnapshot } from '@/types/market';
import { formatNumberBR, formatSignedNumberBR, formatPercentBR } from '@/utils/formatters';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  symbol: 'DÓLAR' | 'ÍNDICE';
  ticker: string;
  flag: string;
  quote: MarketSnapshot['dolar']['quote'];
  decimals?: number;
}

export const MobileQuoteHero: React.FC<Props> = ({
  symbol,
  ticker,
  flag,
  quote,
  decimals = 1,
}) => {
  const isPos = quote.variationPoints >= 0;

  return (
    <div className="bg-[#0C1626] border border-[#1D3048] p-2.5 rounded-sm select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1D3048]/50">
        <div className="flex items-center space-x-2">
          <span className="text-base">{flag}</span>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black tracking-wide text-[#F0F4FA]">{symbol}</span>
              <span className="text-[11px] font-mono font-bold text-[#F3C65A]">— {ticker}</span>
            </div>
            <div className="text-[9px] text-[#8191A8] font-mono leading-none">
              CONTRATO: {quote.contractCode}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[9px] text-[#8191A8] font-bold uppercase">TENDÊNCIA</span>
          <span
            className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono font-bold ${
              quote.trend === 'ALTA'
                ? 'bg-[#21D787]/15 text-[#21D787]'
                : quote.trend === 'BAIXA'
                ? 'bg-[#FF4D5A]/15 text-[#FF4D5A]'
                : 'bg-[#16253b] text-[#F3C65A]'
            }`}
          >
            {quote.trend}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        <div className="flex items-baseline space-x-2">
          <span className="font-mono text-2xl sm:text-3xl font-black text-[#F0F4FA] tracking-tight">
            {formatNumberBR(quote.price, decimals)}
          </span>
          <span className="text-[10px] text-[#8191A8] font-mono">BRL</span>
        </div>

        <div className="flex items-center space-x-1.5 font-mono">
          <div
            className={`flex items-center text-xs font-bold ${
              isPos ? 'text-[#21D787]' : 'text-[#FF4D5A]'
            }`}
          >
            {isPos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{formatSignedNumberBR(quote.variationPoints, decimals)}</span>
          </div>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isPos ? 'bg-[#21D787]/15 text-[#21D787]' : 'bg-[#FF4D5A]/15 text-[#FF4D5A]'
            }`}
          >
            {formatPercentBR(quote.variationPercent, 2)}
          </span>
        </div>
      </div>
    </div>
  );
};
