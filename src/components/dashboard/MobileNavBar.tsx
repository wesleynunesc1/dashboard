'use client';

import React from 'react';
import { DollarSign, TrendingUp, BarChart3, Activity } from 'lucide-react';
import { useMarketStore, MobileTab } from '@/store/useMarketStore';

interface TabItem {
  id: MobileTab;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'dolar', label: 'Dólar', sub: 'WDOFUT', icon: DollarSign },
  { id: 'indice', label: 'Índice', sub: 'WINFUT', icon: TrendingUp },
  { id: 'mercado', label: 'Mercado', sub: 'DI / PTAX', icon: BarChart3 },
  { id: 'fluxo', label: 'Fluxo', sub: 'Agressão', icon: Activity },
];

export const MobileNavBar: React.FC = () => {
  const { mobileTab, setMobileTab } = useMarketStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0C1626]/95 backdrop-blur-md border-t border-[#1D3048] pb-[env(safe-area-inset-bottom,0px)] xl:hidden select-none shadow-lg">
      <div className="grid grid-cols-4 h-13 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = mobileTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex flex-col items-center justify-center relative py-1 transition-all ${
                isActive ? 'text-[#F3C65A]' : 'text-[#8191A8] hover:text-[#F0F4FA]'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-[#F3C65A] rounded-full shadow-[0_0_8px_#F3C65A]" />
              )}
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] leading-tight font-sans ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              <span className="text-[8px] font-mono leading-none opacity-60">
                {tab.sub}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
