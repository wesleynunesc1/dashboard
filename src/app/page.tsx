'use client';

import React, { useEffect } from 'react';
import { marketService } from '@/services/MockMarketDataProvider';
import { useMarketStore } from '@/store/useMarketStore';
import { Header } from '@/components/dashboard/Header';
import { DolarColumn } from '@/components/dashboard/DolarColumn';
import { CenterColumn } from '@/components/dashboard/CenterColumn';
import { IndiceColumn } from '@/components/dashboard/IndiceColumn';

export default function Home() {
  const { snapshot, setSnapshot, activeTab } = useMarketStore();

  useEffect(() => {
    // Conectar ao MarketDataProvider
    marketService.connect();

    // Inscrever para atualizações a cada 1s
    const unsubscribe = marketService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => {
      unsubscribe();
      marketService.disconnect();
    };
  }, [setSnapshot]);

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#070D17] text-[#8191A8] font-mono text-sm">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 border-2 border-[#21D787] border-t-transparent rounded-full animate-spin" />
          <span>INICIALIZANDO TERMINAL FINANCEIRO...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070D17] flex flex-col font-sans selection:bg-[#F3C65A] selection:text-black">
      {/* HEADER DO TERMINAL */}
      <Header />

      {/* ÁREA PRINCIPAL DAS 3 COLUNAS */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-1.5 overflow-x-hidden">
        {/* Layout Desktop Otimizado em 3 Colunas (12 colunas grid: 5 col / 2 col / 5 col) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1.5">
          {/* COLUNA ESQUERDA — DÓLAR FUTURO (WDOFUT) */}
          <section
            className={`xl:col-span-5 ${
              activeTab === 'all' || activeTab === 'dolar' ? 'block' : 'hidden xl:block'
            }`}
          >
            <DolarColumn data={snapshot.dolar} />
          </section>

          {/* COLUNA CENTRAL — INDICADORES AUXILIARES (JUROS DI, TENDÊNCIA, PTAX) */}
          <section
            className={`xl:col-span-2 ${
              activeTab === 'all' || activeTab === 'center' ? 'block' : 'hidden xl:block'
            }`}
          >
            <CenterColumn data={snapshot.center} />
          </section>

          {/* COLUNA DIREITA — ÍNDICE FUTURO (WINFUT) */}
          <section
            className={`xl:col-span-5 ${
              activeTab === 'all' || activeTab === 'indice' ? 'block' : 'hidden xl:block'
            }`}
          >
            <IndiceColumn data={snapshot.indice} />
          </section>
        </div>
      </main>

      {/* FOOTER INFORMATIVO DO TERMINAL */}
      <footer className="h-6 bg-[#0C1626] border-t border-[#1D3048] px-3 flex items-center justify-between text-[9px] font-mono text-[#8191A8] select-none">
        <div className="flex items-center space-x-3">
          <span>LATÊNCIA: &lt; 12ms</span>
          <span>FEED: B3 RTD/FAST</span>
          <span>ARQUITETURA: NEXT.JS + TAILWIND + ECHARTS + ZUSTAND</span>
        </div>
        <div>
          <span>FASE 01 CONCLUÍDA — PRONTO PARA INTEGRAÇÃO COM EXCEL / PYTHON NA FASE 02</span>
        </div>
      </footer>
    </div>
  );
}
