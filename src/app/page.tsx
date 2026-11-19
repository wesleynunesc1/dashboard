'use client';

import React, { useEffect } from 'react';
import { realtimeService } from '@/services/WebSocketMarketDataProvider';
import { useMarketStore } from '@/store/useMarketStore';
import { Header } from '@/components/dashboard/Header';
import { DolarColumn } from '@/components/dashboard/DolarColumn';
import { CenterColumn } from '@/components/dashboard/CenterColumn';
import { IndiceColumn } from '@/components/dashboard/IndiceColumn';
import { MobileNavBar } from '@/components/dashboard/MobileNavBar';
import { MobileDolarView } from '@/components/dashboard/MobileDolarView';
import { MobileIndiceView } from '@/components/dashboard/MobileIndiceView';
import { MobileMercadoView } from '@/components/dashboard/MobileMercadoView';
import { MobileFluxoView } from '@/components/dashboard/MobileFluxoView';
import { MacroAnalysisPanel } from '@/components/dashboard/MacroAnalysisPanel';

export default function Home() {
  const { snapshot, setSnapshot, mobileTab } = useMarketStore();

  useEffect(() => {
    // Conectar ao provedor de dados Realtime WebSocket
    realtimeService.connect();

    // Inscrever para receber atualizações do mercado
    const unsubscribe = realtimeService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => {
      unsubscribe();
      realtimeService.disconnect();
    };
  }, [setSnapshot]);

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070D17] text-[#8191A8] font-mono text-sm">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#21D787] border-t-transparent rounded-full animate-spin" />
          <span>CONECTANDO AO TERMINAL FINANCEIRO REALTIME...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D17] flex flex-col font-sans selection:bg-[#F3C65A] selection:text-black">
      {/* HEADER DO TERMINAL */}
      <Header />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-1.5 sm:p-2 overflow-x-hidden space-y-1.5">
        {/* BLOCO DE ANÁLISE TOTAL E DIREÇÃO DE MERCADO */}
        <MacroAnalysisPanel snapshot={snapshot} />

        {/* ============================================================== */}
        {/* DESKTOP LAYOUT (>= 1280px / xl) — 100% PRESERVADO             */}
        {/* ============================================================== */}
        <div className="hidden xl:grid xl:grid-cols-12 gap-1.5">
          {/* COLUNA ESQUERDA — DÓLAR FUTURO (WDOFUT) */}
          <section className="xl:col-span-5">
            <DolarColumn data={snapshot.dolar} />
          </section>

          {/* COLUNA CENTRAL — INDICADORES AUXILIARES (JUROS DI, TENDÊNCIA, PTAX, MARCADOR DI PP) */}
          <section className="xl:col-span-2">
            <CenterColumn data={snapshot.center} diVarPoints={snapshot.indice.diVarPoints} />
          </section>

          {/* COLUNA DIREITA — ÍNDICE FUTURO (WINZ26 / WINFUT COM CORRELAÇÃO, TOP 10 E BOOK TOP 15) */}
          <section className="xl:col-span-5">
            <IndiceColumn data={snapshot.indice} />
          </section>
        </div>

        {/* ============================================================== */}
        {/* MOBILE & TABLET LAYOUT (< 1280px / xl) — NAVEGAÇÃO PROFISSIONAL */}
        {/* ============================================================== */}
        <div className="block xl:hidden">
          {mobileTab === 'dolar' && <MobileDolarView data={snapshot.dolar} />}
          {mobileTab === 'indice' && <MobileIndiceView data={snapshot.indice} />}
          {mobileTab === 'mercado' && (
            <MobileMercadoView center={snapshot.center} indice={snapshot.indice} />
          )}
          {mobileTab === 'fluxo' && (
            <MobileFluxoView dolar={snapshot.dolar} indice={snapshot.indice} />
          )}
        </div>
      </main>

      {/* BARRA DE NAVEGAÇÃO INFERIOR FIXA PARA DISPOSITIVOS MÓVEIS */}
      <MobileNavBar />

      {/* FOOTER INFORMATIVO DESKTOP */}
      <footer className="hidden xl:flex h-6 bg-[#0C1626] border-t border-[#1D3048] px-3 items-center justify-between text-[9px] font-mono text-[#8191A8] select-none">
        <div className="flex items-center space-x-3">
          <span>FEED: PROFIT PRO RTD → WEBSOCKET RAM</span>
          <span>ARQUITETURA: ZERO DATABASE</span>
          <span>CONTRATO ATIVO: WINZ26 | WDOF27</span>
          <span>BOOK: TOP 15 PROFUNDIDADE</span>
        </div>
        <div>
          <span>ALICERCE FINANCIAL TERMINAL — SINCRONIZAÇÃO EM TEMPO REAL ATIVA</span>
        </div>
      </footer>
    </div>
  );
}
