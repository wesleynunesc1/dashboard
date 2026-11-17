'use client';

import React, { useMemo } from 'react';
import { MarketSnapshot } from '@/types/market';
import { Compass, TrendingUp, TrendingDown, Minus, Zap, ShieldAlert, Cpu } from 'lucide-react';

interface Props {
  snapshot: MarketSnapshot;
}

export interface MacroAnalysis {
  bias: 'ALTA FORTE' | 'COMPRADOR' | 'NEUTRO / INDEFINIDO' | 'VENDEDOR' | 'BAIXA FORTE';
  confidence: number; // 0 - 100%
  dolarDirection: 'COMPRA' | 'VENDA' | 'LATERAL';
  indiceDirection: 'COMPRA' | 'VENDA' | 'LATERAL';
  diPressure: 'ALTA' | 'QUEDA' | 'ESTÁVEL';
  macroSynthesis: string;
  actionableInsights: string[];
}

export const MacroAnalysisPanel: React.FC<Props> = ({ snapshot }) => {
  const { dolar, indice, center } = snapshot;

  const analysis: MacroAnalysis = useMemo(() => {
    // 1. Dólar
    const dPriceVar = dolar.quote.variationPoints;
    const dAggScore = dolar.aggression.score; // -100 a +100
    const dGringoFlow = dolar.dailyFlow.find((f) => f.type === 'estrangeiro')?.value ?? 0;

    // 2. Índice
    const iPriceVar = indice.quote.variationPoints;
    const iAggScore = indice.aggression.score;
    const iGringoFlow = indice.dailyFlow.find((f) => f.type === 'estrangeiro')?.value ?? 0;

    // 3. DI
    const diScore = center.diTrendScore; // -10 a +10 (negativo = juros caindo = bom para bolsa)

    // Cálculo de Direção Global (Score Composto)
    let bullishPoints = 0;
    let bearishPoints = 0;

    // Se juros caem, favorece compra no Índice e venda de Dólar
    if (diScore < -2) bullishPoints += 25;
    else if (diScore > 2) bearishPoints += 25;

    // Gringo no Índice
    if (iGringoFlow > 500000000) bullishPoints += 20;
    else if (iGringoFlow < -500000000) bearishPoints += 20;

    // Agressão no Índice
    if (iAggScore > 20) bullishPoints += 15;
    else if (iAggScore < -20) bearishPoints += 15;

    // Variação do Índice
    if (iPriceVar > 200) bullishPoints += 10;
    else if (iPriceVar < -200) bearishPoints += 10;

    // Dólar (inverso da bolsa normalmente)
    if (dPriceVar < -5) bullishPoints += 15;
    else if (dPriceVar > 5) bearishPoints += 15;

    if (dAggScore < -20) bullishPoints += 15;
    else if (dAggScore > 20) bearishPoints += 15;

    const netScore = bullishPoints - bearishPoints;
    let bias: MacroAnalysis['bias'] = 'NEUTRO / INDEFINIDO';
    let confidence = 50;

    if (netScore >= 45) {
      bias = 'ALTA FORTE';
      confidence = Math.min(94, 60 + Math.abs(netScore) / 2);
    } else if (netScore >= 15) {
      bias = 'COMPRADOR';
      confidence = Math.min(80, 55 + Math.abs(netScore) / 2);
    } else if (netScore <= -45) {
      bias = 'BAIXA FORTE';
      confidence = Math.min(94, 60 + Math.abs(netScore) / 2);
    } else if (netScore <= -15) {
      bias = 'VENDEDOR';
      confidence = Math.min(80, 55 + Math.abs(netScore) / 2);
    } else {
      bias = 'NEUTRO / INDEFINIDO';
      confidence = 48;
    }

    const dDir: MacroAnalysis['dolarDirection'] =
      dPriceVar > 3 || dAggScore > 25 ? 'COMPRA' : dPriceVar < -3 || dAggScore < -25 ? 'VENDA' : 'LATERAL';

    const iDir: MacroAnalysis['indiceDirection'] =
      iPriceVar > 250 || iAggScore > 20 ? 'COMPRA' : iPriceVar < -250 || iAggScore < -20 ? 'VENDA' : 'LATERAL';

    const diPres: MacroAnalysis['diPressure'] =
      diScore > 1 ? 'ALTA' : diScore < -1 ? 'QUEDA' : 'ESTÁVEL';

    // Síntese
    let macroSynthesis = '';
    const insights: string[] = [];

    if (bias === 'ALTA FORTE' || bias === 'COMPRADOR') {
      macroSynthesis =
        'Confluência favorável ao risco: Curva de DI em queda acompanhada por fluxo comprador institucional (Estrangeiros) no Índice Futuro.';
      insights.push('Índice Futuro: Priorizar operações de compra a favor da agressão nos suportes intradiários.');
      insights.push('Dólar: Pressão vendedora ou absorção passiva na máxima; cautela com compras alongadas.');
      insights.push(`Juros DI com inclinação de ${diPres.toLowerCase()} (${diScore} pts), destravando prêmio na curva longa.`);
    } else if (bias === 'BAIXA FORTE' || bias === 'VENDEDOR') {
      macroSynthesis =
        'Aversão ao risco dominante: DI subindo e pressão vendedora dos participantes institucionais no WINZ.';
      insights.push('Índice Futuro: Evitar compras contra a tendência; procurar rejeição em resistências.');
      insights.push('Dólar: Fluxo comprador ativo buscando fechamento de gap e proteção.');
      insights.push('Curva de DI abrindo prêmio de risco, pesando sobre ações de maior peso no Ibov.');
    } else {
      macroSynthesis =
        'Mercado em equilíbrio intradiário (range): Forças compradoras e vendedoras se neutralizando entre Dólar e Índice.';
      insights.push('Mercado lateral: Operar extremos de volatilidade (topo e fundo do dia) com alvos curtos.');
      insights.push(`Book com equilíbrio de liquidez; aguardar rompimento com fluxo institucional confirmado.`);
    }

    return {
      bias,
      confidence: Math.round(confidence),
      dolarDirection: dDir,
      indiceDirection: iDir,
      diPressure: diPres,
      macroSynthesis,
      actionableInsights: insights,
    };
  }, [dolar, indice, center]);

  const isBull = analysis.bias.includes('ALTA') || analysis.bias === 'COMPRADOR';
  const isBear = analysis.bias.includes('BAIXA') || analysis.bias === 'VENDEDOR';

  const badgeColor = isBull
    ? 'bg-[#21D787]/15 text-[#21D787] border-[#21D787]/40'
    : isBear
    ? 'bg-[#FF4D5A]/15 text-[#FF4D5A] border-[#FF4D5A]/40'
    : 'bg-[#F3C65A]/15 text-[#F3C65A] border-[#F3C65A]/40';

  return (
    <div className="bg-[#0C1626] border border-[#1D3048] p-2.5 rounded-sm select-none shadow-md">
      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-wrap items-center justify-between pb-1.5 border-b border-[#1D3048]/60 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-[#070D17] border border-[#1D3048]">
            <Cpu className="w-3.5 h-3.5 text-[#60CDFF] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-extrabold text-[#F0F4FA] tracking-wide">
                DIAGNÓSTICO MACRO &amp; DIREÇÃO DE MERCADO
              </span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#070D17] text-[#60CDFF] border border-[#1D3048]">
                ANÁLISE INTEGRADA EM TEMPO REAL
              </span>
            </div>
            <div className="text-[8.5px] font-mono text-[#8191A8] leading-none">
              Dólar (WDOFUT) × Índice (WINZ26) × Curva DI × Estrangeiros × Livro N15
            </div>
          </div>
        </div>

        {/* BADGE DE VIÉS PREDITIVO */}
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <span className="text-[7.5px] uppercase font-bold text-[#8191A8] block">VIÉS GERAL:</span>
            <div className={`px-2 py-0.5 rounded text-[10px] font-black font-mono border ${badgeColor}`}>
              {analysis.bias} ({analysis.confidence}% CONF.)
            </div>
          </div>
        </div>
      </div>

      {/* GRADE DE VETORES DE FORÇA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-2">
        {/* Vetor Índice */}
        <div className="bg-[#070D17] p-1.5 rounded border border-[#1D3048]/50 flex items-center justify-between">
          <span className="text-[8.5px] text-[#8191A8]">ÍNDICE ({indice.quote.contractCode})</span>
          <span
            className={`text-[9px] font-mono font-bold flex items-center gap-0.5 ${
              analysis.indiceDirection === 'COMPRA'
                ? 'text-[#21D787]'
                : analysis.indiceDirection === 'VENDA'
                ? 'text-[#FF4D5A]'
                : 'text-[#F3C65A]'
            }`}
          >
            {analysis.indiceDirection === 'COMPRA' ? (
              <TrendingUp className="w-3 h-3" />
            ) : analysis.indiceDirection === 'VENDA' ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {analysis.indiceDirection}
          </span>
        </div>

        {/* Vetor Dólar */}
        <div className="bg-[#070D17] p-1.5 rounded border border-[#1D3048]/50 flex items-center justify-between">
          <span className="text-[8.5px] text-[#8191A8]">DÓLAR ({dolar.quote.ticker})</span>
          <span
            className={`text-[9px] font-mono font-bold flex items-center gap-0.5 ${
              analysis.dolarDirection === 'COMPRA'
                ? 'text-[#21D787]'
                : analysis.dolarDirection === 'VENDA'
                ? 'text-[#FF4D5A]'
                : 'text-[#F3C65A]'
            }`}
          >
            {analysis.dolarDirection === 'COMPRA' ? (
              <TrendingUp className="w-3 h-3" />
            ) : analysis.dolarDirection === 'VENDA' ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {analysis.dolarDirection}
          </span>
        </div>

        {/* Vetor Juros DI */}
        <div className="bg-[#070D17] p-1.5 rounded border border-[#1D3048]/50 flex items-center justify-between">
          <span className="text-[8.5px] text-[#8191A8]">CURVA DE JUROS DI</span>
          <span
            className={`text-[9px] font-mono font-bold ${
              analysis.diPressure === 'QUEDA'
                ? 'text-[#21D787]'
                : analysis.diPressure === 'ALTA'
                ? 'text-[#FF4D5A]'
                : 'text-[#F3C65A]'
            }`}
          >
            {analysis.diPressure} ({center.diTrendScore})
          </span>
        </div>

        {/* Vetor Estrangeiro */}
        <div className="bg-[#070D17] p-1.5 rounded border border-[#1D3048]/50 flex items-center justify-between">
          <span className="text-[8.5px] text-[#8191A8]">ESTRANGEIRO (IBOV)</span>
          <span className="text-[9px] font-mono font-bold text-[#21D787]">
            +R$ 888M (COMPRADO)
          </span>
        </div>
      </div>

      {/* SÍNTESE & DIRECIONAMENTO TÉCNICO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1 border-t border-[#1D3048]/40">
        {/* Síntese Interpretativa */}
        <div className="md:col-span-6 bg-[#070D17] p-2 rounded border border-[#1D3048]/40 flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 mb-1">
            <Compass className="w-3 h-3 text-[#F3C65A]" />
            <span className="text-[8.5px] font-bold text-[#8191A8] uppercase tracking-wider">
              SÍNTESE DO CENÁRIO ATUAL
            </span>
          </div>
          <p className="text-[9.5px] text-[#F0F4FA] font-sans leading-relaxed">
            {analysis.macroSynthesis}
          </p>
        </div>

        {/* Insights Operacionais Acionáveis */}
        <div className="md:col-span-6 bg-[#070D17] p-2 rounded border border-[#1D3048]/40 flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 mb-1">
            <Zap className="w-3 h-3 text-[#21D787]" />
            <span className="text-[8.5px] font-bold text-[#8191A8] uppercase tracking-wider">
              DIREÇÃO OPERACIONAL SUGERIDA
            </span>
          </div>
          <ul className="space-y-0.5 text-[9px] font-mono">
            {analysis.actionableInsights.map((ins, idx) => (
              <li key={idx} className="flex items-start space-x-1.5">
                <span className="text-[#60CDFF] shrink-0 font-bold">›</span>
                <span className="text-[#8191A8] leading-tight">{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
