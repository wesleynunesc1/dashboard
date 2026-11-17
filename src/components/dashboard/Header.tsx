'use client';

import React from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';

export const Header: React.FC = () => {
  const { isPaused, togglePause, resetSimulation, activeTab, setActiveTab } = useMarketStore();

  return (
    <header className="h-10 bg-[#0C1626] border-b border-[#1D3048] px-3 flex items-center justify-between select-none">
      {/* Esquerda: Identificação do Terminal e Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#21D787] animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-[#F0F4FA]">
            FINANCIAL TERMINAL
          </span>
          <span className="text-[10px] text-[#8191A8] font-mono px-1 py-0.5 bg-[#070D17] border border-[#1D3048] rounded">
            FASE 01
          </span>
        </div>

        {/* Faixa permanente de demonstração */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-[#FF4D5A]/10 border border-[#FF4D5A]/30">
          <Activity className="w-3 h-3 text-[#FF4D5A]" />
          <span className="text-[10px] font-semibold text-[#FF4D5A] tracking-wide">
            MODO DEMONSTRAÇÃO — DADOS SIMULADOS
          </span>
        </div>
      </div>

      {/* Centro: Tabs Mobile / Tablet */}
      <div className="flex xl:hidden items-center bg-[#070D17] p-0.5 rounded border border-[#1D3048] text-[10px]">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'all' ? 'bg-[#1D3048] text-[#F0F4FA] font-bold' : 'text-[#8191A8]'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setActiveTab('dolar')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'dolar' ? 'bg-[#1D3048] text-[#21D787] font-bold' : 'text-[#8191A8]'
          }`}
        >
          Dólar
        </button>
        <button
          onClick={() => setActiveTab('center')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'center' ? 'bg-[#1D3048] text-[#F3C65A] font-bold' : 'text-[#8191A8]'
          }`}
        >
          DI / PTAX
        </button>
        <button
          onClick={() => setActiveTab('indice')}
          className={`px-2 py-1 rounded transition-colors ${
            activeTab === 'indice' ? 'bg-[#1D3048] text-[#42A5F5] font-bold' : 'text-[#8191A8]'
          }`}
        >
          Índice
        </button>
      </div>

      {/* Direita: Controles de Simulação e Mercado */}
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center space-x-2 text-[10px] text-[#8191A8] font-mono mr-2">
          <span>BM&FBOVESPA</span>
          <span className="text-[#1D3048]">|</span>
          <span className="text-[#21D787]">MERCADO ABERTO</span>
        </div>

        {/* Botão Pausar / Retomar */}
        <button
          onClick={togglePause}
          title={isPaused ? 'Retomar Simulação' : 'Pausar Simulação'}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
            isPaused
              ? 'bg-[#21D787]/15 text-[#21D787] border-[#21D787]/40 hover:bg-[#21D787]/25'
              : 'bg-[#070D17] text-[#8191A8] border-[#1D3048] hover:text-[#F0F4FA] hover:border-[#8191A8]'
          }`}
        >
          {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          <span>{isPaused ? 'Retomar' : 'Pausar'}</span>
        </button>

        {/* Botão Reiniciar */}
        <button
          onClick={resetSimulation}
          title="Reiniciar Simulação"
          className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-medium bg-[#070D17] text-[#8191A8] border border-[#1D3048] hover:text-[#F0F4FA] hover:border-[#8191A8] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </header>
  );
};
