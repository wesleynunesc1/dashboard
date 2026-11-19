'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Activity, Radio, AlertTriangle } from 'lucide-react';
import { useMarketStore } from '@/store/useMarketStore';
import { realtimeService, WebSocketStatus } from '@/services/WebSocketMarketDataProvider';

export const Header: React.FC = () => {
  const { isPaused, togglePause, resetSimulation, snapshot } = useMarketStore();
  const lastUpdate = snapshot?.dolar.quote.lastUpdate || '11:38:22';

  const [wsStatus, setWsStatus] = useState<WebSocketStatus>({
    connected: false,
    connectorOnline: false,
    isStale: false,
    lastMessageTime: 0
  });

  useEffect(() => {
    const unsub = realtimeService.subscribeStatus((st) => {
      setWsStatus(st);
    });
    return unsub;
  }, []);

  return (
    <header className="h-10 xl:h-10 bg-[#0C1626] border-b border-[#1D3048] px-2.5 sm:px-3 flex items-center justify-between select-none sticky top-0 z-40">
      {/* Esquerda: Identificação e Status */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-[#21D787] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold tracking-wider text-[#F0F4FA]">
            FINANCIAL TERMINAL
          </span>
          <span className="hidden sm:inline text-[9px] text-[#8191A8] font-mono px-1 py-0.5 bg-[#070D17] border border-[#1D3048] rounded">
            ALICERCE RTD
          </span>
        </div>

        {/* Status Realtime Conector Windows & WebSocket */}
        <div className="flex items-center space-x-1.5">
          {wsStatus.connected ? (
            <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${
              wsStatus.connectorOnline 
                ? 'bg-[#21D787]/10 text-[#21D787] border-[#21D787]/30' 
                : 'bg-[#F3C65A]/10 text-[#F3C65A] border-[#F3C65A]/30'
            }`}>
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>
                {wsStatus.connectorOnline ? 'EXCEL RTD CONECTADO' : 'AGUARDANDO CONECTOR EXCEL'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#070D17] text-[#8191A8] border border-[#1D3048]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8191A8]" />
              <span>MODO LOCAL / DEMO</span>
            </div>
          )}

          {/* Aviso de Dados Obsoletos (Stale Data Warning) */}
          {wsStatus.isStale && (
            <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#FF4D5A]/10 text-[#FF4D5A] border border-[#FF4D5A]/40 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5 text-[#FF4D5A]" />
              <span className="hidden sm:inline">DADOS DESATUALIZADOS</span>
            </div>
          )}
        </div>
      </div>

      {/* Direita: Horário e Controles */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <div className="flex items-center space-x-1 text-[10px] font-mono text-[#8191A8] bg-[#070D17] px-1.5 py-0.5 rounded border border-[#1D3048]">
          <span className="hidden xs:inline text-[9px] text-[#8191A8]">HORA:</span>
          <span className="text-[#F0F4FA] font-bold">{lastUpdate}</span>
        </div>

        {/* Botão Pausar / Retomar */}
        <button
          onClick={togglePause}
          title={isPaused ? 'Retomar Simulação' : 'Pausar Simulação'}
          className={`flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-medium border transition-colors ${
            isPaused
              ? 'bg-[#21D787]/15 text-[#21D787] border-[#21D787]/40'
              : 'bg-[#070D17] text-[#8191A8] border-[#1D3048] hover:text-[#F0F4FA]'
          }`}
        >
          {isPaused ? <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" /> : <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />}
          <span>{isPaused ? 'Retomar' : 'Pausar'}</span>
        </button>

        {/* Botão Reset */}
        <button
          onClick={resetSimulation}
          title="Reiniciar Simulação"
          className="flex items-center justify-center p-1 sm:px-2 sm:py-1 rounded text-[10px] sm:text-[11px] font-medium bg-[#070D17] text-[#8191A8] border border-[#1D3048] hover:text-[#F0F4FA] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline ml-1">Reset</span>
        </button>
      </div>
    </header>
  );
};
